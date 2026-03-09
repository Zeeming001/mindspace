import { useState, useEffect, useRef, useMemo } from "react";
import { CONCEPT_COLOR, DOMAINS } from "../lib/concepts";

/**
 * ForceGraph renders a force-directed concept network from raw responses.
 *
 * Unlike MDSPlot (which requires a dense distance matrix), ForceGraph works
 * directly with sparse pairwise ratings — only rated pairs become edges.
 * The physics simulation places highly-similar concepts near each other and
 * dissimilar ones far apart, with no imputation of unrated pairs.
 *
 * Props:
 *   responses  - Array<{concept_a, concept_b, rating}>
 *   width, height - SVG dimensions
 *   showLegend - whether to render domain legend
 *   label      - optional header label string
 */

// ─── Physics constants ─────────────────────────────────────────────────────
const REPULSION  = 2200;   // node-to-node repulsion strength
const STIFFNESS  = 0.055;  // spring stiffness along edges
const GRAVITY    = 0.022;  // pull toward canvas centre
const DAMPING    = 0.86;   // velocity damping each tick (lower = faster settling)
const MAX_TICKS  = 280;    // stop animating after this many frames

// Rest length: how far apart two connected nodes "want" to be.
// rating 5 (very likely similar) → 55px apart
// rating 1 (very unlikely similar) → 215px apart
function restLength(rating) {
  return 215 - (rating - 1) * 40;
}

// Visual weight of each edge based on its rating
function edgeStyle(rating) {
  return {
    strokeWidth:   0.6 + rating * 0.52,          // 1.12 → 3.2 px
    strokeOpacity: 0.1  + (rating - 1) * 0.16,   // 0.1  → 0.74
  };
}

