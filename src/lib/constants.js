/**
 * constants.js — shared app-wide constants.
 *
 * Centralised here so a single edit propagates everywhere.
 * Import specific values rather than the whole module.
 */

/**
 * Minimum number of pairs rated before switching from ForceGraph to MDS.
 *
 * Background: with n=61 concepts, the full distance matrix has 1,953 pairs.
 * At 20 pairs/session, a single user covers ~1% of the matrix; at 40 pairs
 * they cover ~2%. Simulation shows that the MDS map only starts showing
 * meaningful domain clustering once a user has rated ~60+ pairs — before that
 * the ~98% neutral-imputed (0.5) pairs dominate the layout and produce
 * an undifferentiated cloud with uninformative stress values (~0.82).
 * The force-directed graph (ForceGraph) is more honest for sparse data
 * because it only draws springs for rated pairs.
 */
export const MDS_THRESHOLD = 60;

/**
 * Total pairs in the survey (61 × 60 / 2 = 1,953).
 * Used to compute coverage percentage for the personal map note.
 */
export const TOTAL_CONCEPT_PAIRS = 1953;

/**
 * Stress thresholds for the layout-quality indicator on aggregate MDS plots.
 *
 * IMPORTANT: These are calibrated for n=61 concepts in 2D MDS, NOT the
 * standard Kruskal thresholds (which assume small n).
 *
 * Empirical bounds for this dataset:
 *   ~0.40 → theoretical floor (full coverage, all 1,953 pairs rated)
 *   ~0.55 → typical with ~100 sessions × 20 pairs (good operating point)
 *   ~0.65 → borderline useful (MIN_RESPONDENTS threshold ~50 sessions)
 *   ~0.70+ → too few respondents; layout is mostly noise
 *
 * NOTE: These thresholds apply only to aggregate (group) maps computed
 * server-side from many respondents. Individual personal maps have stress
 * ~0.82+ due to sparse coverage and should NOT display a stress indicator.
 */
export const STRESS_LABELS = [
  { max: 0.45, label: "Excellent", color: "#a8d4a0" },
  { max: 0.55, label: "Good",      color: "#a8d4a0" },
  { max: 0.65, label: "Fair",      color: "#e8c547" },
  { max: Infinity, label: "Poor",  color: "#d47e7e" },
];

export function stressQuality(stress) {
  return STRESS_LABELS.find(s => stress < s.max) ?? STRESS_LABELS[STRESS_LABELS.length - 1];
}
