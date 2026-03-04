-- ============================================================
-- Mindspace Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Settings table (stores global counters and config) ──────

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize the session counter (tracks how many survey sessions have started)
INSERT INTO settings (key, value)
VALUES ('session_counter', '0')
ON CONFLICT (key) DO NOTHING;


-- ── Responses ────────────────────────────────────────────────
-- One row per rated pair per session.

CREATE TABLE IF NOT EXISTS responses (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID    NOT NULL,
  concept_a  TEXT    NOT NULL,
  concept_b  TEXT    NOT NULL,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_session ON responses (session_id);
CREATE INDEX IF NOT EXISTS idx_responses_concepts ON responses (concept_a, concept_b);


-- ── Sessions ─────────────────────────────────────────────────
-- One row per survey session. Demographic fields are nullable
-- (all voluntary). completed_at is null until demographics submitted.

CREATE TABLE IF NOT EXISTS sessions (
  session_id   UUID PRIMARY KEY,
  political    INTEGER CHECK (political BETWEEN 1 AND 7),
  religion     TEXT,
  age_range    TEXT,
  gender       TEXT,
  country      TEXT,
  education    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_political ON sessions (political);
CREATE INDEX IF NOT EXISTS idx_sessions_religion  ON sessions (religion);


-- ── Aggregate positions ───────────────────────────────────────
-- Precomputed MDS coordinates, refreshed periodically by the Edge Function.
-- group_key examples: 'all', 'political:1', 'political:7', 'religion:Christian'

CREATE TABLE IF NOT EXISTS aggregate_positions (
  group_key    TEXT    NOT NULL,
  concept      TEXT    NOT NULL,
  x            FLOAT   NOT NULL,
  y            FLOAT   NOT NULL,
  n_responses  INTEGER NOT NULL DEFAULT 0,
  computed_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_key, concept)
);

CREATE INDEX IF NOT EXISTS idx_positions_group ON aggregate_positions (group_key);


-- ── Row Level Security ────────────────────────────────────────
-- Enable RLS so anon users can only insert/read, not update/delete.

ALTER TABLE responses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE aggregate_positions ENABLE ROW LEVEL SECURITY;

-- Anon users: insert responses
CREATE POLICY "anon can insert responses"
  ON responses FOR INSERT TO anon
  WITH CHECK (true);

-- Anon users: insert/update their own session
CREATE POLICY "anon can upsert sessions"
  ON sessions FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "anon can update sessions"
  ON sessions FOR UPDATE TO anon
  USING (true);

-- Anon users: read aggregate positions
CREATE POLICY "anon can read aggregate positions"
  ON aggregate_positions FOR SELECT TO anon
  USING (true);

-- Anon users: read settings (needed to claim session index)
CREATE POLICY "anon can read settings"
  ON settings FOR SELECT TO anon
  USING (true);

-- Service role (Edge Functions): full access to everything
-- (service_role bypasses RLS by default — no extra policies needed)


-- ── Atomic session index function ────────────────────────────
-- Called by the frontend to claim the next session index.
-- Uses an advisory lock to prevent race conditions.
-- Returns the old counter value, then increments it.

CREATE OR REPLACE FUNCTION get_next_session_index()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_val INTEGER;
BEGIN
  -- Advisory lock scoped to this function (hash of the key string)
  PERFORM pg_advisory_xact_lock(hashtext('session_counter'));

  SELECT CAST(value AS INTEGER)
    INTO current_val
    FROM settings
   WHERE key = 'session_counter';

  UPDATE settings
     SET value      = CAST(current_val + 1 AS TEXT),
         updated_at = NOW()
   WHERE key = 'session_counter';

  RETURN current_val;
END;
$$;

-- Grant anon users permission to call this function
GRANT EXECUTE ON FUNCTION get_next_session_index() TO anon;


-- ── Helper view: response coverage ───────────────────────────
-- Useful for monitoring which pairs have the most/least coverage.

CREATE OR REPLACE VIEW pair_coverage AS
SELECT
  concept_a,
  concept_b,
  COUNT(*)               AS n_ratings,
  ROUND(AVG(rating), 3)  AS mean_rating,
  ROUND(STDDEV(rating), 3) AS std_rating
FROM responses
GROUP BY concept_a, concept_b
ORDER BY n_ratings DESC;


-- ── Completion ───────────────────────────────────────────────
-- Verify setup:
-- SELECT COUNT(*) FROM settings;           -- should be 1
-- SELECT COUNT(*) FROM aggregate_positions; -- 0 until Edge Function runs
-- SELECT get_next_session_index();          -- should return 0, then 1, etc.
