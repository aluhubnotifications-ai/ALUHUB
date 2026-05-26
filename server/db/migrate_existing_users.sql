-- ════════════════════════════════════════════════════════════════════
--  ONE-OFF MIGRATION
--  Copy existing Supabase Auth users into public.app_users so they
--  can log in through the new backend with the password they already
--  have.
--
--  Why it works: auth.users.encrypted_password is bcrypt-hashed in
--  the same $2a$... format. bcrypt.compare accepts it natively, so
--  we just move the hash — no password reset needed.
--
--  Safe to run multiple times: rows that already exist in app_users
--  (by id or email) are skipped. Run this in the Supabase SQL Editor
--  AFTER you've run custom_auth.sql.
-- ════════════════════════════════════════════════════════════════════

insert into public.app_users (
  id,
  email,
  password_hash,
  email_verified_at,
  created_at,
  updated_at
)
select
  u.id,
  lower(u.email),
  u.encrypted_password,
  coalesce(u.email_confirmed_at, u.created_at),
  u.created_at,
  u.created_at
from auth.users u
where u.email is not null
  and u.encrypted_password is not null
  and u.encrypted_password <> ''
  and u.deleted_at is null
  and not exists (
    select 1 from public.app_users a
    where a.id = u.id or lower(a.email) = lower(u.email)
  );

-- ── Verify the migration ─────────────────────────────────────────────
-- Run these one at a time to confirm the move worked.

-- 1. Count users in each table — they should match (minus OAuth-only
--    accounts in auth.users that have no password).
select
  (select count(*) from auth.users where encrypted_password is not null and deleted_at is null) as auth_users_with_password,
  (select count(*) from public.app_users) as app_users_total;

-- 2. Spot-check a single user — every column should be populated.
-- Replace 'you@example.com' with your real email.
-- select id, email, length(password_hash) as pw_len, email_verified_at, created_at
-- from public.app_users
-- where lower(email) = lower('you@example.com');

-- 3. List any auth.users that were skipped (OAuth-only, deleted, etc.).
-- These users will NOT be able to log in to the new system without
-- going through the password-reset flow first.
-- select id, email, encrypted_password is null as no_password, deleted_at is not null as deleted
-- from auth.users
-- where not exists (select 1 from public.app_users a where a.id = auth.users.id);
