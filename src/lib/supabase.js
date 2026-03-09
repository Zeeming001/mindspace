import { createClient } from "@supabase/supabase-js";

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
 * Returns an array of { concept, x, y, n_responses }.
 * Returns null if n_responses < MIN_RESPONDENTS for any concept.
 */
export async function fetchGroupPositions(groupKey) {
  const { data, error } = await supabase
    .from("aggregate_positions")
    .select("concept, x, y, n_responses, computed_at")
    .eq("group_key", groupKey);

  if (error) throw error;
  return data || [];
}

/**
 * Fetch response counts per group key (for the explore page meta-info).
 */
export async function fetchGroupCounts() {
  const { data, error } = await supabase
    .from("aggregate_positions")
    .select("group_key, n_responses")
    .eq("concept", "Kind"); // sentinel: stable concept present in all groups

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

// ─── Constants ───────────────────────────────────────────────────────────────

export const MIN_RESPONDENTS = 15; // minimum before showing a group's map
