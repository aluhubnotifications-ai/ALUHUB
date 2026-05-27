-- Migration: persist Compass interview sessions
-- Run in Supabase Dashboard SQL editor (idempotent).
--
-- Compass runs a 4-6 turn interview, then recommends 3 jobs, then builds
-- prep plans. Without persistence, refreshing the page loses everything.
-- This table holds one row per student with the latest session state so
-- the student can come back days later and pick up where they left off.

create table if not exists public.compass_sessions (
  student_id    uuid primary key references public.profiles(id) on delete cascade,
  messages      jsonb       default '[]'::jsonb,   -- [{role,content}]
  recommendations jsonb     default null,           -- {summary, recommendations:[...]}
  prep_plans    jsonb       default '{}'::jsonb,    -- {<job_id>: {fit_summary, skills_to_build, ...}}
  stage         text        default 'welcome',      -- welcome | interview | recommended | prepped
  ready         boolean     default false,          -- interview reached [READY] marker
  updated_at    timestamptz default now()
);

create index if not exists compass_sessions_updated_idx
  on public.compass_sessions(updated_at desc);

alter table public.compass_sessions enable row level security;

drop policy if exists "Students read own compass session" on public.compass_sessions;
create policy "Students read own compass session" on public.compass_sessions
  for select using (auth.uid() = student_id);

drop policy if exists "Students write own compass session" on public.compass_sessions;
create policy "Students write own compass session" on public.compass_sessions
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

-- Touch updated_at on every write so we can prune stale sessions later
create or replace function public.touch_compass_session()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists trg_compass_touch on public.compass_sessions;
create trigger trg_compass_touch
  before update on public.compass_sessions
  for each row execute procedure public.touch_compass_session();
