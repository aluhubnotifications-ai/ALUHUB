-- ════════════════════════════════════════════════════════════════
--  Notifications.type CHECK constraint repair.
--
--  The production database has a `notifications_type_check` constraint
--  that was added out-of-band (not from this repo's schema.sql) and
--  rejects values the client legitimately emits — most visibly `'dm'`,
--  which kills the in-app bell for every direct message.
--
--  Symptom in the browser console:
--    [Notif] insert failed: 23514 new row for relation "notifications"
--    violates check constraint "notifications_type_check"
--
--  This migration drops the stale constraint and re-adds one that
--  matches the full set of types the client sends today. Anything
--  outside the set still fails fast so typos don't go silent.
--
--  Safe to re-run. Run this in your Supabase project → SQL editor.
-- ════════════════════════════════════════════════════════════════

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'dm',
    'message',
    'new_job',
    'new_listing',
    'followed_company_listing',
    'status_change',
    'housing',
    'payment',
    'new_application',
    'booking'
  ));
