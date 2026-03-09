import { useNavigate } from "react-router-dom";

const S = {
  page: {
    maxWidth: "700px",
    margin: "0 auto",
    padding: "3rem 1.5rem",
  },
  h1: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "2rem",
    fontWeight: 400,
    color: "#1a1a1e",
    marginBottom: "2.5rem",
    lineHeight: 1.2,
  },
  section: {
    marginBottom: "3rem",
  },
  h2: {
    fontSize: "0.65rem",
    letterSpacing: "0.2em",
    color: "#7eb8d4",
    textTransform: "uppercase",
    marginBottom: "1rem",
  },
  p: {
    fontSize: "0.82rem",
    lineHeight: 1.9,
    color: "#555",
    marginBottom: "1rem",
  },
  highlight: {
    color: "#1a1a1e",
    fontStyle: "italic",
  },
  divider: {
    borderTop: "1px solid #e0dbd3",
    margin: "2.5rem 0",
  },
  codeBlock: {
    background: "rgba(0,0,0,0.03)",
    border: "1px solid #e0dbd3",
    borderRadius: "3px",
    padding: "1rem 1.25rem",
    fontSize: "0.72rem",
    color: "#555",
    fontFamily: "'IBM Plex Mono', monospace",
    lineHeight: 1.8,
    marginBottom: "1rem",
  },
  privacyGrid: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: "0.5rem 1.5rem",
    fontSize: "0.78rem",
    marginBottom: "1rem",
  },
  privacyYes: {
    color: "#a8d4a0",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.7rem",
  },
  privacyNo: {
    color: "#d47e7e",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.7rem",
  },
  privacyItem: {
    color: "#555",
    fontSize: "0.78rem",
    alignSelf: "center",
  },
  btnSecondary: {
    display: "inline-block",
    padding: "0.65rem 1.5rem",
    fontSize: "0.65rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontFamily: "inherit",
    cursor: "pointer",
    border: "1px solid #d0ccc4",
    borderRadius: "3px",
    background: "transparent",
    color: "#555",
    transition: "all 0.2s",
    marginTop: "1rem",
  },
};

export default function About() {
  const navigate = useNavigate();

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Methodology &amp; Privacy</h1>

      <div style={S.section}>
        <h2 style={S.h2}>What Mindspace measures</h2>
        <p style={S.p}>
          Mindspace is a psychometric tool designed to map the conceptual distances
          between abstract values and ideas as they exist in different people's minds.
          The core hypothesis: people belonging to different identity groups organize
          abstract concepts into meaningfully different mental clusters — and making
          those differences visible, without judgment, can function as an
          empathy-building tool.
        </p>
        <p style={S.p}>
          The tool is deliberately{" "}
          <span style={S.highlight}>not a political quiz or personality test</span>,
          though it may feel like one. Its purpose is to show that people you
          disagree with organize values in ways that are internally coherent —
          not merely wrong or malicious.
        </p>
      </div>

      <div style={S.divider} />

      <div style={S.section}>
        <h2 style={S.h2}>Survey design</h2>
        <p style={S.p}>
          Respondents rate the subjective similarity of concept pairs on a
          1–5 Likert scale, starting with 20 pairs before a demographics
          checkpoint. The framing — "in your mind" — is deliberate: we're
          measuring personal association, not factual proximity. There are no
          correct answers.
        </p>
        <p style={S.p}>
          The 63 concepts span 10 domains and were selected to maximize
          between-group signal while minimizing empathy-corrosive framing. Several
          concepts are deliberately ambiguous across groups:{" "}
          <span style={S.highlight}>Devout</span> and{" "}
          <span style={S.highlight}>Atheist</span> cluster together for some
          respondents (shared intensity of belief) and at opposite poles for
          others; <span style={S.highlight}>Amused by irony</span> correlates
          with certain epistemic dispositions across the political spectrum;{" "}
          <span style={S.highlight}>Traditionalist</span> sits near{" "}
          <span style={S.highlight}>Patriotic</span> for some groups and near{" "}
          <span style={S.highlight}>Reverent</span> for others.
        </p>
        <p style={S.p}>
          Demographic questions appear after answering at least twenty survey questions. Pre-survey
          identity priming activates social desirability bias and degrades the
          associative validity of responses.
        </p>
      </div>

      <div style={S.divider} />

      <div style={S.section}>
        <h2 style={S.h2}>How the maps are computed</h2>
        <p style={S.p}>
          Responses are aggregated into an N×N distance matrix for each group,
          where:
        </p>
        <div style={S.codeBlock}>
          distance(A, B) = 1 − mean(rating(A,B) / 5)
        </div>
        <p style={S.p}>
          Classical Multidimensional Scaling (cMDS) is then applied to this
          matrix to extract 2D coordinates that best preserve the distances in
          Euclidean space. The algorithm double-centers the squared distance
          matrix to produce a Gram matrix, then extracts the top two eigenvectors
          via power iteration.
        </p>
        <p style={S.p}>
          Maps are recomputed hourly for all groups with at least 15 respondents.
          Groups with fewer respondents display a "not enough data" message.
          Axes have no inherent meaning — only relative positions matter.
        </p>
      </div>

      <div style={S.divider} />

      <div style={S.section}>
        <h2 style={S.h2}>Pair rotation</h2>
        <p style={S.p}>
          With 1,953 total pairs and 20 pairs per batch, pairs are rotated
          across respondents using an incomplete block design. Each session is
          assigned a pseudo-random ordering of the full pair list, and respondents
          may continue rating in batches of 20 after the first checkpoint. This
          ensures roughly uniform coverage across all pairs without requiring
          coordination between sessions.
        </p>
        <p style={S.p}>
          Approximately 98 respondents are needed to achieve complete pair
          coverage at 20 pairs per session. Groups are displayed as soon as 15
          respondents have contributed.
        </p>
      </div>

      <div style={S.divider} />

      <div style={S.section}>
        <h2 style={S.h2}>Privacy policy</h2>
        <div style={S.privacyGrid}>
          <span style={S.privacyNo}>✗ stored</span>
          <span style={S.privacyItem}>Your name, email, or any identifying information</span>
          <span style={S.privacyNo}>✗ stored</span>
          <span style={S.privacyItem}>Your IP address</span>
          <span style={S.privacyYes}>✓ stored</span>
          <span style={S.privacyItem}>A random session UUID (generated fresh each visit)</span>
          <span style={S.privacyYes}>✓ stored</span>
          <span style={S.privacyItem}>Your pairwise ratings (anonymized)</span>
          <span style={S.privacyYes}>✓ stored</span>
          <span style={S.privacyItem}>Demographic fields you voluntarily provide</span>
          <span style={S.privacyNo}>✗ displayed</span>
          <span style={S.privacyItem}>Individual responses (only group aggregates are shown)</span>
        </div>
        <p style={S.p}>
          No user accounts are required. Sessions cannot be linked back to
          individuals. Demographic data is stored only in aggregate for display
          purposes. You may skip all demographic questions.
        </p>
        <p style={{ ...S.p, color: "#555" }}>
          This project may seek academic publication in future. If it does, data
          collection will be subject to IRB review. The project owner is a
          physician-researcher and is aware of these requirements.
        </p>
      </div>

      <button style={S.btnSecondary} onClick={() => navigate("/survey")}>
        ← Take the survey
      </button>
    </div>
  );
}
