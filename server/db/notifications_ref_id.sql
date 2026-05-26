-- ════════════════════════════════════════════════════════════════
--  Notifications.ref_id migration.
--
--  Adds an optional `ref_id` text column to public.notifications so
--  the client can attach the source row id (job listing, application,
--  skill booking, etc.) and deep-link from a notification to the
--  thing it's about. Existing rows get NULL.
--
--  Safe to re-run (uses `if not exists`). Run this in the Supabase
--  SQL editor against your project.
-- ════════════════════════════════════════════════════════════════

alter table public.notifications
  add column if not exists ref_id text;

-- Index isn't required — we look notifications up by user_id, never
-- by ref_id. Add one later if a per-target query becomes common.
