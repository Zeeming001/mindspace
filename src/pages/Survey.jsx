/**
 * Survey.jsx — Full survey flow
 *
 * Phase sequence:
 *   PRIVACY → QUESTIONS (first 20) → DEMOGRAPHICS → CHECKPOINT → QUESTIONS (next 20) → CHECKPOINT → …
 *
 * Key design decisions:
 *   - Demographics are collected after the first 20 pairs (before attrition, without priming)
 *   - After each subsequent batch, users see a checkpoint with their running results
 *     and choose to "Rate 20 more" or stop
 *   - All 1,953 pairs are available; motivated respondents can complete the full matrix
 *   - Responses are saved to Supabase after each batch (incremental, not on final submit)
 *   - Personal concept network (force-directed graph) is rendered from ratings accumulated so far
 *   - Users can undo the last rating within the current batch (accidental tap recovery)
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { CONCEPTS, CONCEPT_COLOR, getAllPairsForSession, FIRST_BATCH_SIZE, CONTINUED_BATCH_SIZE, TOTAL_PAIRS } from "../lib/concepts";
import { claimSessionIndex, createSession, saveResponses, saveSession, fetchSessionResponses } from "../lib/supabase";
import { LS_SESSION_KEY, LS_COMPLETED_KEY } from "../lib/session";
import { MDS_THRESHOLD } from "../lib/constants";
import { btnPrimary, btnSecondary } from "../styles/buttons";
import { useContainerWidth } from "../lib/hooks";
import MDSPlot from "../components/MDSPlot";
import SparseInsightView from "../components/SparseInsightView";
import ErrorBoundary from "../components/ErrorBoundary";

// ─── Phases ──────────────────────────────────────────────────────────────────

const PHASE = {
  PRIVACY:      "privacy",
  QUESTIONS:    "questions",
  DEMOGRAPHICS: "demographics",
  CHECKPOINT:   "checkpoint",
};

// ─── Shared styles ────────────────────────────────────────────────────────────

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
    maxWidth: "640px",
    width: "100%",
    padding: "3rem 2.5rem",
  },
  wideCard: {
    background: "#ffffff",
    border: "1px solid #e0dbd3",
    borderRadius: "6px",
    maxWidth: "760px",
    width: "100%",
    padding: "2.5rem 2.5rem",
  },
  label: {
    fontSize: "0.62rem",
    letterSpacing: "0.22em",
    color: "#888",
    textTransform: "uppercase",
    marginBottom: "1.2rem",
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
  p: {
    fontSize: "0.8rem",
    lineHeight: 1.9,
    color: "#555",
    marginBottom: "1rem",
  },
  progressBar: {
    height: "2px",
    background: "#e0dbd3",
    borderRadius: "1px",
    marginBottom: "2.5rem",
    overflow: "hidden",
  },
  progressFill: (pct) => ({
    height: "100%",
    width: `${Math.min(pct * 100, 100)}%`,
    background: "#e8c547",
    borderRadius: "1px",
    transition: "width 0.35s ease",
  }),
  conceptPair: {
    display: "flex",
    gap: "2rem",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: "2.5rem",
  },
  conceptPill: (color) => ({
    background: "rgba(0,0,0,0.02)",
    border: `1px solid ${color}66`,
    borderRadius: "4px",
    padding: "1rem 1.8rem",
    fontSize: "1.25rem",
    fontFamily: "'Playfair Display', Georgia, serif",
    color,
    letterSpacing: "0.04em",
    minWidth: "130px",
    textAlign: "center",
    boxShadow: `0 0 18px ${color}14`,
  }),
  ratingRow: {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "center",
    marginBottom: "0.6rem",
  },
  ratingBtn: (selected) => ({
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    border: selected ? "2px solid #1a1a1e" : "1px solid #d0ccc4",
    background: selected ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.02)",
    color: selected ? "#1a1a1e" : "#666",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontFamily: "inherit",
  }),
  ratingLabels: {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "center",
  },
  ratingLabel: {
    width: "50px",
    fontSize: "0.56rem",
    color: "#888",
    textAlign: "center",
    lineHeight: 1.3,
  },
  fieldLabel: {
    display: "block",
    fontSize: "0.62rem",
    letterSpacing: "0.15em",
    color: "#555",
    textTransform: "uppercase",
    marginBottom: "0.6rem",
  },
  radioGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginBottom: "1.4rem",
  },
  radioBtn: (selected) => ({
    padding: "0.4rem 0.9rem",
    fontSize: "0.7rem",
    fontFamily: "inherit",
    cursor: "pointer",
    border: "1px solid",
    borderRadius: "3px",
    transition: "all 0.15s",
    borderColor: selected ? "#7eb8d4" : "#d0ccc4",
    background: selected ? "rgba(126,184,212,0.12)" : "transparent",
    color: selected ? "#4a90b8" : "#555",
  }),
  textInput: {
    width: "100%",
    padding: "0.65rem 0.8rem",
    background: "#ffffff",
    border: "1px solid #d0ccc4",
    borderRadius: "3px",
    color: "#1a1a1e",
    fontFamily: "inherit",
    fontSize: "0.8rem",
    marginBottom: "1.4rem",
  },
  btnPrimary,
  btnSecondary,
  btnRow: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    marginTop: "1.5rem",
  },
  insightRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    padding: "0.5rem 0",
    borderBottom: "1px solid #e0dbd3",
    gap: "1rem",
  },
  insightConcepts: {
    fontSize: "0.8rem",
    fontFamily: "'Playfair Display', serif",
    color: "#1a1a1e",
    flex: 1,
    minWidth: 0,
    wordBreak: "break-word",
  },
  insightRating: (val) => ({
    fontSize: "0.62rem",
    letterSpacing: "0.08em",
    color: val >= 4 ? "#a8d4a0" : val <= 2 ? "#d47e7e" : "#666",
    flexShrink: 0,
  }),
  statRow: {
    display: "flex",
    gap: "2rem",
    flexWrap: "wrap",
    marginBottom: "2rem",
    paddingBottom: "1.5rem",
    borderBottom: "1px solid #e0dbd3",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
  },
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
};

const RATING_LABELS = ["Very distant", "Distant", "Moderate", "Close", "Very close"];

// ─── Privacy Notice ───────────────────────────────────────────────────────────

function PrivacyNotice({ onAccept, alreadyCompleted }) {
  return (
    <div style={S.card}>
      <span style={S.label}>Before you begin</span>
      <h2 style={S.h2}>A note on your data</h2>
      {alreadyCompleted && (
        <div style={{
          background: "rgba(184,136,10,0.06)",
          border: "1px solid rgba(184,136,10,0.25)",
          borderRadius: "4px",
          padding: "0.9rem 1.1rem",
          marginBottom: "1.4rem",
          fontSize: "0.72rem",
          color: "#b8880a",
          lineHeight: 1.7,
        }}>
          It looks like you've completed a session from this browser before. Your
          previous responses are already saved — continuing will add more pair ratings
          to the same anonymous session rather than creating a duplicate record.
        </div>
      )}
      <p style={S.p}>
        This survey collects your ratings for pairs of personal descriptions.
        Your responses are stored anonymously — identified only by a randomly generated
        session ID, with no link to your name, email, or IP address.
      </p>
      <p style={S.p}>
        You'll start with 20 pairs, then be asked a few optional demographic questions.
        After that, you can keep rating as many additional pairs as you like — or stop
        at any point. All responses contribute to the aggregate maps.
      </p>
      <p style={S.p}>
        Demographic fields are entirely voluntary. Your data will only ever appear in
        aggregate — individual responses are never shown publicly.
      </p>
      <p style={{ ...S.p, color: "#666", fontSize: "0.72rem" }}>
        By continuing, you consent to your anonymized responses being used for
        research and visualization purposes.
      </p>
      <div style={S.btnRow}>
        <button style={S.btnPrimary} onClick={onAccept}>
          {alreadyCompleted ? "Continue rating →" : "I understand — begin →"}
        </button>
      </div>
    </div>
  );
}

// ─── Survey Question ──────────────────────────────────────────────────────────

function SurveyQuestion({ pair, onRate, onUndo, canUndo, ratedInBatch, batchSize }) {
  const [selected, setSelected] = useState(null);
  const [fading, setFading] = useState(false);
  const lastPairRef = useRef(null);

  // Reset animation state when pair changes
  useEffect(() => {
    if (pair !== lastPairRef.current) {
      setSelected(null);
      setFading(false);
      lastPairRef.current = pair;
    }
  }, [pair]);

  const handleSelect = useCallback((val) => {
    if (fading) return;
    setSelected(val);
    setFading(true);
    setTimeout(() => onRate(val), 180);
  }, [fading, onRate]);

  // Keyboard shortcut: press 1–5 to rate
  useEffect(() => {
    const handler = (e) => {
      const n = parseInt(e.key);
      if (n >= 1 && n <= 5) handleSelect(n);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSelect]);

  const batchProgress = ratedInBatch / batchSize;

  return (
    <div style={{ ...S.card, opacity: fading ? 0 : 1, transition: "opacity 0.18s ease" }}>
      {/* Batch progress bar */}
      <div style={S.progressBar}>
        <div style={S.progressFill(batchProgress)} />
      </div>

      <div style={{
        fontSize: "0.6rem",
        letterSpacing: "0.18em",
        color: "#888",
        textTransform: "uppercase",
        textAlign: "center",
        marginBottom: "2rem",
      }}>
        How closely related are these concepts in your mind?
      </div>

      <div style={S.conceptPair}>
        {pair.map((concept, idx) => (
          <div key={idx} style={S.conceptPill(CONCEPT_COLOR[concept] || "#888")}>
            {concept}
          </div>
        ))}
      </div>

      <div style={S.ratingRow}>
        {[1, 2, 3, 4, 5].map(val => (
          <button
            key={val}
            onClick={() => handleSelect(val)}
            style={S.ratingBtn(selected === val)}
          >
            {val}
          </button>
        ))}
      </div>

      <div style={S.ratingLabels}>
        {RATING_LABELS.map((lbl, i) => (
          <div key={i} style={S.ratingLabel}>{lbl}</div>
        ))}
      </div>

      {/* Bottom row: keyboard hint on left, undo on right */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "0.9rem",
        minHeight: "1.2rem",
      }}>
        <span style={{ fontSize: "0.52rem", color: "#bbb", letterSpacing: "0.12em" }}>
          Keyboard: press 1 – 5
        </span>
        {canUndo && (
          <button
            onClick={onUndo}
            style={{
              fontSize: "0.55rem",
              color: "#888",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.2rem 0",
              textDecoration: "underline",
              fontFamily: "inherit",
            }}
          >
            undo last
          </button>
        )}
      </div>

      {/* Batch progress counter */}
      <div style={{
        textAlign: "center",
        marginTop: "0.6rem",
        fontSize: "0.58rem",
        color: "#aaa",
        letterSpacing: "0.1em",
      }}>
        {ratedInBatch} of {batchSize} in this batch
      </div>
    </div>
  );
}

