import { createClient } from "@supabase/supabase-js";
import { CONCEPTS } from "./concepts";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables not set. " +
    "Copy .env.example to .env.local and fill in your project credentials."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

// ─── Session management ──────────────────────────────────────────────────────

/**
 * Get the next session index from the database (atomic increment).
 * Falls back to a random index if the DB call fails (graceful degradation).
 */
export async function claimSessionIndex() {
  const { data, error } = await supabase.rpc("get_next_session_index");
  if (error) {
    console.warn("Could not claim session index, using random fallback:", error.message);
    return Math.floor(Math.random() * 1953);
  }
  return data;
}

/**
 * Save all pair ratings for a session to the responses table.
 */
export async function saveResponses(sessionId, ratings) {
  const rows = ratings.map(({ pair, val }) => ({
    session_id: sessionId,
    concept_a: pair[0],
    concept_b: pair[1],
    rating: val,
  }));

  const { error } = await supabase.from("responses").insert(rows);
  if (error) throw error;
}

/**
 * Save demographic data and mark session complete.
 */
export async function saveSession(sessionId, demographics) {
  const { error } = await supabase.from("sessions").upsert({
    session_id: sessionId,
    ...demographics,
    completed_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/**
 * Create a session record at the start (so we can track drop-offs).
 */
export async function createSession(sessionId) {
  const { error } = await supabase.from("sessions").insert({
    session_id: sessionId,
    created_at: new Date().toISOString(),
  });
  if (error) console.warn("Could not create session record:", error.message);
}

// ─── Aggregate data ──────────────────────────────────────────────────────────

/**
 * Fetch precomputed MDS positions for a given group key.
 * Returns an array of { concept, x, y, cluster, stress, n_responses, computed_at }.
 * stress is the group-level Kruskal stress-1 (same value on all rows for this group).
 * Returns [] if no data exists (group hasn't reached MIN_RESPONDENTS yet).
 */
export async function fetchGroupPositions(groupKey) {
  const { data, error } = await supabase
    .from("aggregate_positions")
    .select("concept, x, y, cluster, stress, n_responses, computed_at")
    .eq("group_key", groupKey);

  if (error) throw error;
  return data || [];
}

/**
 * Fetch response counts per group key (for the explore page meta-info).
 *
 * n_responses is stored identically on every row for a given group_key, so we
 * only need one row per group. We use CONCEPTS[0] as the sentinel — it's
 * defined in concepts.js and will always exist in aggregate_positions once the
 * Edge Function has run. Tying the sentinel to the live concept list means any
 * rename will produce an obvious breakage rather than a silent wrong value.
 */
export async function fetchGroupCounts() {
  const sentinel = CONCEPTS[0]; // "Intellectual" — first entry in concepts.js
  const { data, error } = await supabase
    .from("aggregate_positions")
    .select("group_key, n_responses")
    .eq("concept", sentinel);

  if (error) throw error;
  const counts = {};
  for (const row of data || []) counts[row.group_key] = row.n_responses;
  return counts;
}

/**
 * Fetch all responses for a given session ID (for the personal "Your map" view).
 * Returns an array of { concept_a, concept_b, rating }.
 */
export async function fetchSessionResponses(sessionId) {
  const { data, error } = await supabase
    .from("responses")
    .select("concept_a, concept_b, rating")
    .eq("session_id", sessionId);
  if (error) throw error;
  return data || [];
}

/**
 * Fetch REAL completed-session counts per group key by querying the sessions
 * table directly — NOT the aggregate_positions table (which stores simulated
 * n_responses values that would make every group appear to have real data).
 *
 * Returns an object like:
 *   { all: 12, "political:left": 4, "political:center": 2, ... }
 *
 * Any group not yet in the sessions table returns 0.
 */
export async function fetchRealGroupCounts() {
  // Base query: all completed sessions
  const { count: allCount, error: allErr } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .not("completed_at", "is", null);
  if (allErr) throw allErr;

  // Political sub-groups
  const [leftRes, centerRes, rightRes] = await Promise.all([
    supabase.from("sessions").select("*", { count: "exact", head: true })
      .not("completed_at", "is", null).in("political", [1, 2, 3]),
    supabase.from("sessions").select("*", { count: "exact", head: true })
      .not("completed_at", "is", null).in("political", [4]),
    supabase.from("sessions").select("*", { count: "exact", head: true })
      .not("completed_at", "is", null).in("political", [5, 6, 7]),
  ]);

  // Religion sub-groups
  const [religiousRes, secularRes] = await Promise.all([
    supabase.from("sessions").select("*", { count: "exact", head: true })
      .not("completed_at", "is", null)
      .in("religion", ["Christian", "Muslim", "Jewish", "Hindu", "Buddhist", "Other"]),
    supabase.from("sessions").select("*", { count: "exact", head: true })
      .not("completed_at", "is", null)
      .in("religion", ["None"]),
  ]);

  return {
    "all":                allCount    ?? 0,
    "political:left":     leftRes.count   ?? 0,
    "political:center":   centerRes.count ?? 0,
    "political:right":    rightRes.count  ?? 0,
    "religion:religious": religiousRes.count ?? 0,
    "religion:secular":   secularRes.count   ?? 0,
  };
}

/**
 * Count completed sessions (for the live respondent counter on the Home page).
 */
export async function fetchRespondentCount() {
  const { count, error } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .not("completed_at", "is", null);
  if (error) throw error;
  return count ?? 0;
}

// ─── Admin export ────────────────────────────────────────────────────────────
// These call SECURITY DEFINER functions that validate the admin token
// server-side before returning any data. The service role key never
// leaves Supabase infrastructure.

export async function exportFullData(token) {
  const { data, error } = await supabase.rpc("export_full_data", { token });
  if (error) throw error;
  return data || [];
}

export async function exportSessionsData(token) {
  const { data, error } = await supabase.rpc("export_sessions_data", { token });
  if (error) throw error;
  return data || [];
}

export async function exportPairCoverage(token) {
  const { data, error } = await supabase.rpc("export_pair_coverage", { token });
  if (error) throw error;
  return data || [];
}

// ─── Constants ───────────────────────────────────────────────────────────────

// Minimum completed sessions before a group's map is shown publicly.
// At 15 respondents × 20 pairs each, only ~15% of the 1,953-pair matrix is
// covered; the remaining 85% is neutral-imputed, making the layout mostly
// noise. 50 respondents (~1,000 pair ratings) is the practical minimum for a
// map with enough real signal to be worth displaying.
export const MIN_RESPONDENTS = 50;
