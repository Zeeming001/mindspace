import { useState, useEffect, useRef, useMemo } from "react";
import { CONCEPTS, CONCEPT_COLOR, DOMAINS } from "../lib/concepts";
import { classicalMDS, buildDistanceMatrix, normalizeCoords, hierarchicalCluster, convexHull } from "../lib/mds";
import { stressQuality, TOTAL_CONCEPT_PAIRS } from "../lib/constants";

// Per-cluster fill and stroke colours (cycle through up to 8 clusters).
// Opacity is intentionally moderate so hulls are visible without overwhelming
// the domain-colour dots that sit on top of them.
const CLUSTER_FILL   = [
  "rgba(180,200,255,0.22)", "rgba(255,185,185,0.22)", "rgba(175,240,195,0.22)",
  "rgba(255,248,180,0.22)", "rgba(240,185,255,0.22)", "rgba(175,248,255,0.22)",
  "rgba(255,220,175,0.22)", "rgba(220,195,255,0.22)",
];
const CLUSTER_STROKE = [
  "rgba(100,130,210,0.50)", "rgba(200,90,90,0.50)",   "rgba(70,185,110,0.50)",
  "rgba(195,185,45,0.50)",  "rgba(175,75,200,0.50)",  "rgba(45,185,200,0.50)",
  "rgba(200,135,45,0.50)",  "rgba(135,85,200,0.50)",
];

/**
 * MDSPlot renders a 2D concept map from either:
 *   - precomputed positions (positions prop), or
 *   - raw responses (responses prop) — computes MDS in-browser
 *
 * Props:
 *   positions         - Array<{concept, x, y, cluster?}> precomputed coords (0..1 normalized)
 *   responses         - Array<{concept_a, concept_b, rating}> for in-browser MDS
 *   concepts          - which concepts to show (defaults to all CONCEPTS)
 *   width, height     - SVG dimensions
 *   showLegend        - whether to render the domain legend below
 *   loading           - show skeleton state
 *   label             - optional header label string
 *   defaultShowLabels - whether labels start visible (default false for dense
 *                       aggregate maps, true for personal maps)
 */
