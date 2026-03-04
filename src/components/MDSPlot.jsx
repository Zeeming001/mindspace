import { useState, useEffect, useRef, useMemo } from "react";
import { CONCEPTS, CONCEPT_COLOR, CONCEPT_DOMAIN, DOMAINS } from "../lib/concepts";
import { classicalMDS, buildDistanceMatrix, normalizeCoords } from "../lib/mds";

/**
 * MDSPlot renders a 2D concept map from either:
 *   - precomputed positions (positions prop), or
 *   - raw responses (responses prop) — computes MDS in-browser
 *
 * Props:
 *   positions  - Array<{concept, x, y}> of precomputed coords (0..1 normalized)
 *   responses  - Array<{concept_a, concept_b, rating}> for in-browser MDS
 *   concepts   - which concepts to show (defaults to all 63)
 *   width, height - SVG dimensions
 *   showLegend - whether to render the domain legend below
 *   loading    - show skeleton state
 *   minN       - minimum n_responses to show (if using precomputed positions)
 */
export default function MDSPlot({
  positions = null,
  responses = null,
  concepts = CONCEPTS,
  width = 620,
  height = 500,
  showLegend = true,
  loading = false,
  label = null,
}) {
  const [hovered, setHovered] = useState(null);
  const prevCoordsRef = useRef(null);
  const [displayCoords, setDisplayCoords] = useState(null);
  const animFrameRef = useRef(null);

  // Compute or use provided coordinates
  const coords = useMemo(() => {
    if (positions && positions.length > 0) {
      // Use precomputed positions
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
      return map;
    }

    if (responses && responses.length > 0) {
      // In-browser MDS
      const filteredConcepts = concepts.filter(c =>
        responses.some(r => r.concept_a === c || r.concept_b === c)
      );
      if (filteredConcepts.length < 3) return null;
      const distMatrix = buildDistanceMatrix(filteredConcepts, responses);
      const { x, y } = classicalMDS(distMatrix);
      const { x: nx, y: ny } = normalizeCoords(x, y);
      const map = {};
      filteredConcepts.forEach((c, i) => { map[c] = { x: nx[i], y: ny[i] }; });
      return map;
    }

    return null;
  }, [positions, responses, concepts]);

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

  const pad = { top: 24, right: 24, bottom: 24, left: 24 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const toSvgX = (nx) => pad.left + nx * innerW;
  const toSvgY = (ny) => pad.top + ny * innerH;

  if (loading) {
    return (
      <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "#333", textTransform: "uppercase" }}>
          Loading…
        </span>
      </div>
    );
  }

  if (!displayCoords) {
    return (
      <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "#333", textTransform: "uppercase" }}>
          Not enough data yet
        </span>
      </div>
    );
  }

  return (
    <div>
      {label && (
        <div style={{ fontSize: "0.6rem", letterSpacing: "0.15em", color: "#444", textTransform: "uppercase", marginBottom: "0.5rem" }}>
          {label}
        </div>
      )}
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

        {concepts.map((concept) => {
          const c = displayCoords[concept];
          if (!c) return null;
          const cx = toSvgX(c.x);
          const cy = toSvgY(c.y);
          const color = CONCEPT_COLOR[concept];
          const isHovered = hovered === concept;

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
                opacity={isHovered ? 1 : 0.7}
                filter={isHovered ? "url(#glow)" : "none"}
                style={{ transition: "r 0.15s, opacity 0.15s" }}
              />
              <text
                x={cx} y={cy - 9}
                textAnchor="middle"
                fontSize={isHovered ? 10 : 8.5}
                fill={isHovered ? color : "#6a6a72"}
                fontFamily="'IBM Plex Mono', monospace"
                style={{ transition: "font-size 0.15s, fill 0.15s", userSelect: "none", pointerEvents: "none" }}
              >
                {concept}
              </text>
            </g>
          );
        })}
      </svg>

      {showLegend && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.8rem 1.5rem",
          marginTop: "1rem",
          padding: "0.75rem",
          borderTop: "1px solid #1a1a1e",
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
