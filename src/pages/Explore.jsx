import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CONCEPTS, GROUPS } from "../lib/concepts";
import { MDS_THRESHOLD } from "../lib/constants";
import { fetchGroupPositions, fetchGroupCounts, fetchSessionResponses, MIN_RESPONDENTS } from "../lib/supabase";
import { SAMPLE_POSITIONS } from "../lib/samplePositions";
import MDSPlot from "../components/MDSPlot";
import ForceGraph from "../components/ForceGraph";
import ConceptModal from "../components/ConceptModal";
import ErrorBoundary from "../components/ErrorBoundary";
import { LS_SESSION_KEY } from "../lib/session";
import { btnPrimarySmall } from "../styles/buttons";
import { useContainerWidth } from "../lib/hooks";

// ── Group observation prompts ──────────────────────────────────────────────
// Brief, pointed observations that help naive users notice meaningful
// structural differences when they switch between group maps.
const GROUP_OBSERVATIONS = {
  "all": {
    title: "All respondents — what to look for",
    body: "This map averages across everyone. Look for broad domain clusters: do Law concepts sit apart from Moral ones? Do Knowledge and Aesthetics concepts share a neighbourhood? These patterns are the baseline — group-specific maps will show you where agreement breaks down.",
  },
  "political:left": {
    title: "Liberal map — what to look for",
    body: "Notice where \"Pro-choice\" sits relative to \"Values personal liberty\" and \"Emphasizes bodily sovereignty\" — do they cluster as a coherent rights framework? Also watch for \"LGBTQ+ affirming\" and \"Egalitarian\" pulling together, and where \"Traditionalist\" and \"Patriotic\" land relative to the rest.",
  },
  "political:center": {
    title: "Centrist map — what to look for",
    body: "Centrist maps often show less extreme clustering on contested concepts. Look for whether \"Pro-choice\" and \"Pro-religious liberty\" sit at a similar distance from each other, and whether \"Democratic\" sits near concepts from both sides of the political spectrum.",
  },
  "political:right": {
    title: "Conservative map — what to look for",
    body: "Notice how \"Patriotic,\" \"Loyal,\" and \"Traditionalist\" cluster together. Compare where \"Pro-police\" and \"Values security\" land relative to \"Seeking order.\" Look for whether \"Believes in meritocracy\" and \"Hardworking\" are close together, and how far \"Supports a welfare state\" sits from \"Values personal liberty.\"",
  },
  "religion:religious": {
    title: "Religious respondents — what to look for",
    body: "Look for whether \"Devout,\" \"Reverent,\" and \"Believes in grace\" form a tight cluster. Notice how \"Merciful\" and \"Just\" are positioned relative to each other — the tension between mercy and justice is central in many religious traditions. See where \"Emphasizes reconciliation\" lands compared to \"Emphasizes punitive justice.\"",
  },
  "religion:secular": {
    title: "Secular / non-religious respondents — what to look for",
    body: "Compare where \"Atheist\" sits relative to \"Rational\" and \"Scientific\" — do they cluster as a coherent epistemic worldview? Notice the position of \"Mystical\" and \"Spiritual\" relative to knowledge concepts. Look for whether \"Emphasizes consent\" and \"Emphasizes bodily sovereignty\" form a tight cluster.",
  },
};

