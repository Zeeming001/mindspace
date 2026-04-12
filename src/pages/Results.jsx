/**
 * Results.jsx — Personal concept map page.
 *
 * Accessible at /results (reads sessionId from localStorage)
 * or  at /results?s=<sessionId> (shareable link).
 *
 * Shows the user's ForceGraph, summary stats, and a Share button.
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchSessionResponses } from "../lib/supabase";
import { CONCEPTS } from "../lib/concepts";
import { LS_SESSION_KEY } from "../lib/session";
import { MDS_THRESHOLD } from "../lib/constants";
import { btnPrimary, btnSecondary } from "../styles/buttons";
import { useContainerWidth } from "../lib/hooks";
import MDSPlot from "../components/MDSPlot";
import SparseInsightView from "../components/SparseInsightView";
import ErrorBoundary from "../components/ErrorBoundary";
import ConceptModal from "../components/ConceptModal";

const S = {
  page: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "3rem 1.5rem",
    minHeight: "calc(100vh - 120px)",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e0dbd3",
    borderRadius: "6px",
    maxWidth: "720px",
    width: "100%",
    padding: "2.5rem 2rem",
  },
  label: {
    fontSize: "0.62rem",
    letterSpacing: "0.22em",
    color: "#888",
    textTransform: "uppercase",
    marginBottom: "0.9rem",
    display: "block",
  },
  h2: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.8rem",
    fontWeight: 400,
    color: "#1a1a1e",
    marginBottom: "1.4rem",
    lineHeight: 1.2,
  },
  statRow: {
    display: "flex",
    gap: "2rem",
    flexWrap: "wrap",
    marginBottom: "2rem",
    paddingBottom: "1.5rem",
    borderBottom: "1px solid #e0dbd3",
  },
  stat: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  statValue: {
    fontSize: "1.6rem",
    fontFamily: "'Playfair Display', serif",
    color: "#1a1a1e",
    fontWeight: 400,
  },
  statLabel: {
    fontSize: "0.58rem",
    letterSpacing: "0.15em",
    color: "#888",
    textTransform: "uppercase",
  },
  shareBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    marginTop: "0.6rem",
    marginBottom: "2rem",
    padding: "0.65rem 0.9rem",
    background: "rgba(0,0,0,0.02)",
    border: "1px solid #e0dbd3",
    borderRadius: "4px",
    flexWrap: "wrap",
  },
  shareUrl: {
    flex: 1,
    minWidth: 0,
    fontSize: "0.65rem",
    color: "#555",
    letterSpacing: "0.02em",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  btnRow: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    marginTop: "1.5rem",
  },
};

export default function Results() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [responses, setResponses]       = useState(null);  // null = loading
  const [error, setError]               = useState(null);
  const [copied, setCopied]             = useState(false);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [graphContainerRef, graphWidth] = useContainerWidth(660);

  // Resolve sessionId: URL param takes priority (shared link),
  // then fall back to this browser's own session from localStorage.
  const sessionId = searchParams.get("s") || localStorage.getItem(LS_SESSION_KEY);
  const isOwnSession = !searchParams.get("s") ||
    searchParams.get("s") === localStorage.getItem(LS_SESSION_KEY);

  const shareUrl = sessionId
    ? `${window.location.origin}/results?s=${sessionId}`
    : null;

  useEffect(() => {
    if (!sessionId) {
      setResponses([]);
      return;
    }
    fetchSessionResponses(sessionId)
      .then(data => setResponses(data))
      .catch(err => setError(err.message));
  }, [sessionId]);

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const conceptCount = responses
    ? [...new Set(responses.flatMap(r => [r.concept_a, r.concept_b]))].length
    : 0;
  const pairCount = responses?.length ?? 0;

  // ── Loading / error / empty states ────────────────────────────────────────
  if (error) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <span style={S.label}>Your mindspace</span>
          <p style={{ fontSize: "0.78rem", color: "#d47e7e" }}>
            Could not load results: {error}
          </p>
          <div style={S.btnRow}>
            <button style={S.btnSecondary} onClick={() => navigate("/survey")}>
              Take the survey
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionId || responses?.length === 0) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <span style={S.label}>Your mindspace</span>
          <h2 style={S.h2}>No responses yet</h2>
          <p style={{ fontSize: "0.78rem", color: "#555", lineHeight: 1.8 }}>
            {sessionId
              ? "This session doesn't have any recorded responses."
              : "We couldn't find a session in this browser."}
            {" "}Take the survey to build your personal concept map.
          </p>
          <div style={S.btnRow}>
            <button style={S.btnPrimary} onClick={() => navigate("/survey")}>
              Take the survey →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (responses === null) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <span style={S.label}>Your mindspace</span>
          <p style={{ fontSize: "0.65rem", color: "#aaa", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.card}>
        <span style={S.label}>
          {isOwnSession ? "Your mindspace" : "Shared mindspace"}
        </span>
        <h2 style={S.h2}>Your concept map</h2>

        {/* Stats */}
        <div style={S.statRow}>
          {[
            { value: pairCount,    label: "Pairs rated" },
            { value: conceptCount, label: "Concepts seen" },
          ].map(({ value, label }) => (
            <div key={label} style={S.stat}>
              <span style={S.statValue}>{value}</span>
              <span style={S.statLabel}>{label}</span>
            </div>
          ))}
        </div>

        {/* Share bar */}
        {isOwnSession && shareUrl && (
          <div style={S.shareBar}>
            <span style={S.shareUrl}>{shareUrl}</span>
            <button
              style={{ ...btnSecondary, padding: "0.4rem 1rem", fontSize: "0.6rem" }}
              onClick={handleCopyLink}
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>
        )}

        {/* Width-measuring wrapper — always rendered so graphWidth stays current */}
        <div ref={graphContainerRef} style={{ width: "100%" }} />

        {/* MDS spatial map — shown once ≥ MDS_THRESHOLD pairs rated */}
        {responses.length >= MDS_THRESHOLD && (() => {
          const ratedConcepts = CONCEPTS.filter(c =>
            responses.some(r => r.concept_a === c || r.concept_b === c)
          );
          const w = Math.max(graphWidth - 32, 280);
          return (
            <div
              style={{
                background: "rgba(0,0,0,0.02)",
                border: "1px solid #e0dbd3",
                borderRadius: "4px",
                padding: "1rem",
                marginBottom: "2rem",
              }}
            >
              <ErrorBoundary label="concept map">
                <MDSPlot
                  responses={responses}
                  concepts={ratedConcepts}
                  width={w}
                  height={Math.round(w * 0.75)}
                  showLegend={true}
                  defaultShowLabels={true}
                  onConceptClick={setSelectedConcept}
                  selectedConcept={selectedConcept}
                />
              </ErrorBoundary>
            </div>
          );
        })()}

        {/* Pair cards + similarity spectra — always shown */}
        <SparseInsightView
          responses={responses}
          narrow={graphWidth < 480}
        />

        <p style={{ fontSize: "0.72rem", color: "#666", lineHeight: 1.8, marginTop: "1rem", marginBottom: "0.5rem" }}>
          {responses.length >= MDS_THRESHOLD
            ? "The spatial map shows all concepts you've rated — distance reflects psychological closeness."
            : `Rate ${MDS_THRESHOLD - responses.length} more pairs to unlock the full spatial concept map.`}
          {isOwnSession && " Share the link above so others can see your map."}
        </p>

        <div style={S.btnRow}>
          {isOwnSession && (
            <button style={btnPrimary} onClick={() => navigate("/survey")}>
              Rate more pairs →
            </button>
          )}
          <button style={btnSecondary} onClick={() => navigate("/explore")}>
            Explore group maps
          </button>
        </div>
      </div>

      <ConceptModal
        concept={selectedConcept}
        onClose={() => setSelectedConcept(null)}
      />
    </div>
  );
}
