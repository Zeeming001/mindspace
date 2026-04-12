import { useEffect, useRef } from "react";
import { CONCEPT_COLOR, CONCEPT_DOMAIN, DOMAINS } from "../lib/concepts";
import { CONCEPT_DESCRIPTIONS } from "../lib/conceptDescriptions";

/**
 * ConceptModal
 *
 * A slide-in side panel that appears when a user clicks a concept on the map.
 * Shows:
 *   - The concept name (coloured by domain)
 *   - Which domain it belongs to
 *   - What it is meant to evoke
 *   - How perceptions of it tend to differ across identity groups
 *
 * Props:
 *   concept   – concept name string, or null (hidden when null)
 *   onClose   – callback to dismiss
 */
export default function ConceptModal({ concept, onClose }) {
  const panelRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!concept) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [concept, onClose]);

  // Close on backdrop click
  function handleBackdropClick(e) {
    if (panelRef.current && !panelRef.current.contains(e.target)) {
      onClose();
    }
  }

  if (!concept) return null;

  const color       = CONCEPT_COLOR[concept] ?? "#aaa";
  const domainId    = CONCEPT_DOMAIN[concept];
  const domain      = DOMAINS.find(d => d.id === domainId);
  const description = CONCEPT_DESCRIPTIONS[concept];

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,20,24,0.45)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "stretch",
      }}
    >
      <div
        ref={panelRef}
        style={{
          width: "min(420px, 100vw)",
          background: "#fff",
          borderLeft: `3px solid ${color}`,
          boxShadow: "-4px 0 32px rgba(0,0,0,0.14)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          animation: "slideInRight 0.22s ease-out",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "1.25rem 1.5rem 1rem",
          borderBottom: "1px solid #e0dbd3",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
        }}>
          <div>
            <div style={{
              fontSize: "0.58rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: color,
              marginBottom: "0.35rem",
              fontFamily: "'IBM Plex Mono', monospace",
            }}>
              {domain?.label ?? domainId}
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.25rem",
              fontWeight: 400,
              color: "#1a1a1e",
              lineHeight: 1.3,
              margin: 0,
            }}>
              {concept}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#aaa",
              fontSize: "1.4rem",
              lineHeight: 1,
              padding: "0.1rem 0.25rem",
              borderRadius: "3px",
              flexShrink: 0,
              marginTop: "0.15rem",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#333"}
            onMouseLeave={e => e.currentTarget.style.color = "#aaa"}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.25rem 1.5rem", flex: 1 }}>
          {description ? (
            <>
              <section style={{ marginBottom: "1.5rem" }}>
                <h3 style={{
                  fontSize: "0.58rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#888",
                  marginBottom: "0.6rem",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 400,
                }}>
                  What this concept evokes
                </h3>
                <p style={{
                  fontSize: "0.82rem",
                  lineHeight: 1.85,
                  color: "#333",
                  margin: 0,
                }}>
                  {description.evokes}
                </p>
              </section>

              <section>
                <h3 style={{
                  fontSize: "0.58rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#888",
                  marginBottom: "0.6rem",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 400,
                }}>
                  How perceptions differ across groups
                </h3>
                <p style={{
                  fontSize: "0.82rem",
                  lineHeight: 1.85,
                  color: "#333",
                  margin: 0,
                }}>
                  {description.variation}
                </p>
              </section>
            </>
          ) : (
            <p style={{ fontSize: "0.82rem", color: "#888", fontStyle: "italic" }}>
              No description available for this concept.
            </p>
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: "0.85rem 1.5rem",
          borderTop: "1px solid #e0dbd3",
          fontSize: "0.6rem",
          color: "#bbb",
          letterSpacing: "0.06em",
          lineHeight: 1.6,
        }}>
          Click another concept on the map to compare, or press Esc to close.
        </div>
      </div>

      {/* Keyframe animation injected once */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
