-- Migration: two-layer match-scoring v2 support
-- Run in Supabase Dashboard SQL editor (idempotent — safe to re-run).
--
-- Context: server/src/routes/ai.ts now scores jobs in two layers
-- (deterministic base + bounded Claude delta) and emits mismatch_flags.
-- This migration:
--   1. persists mismatch_flags on the cache,
--   2. extends the profile-change stale trigger to cover location_pref and
--      year — both are now read by the Layer-1 scorer but were NOT watched,
--      so changing them used to leave stale scores cached,
--   3. one-time invalidates EVERY cached row, because the scoring algorithm
--      itself changed: pre-v2 rows hold the old inflated scores.

-- 1. Persist the model's mismatch_flags ("what genuinely hurts this fit").
alter table public.ai_match_cache
  add column if not exists mismatch_flags text[] default '{}';

-- 2. Extend the profile-change stale trigger. Adds location_pref + year to
--    the existing watched set (desired_roles, preferred_industries, skills,
--    work_type, major, bio, cv_uploaded_at). Recreated in full so it stays
--    the single source of truth regardless of prior migration order.
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
    new.cv_uploaded_at       is distinct from old.cv_uploaded_at
  ) then
    update public.ai_match_cache
      set stale = true
      where student_id = new.id;
  end if;
  return new;
end;
$$;

-- 3. One-time: invalidate all existing cached matches. The two-layer scorer
--    produces different (less inflated) numbers than the pre-v2 single-prompt
--    scorer, so every cached row must be recomputed on next request.
update public.ai_match_cache set stale = true where stale = false;