const S = {
  page: {
    padding: "2.5rem 1.5rem",
    maxWidth: "780px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "1.5rem",
  },
  title: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.4rem",
    fontWeight: 400,
    color: "#1a1a1e",
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "0.72rem",
    color: "#555",
    lineHeight: 1.7,
  },
  controls: {
    marginBottom: "1.5rem",
  },
  controlLabel: {
    fontSize: "0.6rem",
    letterSpacing: "0.18em",
    color: "#888",
    textTransform: "uppercase",
    marginBottom: "0.6rem",
    display: "block",
  },
  groupTabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    alignItems: "center",
  },
  groupTab: (active) => ({
    padding: "0.45rem 1rem",
    fontSize: "0.63rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontFamily: "inherit",
    cursor: "pointer",
    border: "1px solid",
    borderRadius: "3px",
    transition: "all 0.15s",
    borderColor: active ? "#7eb8d4" : "#d0ccc4",
    background: active ? "rgba(126,184,212,0.1)" : "transparent",
    color: active ? "#4a90b8" : "#555",
  }),
  myTab: (active) => ({
    padding: "0.45rem 1rem",
    fontSize: "0.63rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontFamily: "inherit",
    cursor: "pointer",
    border: "1px solid",
    borderRadius: "3px",
    transition: "all 0.15s",
    borderColor: active ? "#b8880a" : "#d0ccc4",
    background: active ? "rgba(184,136,10,0.08)" : "transparent",
    color: active ? "#b8880a" : "#888",
  }),
  tabDivider: {
    width: "1px",
    height: "1.4rem",
    background: "#e0dbd3",
    flexShrink: 0,
  },
  plotContainer: {
    background: "#ffffff",
    border: "1px solid #e0dbd3",
    borderRadius: "6px",
    padding: "1rem",
    overflowX: "auto",
    position: "relative",
  },
  // Banner shown when rendering simulated/placeholder data
  simulatedBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.7rem",
    background: "rgba(184,136,10,0.07)",
    border: "1px solid rgba(184,136,10,0.32)",
    borderRadius: "4px",
    padding: "0.75rem 1rem",
    marginBottom: "0.85rem",
    fontSize: "0.67rem",
    color: "#96640a",
    letterSpacing: "0.03em",
    lineHeight: 1.65,
  },
  meta: {
    display: "flex",
    gap: "2rem",
    marginTop: "1rem",
    padding: "0.75rem 0",
    borderTop: "1px solid #e0dbd3",
    flexWrap: "wrap",
  },
  metaItem: {
    fontSize: "0.62rem",
    color: "#888",
    letterSpacing: "0.08em",
  },
  metaValue: {
    color: "#555",
  },
  warning: {
    background: "rgba(184,136,10,0.06)",
    border: "1px solid rgba(184,136,10,0.2)",
    borderRadius: "4px",
    padding: "1.5rem",
    textAlign: "center",
    fontSize: "0.72rem",
    color: "#b8880a",
    letterSpacing: "0.05em",
  },
  callout: {
    background: "rgba(0,0,0,0.02)",
    border: "1px solid #e0dbd3",
    borderRadius: "4px",
    padding: "1rem 1.25rem",
    fontSize: "0.72rem",
    color: "#555",
    lineHeight: 1.8,
    marginTop: "1.5rem",
  },
  observationBox: {
    background: "rgba(126,184,212,0.06)",
    border: "1px solid rgba(126,184,212,0.28)",
    borderRadius: "4px",
    padding: "0.9rem 1.25rem",
    marginTop: "1rem",
    fontSize: "0.7rem",
    color: "#3a6880",
    lineHeight: 1.8,
  },
  observationTitle: {
    fontSize: "0.57rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#7eb8d4",
    fontFamily: "'IBM Plex Mono', monospace",
    marginBottom: "0.45rem",
    display: "block",
  },
  btnPrimary: { ...btnPrimarySmall, marginTop: "1rem" },
};

