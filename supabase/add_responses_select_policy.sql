-- ============================================================
-- Mindspace — Migration: allow anon to read responses
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- WHY THIS IS NEEDED:
--   The /results page (both "View your full map" and shared links)
--   fetches responses from Supabase by session UUID. Without a SELECT
--   policy, Supabase's Row Level Security silently returns an empty
--   array, making the results page always show "No responses yet".
--
-- WHY IT'S SAFE:
--   The responses table contains no PII — only concept names, ratings
--   (1–5), and a random 128-bit session UUID. Session UUIDs are
--   cryptographically unguessable, so allowing SELECT on the table
--   does not expose any user-identifiable information.
-- ============================================================

CREATE POLICY "anon can read responses"
  ON responses FOR SELECT TO anon
  USING (true);
