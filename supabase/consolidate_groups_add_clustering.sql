-- ============================================================
-- Migration: Consolidate affinity groups + add clustering
-- Run this once in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Add the cluster column (Ward cluster index, 0-based integer).
--    NULL until the Edge Function next runs and populates it.
ALTER TABLE aggregate_positions
  ADD COLUMN IF NOT EXISTS cluster INTEGER;


-- 2. Remove the old granular group-key rows.
--    These will never be written again (groups have been consolidated).
--    The new groups (political:left / political:center / political:right /
--    religion:religious / religion:secular) will be written on the next
--    Edge Function run.
DELETE FROM aggregate_positions
WHERE group_key IN (
  'political:1-2',
  'political:3',
  'political:4',
  'political:5',
  'political:6-7',
  'religion:Christian',
  'religion:None',
  'religion:Muslim',
  'religion:Jewish',
  'religion:Other'
);


-- Verify:
-- SELECT DISTINCT group_key, COUNT(*) as concepts
-- FROM aggregate_positions
-- GROUP BY group_key
-- ORDER BY group_key;
-- Expected: only 'all' row remains (or empty if Edge Function hasn't run yet).
