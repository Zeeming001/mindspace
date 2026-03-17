/**
 * Admin.jsx — Project owner data export page.
 *
 * Accessible at /admin. Not linked from the nav — navigate there directly.
 * Requires the admin token set in the Supabase settings table.
 *
 * Provides three CSV downloads:
 *   1. Full dataset  — every rating with demographics attached (main analysis file)
 *   2. Sessions      — one row per respondent with demographic breakdown
 *   3. Pair coverage — mean rating per concept pair (anonymised aggregate)
 */

import { useState } from "react";
import { exportFullData, exportSessionsData, exportPairCoverage, fetchRespondentCount } from "../lib/supabase";

// ── CSV utilities ─────────────────────────────────────────────────────────────

function toCSV(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape  = (v) => {
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
  const csv  = toCSV(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  page: {
    maxWidth: "640px",
    margin: "0 auto",
    padding: "3rem 1.5rem",
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
    margin: "2rem 0",
  },
  statRow: {
    display: "flex",
    gap: "2rem",
    flexWrap: "wrap",
    marginBottom: "2rem",
    paddingBottom: "1.5rem",
    borderBottom: "1px solid #e0dbd3",
  },
  stat: { display: "flex", flexDirection: "column", gap: "0.3rem" },
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
};

// ── Export card component ─────────────────────────────────────────────────────

function ExportCard({ title, description, columns, filename, fetcher, token }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

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

// ── Main admin page ───────────────────────────────────────────────────────────

export default function Admin() {
  const [token,         setToken]         = useState("");
  const [authed,        setAuthed]        = useState(false);
  const [authError,     setAuthError]     = useState(null);
  const [verifying,     setVerifying]     = useState(false);
  const [respondentCount, setRespondentCount] = useState(null);

  const handleVerify = async () => {
    setVerifying(true);
    setAuthError(null);
    try {
      // Cheapest possible auth check: fetch pair_coverage with the token.
      // If the DB throws "Unauthorized" we know the token is wrong.
      await exportPairCoverage(token);
      // Also grab respondent count for the stats display
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

  const today    = new Date().toISOString().slice(0, 10);
  const filename = (label) => `mindspace_${label}_${today}.csv`;

  return (
    <div style={S.page}>
      <span style={S.label}>Project owner</span>
      <h2 style={S.h2}>Data export</h2>

      {!authed ? (
        <>
          <p style={S.p}>
            Enter your admin token to access the data. This is the token you
            set in the Supabase settings table when running{" "}
            <code style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
              admin_export.sql
            </code>.
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
          {/* Stats */}
          {respondentCount !== null && (
            <div style={S.statRow}>
              <div style={S.stat}>
                <span style={S.statValue}>{respondentCount.toLocaleString()}</span>
                <span style={S.statLabel}>Completed sessions</span>
              </div>
            </div>
          )}

          <p style={S.p}>
            All three files are CSV — open directly in Excel, Google Sheets,
            R, or Python. The full dataset is the main file for analysis;
            session rows and pair coverage are supplementary.
          </p>

          <div style={S.divider} />

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