export default function ForceGraph({
  responses = [],
  width     = 620,
  height    = 500,
  showLegend = true,
  label      = null,
}) {
  const [hovered,    setHovered]    = useState(null);
  const [showLabels, setShowLabels] = useState(false);
  const [positions,  setPositions]  = useState(null);

  const svgRef       = useRef(null);
  const dragRef      = useRef(null);   // { i, dx, dy } while dragging
  const simRef       = useRef(null);   // mutable simulation state
  const animRef      = useRef(null);   // rAF handle
  const tickRef      = useRef(0);

  // ── Derive nodes and edges from responses ────────────────────────────────
  const { nodes, edges } = useMemo(() => {
    if (!responses || responses.length === 0) return { nodes: [], edges: [] };

    const conceptSet = new Set();
    for (const r of responses) {
      conceptSet.add(r.concept_a);
      conceptSet.add(r.concept_b);
    }
    const nodes = [...conceptSet];
    const idx   = Object.fromEntries(nodes.map((c, i) => [c, i]));

    const edges = responses
      .filter(r => idx[r.concept_a] !== undefined && idx[r.concept_b] !== undefined)
      .map(r => ({
        i:      idx[r.concept_a],
        j:      idx[r.concept_b],
        rating: r.rating,
        len:    restLength(r.rating),
      }));

    return { nodes, edges };
  }, [responses]);

  // ── Initialise and animate simulation ────────────────────────────────────
  useEffect(() => {
    if (nodes.length < 3) return;

    const n  = nodes.length;
    const cx = width  / 2;
    const cy = height / 2;
    const r0 = Math.min(width, height) * 0.28;

    // Initialise on a circle with tiny jitter so power iteration converges
    const pos = nodes.map((_, i) => ({
      x: cx + r0 * Math.cos((2 * Math.PI * i) / n) + (i % 3 - 1) * 4,
      y: cy + r0 * Math.sin((2 * Math.PI * i) / n) + (i % 2 - 0.5) * 4,
    }));
    const vel = nodes.map(() => ({ x: 0, y: 0 }));

    simRef.current = { pos, vel, n, cx, cy };
    tickRef.current = 0;

    function tick() {
      const { pos, vel, n, cx, cy } = simRef.current;
      const f = Array.from({ length: n }, () => ({ x: 0, y: 0 }));

      // Repulsion between every pair of nodes
      for (let a = 0; a < n; a++) {
        for (let b = a + 1; b < n; b++) {
          const dx   = pos[a].x - pos[b].x;
          const dy   = pos[a].y - pos[b].y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.5;
          const mag  = REPULSION / (dist * dist);
          f[a].x += (dx / dist) * mag;
          f[a].y += (dy / dist) * mag;
          f[b].x -= (dx / dist) * mag;
          f[b].y -= (dy / dist) * mag;
        }
      }

      // Spring attraction along rated edges
      for (const { i, j, len } of edges) {
        const dx   = pos[j].x - pos[i].x;
        const dy   = pos[j].y - pos[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.5;
        const mag  = STIFFNESS * (dist - len);
        f[i].x += (dx / dist) * mag;
        f[i].y += (dy / dist) * mag;
        f[j].x -= (dx / dist) * mag;
        f[j].y -= (dy / dist) * mag;
      }

      // Gravity toward canvas centre
      for (let a = 0; a < n; a++) {
        f[a].x += (cx - pos[a].x) * GRAVITY;
        f[a].y += (cy - pos[a].y) * GRAVITY;
      }

      // Integrate velocities and positions
      let maxV = 0;
      for (let a = 0; a < n; a++) {
        if (dragRef.current?.i === a) continue;   // freeze dragged node
        vel[a].x = (vel[a].x + f[a].x) * DAMPING;
        vel[a].y = (vel[a].y + f[a].y) * DAMPING;
        pos[a].x = Math.max(40, Math.min(width  - 40, pos[a].x + vel[a].x));
        pos[a].y = Math.max(40, Math.min(height - 40, pos[a].y + vel[a].y));
        maxV = Math.max(maxV, Math.abs(vel[a].x) + Math.abs(vel[a].y));
      }

      setPositions([...pos]);
      tickRef.current++;

      // Continue until converged or max ticks reached
      if (tickRef.current < MAX_TICKS && maxV > 0.08) {
        animRef.current = requestAnimationFrame(tick);
      }
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [nodes, edges, width, height]);

  // ── Drag interaction ──────────────────────────────────────────────────────
  function getSVGPoint(e) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function onNodeMouseDown(e, i) {
    e.preventDefault();
    const p = getSVGPoint(e);
    const pos = simRef.current?.pos;
    if (!pos) return;
    dragRef.current = { i, dx: p.x - pos[i].x, dy: p.y - pos[i].y };
  }

  function onSVGMouseMove(e) {
    if (!dragRef.current || !simRef.current) return;
    const p = getSVGPoint(e);
    const { i, dx, dy } = dragRef.current;
    const pos = simRef.current.pos;
    pos[i].x = Math.max(40, Math.min(width  - 40, p.x - dx));
    pos[i].y = Math.max(40, Math.min(height - 40, p.y - dy));
    // Also zero velocity so node doesn't jerk when released
    if (simRef.current.vel) {
      simRef.current.vel[i].x = 0;
      simRef.current.vel[i].y = 0;
    }
    setPositions([...pos]);
  }

  function onSVGMouseUp() { dragRef.current = null; }

  // ── Label placement: anchor text away from the nearest canvas edge ────────
  function labelAnchor(px, py) {
    const xN = px / width;
    const yN = py / height;
    const textAnchor = xN < 0.35 ? "start" : xN > 0.65 ? "end" : "middle";
    const dx         = xN < 0.35 ? 9        : xN > 0.65 ? -9    : 0;
    const dy         = yN < 0.3  ? 14       : -9;
    return { textAnchor, dx, dy };
  }

  // ── Greedy collision-avoidance for "labels on" mode ──────────────────────
  // Hovered labels always show regardless; this set only controls the batch mode.
  const visibleLabels = useMemo(() => {
    if (!showLabels || !positions) return new Set();

    const CHAR_W = 5.1;   // approx px per char at 8.5 px IBM Plex Mono
    const LINE_H = 13;    // approx label height in px

    const placed  = [];
    const visible = new Set();

    for (let i = 0; i < nodes.length; i++) {
      if (!positions[i]) continue;
      const concept = nodes[i];
      const px  = positions[i].x;
      const py  = positions[i].y;

      // Mirror labelAnchor logic (uses width/height from props)
      const xN        = px / width;
      const yN        = py / height;
      const textAnchor = xN < 0.35 ? "start" : xN > 0.65 ? "end" : "middle";
      const dx         = xN < 0.35 ?  9       : xN > 0.65 ? -9    : 0;
      const dy         = yN < 0.3  ?  14      : -9;

      const lw = concept.length * CHAR_W;
      const lx = textAnchor === "start" ? px + dx
               : textAnchor === "end"   ? px + dx - lw
               :                          px + dx - lw / 2;
      const ly = py + dy - LINE_H;

      const overlaps = placed.some(b =>
        lx < b.x + b.w && lx + lw > b.x && ly < b.y + b.h && ly + LINE_H > b.y
      );

      if (!overlaps) {
        placed.push({ x: lx, y: ly, w: lw, h: LINE_H });
        visible.add(concept);
      }
    }

    return visible;
  }, [showLabels, positions, nodes, width, height]);

  // ── Early-exit states ─────────────────────────────────────────────────────
  const placeholder = (msg) => (
    <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "#888", textTransform: "uppercase" }}>
        {msg}
      </span>
    </div>
  );

  if (nodes.length < 3) return placeholder("Rate more pairs to see your network");
  if (!positions)       return placeholder("Building graph…");

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header: optional label + toggle */}
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
            color:      showLabels ? "#f8f7f4" : "#888",
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: "inherit",
          }}
        >
          {showLabels ? "Labels on" : "Labels off"}
        </button>
      </div>

      {/* Explainer */}
      <div style={{
        fontSize: "0.6rem",
        color: "#999",
        letterSpacing: "0.03em",
        marginBottom: "0.55rem",
        lineHeight: 1.5,
      }}>
        Each node is a concept you've rated. Edges connect rated pairs — thicker &amp; darker means more similar.
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block", maxWidth: "100%", cursor: dragRef.current ? "grabbing" : "default" }}
        onMouseMove={onSVGMouseMove}
        onMouseUp={onSVGMouseUp}
        onMouseLeave={onSVGMouseUp}
      >
        <defs>
          <filter id="fg-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges — drawn first so they sit behind nodes */}
        {edges.map(({ i, j, rating }, idx) => {
          if (!positions[i] || !positions[j]) return null;
          const { strokeWidth, strokeOpacity } = edgeStyle(rating);
          return (
            <line
              key={idx}
              x1={positions[i].x} y1={positions[i].y}
              x2={positions[j].x} y2={positions[j].y}
              stroke="#888"
              strokeWidth={strokeWidth}
              strokeOpacity={strokeOpacity}
              strokeLinecap="round"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((concept, i) => {
          if (!positions[i]) return null;
          const px        = positions[i].x;
          const py        = positions[i].y;
          const color     = CONCEPT_COLOR[concept];
          const isHovered = hovered === concept;
          const showLabel = (showLabels && visibleLabels.has(concept)) || isHovered;
          const { textAnchor, dx, dy } = labelAnchor(px, py);

          return (
            <g
              key={concept}
              onMouseEnter={() => setHovered(concept)}
              onMouseLeave={() => setHovered(null)}
              onMouseDown={(e) => onNodeMouseDown(e, i)}
              style={{ cursor: "grab" }}
            >
              <circle
                cx={px} cy={py}
                r={isHovered ? 7 : 5}
                fill={color}
                opacity={isHovered ? 1 : 0.8}
                filter={isHovered ? "url(#fg-glow)" : "none"}
                style={{ transition: "r 0.15s, opacity 0.15s" }}
              />
              {showLabel && (
                <text
                  x={px + dx} y={py + dy}
                  textAnchor={textAnchor}
                  fontSize={isHovered ? 10.5 : 8.5}
                  fill={isHovered ? color : "#555"}
                  fontFamily="'IBM Plex Mono', monospace"
                  style={{ userSelect: "none", pointerEvents: "none" }}
                >
                  {concept}
                </text>
              )}
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
          borderTop: "1px solid #e0dbd3",
        }}>
          {DOMAINS.map(d => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: "0.6rem", color: "#555", letterSpacing: "0.05em" }}>{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
