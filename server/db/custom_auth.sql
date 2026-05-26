-- ════════════════════════════════════════════════════════════════════
--  ALUHub Custom Auth — replaces Supabase Auth (no MAU / email limits)
--  Run in Supabase Dashboard → SQL Editor.
--
--  After running this:
--   1. Set BCRYPT_ROUNDS, SUPABASE_JWT_SECRET in server env.
--   2. Deploy the new /api/auth backend.
--   3. Existing users in auth.users keep working until you decide to
--      migrate them; new signups go to public.app_users.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Users table ────────────────────────────────────────────────────
create table if not exists public.app_users (
  id                       uuid primary key default gen_random_uuid(),
  email                    text not null unique,
  password_hash            text not null,
  email_verified_at        timestamptz,
  verification_token_hash  text,
  verification_expires_at  timestamptz,
  password_reset_hash      text,
  password_reset_expires_at timestamptz,
  failed_attempts          integer not null default 0,
  locked_until             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create unique index if not exists app_users_email_lower_idx
  on public.app_users (lower(email));

create index if not exists app_users_verification_idx
  on public.app_users (verification_token_hash)
  where verification_token_hash is not null;

create index if not exists app_users_password_reset_idx
  on public.app_users (password_reset_hash)
  where password_reset_hash is not null;

-- The server uses the service-role key. RLS is enabled so anon/public
-- keys can never read password hashes or verification tokens.
alter table public.app_users enable row level security;

-- ── 2. Refresh-token store ────────────────────────────────────────────
-- If you previously ran auth_tokens.sql, the table already exists but
-- its FK points at auth.users. Re-point it at app_users.

create table if not exists public.auth_refresh_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  revoked     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Drop the old FK (to auth.users) if it exists, then add the new one.
do $$
declare
  fk record;
begin
  for fk in
    select conname
    from pg_constraint
    where conrelid = 'public.auth_refresh_tokens'::regclass
      and contype = 'f'
  loop
    execute format('alter table public.auth_refresh_tokens drop constraint %I', fk.conname);
  end loop;
end $$;

-- Note: we intentionally do NOT add a FK to app_users here. Tokens for
-- legacy auth.users rows would otherwise be orphaned. The /refresh
-- handler validates the user explicitly.

create index if not exists auth_refresh_tokens_user_idx
  on public.auth_refresh_tokens (user_id);
create index if not exists auth_refresh_tokens_hash_idx
  on public.auth_refresh_tokens (token_hash);

alter table public.auth_refresh_tokens enable row level security;

-- ── 3. Drop every FK pointing at auth.users ──────────────────────────
-- New signups live in app_users, not auth.users, so any table with a
-- FK to auth.users would reject inserts for our new users. Drop them
-- all in one sweep — covers profiles, push_tokens, and any future
-- table you forgot to update.

do $$
declare
  fk record;
begin
  for fk in
    select conrelid::regclass::text as tbl, conname
    from pg_constraint
    where contype = 'f'
      and confrelid = 'auth.users'::regclass
      and connamespace = 'public'::regnamespace
  loop
    execute format('alter table %s drop constraint %I', fk.tbl, fk.conname);
    raise notice 'Dropped FK % on %', fk.conname, fk.tbl;
  end loop;
end $$;

-- ── 4. updated_at trigger ─────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_users_touch on public.app_users;
create trigger trg_app_users_touch
  before update on public.app_users
  for each row execute procedure public.touch_updated_at();
