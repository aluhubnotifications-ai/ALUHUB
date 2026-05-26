-- Fix: add 'hired' to the applications.status check constraint.
-- The original schema was missing 'hired', which caused the Accept action
-- to fail with a constraint-violation error even though the UI showed success.
--
-- Run this once against the live Supabase database.

alter table public.applications
  drop constraint if exists applications_status_check;

alter table public.applications
  add constraint applications_status_check
  check (status in ('pending', 'reviewed', 'shortlisted', 'hired', 'rejected'));