export default function Explore() {
  const navigate = useNavigate();

  // ── Group selection ─────────────────────────────────────────────────────────
  const [selectedGroupId, setSelectedGroupId] = useState("all");

  // ── Concept modal ───────────────────────────────────────────────────────────
  const [selectedConcept, setSelectedConcept] = useState(null);

  // ── Aggregate map state ─────────────────────────────────────────────────────
  const [positions,   setPositions]   = useState(null);
  const [counts,      setCounts]      = useState({});
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [computedAt,  setComputedAt]  = useState(null);
  const [plotContainerRef, plotWidth] = useContainerWidth(700);

  // ── Personal map state ──────────────────────────────────────────────────────
  const [sessionId] = useState(() => {
    try { return localStorage.getItem(LS_SESSION_KEY) || null; } catch { return null; }
  });
  const [myResponses, setMyResponses] = useState(null);   // null = not yet fetched
  const [myLoading,   setMyLoading]   = useState(false);
  const [myError,     setMyError]     = useState(null);

  // Load group counts once on mount
  useEffect(() => {
    fetchGroupCounts()
      .then(setCounts)
      .catch(() => {}); // non-fatal
  }, []);

  // Load aggregate positions whenever selected group changes (skip for personal tab)
  useEffect(() => {
    if (selectedGroupId === "mine") return;

    setLoading(true);
    setError(null);
    setPositions(null);
    setSelectedConcept(null); // clear selection when switching groups

    fetchGroupPositions(selectedGroupId)
      .then((data) => {
        if (!data || data.length === 0) {
          setPositions([]);
        } else {
          setPositions(data);
          if (data[0]?.computed_at) setComputedAt(data[0].computed_at);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedGroupId]);

  // Load personal responses when personal tab is selected
  useEffect(() => {
    if (selectedGroupId !== "mine" || !sessionId) return;
    if (myResponses !== null) return; // already fetched

    setMyLoading(true);
    setMyError(null);
    fetchSessionResponses(sessionId)
      .then(setMyResponses)
      .catch((err) => { setMyError(err.message); setMyResponses([]); })
      .finally(() => setMyLoading(false));
  }, [selectedGroupId, sessionId, myResponses]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const selectedGroup    = GROUPS.find(g => g.id === selectedGroupId);
  const nResponses       = counts[selectedGroupId] ?? null;
  const hasRealData      = nResponses !== null && nResponses >= MIN_RESPONDENTS;
  const showSample       = !hasRealData && selectedGroupId === "all";
  const displayPositions = hasRealData ? positions : (showSample ? SAMPLE_POSITIONS : null);

  const myConceptCount = myResponses
    ? new Set(myResponses.flatMap(r => [r.concept_a, r.concept_b])).size
    : 0;

  const observation = GROUP_OBSERVATIONS[selectedGroupId];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Explore concept maps</h1>
        <p style={S.subtitle}>
          {selectedGroupId === "mine"
            ? "Your personal network shows how the concepts you've rated relate to each other based on your own similarity judgements."
            : "Each point is a concept. Proximity reflects psychological similarity within the selected group's average ratings. Switch groups to compare how different communities organize these ideas."}
        </p>
      </div>

      {/* ── Group selector tabs ── */}
      <div style={S.controls}>
        <span style={S.controlLabel}>Viewing mindspace for:</span>
        <div style={S.groupTabs}>
          {GROUPS.map(g => (
            <button
              key={g.id}
              style={S.groupTab(selectedGroupId === g.id)}
              onClick={() => setSelectedGroupId(g.id)}
            >
              {g.label}
              {counts[g.id] !== undefined && (
                <span style={{ marginLeft: "0.4rem", opacity: 0.5 }}>
                  n={counts[g.id]}
                </span>
              )}
            </button>
          ))}

          {/* Visual divider */}
          <div style={S.tabDivider} />

          {/* Personal tab */}
          <button
            style={S.myTab(selectedGroupId === "mine")}
            onClick={() => setSelectedGroupId("mine")}
          >
            Your map
            {myResponses && myResponses.length > 0 && (
              <span style={{ marginLeft: "0.4rem", opacity: 0.6 }}>
                {myResponses.length} pairs
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Plot area ── */}
      <div ref={plotContainerRef} style={S.plotContainer}>
        {selectedGroupId === "mine" ? (

          // ── Personal map ──────────────────────────────────────────────────
          myLoading ? (
            <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "0.65rem", color: "#888", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                Loading…
              </span>
            </div>
          ) : !sessionId ? (
            <div style={S.warning}>
              You haven't taken the survey yet — your personal map will appear here
              after your first session.
            </div>
          ) : myError ? (
            <div style={{ ...S.warning, color: "#d47e7e", borderColor: "#d47e7e22" }}>
              Could not load your responses: {myError}
            </div>
          ) : !myResponses || myResponses.length === 0 ? (
            <div style={S.warning}>
              No responses found for your session. If you've taken the survey,
              try refreshing — or continue rating to add more data.
            </div>
          ) : (() => {
            const useMDS = myResponses.length >= MDS_THRESHOLD;
            const ratedConcepts = CONCEPTS.filter(c =>
              myResponses.some(r => r.concept_a === c || r.concept_b === c)
            );
            const w = Math.max(plotWidth - 48, 280);
            return (
              <ErrorBoundary label="personal map">
                {useMDS ? (
                  <MDSPlot
                    responses={myResponses}
                    concepts={ratedConcepts}
                    width={w}
                    height={Math.round(w * 0.75)}
                    showLegend={true}
                    defaultShowLabels={true}
                    onConceptClick={setSelectedConcept}
                    selectedConcept={selectedConcept}
                  />
                ) : (
                  <ForceGraph
                    responses={myResponses}
                    width={w}
                    height={Math.round(w * 0.74)}
                    showLegend={true}
                    defaultShowLabels={true}
                    onConceptClick={setSelectedConcept}
                    selectedConcept={selectedConcept}
                  />
                )}
              </ErrorBoundary>
            );
          })()

        ) : (

          // ── Aggregate map ─────────────────────────────────────────────────
          error ? (
            <div style={{ ...S.warning, color: "#d47e7e", borderColor: "#d47e7e22" }}>
              Could not load data: {error}
            </div>
          ) : !hasRealData && !showSample ? (
            <div style={S.warning}>
              Not enough data yet for this group (minimum {MIN_RESPONDENTS} respondents required
              {nResponses !== null ? `, currently ${nResponses}` : ""}). Take the survey to contribute.
            </div>
          ) : (
            <div>
              {showSample && (
                <div style={S.simulatedBanner}>
                  <span style={{ fontSize: "0.8rem", flexShrink: 0, marginTop: "0.05rem" }}>⚠</span>
                  <span>
                    <strong style={{ letterSpacing: "0.06em" }}>Placeholder data — not from real respondents.</strong>
                    {" "}This map was generated from a theoretical model to demonstrate what domain-level clustering
                    might look like. It will be automatically replaced once {MIN_RESPONDENTS} people have completed the survey.
                    {nResponses !== null && nResponses > 0 && (
                      <span style={{ display: "inline-block", marginLeft: "0.4rem", fontStyle: "italic" }}>
                        ({nResponses} of {MIN_RESPONDENTS} needed so far.)
                      </span>
                    )}
                  </span>
                </div>
              )}
              <ErrorBoundary label="concept map">
                <MDSPlot
                  positions={displayPositions}
                  loading={loading && !showSample}
                  width={Math.max(plotWidth - 48, 280)}
                  height={Math.round(Math.max(plotWidth - 48, 280) * 0.74)}
                  showLegend={true}
                  onConceptClick={setSelectedConcept}
                  selectedConcept={selectedConcept}
                />
              </ErrorBoundary>
            </div>
          )
        )}
      </div>

      {/* ── Meta row ── */}
      <div style={S.meta}>
        {selectedGroupId === "mine" ? (
          <>
            <span style={S.metaItem}>
              Source: <span style={S.metaValue}>your session</span>
            </span>
            {myResponses && (
              <span style={S.metaItem}>
                Pairs rated: <span style={S.metaValue}>{myResponses.length}</span>
              </span>
            )}
            {myConceptCount > 0 && (
              <span style={S.metaItem}>
                Concepts seen: <span style={S.metaValue}>{myConceptCount}</span>
              </span>
            )}
          </>
        ) : (
          <>
            <span style={S.metaItem}>
              Group: <span style={S.metaValue}>{selectedGroup?.label}</span>
            </span>
            {nResponses !== null && (
              <span style={S.metaItem}>
                Respondents: <span style={S.metaValue}>{nResponses}</span>
              </span>
            )}
            {hasRealData && computedAt && (
              <span style={S.metaItem}>
                Map computed: <span style={S.metaValue}>
                  {new Date(computedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </span>
            )}
            <span style={S.metaItem}>
              Min. threshold: <span style={S.metaValue}>{MIN_RESPONDENTS} respondents</span>
            </span>
            {showSample && (
              <span style={{ ...S.metaItem, color: "#b8880a" }}>
                Source: <span style={{ color: "#b8880a", fontStyle: "italic" }}>placeholder (simulated)</span>
              </span>
            )}
          </>
        )}
      </div>

      {/* ── What to look for — group-specific observation prompts ── */}
      {selectedGroupId !== "mine" && (hasRealData || showSample) && observation && (
        <div style={S.observationBox}>
          <span style={S.observationTitle}>{observation.title}</span>
          {observation.body}
        </div>
      )}

      {/* ── Callout / explanation ── */}
      {selectedGroupId === "mine" ? (
        <div style={S.callout}>
          {myResponses && myResponses.length >= MDS_THRESHOLD
            ? "Your map uses classical MDS — spatial distance directly reflects how similar you rated each pair of concepts. The layout is computed from your personal distance matrix, with unrated pairs treated as neutral."
            : "Your network shows only the pairs you've rated — no averages or imputation. Concepts you rated as highly similar are pulled close together; dissimilar pairs are pushed apart. Rate 60+ pairs to unlock the full MDS spatial map."}
        </div>
      ) : (
        <div style={S.callout}>
          {hasRealData
            ? "Maps are recomputed hourly from all submitted responses. Position is determined by classical MDS on the group's aggregate distance matrix. Axes have no inherent meaning — only relative distances matter."
            : showSample
            ? "The map above is a placeholder generated from theoretically motivated distances. It illustrates how domain-level clustering should look once real data arrives — but the specific positions are not empirically grounded. Real maps are computed hourly once a group reaches the minimum respondent threshold."
            : "Real maps are computed hourly once a group reaches the minimum respondent threshold. Take the survey to help your groups reach that threshold sooner."}
        </div>
      )}

      {/* ── CTA ── */}
      {selectedGroupId === "mine" ? (
        sessionId && myResponses && myResponses.length > 0 ? (
          <div style={{ marginTop: "1.5rem" }}>
            <p style={{ fontSize: "0.72rem", color: "#555" }}>
              Rate more pairs to fill in your network — each batch of 20 adds new concepts
              and refines the positions of existing ones.
            </p>
            <button style={S.btnPrimary} onClick={() => navigate("/survey")}>
              Continue rating →
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "1.5rem" }}>
            <p style={{ fontSize: "0.72rem", color: "#555" }}>
              Your personal map appears here after your first survey session.
            </p>
            <button style={S.btnPrimary} onClick={() => navigate("/survey")}>
              Take the survey →
            </button>
          </div>
        )
      ) : (
        (!nResponses || nResponses < 50) && (
          <div style={{ marginTop: "1.5rem" }}>
            <p style={{ fontSize: "0.72rem", color: "#555" }}>
              The maps improve with more data. If you haven't taken the survey yet, your
              responses will directly improve the maps for your demographic groups.
            </p>
            <button style={S.btnPrimary} onClick={() => navigate("/survey")}>
              Take the survey →
            </button>
          </div>
        )
      )}

      {/* ── Concept detail modal ── */}
      <ConceptModal
        concept={selectedConcept}
        onClose={() => setSelectedConcept(null)}
      />
    </div>
  );
}
