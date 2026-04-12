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
  trackOuter: {
    position: "relative",
    height: "64px",           // enough room for dot + label below
    marginBottom: "0.25rem",
  },
  trackLine: {
    position: "absolute",
    top: "10px",               // dot center
    left: "0",
    right: "0",
    height: "2px",
    background: "linear-gradient(to right, #d47e7e44, #e0dbd3, #a8d4a044)",
    borderRadius: "1px",
  },
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

function SpectrumRow({ anchor, coRatings }) {
  const anchorColor = CONCEPT_COLOR[anchor] || "#888";

  // Sort coRatings by rating so labels don't jump around
  const sorted = [...coRatings].sort((a, b) => a.rating - b.rating);

  // Detect which items share the same rating so we can stagger their labels
  const ratingCounts = {};
  for (const { rating } of sorted) ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;

  // Assign vertical stagger index per rating group
  const ratingIdx = {};
  const positioned = sorted.map(({ other, rating }) => {
    ratingIdx[rating] = (ratingIdx[rating] || 0);
    const staggerIdx = ratingIdx[rating];
    ratingIdx[rating]++;
    const pct = ((rating - 1) / 4) * 100;  // 1→0%, 5→100%
    return { other, rating, pct, staggerIdx };
  });

  return (
    <div style={S.spectrumWrapper}>
      <span style={S.anchorChip(anchorColor)}>{anchor}</span>
      <div style={S.trackOuter}>
        <div style={S.trackLine} />
        {positioned.map(({ other, rating, pct, staggerIdx }) => {
          const dotColor = CONCEPT_COLOR[other] || "#888";
          // Stagger labels below for same-rating items
          const labelTop = 24 + staggerIdx * 14;
          return (
            <div
              key={other}
              style={{
                position: "absolute",
                left: `${pct}%`,
                top: "0",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              {/* dot on the track line */}
              <div style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: dotColor,
                border: "2px solid #fff",
                boxShadow: `0 0 0 1px ${dotColor}`,
                flexShrink: 0,
                marginTop: "5px",   // center on track line (top:10px - half height)
              }} />
              {/* label below */}
              <div style={{
                position: "absolute",
                top: `${labelTop}px`,
                fontSize: "0.58rem",
                color: dotColor,
                whiteSpace: "nowrap",
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: "0.02em",
                maxWidth: "110px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {other}
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
