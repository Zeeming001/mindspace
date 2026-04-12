/**
 * SparseInsightView.jsx
 *
 * Replaces the force-directed graph for personal concept maps.
 * Works at any response count — shown alone when < MDS_THRESHOLD,
 * and shown below the MDS plot when ≥ MDS_THRESHOLD.
 *
 * Two sections:
 *   1. Card view — closest and most-distant rated pairs
 *   2. Similarity spectra — 1D horizontal strips for concepts the user
 *      has rated against 2+ others, showing where those others land on
 *      a "very different → very similar" axis
 *
 * Props:
 *   responses  – Array of { concept_a, concept_b, rating } (1–5)
 */

import { useMemo } from "react";
import { CONCEPT_COLOR, CONCEPT_DOMAIN } from "../lib/concepts";

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  root: {
    marginTop: "0",
  },
  sectionLabel: {
    fontSize: "0.57rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontFamily: "'IBM Plex Mono', monospace",
    marginBottom: "0.7rem",
    display: "block",
  },
  pairGrid: (narrow) => ({
    display: "grid",
    gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
    gap: "1.25rem",
    marginBottom: "1.75rem",
  }),
  pairRow: {
    display: "flex",
    alignItems: "center",
    padding: "0.42rem 0",
    borderBottom: "1px solid #f0ede8",
    gap: "0.5rem",
  },
  dotA: (color) => ({
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  }),
  dotB: (color) => ({
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  }),
  pairNames: {
    flex: 1,
    fontSize: "0.73rem",
    fontFamily: "'Playfair Display', serif",
    color: "#1a1a1e",
    minWidth: 0,
    lineHeight: 1.35,
  },
  ratingBadge: (val) => ({
    flexShrink: 0,
    fontSize: "0.58rem",
    fontFamily: "'IBM Plex Mono', monospace",
    letterSpacing: "0.06em",
    color: val >= 4 ? "#6ab04c" : val <= 2 ? "#c0574a" : "#888",
    minWidth: "24px",
    textAlign: "right",
  }),
  spectraSection: {
    marginTop: "0.25rem",
    borderTop: "1px solid #e0dbd3",
    paddingTop: "1.5rem",
  },
  spectraLabel: {
    fontSize: "0.57rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontFamily: "'IBM Plex Mono', monospace",
    color: "#7eb8d4",
    marginBottom: "1.5rem",
    display: "block",
  },
  spectrumWrapper: {
    marginBottom: "2rem",
  },
  anchorChip: (color) => ({
    display: "inline-block",
    fontSize: "0.68rem",
    fontFamily: "'Playfair Display', serif",
    color,
    borderBottom: `2px solid ${color}`,
    paddingBottom: "1px",
    marginBottom: "0.75rem",
    letterSpacing: "0.02em",
  }),
  trackEndLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.52rem",
    color: "#bbb",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontFamily: "'IBM Plex Mono', monospace",
    marginTop: "0.2rem",
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function PairRow({ response }) {
  const { concept_a, concept_b, rating } = response;
  const colorA = CONCEPT_COLOR[concept_a] || "#999";
  const colorB = CONCEPT_COLOR[concept_b] || "#999";
  return (
    <div style={S.pairRow}>
      <div style={S.dotA(colorA)} />
      <div style={S.dotB(colorB)} />
      <span style={S.pairNames}>{concept_a} · {concept_b}</span>
      <span style={S.ratingBadge(rating)}>{rating}/5</span>
    </div>
  );
}

// Truncate a concept name to ~28 chars, breaking at a word boundary
function truncate(name, max = 28) {
  if (name.length <= max) return name;
  const cut = name.lastIndexOf(" ", max);
  return (cut > 12 ? name.slice(0, cut) : name.slice(0, max)) + "…";
}

