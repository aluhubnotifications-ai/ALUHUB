-- ════════════════════════════════════════════════════════════════════
--  ALUHUB — Migration: school role + apply modes + year restrictions
--
--  RUN THIS ONCE before running seed_school_and_apply_modes.sql.
--  Safe to re-run: every operation is idempotent.
--
--  WHAT IT ADDS
--    1. 'school' as a valid profiles.user_type
--       (alongside 'student' and 'company')
--    2. job_listings.apply_url
--         External apply link (nullable). If set, frontend opens the
--         link in a new tab. If null, the in-app native flow is used.
--    3. job_listings.posted_by_role
--         'company' (default) or 'school' — tells the UI who posted.
--    4. job_listings.original_company_name
--       job_listings.original_company_logo_url
--         When a school posts a job ON BEHALF of an external employer
--         (e.g. ALU Career Services posts a Microsoft role), these
--         hold the employer's name and logo. company_id still points
--         at the school's profile so the school owns the listing.
--    5. job_listings.allowed_years
--         text[] of years (e.g. '{"Year 3","Year 4"}').
--         Empty / NULL = visible to all years.
--         Populated = visible only to students whose profiles.year
--         appears in this array (enforced client-side; can be moved
--         to RLS later if needed).
-- ════════════════════════════════════════════════════════════════════

begin;

-- ── 1. Expand user_type to include 'school' ──────────────────────────
alter table public.profiles
  drop constraint if exists profiles_user_type_check;

alter table public.profiles
  add constraint profiles_user_type_check
    check (user_type in ('student', 'company', 'school'));

-- ── 2. New job_listings columns ──────────────────────────────────────
alter table public.job_listings
  add column if not exists apply_url text;
alter table public.job_listings
  add column if not exists posted_by_role text default 'company';
alter table public.job_listings
  add column if not exists original_company_name text;
alter table public.job_listings
  add column if not exists original_company_logo_url text;
alter table public.job_listings
  add column if not exists allowed_years text[] default '{}';

-- ── 3. posted_by_role check constraint ───────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'job_listings_posted_by_role_check'
  ) then
    alter table public.job_listings
      add constraint job_listings_posted_by_role_check
        check (posted_by_role in ('company', 'school'));
  end if;
end $$;

-- ── 4. GIN index for year filtering ──────────────────────────────────
create index if not exists job_listings_allowed_years_idx
  on public.job_listings using gin (allowed_years);

-- ── 5. Index for apply_url presence (used by "external apply" filter) ─
create index if not exists job_listings_apply_url_present_idx
  on public.job_listings ((apply_url is not null));

commit;

-- Verify columns were added
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'job_listings'
  and column_name in ('apply_url', 'posted_by_role',
                      'original_company_name', 'original_company_logo_url',
                      'allowed_years')
order by column_name;
