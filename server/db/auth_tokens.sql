-- ════════════════════════════════════════════════════════════════
--  Refresh-token store for backend-issued access/refresh rotation.
--  Run this in your Supabase project → SQL Editor.
--  Accessed only by the server via the service-role key.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.auth_refresh_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  revoked     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists auth_refresh_tokens_user_idx
  on public.auth_refresh_tokens (user_id);

create index if not exists auth_refresh_tokens_hash_idx
  on public.auth_refresh_tokens (token_hash);

-- The server uses the service-role key (which bypasses RLS). RLS is still
-- enabled so that the anon/public keys can never read raw token hashes.
alter table public.auth_refresh_tokens enable row level security;