export default function MDSPlot({
  positions         = null,
  responses         = null,
  concepts          = CONCEPTS,
  width             = 620,
  height            = 500,
  showLegend        = true,
  loading           = false,
  label             = null,
  defaultShowLabels = false,
}) {
  const [hovered, setHovered] = useState(null);
  const [showLabels, setShowLabels] = useState(defaultShowLabels);
  const prevCoordsRef = useRef(null);
  const [displayCoords, setDisplayCoords] = useState(null);
  const animFrameRef = useRef(null);

  // Compute or use provided coordinates.
  // Returns { coords: map, stress: number|null, isPersonal: bool, pairsRated: number }
  // stress is only meaningful for aggregate (precomputed) positions.
  // For personal maps (responses prop), stress is suppressed because sparse
  // coverage (~2-5%) and 0.5 neutral imputation produce stress ~0.82+
  // regardless of data quality — a meaningless and alarming number.
  const { coords, stress, isPersonal, pairsRated } = useMemo(() => {
    if (positions && positions.length > 0) {
      // Use precomputed positions. Extract stress from the first row (same for
      // all rows within a group, stored by the Edge Function).
      const xs = positions.map(p => p.x);
      const ys = positions.map(p => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;
      const map = {};
      for (const p of positions) {
        map[p.concept] = {
          x: (p.x - minX) / rangeX,
          y: (p.y - minY) / rangeY,
        };
      }
      // Use stored stress value (available once Edge Function writes it).
      const aggStress = positions[0]?.stress ?? null;
      return { coords: map, stress: aggStress, isPersonal: false, pairsRated: 0 };
    }

    if (responses && responses.length > 0) {
      // In-browser MDS — only include concepts the user has actually rated.
      // Concepts with no ratings get neutral-imputed at 0.5 for ALL their
      // pairs, causing them to cluster into an uninformative blob at the
      // map's center. Filtering to rated concepts avoids this.
      const ratedConcepts = new Set();
      for (const r of responses) {
        ratedConcepts.add(r.concept_a);
        ratedConcepts.add(r.concept_b);
      }
      const filteredConcepts = concepts.filter(c => ratedConcepts.has(c));
      if (filteredConcepts.length < 3) return { coords: null, stress: null, isPersonal: true, pairsRated: responses.length };
      const distMatrix = buildDistanceMatrix(filteredConcepts, responses);
      const { x, y } = classicalMDS(distMatrix);
      const { x: nx, y: ny } = normalizeCoords(x, y);
      const map = {};
      filteredConcepts.forEach((c, i) => { map[c] = { x: nx[i], y: ny[i] }; });
      // Do NOT return stress: at typical coverage (2-5%), stress is ~0.82+
      // due to neutral imputation — alarming but uninformative.
      return { coords: map, stress: null, isPersonal: true, pairsRated: responses.length };
    }

    return { coords: null, stress: null, isPersonal: false, pairsRated: 0 };
  }, [positions, responses, concepts]);

  // Cluster assignments: concept -> integer cluster index.
  // For precomputed positions: use the `cluster` field stored by the edge function.
  // For in-browser MDS: run Ward clustering on the already-computed coords.
  const clusters = useMemo(() => {
    // Precomputed path
    if (positions && positions.length > 0) {
      const map = {};
      let hasData = false;
      for (const p of positions) {
        if (p.cluster != null) { map[p.concept] = p.cluster; hasData = true; }
      }
      return hasData ? map : null;
    }
    // In-browser path
    if (coords) {
      const cl = Object.keys(coords);
      if (cl.length < 6) return null;
      const xs = cl.map(c => coords[c].x);
      const ys = cl.map(c => coords[c].y);
      const asgn = hierarchicalCluster(xs, ys, 10);
      const map = {};
      cl.forEach((c, i) => { map[c] = asgn[i]; });
      return map;
    }
    return null;
  }, [positions, coords]);

  // Animate transitions between coord sets
  useEffect(() => {
    if (!coords) return;

    const prev = prevCoordsRef.current;
    if (!prev) {
      prevCoordsRef.current = coords;
      setDisplayCoords(coords);
      return;
    }

    // Interpolate from prev to coords over 400ms
    const startTime = performance.now();
    const duration = 400;

    const allConcepts = Object.keys(coords);

    function animate(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out

      const interpolated = {};
      for (const c of allConcepts) {
        const to = coords[c];
        const from = prev[c] || to;
        interpolated[c] = {
          x: from.x + (to.x - from.x) * ease,
          y: from.y + (to.y - from.y) * ease,
        };
      }
      setDisplayCoords(interpolated);

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        prevCoordsRef.current = coords;
      }
    }

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animate);

    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [coords]);

  // Padding: extra horizontal room for edge labels when all labels are shown
  const pad = showLabels
    ? { top: 24, right: 110, bottom: 24, left: 110 }
    : { top: 24, right: 24,  bottom: 24, left: 24  };

  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const toSvgX = (nx) => pad.left + nx * innerW;
  const toSvgY = (ny) => pad.top  + ny * innerH;

  // Given a normalised position, return text-anchor and x/y offsets
  // that keep the label within the SVG bounds and away from the dot.
  function labelPlacement(nx, ny) {
    const anchor = nx < 0.4 ? "start" : nx > 0.6 ? "end" : "middle";
    const dx     = nx < 0.4 ?  8      : nx > 0.6 ? -8    : 0;
    const dy     = ny < 0.35 ? 14     : -9;   // below dot near top edge, above elsewhere
    return { anchor, dx, dy };
  }

  // Greedy collision-avoidance: compute which labels can be shown without overlap.
  // Hovered labels are always shown regardless; this set only controls the "all labels" mode.
  const visibleLabels = useMemo(() => {
    if (!showLabels || !displayCoords) return new Set();

    // Recompute layout constants here (mirrors the values used during render)
    const p   = { top: 24, right: 110, bottom: 24, left: 110 };
    const iW  = width  - p.left - p.right;
    const iH  = height - p.top  - p.bottom;
    const toX = (nx) => p.left + nx * iW;
    const toY = (ny) => p.top  + ny * iH;

    const CHAR_W = 5.1;   // approx px per char at 8.5 px IBM Plex Mono
    const LINE_H = 13;    // approx label height in px

    const placed  = [];
    const visible = new Set();

    for (const concept of concepts) {
      const c = displayCoords[concept];
      if (!c) continue;

      const cx = toX(c.x);
      const cy = toY(c.y);
      const nx = c.x;
      const ny = c.y;

      // Mirror labelPlacement logic
      const anchor = nx < 0.4 ? "start" : nx > 0.6 ? "end" : "middle";
      const dx     = nx < 0.4 ?  8      : nx > 0.6 ? -8    : 0;
      const dy     = ny < 0.35 ? 14     : -9;

      const lw = concept.length * CHAR_W;
      const lx = anchor === "start"  ? cx + dx
               : anchor === "end"    ? cx + dx - lw
               :                       cx + dx - lw / 2;
      const ly = cy + dy - LINE_H;

      const overlaps = placed.some(b =>
        lx < b.x + b.w && lx + lw > b.x && ly < b.y + b.h && ly + LINE_H > b.y
      );

      if (!overlaps) {
        placed.push({ x: lx, y: ly, w: lw, h: LINE_H });
        visible.add(concept);
      }
    }

    return visible;
  }, [showLabels, displayCoords, concepts, width, height]);

  if (loading) {
    return (
      <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "#888", textTransform: "uppercase" }}>
          Loading…
        </span>
      </div>
    );
  }

  if (!displayCoords) {
    return (
      <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "#888", textTransform: "uppercase" }}>
          Not enough data yet
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* Header row: optional label + toggle button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
        {label && (
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.15em", color: "#888", textTransform: "uppercase" }}>
            {label}
          </div>
        )}
        <button
          onClick={() => setShowLabels(s => !s)}
          style={{
            marginLeft: "auto",
            fontSize: "0.55rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "0.3rem 0.7rem",
            border: "1px solid #d0ccc4",
            borderRadius: "3px",
            background: showLabels ? "#1a1a1e" : "transparent",
            color:  showLabels ? "#f8f7f4" : "#888",
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: "inherit",
          }}
        >
          {showLabels ? "Labels on" : "Labels off"}
        </button>
      </div>

      <svg
        width={width}
        height={height}
        style={{ overflow: "visible", display: "block", maxWidth: "100%" }}
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Cluster background hulls (rendered behind concept dots) ── */}
        {clusters && displayCoords && (() => {
          // Group SVG-space points by cluster index
          const groups = {};
          for (const concept of concepts) {
            const pos = displayCoords[concept];
            const k   = clusters[concept];
            if (!pos || k == null) continue;
            if (!groups[k]) groups[k] = [];
            groups[k].push({ x: toSvgX(pos.x), y: toSvgY(pos.y) });
          }

          return Object.entries(groups).map(([ki, pts]) => {
            if (pts.length < 3) return null; // need at least 3 pts for a hull

            let hull;
            if (pts.length === 3) {
              hull = [...pts];
            } else {
              hull = convexHull(pts);
              if (hull.length < 3) return null;
            }

            // Expand each hull vertex outward from the centroid by 16 px
            const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length;
            const cy = hull.reduce((s, p) => s + p.y, 0) / hull.length;
            const padded = hull.map(p => {
              const dx = p.x - cx, dy = p.y - cy;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              return { x: p.x + (dx / len) * 16, y: p.y + (dy / len) * 16 };
            });

            const d = padded
              .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
              .join(' ') + 'Z';

            const ci = parseInt(ki) % CLUSTER_FILL.length;
            return (
              <path
                key={`cluster-hull-${ki}`}
                d={d}
                fill={CLUSTER_FILL[ci]}
                stroke={CLUSTER_STROKE[ci]}
                strokeWidth={1.2}
              />
            );
          });
        })()}

        {concepts.map((concept) => {
          const c = displayCoords[concept];
          if (!c) return null;
          const cx = toSvgX(c.x);
          const cy = toSvgY(c.y);
          const color = CONCEPT_COLOR[concept];
          const isHovered = hovered === concept;
          const { anchor, dx, dy } = labelPlacement(c.x, c.y);

          // Show label if: collision-safe in all-labels mode, OR this dot is hovered
          const renderLabel = (showLabels && visibleLabels.has(concept)) || isHovered;

          return (
            <g
              key={concept}
              onMouseEnter={() => setHovered(concept)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "default" }}
            >
              <circle
                cx={cx} cy={cy}
                r={isHovered ? 7 : 5}
                fill={color}
                opacity={isHovered ? 1 : 0.75}
                filter={isHovered ? "url(#glow)" : "none"}
                style={{ transition: "r 0.15s, opacity 0.15s" }}
              />
              {renderLabel && (
                <text
                  x={cx + dx}
                  y={cy + dy}
                  textAnchor={anchor}
                  fontSize={isHovered ? 10.5 : 8.5}
                  fill={isHovered ? color : "#555"}
                  fontFamily="'IBM Plex Mono', monospace"
                  style={{ transition: "font-size 0.15s, fill 0.15s", userSelect: "none", pointerEvents: "none" }}
                >
                  {concept}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Axis note — always shown to prevent misreading the layout */}
      <div style={{
        fontSize: "0.58rem",
        color: "#aaa",
        letterSpacing: "0.04em",
        fontStyle: "italic",
        marginTop: "0.4rem",
        lineHeight: 1.5,
      }}>
        Position = relative similarity; axes are arbitrary.
        {isPersonal && pairsRated > 0 && (
          <span style={{ marginLeft: "0.8rem", color: "#b8a0d4", fontStyle: "normal" }}>
            {pairsRated} of {TOTAL_CONCEPT_PAIRS} pairs rated
            {" "}({Math.round(pairsRated / TOTAL_CONCEPT_PAIRS * 100)}% coverage)
            {" "}— only concepts you've encountered are shown.
          </span>
        )}
        {!isPersonal && stress !== null && (() => {
          const q = stressQuality(stress);
          return (
            <span style={{ marginLeft: "0.8rem", color: q.color, fontStyle: "normal" }}>
              Layout quality: {q.label} (stress {stress.toFixed(3)})
            </span>
          );
        })()}
      </div>

      {showLegend && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.8rem 1.5rem",
          marginTop: "0.75rem",
          padding: "0.75rem",
          borderTop: "1px solid #e0dbd3",
        }}>
          {DOMAINS.map(d => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: "0.6rem", color: "#555", letterSpacing: "0.05em" }}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
