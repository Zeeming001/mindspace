/**
 * Admin.jsx — Project owner dashboard + data export page.
 *
 * Accessible at /admin. Not linked from the nav — navigate there directly.
 * Requires the admin token set in the Supabase settings table.
 *
 * After authentication, shows:
 *   - Summary stats (total sessions, total ratings, sessions today/this week)
 *   - Demographic breakdown charts (political, religion, age, gender, education)
 *   - Group map status table (n, stress, quality grade, last computed)
 *   - Recent session activity (last 10 completed sessions)
 *   - CSV export cards for full analysis files
 */

import { useState, useEffect } from "react";
import {
  exportFullData,
  exportSessionsData,
  exportPairCoverage,
  fetchRespondentCount,
  fetchGroupPositions,
  fetchRealGroupCounts,
} from "../lib/supabase";
import { GROUPS } from "../lib/concepts";
import { MIN_RESPONDENTS } from "../lib/supabase";

// ── CSV utilities ─────────────────────────────────────────────────────────────

function toCSV(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map(row => headers.map(h => escape(row[h])).join(",")),
  ].join("\n");
}

function downloadCSV(filename, rows) {
  const csv = toCSV(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Analytics helpers ─────────────────────────────────────────────────────────

function countBy(rows, field) {
  const counts = {};
  for (const row of rows) {
    const val = row[field] ?? "Unknown";
    counts[val] = (counts[val] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, n]) => ({ label, n }));
}

function sessionsInDays(sessions, days) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  return sessions.filter(s => s.completed_at && s.completed_at > cutoff).length;
}

