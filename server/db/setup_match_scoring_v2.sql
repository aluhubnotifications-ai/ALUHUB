-- Self-contained setup for AI match scoring (v2).
-- Run in Supabase Dashboard SQL editor. Fully idempotent — safe to re-run.
--
-- Combines, in ONE pasteable block:
--   * the ai_match_cache table + indexes + RLS (from schema.sql section 14)
--   * the v2 additions (mismatch_flags column, location_pref + year added to
--     the profile-change stale trigger, one-time invalidation of old rows)
--   * both stale-marking triggers (profile change + job change)
--
-- Use this instead of pasting fragments of schema.sql — a partial copy that
-- starts in the middle of another table body produces a misleading
-- "syntax error at or near table" on the first alter/create it reaches.

-- 0. Ensure every profiles column the stale-trigger reads actually exists.
--    (These otherwise live in separate migrations; guarding here keeps this
--    block standalone — a missing column would only fail later at trigger
--    fire-time, which is far harder to diagnose.)
alter table public.profiles add column if not exists desired_roles        text[] default '{}';
alter table public.profiles add column if not exists preferred_industries text[] default '{}';
alter table public.profiles add column if not exists skills               text[] default '{}';
alter table public.profiles add column if not exists work_type            text;
alter table public.profiles add column if not exists location_pref        text;
alter table public.profiles add column if not exists cv_uploaded_at       timestamptz;
-- Extracted résumé text — the PRIMARY matching signal. Populated once per
-- upload by POST /api/ai/cv-extract (native PDF support, no parser lib).
alter table public.profiles add column if not exists cv_text             text;

-- 1. Cache table -----------------------------------------------------------
create table if not exists public.ai_match_cache (
  id             uuid default gen_random_uuid() primary key,
  student_id     uuid references public.profiles(id) on delete cascade not null,
  job_id         uuid references public.job_listings(id) on delete cascade not null,
  score          integer not null check (score between 0 and 100),
  fit            text,                         -- strong/good/possible/weak
  match_reasons  jsonb   default '[]'::jsonb,  -- [{label, detail}] (legacy)
  reasons        text[]  default '{}',         -- plain-text reasons array
  matched_skills text[]  default '{}',
  tip            text,                         -- one concrete application tip
  mismatch_flags text[]  default '{}',         -- v2: what genuinely hurts fit
  matched_at     timestamptz default now(),
  stale          boolean default false,        -- set true when job or profile changes
  unique(student_id, job_id)
);

-- Idempotent column guards for tables that already exist (safe to re-run).
alter table public.ai_match_cache add column if not exists fit            text;
alter table public.ai_match_cache add column if not exists reasons        text[]  default '{}';
alter table public.ai_match_cache add column if not exists tip            text;
alter table public.ai_match_cache add column if not exists mismatch_flags text[]  default '{}';

create index if not exists ai_match_cache_student_idx on public.ai_match_cache(student_id);
create index if not exists ai_match_cache_job_idx     on public.ai_match_cache(job_id);
create index if not exists ai_match_cache_score_idx   on public.ai_match_cache(student_id, score desc);

-- 2. RLS -------------------------------------------------------------------
alter table public.ai_match_cache enable row level security;
drop policy if exists "Students can read own matches" on public.ai_match_cache;
create policy "Students can read own matches" on public.ai_match_cache
  for select using (auth.uid() = student_id);
drop policy if exists "Service role can write matches" on public.ai_match_cache;
create policy "Service role can write matches" on public.ai_match_cache
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- 3. Stale on profile change (v2: + location_pref, + year) -----------------
create or replace function public.mark_matches_stale_on_profile_change()
returns trigger language plpgsql as $$
begin
  if (
    new.desired_roles        is distinct from old.desired_roles or
    new.preferred_industries is distinct from old.preferred_industries or
    new.skills               is distinct from old.skills or
    new.work_type            is distinct from old.work_type or
    new.major                is distinct from old.major or
    new.bio                  is distinct from old.bio or
    new.location_pref        is distinct from old.location_pref or
    new.year                 is distinct from old.year or
    new.cv_text              is distinct from old.cv_text or
    new.cv_uploaded_at       is distinct from old.cv_uploaded_at
  ) then
    update public.ai_match_cache
      set stale = true
      where student_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_profile_match_stale on public.profiles;
create trigger trg_profile_match_stale
  after update on public.profiles
  for each row execute procedure public.mark_matches_stale_on_profile_change();

-- 4. Stale on job change ---------------------------------------------------
create or replace function public.mark_matches_stale_on_job_change()
returns trigger language plpgsql as $$
begin
  update public.ai_match_cache
    set stale = true
    where job_id = new.id;
  return new;
end;
$$;
drop trigger if exists trg_job_match_stale on public.job_listings;
create trigger trg_job_match_stale
  after update on public.job_listings
  for each row execute procedure public.mark_matches_stale_on_job_change();

-- 5. One-time: invalidate every existing cached row. The v2 two-layer scorer
--    produces different (less inflated) numbers than the pre-v2 scorer.
update public.ai_match_cache set stale = true where stale = false;
