-- ════════════════════════════════════════════════════════════════
--  Push-notification registry.
--  One row per (user, device) — populated by the Android shell when
--  Firebase Cloud Messaging hands us a token, deleted on sign-out or
--  when FCM tells us the token is dead.
--
--  Accessed only by the backend via the service-role key.
--  Run this in your Supabase project → SQL Editor.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.push_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  token         text not null unique,
  platform      text not null check (platform in ('android','ios','web')),
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;
-- No client-facing policies: only the service-role key (used by the
-- Node backend) can read or write this table.
