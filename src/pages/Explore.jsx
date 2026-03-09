import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GROUPS } from "../lib/concepts";
import { fetchGroupPositions, fetchGroupCounts, MIN_RESPONDENTS } from "../lib/supabase";
import { SAMPLE_POSITIONS } from "../lib/samplePositions";
import MDSPlot from "../components/MDSPlot";

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
  plotContainer: {
    background: "#ffffff",
    border: "1px solid #e0dbd3",
    borderRadius: "6px",
    padding: "1rem",
    overflowX: "auto",
  },
  // Banner shown when rendering simulated data
  simulatedBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.7rem",
    background: "rgba(184,136,10,0.05)",
    border: "1px solid rgba(184,136,10,0.22)",
    borderRadius: "4px",
    padding: "0.65rem 1rem",
    marginBottom: "0.75rem",
    fontSize: "0.65rem",
    color: "#b8880a",
    letterSpacing: "0.04em",
    lineHeight: 1.6,
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
  btnPrimary: {
    display: "inline-block",
    padding: "0.65rem 1.5rem",
    fontSize: "0.65rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontFamily: "inherit",
    cursor: "pointer",
    border: "1px solid #e8c547",
    borderRadius: "3px",
    background: "#e8c547",
    color: "#0d0d0f",
    transition: "all 0.2s",
    marginTop: "1rem",
  },
};

export default function Explore() {
  const navigate = useNavigate();
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [positions, setPositions] = useState(null);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [computedAt, setComputedAt] = useState(null);

  // Load group counts once on mount
  useEffect(() => {
    fetchGroupCounts()
      .then(setCounts)
      .catch(() => {}); // non-fatal
  }, []);

  // Load positions whenever selected group changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    setPositions(null);

    fetchGroupPositions(selectedGroupId)
      .then((data) => {
        if (!data || data.length === 0) {
          setPositions([]);
        } else {
          setPositions(data);
          if (data[0]?.computed_at) setComputedAt(data[0].computed_at);
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [selectedGroupId]);

  const selectedGroup  = GROUPS.find(g => g.id === selectedGroupId);
  const nResponses     = counts[selectedGroupId] ?? null;
  const hasRealData    = nResponses !== null && nResponses >= MIN_RESPONDENTS;

  // Show simulated positions when: "all" group is selected and not enough real data yet.
  // For demographic sub-groups (political, religious) we still show "not enough data" —
  // the sample is only a useful stand-in for the aggregate "all respondents" view.
  const showSample     = !hasRealData && selectedGroupId === "all";
  const displayPositions = hasRealData ? positions : (showSample ? SAMPLE_POSITIONS : null);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Explore concept maps</h1>
        <p style={S.subtitle}>
          Each point is a concept. Proximity reflects psychological similarity
          within the selected group's average ratings. Switch groups to compare
          how different communities organize these ideas.
        </p>
      </div>

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
        </div>
      </div>

      <div style={S.plotContainer}>
        {error ? (
          <div style={{ ...S.warning, color: "#d47e7e", borderColor: "#d47e7e22" }}>
            Could not load data: {error}
          </div>
        ) : !hasRealData && !showSample ? (
          // Demographic sub-group: not enough data, no fallback
          <div style={S.warning}>
            Not enough data yet for this group (minimum {MIN_RESPONDENTS} respondents required
            {nResponses !== null ? `, currently ${nResponses}` : ""}). Take the survey to contribute.
          </div>
        ) : (
          // Real data or sample fallback
          <div>
            {showSample && (
              <div style={S.simulatedBanner}>
                <span style={{ fontSize: "0.75rem" }}>⚠</span>
                <span>
                  <strong>Simulated data</strong> — this map is generated from a theoretical
                  model, not real survey responses. It will be automatically replaced once{" "}
                  {MIN_RESPONDENTS} respondents have contributed.
                  {nResponses !== null && nResponses > 0 && (
                    <> Currently {nResponses} of {MIN_RESPONDENTS} needed.</>
                  )}
                </span>
              </div>
            )}
            <MDSPlot
              positions={displayPositions}
              loading={loading && !showSample}
              width={700}
              height={520}
              showLegend={true}
            />
          </div>
        )}
      </div>

      <div style={S.meta}>
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
            Source: <span style={{ color: "#b8880a" }}>simulated</span>
          </span>
        )}
      </div>

      <div style={S.callout}>
        {hasRealData
          ? "Maps are recomputed hourly from all submitted responses. Position is determined by classical MDS on the group's aggregate distance matrix. Axes have no inherent meaning — only relative distances matter."
          : "Real maps are computed hourly once a group reaches the minimum respondent threshold. The simulated map above uses theoretically motivated distances; it shows what domain-level clustering might look like, not what it actually does."}
      </div>

      {(!nResponses || nResponses < 50) && (
        <div style={{ marginTop: "1.5rem" }}>
          <p style={{ fontSize: "0.72rem", color: "#555" }}>
            The maps improve with more data. If you haven't taken the survey yet, your
            responses will directly improve the maps for your demographic groups.
          </p>
          <button style={S.btnPrimary} onClick={() => navigate("/survey")}>
            Take the survey →
          </button>
        </div>
      )}
    </div>
  );
}
