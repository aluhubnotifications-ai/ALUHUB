-- Migration: add skills[] to profiles, tip + fit columns to ai_match_cache
-- Run in Supabase Dashboard SQL editor (idempotent).

-- 1. Explicit skills array on student profiles
alter table public.profiles add column if not exists skills text[] default '{}';

-- 2. AI-generated application tip stored per cached match
alter table public.ai_match_cache add column if not exists tip text;

-- 3. Fit band (strong/good/possible/weak) derived from score
alter table public.ai_match_cache add column if not exists fit text;

-- 4. Reasons array (parallel to match_reasons but plain text for speed)
alter table public.ai_match_cache add column if not exists reasons text[] default '{}';

-- 3. Extend the profile-change stale trigger to include skills changes
create or replace function public.mark_matches_stale_on_profile_change()
returns trigger language plpgsql as $$
begin
  if (
    new.desired_roles       is distinct from old.desired_roles or
    new.preferred_industries is distinct from old.preferred_industries or
    new.skills              is distinct from old.skills or
    new.work_type           is distinct from old.work_type or
    new.major               is distinct from old.major or
    new.bio                 is distinct from old.bio or
    new.cv_uploaded_at      is distinct from old.cv_uploaded_at
  ) then
    update public.ai_match_cache
      set stale = true
      where student_id = new.id;
  end if;
  return new;
end;
$$;
