/**
 * session.js — shared localStorage keys for session persistence.
 *
 * Centralised here so Survey.jsx and Explore.jsx both reference
 * the same constants rather than duplicating string literals.
 */

export const LS_SESSION_KEY   = "mindspace_session_id";
export const LS_COMPLETED_KEY = "mindspace_completed";
