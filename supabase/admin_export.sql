-- ============================================================
-- Mindspace — Admin Export Functions
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- After running, set your admin token by running:
--   UPDATE settings SET value = 'your-secret-token-here' WHERE key = 'admin_token';
-- Then use that same token on the /admin page of the app.
-- ============================================================


-- ── Store admin token ─────────────────────────────────────────────────────────
-- Change 'REPLACE_ME' to a long random string before using.
-- You can generate one at: https://1password.com/password-generator/

INSERT INTO settings (key, value)
VALUES ('admin_token', 'REPLACE_ME')
ON CONFLICT (key) DO NOTHING;


-- ── Tighten the settings read policy ─────────────────────────────────────────
-- The existing policy lets anon read ALL settings rows (needed for the
-- session counter). We narrow it so anon can't read admin_* keys.

DROP POLICY IF EXISTS "anon can read settings" ON settings;

CREATE POLICY "anon can read non-admin settings"
  ON settings FOR SELECT TO anon
  USING (key NOT LIKE 'admin_%');


-- ── Export: full dataset (responses joined with session demographics) ─────────
-- Most useful for analysis: one row per rating, demographics attached.
-- Columns: session_id, concept_a, concept_b, rating, rated_at,
--          political (1-7), religion, age_range, gender, country,
--          education, completed_at

CREATE OR REPLACE FUNCTION export_full_data(token TEXT)
RETURNS TABLE(
  session_id   UUID,
  concept_a    TEXT,
  concept_b    TEXT,
  rating       INTEGER,
  rated_at     TIMESTAMPTZ,
  political    INTEGER,
  religion     TEXT,
  age_range    TEXT,
  gender       TEXT,
  country      TEXT,
  education    TEXT,
  completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM settings WHERE key = 'admin_token' AND value = token
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
    SELECT
      r.session_id,
      r.concept_a,
      r.concept_b,
      r.rating,
      r.created_at   AS rated_at,
      s.political,
      s.religion,
      s.age_range,
      s.gender,
      s.country,
      s.education,
      s.completed_at
    FROM responses r
    LEFT JOIN sessions s USING (session_id)
    ORDER BY r.created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION export_full_data(TEXT) TO anon;


-- ── Export: sessions summary (one row per respondent) ────────────────────────
-- Useful for demographic breakdowns.
-- Columns: session_id, political, religion, age_range, gender, country,
--          education, created_at, completed_at, n_responses

CREATE OR REPLACE FUNCTION export_sessions_data(token TEXT)
RETURNS TABLE(
  session_id   UUID,
  political    INTEGER,
  religion     TEXT,
  age_range    TEXT,
  gender       TEXT,
  country      TEXT,
  education    TEXT,
  created_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  n_responses  BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM settings WHERE key = 'admin_token' AND value = token
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
    SELECT
      s.session_id,
      s.political,
      s.religion,
      s.age_range,
      s.gender,
      s.country,
      s.education,
      s.created_at,
      s.completed_at,
      COUNT(r.id) AS n_responses
    FROM sessions s
    LEFT JOIN responses r USING (session_id)
    GROUP BY
      s.session_id, s.political, s.religion, s.age_range,
      s.gender, s.country, s.education, s.created_at, s.completed_at
    ORDER BY s.created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION export_sessions_data(TEXT) TO anon;


-- ── Export: pair coverage (anonymised aggregate — safe to share) ─────────────
-- Mean rating and response count per concept pair.
-- Wraps the existing pair_coverage view behind token auth.

CREATE OR REPLACE FUNCTION export_pair_coverage(token TEXT)
RETURNS TABLE(
  concept_a  TEXT,
  concept_b  TEXT,
  n_ratings  BIGINT,
  mean_rating NUMERIC,
  std_rating  NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM settings WHERE key = 'admin_token' AND value = token
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY SELECT * FROM pair_coverage;
END;
$$;

GRANT EXECUTE ON FUNCTION export_pair_coverage(TEXT) TO anon;