// Kruskal stress → quality label
function stressLabel(stress) {
  if (stress == null) return { text: "—", color: "#aaa" };
  if (stress < 0.45)  return { text: "Excellent", color: "#6ab04c" };
  if (stress < 0.55)  return { text: "Good",      color: "#78c37e" };
  if (stress < 0.65)  return { text: "Fair",       color: "#e8c547" };
  return                     { text: "Poor",       color: "#d47e7e" };
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  page: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "3rem 1.5rem 5rem",
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
  },
  h3: {
    fontSize: "0.62rem",
    letterSpacing: "0.18em",
    color: "#7eb8d4",
    textTransform: "uppercase",
    marginBottom: "1rem",
    marginTop: "0",
  },
  p: {
    fontSize: "0.78rem",
    lineHeight: 1.9,
    color: "#555",
    marginBottom: "1rem",
  },
  tokenRow: {
    display: "flex",
    gap: "0.6rem",
    marginBottom: "2rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  tokenInput: {
    flex: 1,
    minWidth: "180px",
    padding: "0.65rem 0.8rem",
    background: "#ffffff",
    border: "1px solid #d0ccc4",
    borderRadius: "3px",
    color: "#1a1a1e",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.78rem",
    letterSpacing: "0.05em",
  },
  verifyBtn: {
    padding: "0.65rem 1.4rem",
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
    flexShrink: 0,
  },
  divider: {
    borderTop: "1px solid #e0dbd3",
    margin: "2.5rem 0",
  },
  section: {
    marginBottom: "2.5rem",
  },
  // ── Summary stat tiles
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "1rem",
    marginBottom: "0.5rem",
  },
  statTile: {
    background: "#ffffff",
    border: "1px solid #e0dbd3",
    borderRadius: "6px",
    padding: "1.1rem 1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  statValue: {
    fontSize: "1.7rem",
    fontFamily: "'Playfair Display', serif",
    color: "#1a1a1e",
    fontWeight: 400,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "0.56rem",
    letterSpacing: "0.15em",
    color: "#888",
    textTransform: "uppercase",
  },
  // ── Demographic bars
  demoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1.5rem",
    marginBottom: "0.5rem",
  },
  demoCard: {
    background: "#ffffff",
    border: "1px solid #e0dbd3",
    borderRadius: "6px",
    padding: "1rem 1.25rem",
  },
  demoTitle: {
    fontSize: "0.57rem",
    letterSpacing: "0.16em",
    color: "#7eb8d4",
    textTransform: "uppercase",
    marginBottom: "0.8rem",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  barRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.45rem",
    fontSize: "0.66rem",
    color: "#555",
  },
  barLabel: {
    width: "110px",
    flexShrink: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "#444",
  },
  barTrack: {
    flex: 1,
    height: "8px",
    background: "#f0ede8",
    borderRadius: "4px",
    overflow: "hidden",
  },
  barCount: {
    width: "26px",
    flexShrink: 0,
    textAlign: "right",
    color: "#888",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  // ── Group map status table
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.68rem",
    color: "#555",
  },
  th: {
    fontSize: "0.55rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#888",
    padding: "0.5rem 0.75rem",
    borderBottom: "1px solid #e0dbd3",
    textAlign: "left",
    fontWeight: 400,
  },
  td: {
    padding: "0.6rem 0.75rem",
    borderBottom: "1px solid #f0ede8",
    verticalAlign: "middle",
  },
  // ── Recent sessions
  sessionRow: {
    display: "flex",
    gap: "1rem",
    padding: "0.6rem 0",
    borderBottom: "1px solid #f0ede8",
    fontSize: "0.66rem",
    color: "#555",
    flexWrap: "wrap",
    alignItems: "center",
  },
  sessionId: {
    fontFamily: "'IBM Plex Mono', monospace",
    color: "#aaa",
    fontSize: "0.58rem",
    minWidth: "100px",
  },
  // ── Export cards
  exportCard: {
    border: "1px solid #e0dbd3",
    borderRadius: "6px",
    padding: "1.5rem",
    marginBottom: "1rem",
    background: "#ffffff",
  },
  exportTitle: {
    fontSize: "0.78rem",
    fontFamily: "'Playfair Display', serif",
    color: "#1a1a1e",
    marginBottom: "0.4rem",
  },
  exportDesc: {
    fontSize: "0.68rem",
    color: "#888",
    lineHeight: 1.7,
    marginBottom: "1rem",
  },
  exportCols: {
    fontSize: "0.6rem",
    fontFamily: "'IBM Plex Mono', monospace",
    color: "#aaa",
    lineHeight: 1.8,
    marginBottom: "1rem",
    letterSpacing: "0.02em",
  },
  downloadBtn: (loading) => ({
    padding: "0.6rem 1.4rem",
    fontSize: "0.65rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontFamily: "inherit",
    cursor: loading ? "wait" : "pointer",
    border: "1px solid #d0ccc4",
    borderRadius: "3px",
    background: "transparent",
    color: loading ? "#aaa" : "#555",
    transition: "all 0.2s",
    opacity: loading ? 0.6 : 1,
  }),
  error: {
    fontSize: "0.7rem",
    color: "#d47e7e",
    marginTop: "0.5rem",
  },
  loadingText: {
    fontSize: "0.62rem",
    color: "#aaa",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    padding: "1rem 0",
  },
};

// ── Demographic bar chart component ──────────────────────────────────────────

function DemoCard({ title, data, total }) {
  if (!data || data.length === 0) return null;
  const maxN = data[0]?.n ?? 1;
  return (
    <div style={S.demoCard}>
      <div style={S.demoTitle}>{title}</div>
      {data.slice(0, 8).map(({ label, n }) => (
        <div key={label} style={S.barRow}>
          <span style={S.barLabel} title={label}>{label}</span>
          <div style={S.barTrack}>
            <div style={{
              width: `${(n / maxN) * 100}%`,
              height: "100%",
              background: "rgba(126,184,212,0.55)",
              borderRadius: "4px",
              transition: "width 0.4s ease",
            }} />
          </div>
          <span style={S.barCount}>{n}</span>
        </div>
      ))}
      {total != null && (
        <div style={{ fontSize: "0.58rem", color: "#bbb", marginTop: "0.5rem" }}>
          n = {total} completed sessions
        </div>
      )}
    </div>
  );
}

