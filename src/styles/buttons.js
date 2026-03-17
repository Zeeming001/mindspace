/**
 * buttons.js — shared button style objects.
 *
 * Centralised here so all pages use consistent button tokens
 * instead of duplicating identical style objects.
 *
 * Usage:
 *   import { btnPrimary, btnSecondary, btnPrimarySmall, btnSecondarySmall } from "../styles/buttons";
 *   <button style={btnPrimary}>…</button>
 *   <button style={{ ...btnPrimary, marginTop: "1rem" }}>…</button>
 */

// ── Standard size (Home, Survey) ─────────────────────────────────────────────

export const btnPrimary = {
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
};

export const btnSecondary = {
  padding: "0.8rem 2rem",
  fontSize: "0.68rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  fontFamily: "inherit",
  cursor: "pointer",
  border: "1px solid #d0ccc4",
  borderRadius: "3px",
  background: "transparent",
  color: "#555",
  transition: "all 0.2s",
};

// ── Compact size (Explore, About) ─────────────────────────────────────────────

export const btnPrimarySmall = {
  ...btnPrimary,
  padding: "0.65rem 1.5rem",
  fontSize: "0.65rem",
  letterSpacing: "0.18em",
};

export const btnSecondarySmall = {
  ...btnSecondary,
  padding: "0.65rem 1.5rem",
  fontSize: "0.65rem",
  letterSpacing: "0.18em",
};
