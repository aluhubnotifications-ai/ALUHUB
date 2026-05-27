-- Migration: support multiple Compass sessions per student (history)
-- Run AFTER migration_compass_sessions.sql
-- Idempotent — safe to re-run.

-- 1. Add id PK so we can have many sessions per student
alter table public.compass_sessions
  add column if not exists id uuid default gen_random_uuid();

-- 2. Add title so sessions are scannable in the history list
alter table public.compass_sessions
  add column if not exists title text;

-- 3. Add created_at (we already have updated_at)
alter table public.compass_sessions
  add column if not exists created_at timestamptz default now();

-- 4. Replace the (student_id) primary key with a (id) primary key.
-- We have to do this in two steps because Postgres can't drop the PK
-- while it's the column constraint.
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_schema='public'
      and table_name='compass_sessions'
      and constraint_name='compass_sessions_pkey'
  ) then
    -- Old PK was on student_id; backfill ids and switch
    update public.compass_sessions set id = gen_random_uuid() where id is null;
    alter table public.compass_sessions drop constraint compass_sessions_pkey;
  end if;
end$$;

-- Make id NOT NULL and primary key
alter table public.compass_sessions
  alter column id set not null;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public'
      and table_name='compass_sessions'
      and constraint_type='PRIMARY KEY'
  ) then
    alter table public.compass_sessions add primary key (id);
  end if;
end$$;

-- 5. Fast lookup of all sessions for one student
create index if not exists compass_sessions_student_idx
  on public.compass_sessions(student_id, updated_at desc);

-- 6. Backfill titles from the first user message in existing rows so
-- they're not blank in the history list. The trigger below keeps new
-- inserts in sync.
update public.compass_sessions
set title = coalesce(
  title,
  nullif(trim((messages->0->>'content')), ''),
  'New conversation'
)
where title is null or title = '';
