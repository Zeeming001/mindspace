import { useNavigate } from "react-router-dom";
import { DOMAINS } from "../lib/concepts";

const S = {
  page: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "calc(100vh - 120px)",
    padding: "4rem 1.5rem",
  },
  card: {
    background: "rgba(255,255,255,0.025)",
    border: "1px solid #1e1e22",
    borderRadius: "6px",
    maxWidth: "660px",
    width: "100%",
    padding: "3.5rem 3rem",
  },
  h1: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "clamp(2rem, 5vw, 3rem)",
    fontWeight: 400,
    color: "#e8e4dc",
    lineHeight: 1.15,
    marginBottom: "2rem",
    letterSpacing: "-0.01em",
  },
  p: {
    fontSize: "0.82rem",
    lineHeight: 1.9,
    color: "#888",
    marginBottom: "1rem",
  },
  highlight: {
    color: "#e8c547",
    fontWeight: 400,
  },
  divider: {
    borderTop: "1px solid #1e1e22",
    margin: "2rem 0",
  },
  domainGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem",
    marginBottom: "2rem",
  },
  domainBadge: (color) => ({
    fontSize: "0.58rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    padding: "0.3rem 0.7rem",
    border: `1px solid ${color}44`,
    borderRadius: "3px",
    color: color,
    background: `${color}0a`,
  }),
  buttons: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    marginTop: "2rem",
  },
  btnPrimary: {
    display: "inline-block",
    padding: "0.8rem 2rem",
    fontSize: "0.68rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    fontFamily: "inherit",
    cursor: "pointer",
    border: "1px solid #e8c547",
    borderRadius: "3px",
    background: "#e8c547",
    color: "#0d0d0f",
    transition: "all 0.2s",
  },
  btnSecondary: {
    display: "inline-block",
    padding: "0.8rem 2rem",
    fontSize: "0.68rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    fontFamily: "inherit",
    cursor: "pointer",
    border: "1px solid #2a2a30",
    borderRadius: "3px",
    background: "transparent",
    color: "#666",
    transition: "all 0.2s",
  },
  meta: {
    display: "flex",
    gap: "2rem",
    flexWrap: "wrap",
    marginTop: "2rem",
    paddingTop: "1.5rem",
    borderTop: "1px solid #1a1a1e",
  },
  metaItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
  },
  metaValue: {
    fontSize: "1.3rem",
    fontFamily: "'Playfair Display', serif",
    color: "#d4d0c8",
    fontWeight: 400,
  },
  metaLabel: {
    fontSize: "0.6rem",
    letterSpacing: "0.15em",
    color: "#444",
    textTransform: "uppercase",
  },
};

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={S.page}>
      <div style={S.card}>
        <h1 style={S.h1}>
          How close are<br /><em>your</em> ideas<br />to each other?
        </h1>

        <p style={S.p}>
          Every mind organizes abstract concepts differently. For some people,{" "}
          <span style={S.highlight}>Justice</span> and{" "}
          <span style={S.highlight}>Authority</span> are nearly synonymous.
          For others, they sit at opposite ends of a universe.
        </p>

        <p style={S.p}>
          Mindspace maps those distances — across individuals, and across the
          identity groups we belong to — to build a more honest picture of how
          differently people actually think, and why that's not the same as
          thinking wrongly.
        </p>

        <p style={S.p}>
          You'll rate the similarity of 60 concept pairs. Afterward, you'll see
          how your mind organized them — and how it compares to other groups.
        </p>

        <div style={S.divider} />

        <div style={{ fontSize: "0.6rem", letterSpacing: "0.15em", color: "#444", textTransform: "uppercase", marginBottom: "0.8rem" }}>
          63 concepts across 10 domains
        </div>

        <div style={S.domainGrid}>
          {DOMAINS.map(d => (
            <span key={d.id} style={S.domainBadge(d.color)}>{d.label}</span>
          ))}
        </div>

        <div style={S.buttons}>
          <button style={S.btnPrimary} onClick={() => navigate("/survey")}>
            Take the survey →
          </button>
          <button style={S.btnSecondary} onClick={() => navigate("/explore")}>
            Explore the data
          </button>
        </div>

        <div style={S.meta}>
          {[
            { value: "63",    label: "Concepts" },
            { value: "1,953", label: "Total pairs" },
            { value: "60",    label: "Pairs per session" },
            { value: "~8 min", label: "Estimated time" },
          ].map(({ value, label }) => (
            <div key={label} style={S.metaItem}>
              <span style={S.metaValue}>{value}</span>
              <span style={S.metaLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