function SpectrumRow({ anchor, coRatings }) {
  const anchorColor = CONCEPT_COLOR[anchor] || "#888";

  // Sort by rating (left → right)
  const sorted = [...coRatings].sort((a, b) => a.rating - b.rating);

  // Assign a stagger row within each rating group so same-value labels
  // don't collide. Each stagger row is offset 22px further down.
  const ratingRowCount = {};
  const positioned = sorted.map(({ other, rating }) => {
    const row = ratingRowCount[rating] || 0;
    ratingRowCount[rating] = row + 1;
    // Map rating 1–5 → 0–100%, then clamp 4–96% so edge labels stay in frame
    const pct = Math.max(4, Math.min(96, ((rating - 1) / 4) * 100));
    return { other, rating, pct, row };
  });

  const maxRow = Math.max(...positioned.map(p => p.row));
  // Track sits at top:6px; dot is 10px tall; labels start at top:22px;
  // each stagger adds 20px
  const outerHeight = 22 + (maxRow + 1) * 20 + 4;

  return (
    <div style={S.spectrumWrapper}>
      <span style={S.anchorChip(anchorColor)}>{anchor}</span>
      <div style={{ position: "relative", height: `${outerHeight}px`, marginBottom: "0.15rem" }}>
        {/* Gradient track */}
        <div style={{
          position: "absolute",
          top: "11px",
          left: 0, right: 0,
          height: "2px",
          background: "linear-gradient(to right, #d47e7e55, #e0dbd3, #a8d4a055)",
          borderRadius: "1px",
        }} />

        {positioned.map(({ other, rating, pct, row }) => {
          const dotColor = CONCEPT_COLOR[other] || "#888";
          const labelTop = 22 + row * 20;

          // Edge-aware horizontal alignment:
          // left zone  (<15%): anchor label to the left of dot → no negative x
          // right zone (>85%): anchor label to the right of dot → won't overflow
          // middle: centre on dot
          const labelTransform =
            pct < 15 ? "none" :
            pct > 85 ? "translateX(-100%)" :
            "translateX(-50%)";

          return (
            <div key={other} style={{ position: "absolute", left: `${pct}%`, top: 0, pointerEvents: "none" }}>
              {/* Dot */}
              <div style={{
                position: "absolute",
                top: "6px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: dotColor,
                border: "2px solid #fff",
                boxShadow: `0 0 0 1px ${dotColor}`,
              }} />
              {/* Label */}
              <div style={{
                position: "absolute",
                top: `${labelTop}px`,
                left: 0,
                transform: labelTransform,
                fontSize: "0.57rem",
                color: dotColor,
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
                lineHeight: 1.3,
              }}>
                {truncate(other)}
              </div>
            </div>
          );
        })}
      </div>
      <div style={S.trackEndLabels}>
        <span>Very different</span>
        <span>Very similar</span>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function SparseInsightView({ responses, narrow = false }) {
  if (!responses || responses.length === 0) return null;

  // ── Pair cards ────────────────────────────────────────────────────────────
  const sorted = useMemo(
    () => [...responses].sort((a, b) => b.rating - a.rating),
    [responses]
  );

  // Show top/bottom N pairs; scale with data quantity, cap at 6
  const nShow = Math.min(6, Math.max(3, Math.ceil(responses.length / 5)));
  const closest      = sorted.slice(0, nShow);
  const mostDistant  = sorted.slice(-nShow).reverse();

  // ── Similarity spectra ────────────────────────────────────────────────────
  const spectraAnchors = useMemo(() => {
    // Build co-rating map: concept → [{ other, rating }]
    const coMap = {};
    for (const { concept_a, concept_b, rating } of responses) {
      if (!coMap[concept_a]) coMap[concept_a] = [];
      if (!coMap[concept_b]) coMap[concept_b] = [];
      coMap[concept_a].push({ other: concept_b, rating });
      coMap[concept_b].push({ other: concept_a, rating });
    }

    return Object.entries(coMap)
      .filter(([, rs]) => rs.length >= 2)
      .map(([concept, rs]) => {
        const vals = rs.map(r => r.rating);
        const spread = Math.max(...vals) - Math.min(...vals);
        return { concept, coRatings: rs, count: rs.length, spread };
      })
      // Prefer more data points; break ties by spread (more spread = more interesting)
      .sort((a, b) =>
        b.count !== a.count ? b.count - a.count : b.spread - a.spread
      )
      .slice(0, 3);
  }, [responses]);

  return (
    <div style={S.root}>
      {/* ── Cards ─────────────────────────────────────────────────────────── */}
      <div style={S.pairGrid(narrow)}>
        <div>
          <span style={{ ...S.sectionLabel, color: "#6ab04c" }}>Closest pairs</span>
          {closest.map((r, i) => <PairRow key={i} response={r} />)}
        </div>
        <div>
          <span style={{ ...S.sectionLabel, color: "#c0574a" }}>Most distant pairs</span>
          {mostDistant.map((r, i) => <PairRow key={i} response={r} />)}
        </div>
      </div>

      {/* ── Spectra ───────────────────────────────────────────────────────── */}
      {spectraAnchors.length > 0 && (
        <div style={S.spectraSection}>
          <span style={S.spectraLabel}>Similarity spectrum</span>
          <p style={{
            fontSize: "0.65rem",
            color: "#888",
            lineHeight: 1.7,
            marginBottom: "1.5rem",
            marginTop: "-0.75rem",
          }}>
            Concepts you've rated alongside the same anchor, placed by how similar you find them.
          </p>
          {spectraAnchors.map(({ concept, coRatings }) => (
            <SpectrumRow key={concept} anchor={concept} coRatings={coRatings} />
          ))}
        </div>
      )}
    </div>
  );
}
