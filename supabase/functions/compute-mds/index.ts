/**
 * Mindspace — compute-mds Edge Function
 *
 * Triggered on a schedule (e.g. every hour via pg_cron or Supabase Scheduler).
 * Can also be triggered manually via HTTP POST to /<project>/functions/v1/compute-mds
 *
 * For each group key, this function:
 *   1. Fetches all responses from sessions matching the group
 *   2. Builds an N×N distance matrix (distance = 1 - mean_rating/5)
 *   3. Applies classical MDS to extract 2D coordinates
 *   4. Writes results to aggregate_positions table
 *
 * Groups computed:
 *   - 'all'              → all completed sessions
 *   - 'political:1-2'    → political IN (1,2)
 *   - 'political:3'      → political = 3
 *   - 'political:4'      → political = 4  (centrist)
 *   - 'political:5'      → political = 5
 *   - 'political:6-7'    → political IN (6,7)
 *   - 'religion:*'       → religion = value
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MIN_N        = 15; // minimum respondents to compute a map

// ── Concepts (must match frontend concepts.js) ─────────────────────────────

const CONCEPTS_BY_DOMAIN: Record<string, string[]> = {
  knowledge:  ["Intellectual", "Rational", "Scientific", "Intuitive", "Mystical", "Practical"],
  religion:   ["Devout", "Atheist", "Spiritual", "Aware of personal guilt", "Believes in grace", "Reverent"],
  moral:      ["Just", "Merciful", "Loyal", "Deferential", "Caring", "Emphasizes purity", "Principled"],
  politics:   ["Liberty-loving", "Egalitarian", "Values security", "Seeks order", "Democratic", "Traditionalist", "Patriotic"],
  society:    ["Family-oriented", "Pro-marriage", "Sexually liberated", "LGBTQ+ affirming", "Pro-religious liberty", "Multicultural"],
  bodies:     ["Pro-choice", "Bodily-sovereign", "Consent-focused", "Believes in innocence", "Interdependent"],
  law:        ["Pro-policing", "Rehabilitative", "Punitive", "Tough on crime", "Free speech absolutist", "Surveillance-tolerant", "Pro-death penalty", "Reconciliation-minded"],
  economy:    ["Pro-welfare", "Free-market", "Meritocratic", "Inequality-tolerant", "Poverty-conscious", "Solidarity-minded"],
  aesthetics: ["Aesthetic", "Truth-seeking", "Power-driven", "Seeks meaning", "Authentic", "Ironic"],
  identity:   ["Kind", "Honest", "Ambitious", "Humble", "Hardworking", "Believes in luck"],
};

const CONCEPTS: string[] = Object.values(CONCEPTS_BY_DOMAIN).flat(); // 63 concepts

// ── Group definitions ──────────────────────────────────────────────────────

interface GroupDef {
  key: string;
  filter: (sb: ReturnType<typeof createClient>) => Promise<string[]>; // returns session_ids
}

// ── MDS implementation ────────────────────────────────────────────────────

function classicalMDS(distMatrix: number[][]): { x: number[]; y: number[] } {
  const n = distMatrix.length;
  if (n < 3) return { x: [0, 0], y: [0, 0] };

  // D² matrix
  const D2 = distMatrix.map(row => row.map(d => d * d));

  // Double-centering: B = -0.5 * J * D² * J
  const rowMeans = D2.map(row => row.reduce((s, v) => s + v, 0) / n);
  const grandMean = rowMeans.reduce((s, v) => s + v, 0) / n;
  const B = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      -0.5 * (D2[i][j] - rowMeans[i] - rowMeans[j] + grandMean)
    )
  );

  // Power iteration for top 2 eigenvectors
  function powerIter(mat: number[][], iters = 300): { vec: number[]; val: number } {
    let v = Array.from({ length: n }, (_, i) => Math.sin(i * 2.399963));
    const norm0 = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    v = v.map(x => x / norm0);

    for (let it = 0; it < iters; it++) {
      const vNew = Array(n).fill(0);
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
          vNew[i] += mat[i][j] * v[j];
      const norm = Math.sqrt(vNew.reduce((s, x) => s + x * x, 0));
      if (norm < 1e-12) break;
      v = vNew.map(x => x / norm);
    }

    let val = 0;
    for (let i = 0; i < n; i++) {
      let bv = 0;
      for (let j = 0; j < n; j++) bv += mat[i][j] * v[j];
      val += v[i] * bv;
    }
    return { vec: v, val };
  }

  const { vec: v1, val: l1 } = powerIter(B);
  const B2 = B.map((row, i) => row.map((val, j) => val - l1 * v1[i] * v1[j]));
  const { vec: v2, val: l2 } = powerIter(B2);

  const x = v1.map(v => v * Math.sqrt(Math.max(l1, 0)));
  const y = v2.map(v => v * Math.sqrt(Math.max(l2, 0)));
  return { x, y };
}

function buildDistanceMatrix(
  concepts: string[],
  responses: Array<{ concept_a: string; concept_b: string; rating: number }>
): number[][] {
  const n = concepts.length;
  const idx: Record<string, number> = Object.fromEntries(concepts.map((c, i) => [c, i]));
  const sums   = Array.from({ length: n }, () => Array(n).fill(0));
  const counts = Array.from({ length: n }, () => Array(n).fill(0));

  for (const { concept_a, concept_b, rating } of responses) {
    const i = idx[concept_a], j = idx[concept_b];
    if (i === undefined || j === undefined || i === j) continue;
    const d = 1 - rating / 5;
    sums[i][j] += d; sums[j][i] += d;
    counts[i][j]++;   counts[j][i]++;
  }

  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 0;
      return counts[i][j] > 0 ? sums[i][j] / counts[i][j] : 0.5;
    })
  );
}

// ── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (_req) => {
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const log: string[] = [];
  const now = new Date().toISOString();

  // ── Define groups ────────────────────────────────────────────────────

  const getSessionIds = async (where: string): Promise<string[]> => {
    const { data, error } = await sb.rpc("get_session_ids", { where_clause: where });
    if (error) throw error;
    return (data as Array<{ session_id: string }>).map(r => r.session_id);
  };

  // Simpler: use direct queries via the JS client
  const fetchSessionIds = async (
    field: string | null,
    values: (number | string)[] | null
  ): Promise<string[]> => {
    let query = sb
      .from("sessions")
      .select("session_id")
      .not("completed_at", "is", null);

    if (field && values) {
      query = query.in(field, values);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r: { session_id: string }) => r.session_id);
  };

  const groups: Array<{
    key: string;
    field: string | null;
    values: (number | string)[] | null;
  }> = [
    { key: "all",            field: null,        values: null },
    { key: "political:1-2",  field: "political", values: [1, 2] },
    { key: "political:3",    field: "political", values: [3] },
    { key: "political:4",    field: "political", values: [4] },
    { key: "political:5",    field: "political", values: [5] },
    { key: "political:6-7",  field: "political", values: [6, 7] },
    { key: "religion:Christian", field: "religion", values: ["Christian"] },
    { key: "religion:None",      field: "religion", values: ["None"] },
    { key: "religion:Muslim",    field: "religion", values: ["Muslim"] },
    { key: "religion:Jewish",    field: "religion", values: ["Jewish"] },
        { key: "religion:Other", field: "religion", values: ["Hindu", "Buddhist", "Other"] },
  ];

  // ── Process each group ────────────────────────────────────────────────

  for (const group of groups) {
    try {
      const sessionIds = await fetchSessionIds(group.field, group.values);

      if (sessionIds.length < MIN_N) {
        log.push(`${group.key}: skipped (n=${sessionIds.length} < ${MIN_N})`);
        continue;
      }

      // Fetch all responses for this group's sessions
      const { data: responses, error: rErr } = await sb
        .from("responses")
        .select("concept_a, concept_b, rating")
        .in("session_id", sessionIds);

      if (rErr) throw rErr;
      if (!responses || responses.length === 0) {
        log.push(`${group.key}: no responses`);
        continue;
      }

      // Build distance matrix and run MDS
      const distMatrix = buildDistanceMatrix(CONCEPTS, responses);
      const { x, y } = classicalMDS(distMatrix);

      // Upsert coordinates into aggregate_positions
      const rows = CONCEPTS.map((concept, i) => ({
        group_key:   group.key,
        concept,
        x:           x[i],
        y:           y[i],
        n_responses: sessionIds.length,
        computed_at: now,
      }));

      const { error: uErr } = await sb
        .from("aggregate_positions")
        .upsert(rows, { onConflict: "group_key,concept" });

      if (uErr) throw uErr;

      log.push(`${group.key}: computed (n=${sessionIds.length}, ${responses.length} responses)`);
    } catch (err) {
      log.push(`${group.key}: ERROR — ${(err as Error).message}`);
    }
  }

  return new Response(
    JSON.stringify({ ok: true, computed_at: now, log }),
    { headers: { "Content-Type": "application/json" } }
  );
});
