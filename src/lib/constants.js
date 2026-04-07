/**
 * constants.js — shared app-wide constants.
 *
 * Centralised here so a single edit propagates everywhere.
 * Import specific values rather than the whole module.
 */

/**
 * Minimum number of pairs rated before switching from ForceGraph to MDS.
 * Below this threshold the distance matrix is too sparse for MDS to produce
 * a meaningful spatial layout; the force-directed graph is more honest.
 */
export const MDS_THRESHOLD = 40;

/**
 * Stress thresholds for the layout-quality indicator shown on MDS plots.
 * Kruskal's stress-1: lower is better.
 *   < 0.05  → excellent
 *   < 0.10  → good
 *   < 0.20  → fair
 *   ≥ 0.20  → poor (treat layout with caution)
 */
export const STRESS_LABELS = [
  { max: 0.05, label: "Excellent", color: "#a8d4a0" },
  { max: 0.10, label: "Good",      color: "#a8d4a0" },
  { max: 0.20, label: "Fair",      color: "#e8c547" },
  { max: Infinity, label: "Poor",  color: "#d47e7e" },
];

export function stressQuality(stress) {
  return STRESS_LABELS.find(s => stress < s.max) ?? STRESS_LABELS[STRESS_LABELS.length - 1];
}