// ── Export card component ─────────────────────────────────────────────────────

function ExportCard({ title, description, columns, filename, fetcher, token }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetcher(token);
      downloadCSV(filename, rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.exportCard}>
      <div style={S.exportTitle}>{title}</div>
      <div style={S.exportDesc}>{description}</div>
      <div style={S.exportCols}>{columns}</div>
      <button style={S.downloadBtn(loading)} onClick={handleDownload} disabled={loading}>
        {loading ? "Preparing…" : `Download ${filename}`}
      </button>
      {error && <div style={S.error}>{error}</div>}
    </div>
  );
}

// ── Group map status row ──────────────────────────────────────────────────────

function GroupStatusTable({ token }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    if (!token) return;
    // Fetch real session counts and MDS metadata (stress, computed_at) separately.
    // aggregate_positions.n_responses reflects simulated/sample data and must not
    // be used for respondent counts — use the get_group_counts() RPC instead.
    Promise.all([
      fetchRealGroupCounts().catch(() => ({})),
      Promise.all(
        GROUPS.map(async (g) => {
          try {
            const data = await fetchGroupPositions(g.id);
            if (!data || data.length === 0) return { id: g.id, stress: null, computed_at: null };
            return { id: g.id, stress: data[0].stress ?? null, computed_at: data[0].computed_at ?? null };
          } catch {
            return { id: g.id, stress: null, computed_at: null };
          }
        })
      ),
    ]).then(([counts, mdsRows]) => {
      const mdsByGroup = Object.fromEntries(mdsRows.map(r => [r.id, r]));
      setRows(
        GROUPS.map(g => ({
          id: g.id,
          label: g.label,
          n: counts[g.id] ?? 0,
          stress: mdsByGroup[g.id]?.stress ?? null,
          computed_at: mdsByGroup[g.id]?.computed_at ?? null,
        }))
      );
    });
  }, [token]);

  if (!rows) return <div style={S.loadingText}>Loading group status…</div>;

  return (
    <table style={S.table}>
      <thead>
        <tr>
          <th style={S.th}>Group</th>
          <th style={S.th}>Respondents</th>
          <th style={S.th}>Stress</th>
          <th style={S.th}>Quality</th>
          <th style={S.th}>Last computed</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => {
          const q = stressLabel(row.stress);
          const meetsThreshold = typeof row.n === "number" && row.n >= MIN_RESPONDENTS;
          return (
            <tr key={row.id}>
              <td style={S.td}>{row.label}</td>
              <td style={{ ...S.td, fontFamily: "'IBM Plex Mono', monospace" }}>
                {row.n}
                {typeof row.n === "number" && !meetsThreshold && (
                  <span style={{ color: "#b8880a", marginLeft: "0.4rem", fontSize: "0.6rem" }}>
                    (needs {MIN_RESPONDENTS - row.n} more)
                  </span>
                )}
              </td>
              <td style={{ ...S.td, fontFamily: "'IBM Plex Mono', monospace" }}>
                {row.stress != null ? row.stress.toFixed(3) : "—"}
              </td>
              <td style={{ ...S.td, color: q.color, fontWeight: 500 }}>{q.text}</td>
              <td style={{ ...S.td, color: "#aaa", fontSize: "0.62rem" }}>
                {row.computed_at
                  ? new Date(row.computed_at).toLocaleString("en-US", {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })
                  : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────────

export default function Admin() {
  const [token,           setToken]           = useState("");
  const [authed,          setAuthed]          = useState(false);
  const [authError,       setAuthError]       = useState(null);
  const [verifying,       setVerifying]       = useState(false);
  const [respondentCount, setRespondentCount] = useState(null);

  // Dashboard data loaded after auth
  const [sessions,    setSessions]    = useState(null);  // array from exportSessionsData
  const [dashLoading, setDashLoading] = useState(false);
  const [dashError,   setDashError]   = useState(null);

  const handleVerify = async () => {
    setVerifying(true);
    setAuthError(null);
    try {
      await exportPairCoverage(token);
      const n = await fetchRespondentCount();
      setRespondentCount(n);
      setAuthed(true);
    } catch (err) {
      setAuthError(
        err.message.includes("Unauthorized")
          ? "Incorrect token."
          : `Error: ${err.message}`
      );
    } finally {
      setVerifying(false);
    }
  };

  // Load session data for demographics/activity once authed
  useEffect(() => {
    if (!authed || sessions !== null) return;
    setDashLoading(true);
    setDashError(null);
    exportSessionsData(token)
      .then(setSessions)
      .catch(err => setDashError(err.message))
      .finally(() => setDashLoading(false));
  }, [authed, token, sessions]);

  // ── Derived dashboard analytics ──────────────────────────────────────────
  const completedSessions = (sessions || []).filter(s => s.completed_at);
  const totalSessions     = completedSessions.length;
  const todayCount        = sessionsInDays(completedSessions, 1);
  const weekCount         = sessionsInDays(completedSessions, 7);

  // Demographic breakdowns from completed sessions
  const political  = countBy(completedSessions, "political");
  const religion   = countBy(completedSessions, "religion");
  const ageRange   = countBy(completedSessions, "age_range");
  const gender     = countBy(completedSessions, "gender");
  const education  = countBy(completedSessions, "education");
  const country    = countBy(completedSessions, "country");

  // Recent 10 sessions
  const recentSessions = [...completedSessions]
    .sort((a, b) => (b.completed_at > a.completed_at ? 1 : -1))
    .slice(0, 10);

  const today    = new Date().toISOString().slice(0, 10);
  const filename = (label) => `mindspace_${label}_${today}.csv`;

  return (
    <div style={S.page}>
      <span style={S.label}>Project owner</span>
      <h2 style={S.h2}>Admin dashboard</h2>

      {!authed ? (
        <>
          <p style={S.p}>
            Enter your admin token to access the dashboard and data exports.
            This is the token set in the Supabase settings table.
          </p>
          <div style={S.tokenRow}>
            <input
              type="password"
              placeholder="Admin token"
              value={token}
              onChange={e => setToken(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleVerify()}
              style={S.tokenInput}
            />
            <button
              style={S.verifyBtn}
              onClick={handleVerify}
              disabled={verifying || !token}
            >
              {verifying ? "Checking…" : "Verify →"}
            </button>
          </div>
          {authError && <div style={S.error}>{authError}</div>}
        </>
      ) : (
        <>
          {/* ── Summary stats ─────────────────────────────────────────────── */}
          <div style={S.section}>
            <h3 style={S.h3}>Overview</h3>
            <div style={S.statGrid}>
              {[
                { value: respondentCount ?? "…", label: "Completed sessions" },
                { value: todayCount,              label: "Today" },
                { value: weekCount,               label: "This week" },
              ].map(({ value, label }) => (
                <div key={label} style={S.statTile}>
                  <span style={S.statValue}>{value}</span>
                  <span style={S.statLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={S.divider} />

          {/* ── Group map status ───────────────────────────────────────────── */}
          <div style={S.section}>
            <h3 style={S.h3}>Group map status</h3>
            <p style={{ ...S.p, fontSize: "0.7rem", marginBottom: "1rem" }}>
              Stress is Kruskal's stress-1 for n=61 concepts in 2D. Calibrated
              thresholds: Excellent &lt;0.45, Good &lt;0.55, Fair &lt;0.65, Poor ≥0.65.
              Maps are recomputed hourly once a group reaches {MIN_RESPONDENTS} respondents.
            </p>
            <div style={{
              background: "#ffffff",
              border: "1px solid #e0dbd3",
              borderRadius: "6px",
              overflow: "hidden",
            }}>
              <GroupStatusTable token={token} />
            </div>
          </div>

          <div style={S.divider} />

          {/* ── Demographics ───────────────────────────────────────────────── */}
          <div style={S.section}>
            <h3 style={S.h3}>Demographics</h3>
            {dashLoading && <div style={S.loadingText}>Loading respondent data…</div>}
            {dashError && <div style={S.error}>{dashError}</div>}
            {sessions && (
              <div style={S.demoGrid}>
                <DemoCard title="Political orientation (1=far left, 7=far right)"
                  data={political.map(d => ({ ...d, label: `${d.label}` }))}
                  total={totalSessions} />
                <DemoCard title="Religion" data={religion} total={totalSessions} />
                <DemoCard title="Age range" data={ageRange} total={totalSessions} />
                <DemoCard title="Gender" data={gender} total={totalSessions} />
                <DemoCard title="Education" data={education} total={totalSessions} />
                <DemoCard title="Country (top 8)" data={country} total={totalSessions} />
              </div>
            )}
          </div>

          <div style={S.divider} />

          {/* ── Recent activity ────────────────────────────────────────────── */}
          <div style={S.section}>
            <h3 style={S.h3}>Recent sessions (last 10)</h3>
            {sessions && recentSessions.length === 0 && (
              <p style={{ ...S.p, color: "#aaa" }}>No completed sessions yet.</p>
            )}
            {sessions && recentSessions.map((s, i) => (
              <div key={s.session_id ?? i} style={S.sessionRow}>
                <span style={S.sessionId}>{(s.session_id ?? "").slice(0, 8)}…</span>
                <span style={{ color: "#888" }}>
                  {s.completed_at
                    ? new Date(s.completed_at).toLocaleString("en-US", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })
                    : "—"}
                </span>
                {s.political   && <span>pol={s.political}</span>}
                {s.religion    && <span>{s.religion}</span>}
                {s.gender      && <span>{s.gender}</span>}
                {s.age_range   && <span>{s.age_range}</span>}
                {s.country     && <span>{s.country}</span>}
                {s.n_responses && (
                  <span style={{ marginLeft: "auto", fontFamily: "'IBM Plex Mono', monospace", color: "#aaa", fontSize: "0.6rem" }}>
                    {s.n_responses} ratings
                  </span>
                )}
              </div>
            ))}
          </div>

          <div style={S.divider} />

          {/* ── CSV exports ────────────────────────────────────────────────── */}
          <div style={S.section}>
            <h3 style={S.h3}>Data exports</h3>
            <p style={S.p}>
              CSV files — open directly in Excel, Google Sheets, R, or Python.
              The full dataset is the primary file for analysis.
            </p>

            <ExportCard
              title="Full dataset (responses + demographics)"
              description="One row per rating. Each row includes the respondent's demographics — the primary file for all statistical analysis."
              columns="session_id · concept_a · concept_b · rating · rated_at · political · religion · age_range · gender · country · education · completed_at"
              filename={filename("full")}
              fetcher={exportFullData}
              token={token}
            />

            <ExportCard
              title="Sessions (one row per respondent)"
              description="Demographic breakdown by respondent. Useful for checking sample composition."
              columns="session_id · political · religion · age_range · gender · country · education · created_at · completed_at · n_responses"
              filename={filename("sessions")}
              fetcher={exportSessionsData}
              token={token}
            />

            <ExportCard
              title="Pair coverage (aggregate ratings)"
              description="Mean rating and response count per concept pair, aggregated across all respondents. Anonymised — safe to share publicly."
              columns="concept_a · concept_b · n_ratings · mean_rating · std_rating"
              filename={filename("pair_coverage")}
              fetcher={exportPairCoverage}
              token={token}
            />
          </div>

          <div style={S.divider} />
          <p style={{ ...S.p, fontSize: "0.65rem", color: "#aaa" }}>
            To change your admin token:{" "}
            <code style={{ fontFamily: "monospace" }}>
              UPDATE settings SET value = 'new-token' WHERE key = 'admin_token';
            </code>
          </p>
        </>
      )}
    </div>
  );
}
