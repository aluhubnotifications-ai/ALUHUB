-- ════════════════════════════════════════════════════════════════════
--  ALUHUB — Migration: company-profile columns
-- ════════════════════════════════════════════════════════════════════
--  The CompanyProfilePage edit form writes several optional columns
--  that were never in schema.sql. Without these, saving the profile
--  (even just the company name) returns 400 because PostgREST aborts
--  the whole UPDATE on the first unknown column.
--
--  Idempotent — safe to re-run. If you hit a deadlock (40P01) because
--  PostgREST / Realtime is reading the profiles table, just re-run
--  the file — ADD COLUMN IF NOT EXISTS won't re-do work that's done.
-- ════════════════════════════════════════════════════════════════════

-- Fail fast instead of waiting forever or deadlocking with concurrent
-- reads. Re-run on lock-timeout failure; ADD COLUMN IF NOT EXISTS is
-- idempotent so partial progress is fine.
set lock_timeout = '4s';

alter table public.profiles
  add column if not exists tagline    text,
  add column if not exists location   text,
  add column if not exists founded    text,
  add column if not exists cover_url  text;

-- Refresh PostgREST's schema cache so the new columns are usable
-- immediately on the REST API.
notify pgrst, 'reload schema';
