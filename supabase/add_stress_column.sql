-- Migration: add stress column to aggregate_positions
--
-- Stores Kruskal's stress-1 for each group's 2D MDS layout.
-- Calibrated for n=61 concepts:
--   ~0.40 = excellent (theoretical floor with full coverage)
--   ~0.55 = good (~100 sessions × 20 pairs)
--   ~0.65 = fair (~50 sessions, minimum threshold)
--   ~0.70+ = poor (too few respondents)
--
-- The stress column is set to the same value for all rows within a group_key.
-- To display stress in the UI, read it from any row for that group_key.

ALTER TABLE aggregate_positions
  ADD COLUMN IF NOT EXISTS stress FLOAT;

COMMENT ON COLUMN aggregate_positions.stress IS
  'Kruskal stress-1 for this group''s 2D MDS layout. Same value for all rows with the same group_key. Calibrated range for n=61 concepts: ~0.40 (excellent) to ~0.70+ (poor).';
