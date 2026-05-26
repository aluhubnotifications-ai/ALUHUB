-- ════════════════════════════════════════════════════════════════════
--  ALUHUB — Migration: school-only listings + student email domain
-- ════════════════════════════════════════════════════════════════════
--  Adds two columns:
--
--    profiles.student_email_domain text
--      For schools: the email suffix that identifies their students
--      (e.g. 'alustudent.com'). Used to decide which students see a
--      school-only listing.
--
--    job_listings.school_only boolean default false
--      When true (and posted_by_role = 'school'), the listing is only
--      visible to students whose email domain matches the school's
--      student_email_domain. Enforced client-side now; can be lifted
--      to RLS later.
--
--  Idempotent — safe to re-run. If you hit a deadlock (40P01) because
--  PostgREST / Realtime is reading these tables, just re-run the file.
-- ════════════════════════════════════════════════════════════════════

-- Bail out quickly instead of waiting forever or deadlocking with
-- background traffic touching the same tables. The migration is
-- idempotent so a lock-timeout failure is safe to retry.
set lock_timeout = '4s';

alter table public.profiles
  add column if not exists student_email_domain text;

alter table public.job_listings
  add column if not exists school_only boolean default false;

-- Backfill: existing rows default to NOT school-only so nothing
-- disappears unexpectedly.
update public.job_listings
  set school_only = false
  where school_only is null;

-- Ask PostgREST to refresh its schema cache so the new columns are
-- visible immediately. Without this the API may keep returning
-- "Could not find the X column" for up to a minute.
notify pgrst, 'reload schema';
