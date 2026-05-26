-- ════════════════════════════════════════════════════════════════════
--  Reconcile profiles with app_users
--
--  WHAT THIS DOES
--  After the custom-auth migration, the RLS policies on tables like
--  direct_messages assume `profiles.id = app_users.id` for every
--  signed-in user. That breaks when:
--   • A profile row was never created for a given app_users row.
--     → "new row violates row-level security policy for table
--        direct_messages" when the user tries to send a DM (FK to
--        profiles passes only if a profile row with id=app_users.id
--        exists, and the policy passes only if auth.uid()=that id).
--   • A user was deleted then re-registered; the OLD profile row is
--     still around with their old id, but their NEW app_users.id has
--     no matching profile row.
--
--  This script creates a minimal profiles row for every app_users
--  whose id is missing from profiles. Safe to re-run: existing rows
--  are left untouched.
--
--  HOW TO USE
--  Open Supabase Dashboard → SQL Editor, paste, run.
-- ════════════════════════════════════════════════════════════════════

insert into public.profiles (id, full_name)
select au.id, split_part(au.email, '@', 1)
from public.app_users au
where not exists (
  select 1 from public.profiles p where p.id = au.id
);

-- Report how many users now have a profile row vs. don't.
select
  (select count(*) from public.app_users) as app_users_total,
  (select count(*) from public.app_users au
     where exists (select 1 from public.profiles p where p.id = au.id)
  ) as app_users_with_profile,
  (select count(*) from public.app_users au
     where not exists (select 1 from public.profiles p where p.id = au.id)
  ) as app_users_missing_profile;

-- ── Optional: list orphan profile rows ──────────────────────────────
-- Profile rows whose id no longer matches any app_users row. Usually
-- safe to leave alone (they don't break anything) but can be cleaned
-- if you're sure no other table references them.
-- select p.id, p.full_name
-- from public.profiles p
-- where not exists (select 1 from public.app_users au where au.id = p.id);