// ─── Demographics ─────────────────────────────────────────────────────────────

// Common countries shown as radio buttons; "Other" triggers a text field.
const COMMON_COUNTRIES = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "India"];

function DemographicsForm({ onSubmit, onSkip }) {
  const [form, setForm] = useState({
    political: "", religion: "", age_range: "", gender: "", country: "", education: "",
  });
  const [countryOther, setCountryOther] = useState("");

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const RadioGroup = ({ field, options }) => (
    <div style={S.radioGroup}>
      {options.map(opt => (
        <button
          key={opt.value}
          style={S.radioBtn(form[field] === opt.value)}
          onClick={() => set(field, form[field] === opt.value ? "" : opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  const handleSubmit = () => {
    const resolved = {
      ...form,
      country: form.country === "Other" ? countryOther.trim() : form.country,
    };
    onSubmit(resolved);
  };

  return (
    <div style={S.card}>
      <span style={S.label}>Quick checkpoint</span>
      <h2 style={S.h2}>A few questions about you</h2>
      <p style={S.p}>
        All fields are optional. These help stratify the concept maps by group — your
        answers are never tied to individual responses. After this you can keep rating
        more pairs, or stop and see your results.
      </p>

      <div style={{ marginTop: "1.5rem" }}>
        <span style={S.fieldLabel}>Political orientation</span>
        <RadioGroup field="political" options={[
          { value: "1", label: "Very liberal" },
          { value: "2", label: "Liberal" },
          { value: "3", label: "Lean liberal" },
          { value: "4", label: "Moderate" },
          { value: "5", label: "Lean conservative" },
          { value: "6", label: "Conservative" },
          { value: "7", label: "Very conservative" },
        ]} />

        <span style={S.fieldLabel}>Religious identity</span>
        <RadioGroup field="religion" options={[
          { value: "None", label: "None" },
          { value: "Christian", label: "Christian" },
          { value: "Jewish", label: "Jewish" },
          { value: "Muslim", label: "Muslim" },
          { value: "Hindu", label: "Hindu" },
          { value: "Buddhist", label: "Buddhist" },
          { value: "Other", label: "Other" },
        ]} />

        <span style={S.fieldLabel}>Age range</span>
        <RadioGroup field="age_range" options={[
          { value: "Under 18", label: "Under 18" },
          { value: "18-24",    label: "18–24" },
          { value: "25-34",    label: "25–34" },
          { value: "35-44",    label: "35–44" },
          { value: "45-54",    label: "45–54" },
          { value: "55-64",    label: "55–64" },
          { value: "65+",      label: "65+" },
        ]} />

        <span style={S.fieldLabel}>Gender</span>
        <RadioGroup field="gender" options={[
          { value: "Man",        label: "Man" },
          { value: "Woman",      label: "Woman" },
          { value: "Non-binary", label: "Non-binary" },
          { value: "Prefer not to say", label: "Prefer not to say" },
        ]} />

        <span style={S.fieldLabel}>Education</span>
        <RadioGroup field="education" options={[
          { value: "High school",     label: "High school" },
          { value: "Some college",    label: "Some college" },
          { value: "Bachelor's",      label: "Bachelor's" },
          { value: "Graduate degree", label: "Graduate" },
        ]} />

        <span style={S.fieldLabel}>Country of residence</span>
        <div style={S.radioGroup}>
          {COMMON_COUNTRIES.map(c => (
            <button
              key={c}
              style={S.radioBtn(form.country === c)}
              onClick={() => set("country", form.country === c ? "" : c)}
            >
              {c}
            </button>
          ))}
          <button
            style={S.radioBtn(form.country === "Other")}
            onClick={() => set("country", form.country === "Other" ? "" : "Other")}
          >
            Other
          </button>
        </div>
        {form.country === "Other" && (
          <input
            type="text"
            placeholder="Country name"
            value={countryOther}
            onChange={e => setCountryOther(e.target.value)}
            style={S.textInput}
          />
        )}
      </div>

      <div style={S.btnRow}>
        <button style={S.btnPrimary} onClick={handleSubmit}>
          Continue →
        </button>
        <button style={S.btnSecondary} onClick={onSkip}>
          Skip
        </button>
      </div>
    </div>
  );
}

// ─── Checkpoint / Results ─────────────────────────────────────────────────────

function Checkpoint({ ratings, totalPairs, sessionId, onContinue, onDone }) {
  const navigate = useNavigate();
  const hasMore = ratings.length < totalPairs;
  const [copied, setCopied] = useState(false);
  const [graphContainerRef, graphWidth] = useContainerWidth(700);

  // Convert in-memory ratings to the DB response format used by visualisations
  const responses = useMemo(
    () => ratings.map(({ pair, val }) => ({ concept_a: pair[0], concept_b: pair[1], rating: val })),
    [ratings]
  );

  const conceptsInSession = useMemo(
    () => [...new Set(ratings.flatMap(r => r.pair))],
    [ratings]
  );

  const useMDS = ratings.length >= MDS_THRESHOLD;
  const ratedConcepts = CONCEPTS.filter(c => conceptsInSession.includes(c));

  const shareUrl = `${window.location.origin}/results?s=${sessionId}`;
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <div style={S.wideCard}>
      <span style={S.label}>
        {hasMore ? "Checkpoint" : "Survey complete"}
      </span>
      <h2 style={S.h2}>Your concept map so far</h2>

      {/* Stats */}
      <div style={S.statRow}>
        {[
          { value: ratings.length,           label: "Pairs rated" },
          { value: conceptsInSession.length, label: "Concepts seen" },
          { value: `${Math.round((ratings.length / TOTAL_PAIRS) * 100)}%`, label: "Matrix coverage" },
        ].map(({ value, label }) => (
          <div key={label} style={S.stat}>
            <span style={S.statValue}>{value}</span>
            <span style={S.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* MDS spatial map (shown once ≥ MDS_THRESHOLD pairs) */}
      {useMDS && conceptsInSession.length >= 5 && (
        <div
          ref={graphContainerRef}
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
              width={Math.max(graphWidth - 32, 280)}
              height={Math.round(Math.max(graphWidth - 32, 280) * 0.75)}
              showLegend={true}
              defaultShowLabels={true}
              label={`Your concept map — ${conceptsInSession.length} concepts`}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Pair cards + similarity spectra (always shown) */}
      {ratings.length >= 1 && (
        <SparseInsightView
          responses={responses}
          narrow={graphWidth < 480}
        />
      )}

      <p style={{ ...S.p, color: "#666", fontSize: "0.72rem", marginTop: "1.5rem" }}>
        Your responses have been saved anonymously.
        {hasMore
          ? useMDS
            ? " The spatial map above updates with each new batch — keep rating to see clusters sharpen."
            : ` Rate ${MDS_THRESHOLD - ratings.length} more pairs to unlock your full spatial concept map.`
          : " You've rated all available pairs. Thank you for your thoroughness."}
      </p>

      <div style={S.btnRow}>
        {hasMore && (
          <button style={S.btnPrimary} onClick={onContinue}>
            Rate {CONTINUED_BATCH_SIZE} more pairs →
          </button>
        )}
        <button style={S.btnSecondary} onClick={() => navigate("/results")}>
          View your full map →
        </button>
        <button style={S.btnSecondary} onClick={() => navigate("/explore")}>
          Explore all groups
        </button>
        <button
          style={{ ...S.btnSecondary, fontSize: "0.6rem" }}
          onClick={handleCopyLink}
        >
          {copied ? "Link copied ✓" : "Share your map"}
        </button>
      </div>
    </div>
  );
}

// ─── Persistent session helpers ───────────────────────────────────────────────

function getOrCreateSessionId() {
  try {
    const stored = localStorage.getItem(LS_SESSION_KEY);
    if (stored) return stored;
    const fresh = uuidv4();
    localStorage.setItem(LS_SESSION_KEY, fresh);
    return fresh;
  } catch {
    return uuidv4(); // storage blocked (private mode etc.) — fall back gracefully
  }
}

function markSessionCompleted() {
  try { localStorage.setItem(LS_COMPLETED_KEY, "1"); } catch {}
}

function hasCompletedBefore() {
  try { return !!localStorage.getItem(LS_COMPLETED_KEY); } catch { return false; }
}

// ─── Main Survey Page ─────────────────────────────────────────────────────────

export default function Survey() {
  const [phase, setPhase]             = useState(PHASE.PRIVACY);
  const [allPairs, setAllPairs]       = useState([]);
  const [batchStart, setBatchStart]   = useState(0);
  const [batchSize, setBatchSize]     = useState(FIRST_BATCH_SIZE);
  const [pairIdx, setPairIdx]         = useState(0);
  const [ratings, setRatings]         = useState([]);
  const [sessionId]                   = useState(() => getOrCreateSessionId());
  const [alreadyCompleted]            = useState(() => hasCompletedBefore());
  const [error, setError]             = useState(null);

  // Undo state: tracks the previous pairIdx so we can rewind one step.
  // Cleared automatically after 4 seconds or when the batch ends.
  const [undoData, setUndoData]       = useState(null); // { prevPairIdx } | null
  const undoTimerRef                  = useRef(null);

  // ── Start: claim session, load all pairs ───────────────────────────────────

  const handleStart = useCallback(async () => {
    try {
      const idx = await claimSessionIndex();
      const pairs = getAllPairsForSession(idx);
      setAllPairs(pairs);
      await createSession(sessionId);

      try {
        const existing = await fetchSessionResponses(sessionId);
        if (existing.length > 0) {
          setRatings(existing.map(r => ({
            pair: [r.concept_a, r.concept_b],
            val: r.rating,
          })));
        }
      } catch {
        // Not critical — graph will just start from the current visit only.
      }

      setBatchStart(0);
      setBatchSize(FIRST_BATCH_SIZE);
      setPairIdx(0);
      setPhase(PHASE.QUESTIONS);
    } catch {
      const fallbackIdx = Math.floor(Math.random() * TOTAL_PAIRS);
      const pairs = getAllPairsForSession(fallbackIdx);
      setAllPairs(pairs);
      setBatchStart(0);
      setBatchSize(FIRST_BATCH_SIZE);
      setPairIdx(0);
      setPhase(PHASE.QUESTIONS);
    }
  }, [sessionId]);

  // ── Rate a pair ────────────────────────────────────────────────────────────

  const handleRate = useCallback((val) => {
    const pair = allPairs[batchStart + pairIdx];
    const newRatings = [...ratings, { pair, val }];
    setRatings(newRatings);

    const nextIdx = pairIdx + 1;

    if (nextIdx >= batchSize) {
      // Batch complete — clear undo (no going back across a save boundary)
      clearTimeout(undoTimerRef.current);
      setUndoData(null);

      const batchRatings = newRatings.slice(newRatings.length - batchSize);
      saveResponses(sessionId, batchRatings).catch(err =>
        setError("Responses may not have saved: " + err.message)
      );

      if (batchStart === 0) {
        markSessionCompleted();
        setPhase(alreadyCompleted ? PHASE.CHECKPOINT : PHASE.DEMOGRAPHICS);
      } else {
        setPhase(PHASE.CHECKPOINT);
      }
    } else {
      // Mid-batch — enable undo for 4 seconds
      const prevIdx = pairIdx;
      setPairIdx(nextIdx);
      setUndoData({ prevPairIdx: prevIdx });
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => setUndoData(null), 4000);
    }
  }, [allPairs, alreadyCompleted, batchStart, batchSize, pairIdx, ratings, sessionId]);

  // ── Undo last rating ───────────────────────────────────────────────────────

  const handleUndo = useCallback(() => {
    if (!undoData) return;
    setRatings(prev => prev.slice(0, -1));
    setPairIdx(undoData.prevPairIdx);
    setUndoData(null);
    clearTimeout(undoTimerRef.current);
  }, [undoData]);

  // ── Demographics submitted ─────────────────────────────────────────────────

  const handleDemographicsSubmit = useCallback(async (form) => {
    try {
      await saveSession(sessionId, {
        political:  form.political  ? parseInt(form.political) : null,
        religion:   form.religion   || null,
        age_range:  form.age_range  || null,
        gender:     form.gender     || null,
        country:    form.country    || null,
        education:  form.education  || null,
      });
    } catch (err) {
      console.warn("Could not save demographics:", err.message);
    }
    setPhase(PHASE.CHECKPOINT);
  }, [sessionId]);

  const handleDemographicsSkip = useCallback(() => {
    setPhase(PHASE.CHECKPOINT);
  }, []);

  // ── Continue to next batch ─────────────────────────────────────────────────

  const handleContinue = useCallback(() => {
    const nextStart = batchStart + batchSize;
    const remaining = allPairs.length - nextStart;
    const nextBatchSize = Math.min(CONTINUED_BATCH_SIZE, remaining);

    if (nextBatchSize <= 0) return;

    setBatchStart(nextStart);
    setBatchSize(nextBatchSize);
    setPairIdx(0);
    setUndoData(null);
    setPhase(PHASE.QUESTIONS);
  }, [allPairs, batchStart, batchSize]);

  // ── Current pair ──────────────────────────────────────────────────────────

  const currentPair = allPairs.length > 0 ? allPairs[batchStart + pairIdx] : null;

  return (
    <div style={S.page}>
      {error && (
        <div style={{
          background: "rgba(212,126,126,0.08)",
          border: "1px solid #d47e7e33",
          borderRadius: "4px",
          padding: "0.7rem 1rem",
          marginBottom: "1rem",
          fontSize: "0.7rem",
          color: "#d47e7e",
          maxWidth: "640px",
          width: "100%",
        }}>
          {error}
        </div>
      )}

      {phase === PHASE.PRIVACY && (
        <PrivacyNotice onAccept={handleStart} alreadyCompleted={alreadyCompleted} />
      )}

      {phase === PHASE.QUESTIONS && currentPair && (
        <SurveyQuestion
          pair={currentPair}
          onRate={handleRate}
          onUndo={handleUndo}
          canUndo={!!undoData}
          ratedInBatch={pairIdx}
          batchSize={batchSize}
        />
      )}

      {phase === PHASE.DEMOGRAPHICS && (
        <DemographicsForm
          onSubmit={handleDemographicsSubmit}
          onSkip={handleDemographicsSkip}
        />
      )}

      {phase === PHASE.CHECKPOINT && (
        <Checkpoint
          ratings={ratings}
          totalPairs={allPairs.length}
          sessionId={sessionId}
          onContinue={handleContinue}
          onDone={() => {}}
        />
      )}
    </div>
  );
}
