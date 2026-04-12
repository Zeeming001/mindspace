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
 *   4. Runs Ward hierarchical clustering on the 2D coordinates
 *   5. Writes results (x, y, cluster) to aggregate_positions table
 *
 * Groups computed:
 *   - 'all'                → all completed sessions
 *   - 'political:left'     → political IN (1,2,3)
 *   - 'political:center'   → political = 4
 *   - 'political:right'    → political IN (5,6,7)
 *   - 'religion:religious' → religion IN (Christian, Muslim, Jewish, Hindu, Buddhist, Other)
 *   - 'religion:secular'   → religion = None
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CONCEPTS_BY_DOMAIN, CONCEPTS } from "../../../src/lib/concepts.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET  = Deno.env.get("COMPUTE_MDS_CRON_SECRET"); // set in Supabase Edge Function secrets
const MIN_N        = 50; // minimum respondents to compute a map (matches MIN_RESPONDENTS in supabase.js)

// ── Group definitions ──────────────────────────────────────────────────────

// ── Ward hierarchical clustering ──────────────────────────────────────────

/**
 * Agglomerative Ward clustering on 2D coordinates.
 * Selects optimal k (2–maxK) by mean silhouette score.
 * Returns a cluster-index array (0-based) parallel to the input arrays.
 */
function wardCluster(x: number[], y: number[], maxK = 10): number[] {
  const n = x.length;
  if (n <= 2) return x.map((_, i) => i);

  interface Cluster { indices: number[]; cx: number; cy: number; }
  let clusters: Cluster[] = x.map((xi, i) => ({ indices: [i], cx: xi, cy: y[i] }));

  const history: Record<number, number[]> = {};

  while (clusters.length > 1) {
    const k = clusters.length;
    const asgn = new Array<number>(n);
    clusters.forEach((cl, ci) => cl.indices.forEach(idx => { asgn[idx] = ci; }));
    history[k] = asgn;

    let minDist = Infinity, mi = 0, mj = 1;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const na = clusters[i].indices.length, nb = clusters[j].indices.length;
        const dx = clusters[i].cx - clusters[j].cx;
        const dy = clusters[i].cy - clusters[j].cy;
        const d = (na * nb) / (na + nb) * (dx * dx + dy * dy);
        if (d < minDist) { minDist = d; mi = i; mj = j; }
      }
    }

    const a = clusters[mi], b = clusters[mj];
    const na = a.indices.length, nb = b.indices.length;
    clusters[mi] = {
      indices: [...a.indices, ...b.indices],
      cx: (na * a.cx + nb * b.cx) / (na + nb),
      cy: (na * a.cy + nb * b.cy) / (na + nb),
    };
    clusters.splice(mj, 1);
  }

  const effMaxK = Math.min(maxK, n - 1);
  let bestK = Math.min(4, effMaxK);
  let bestScore = -Infinity;
  for (let k = 2; k <= effMaxK; k++) {
    if (!history[k]) continue;
    const score = meanSilhouette(x, y, history[k], k);
    if (score > bestScore) { bestScore = score; bestK = k; }
  }

  return history[bestK] ?? new Array(n).fill(0);
}

function meanSilhouette(x: number[], y: number[], assignments: number[], k: number): number {
  const n = x.length;
  if (k <= 1 || k >= n) return 0;
  let total = 0, count = 0;

  for (let i = 0; i < n; i++) {
    const ci = assignments[i];
    let aSum = 0, aCount = 0;
    for (let j = 0; j < n; j++) {
      if (j !== i && assignments[j] === ci) {
        aSum += Math.sqrt((x[i] - x[j]) ** 2 + (y[i] - y[j]) ** 2);
        aCount++;
      }
    }
    const a = aCount > 0 ? aSum / aCount : 0;

    let minB = Infinity;
    for (let ck = 0; ck < k; ck++) {
      if (ck === ci) continue;
      let bSum = 0, bCount = 0;
      for (let j = 0; j < n; j++) {
        if (assignments[j] === ck) {
          bSum += Math.sqrt((x[i] - x[j]) ** 2 + (y[i] - y[j]) ** 2);
          bCount++;
        }
      }
      if (bCount > 0) minB = Math.min(minB, bSum / bCount);
    }
    if (!isFinite(minB)) continue;

    const s = (minB - a) / Math.max(a, minB);
    if (isFinite(s)) { total += s; count++; }
  }

  return count > 0 ? total / count : 0;
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

Deno.serve(async (req) => {
  // Auth guard — require Authorization: Bearer <COMPUTE_MDS_CRON_SECRET>
  // Set COMPUTE_MDS_CRON_SECRET in Supabase Dashboard → Edge Functions → Secrets.
  // Pass the same value in your cron scheduler (pg_cron, GitHub Actions, etc.).
  if (CRON_SECRET) {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (token !== CRON_SECRET) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const log: string[] = [];
  const now = new Date().toISOString();

  // ── Define groups ────────────────────────────────────────────────────

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
    { key: "all",                field: null,        values: null },
    { key: "political:left",     field: "political", values: [1, 2, 3] },
    { key: "political:center",   field: "political", values: [4] },
    { key: "political:right",    field: "political", values: [5, 6, 7] },
    { key: "religion:religious", field: "religion",  values: ["Christian", "Muslim", "Jewish", "Hindu", "Buddhist", "Other"] },
    { key: "religion:secular",   field: "religion",  values: ["None"] },
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

      // Compute Kruskal's stress-1 for this group's map.
      // Calibrated range for n=61 concepts in 2D:
      //   ~0.40 = theoretical floor (full coverage)
      //   ~0.55 = good (100+ sessions)
      //   ~0.65 = fair (50 sessions, minimum threshold)
      //   ~0.70+ = poor (too few respondents)
      function computeStress(dm: number[][], xs: number[], ys: number[]): number {
        const n = xs.length;
        let numerator = 0, denominator = 0;
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const dij = dm[i][j];
            const eij = Math.sqrt((xs[i] - xs[j]) ** 2 + (ys[i] - ys[j]) ** 2);
            numerator   += (dij - eij) ** 2;
            denominator += dij * dij;
          }
        }
        return denominator > 0 ? Math.sqrt(numerator / denominator) : 0;
      }
      const stress = computeStress(distMatrix, x, y);

      // Run Ward hierarchical clustering on the 2D layout
      const clusterAssignments = wardCluster(x, y, 10);

      // Upsert coordinates + cluster assignments into aggregate_positions
      const rows = CONCEPTS.map((concept, i) => ({
        group_key:   group.key,
        concept,
        x:           x[i],
        y:           y[i],
        cluster:     clusterAssignments[i],
        stress:      stress,           // layout quality — same value for all rows in this group
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
