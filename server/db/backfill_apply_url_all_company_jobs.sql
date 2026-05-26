-- ════════════════════════════════════════════════════════════════════
--  ALUHUB — One-shot backfill: give every company job an apply_url
--
--  WHY
--    Originally only half of each company's jobs had apply_url set.
--    The rest (incl. One Acre Fund's "Field Coordinator Intern") fell
--    back to the in-app form. Convention is now: any company-posted
--    listing routes Apply to that company's public careers page.
--    The in-app form only fires for ALU school's own native roles.
--
--  HOW TO RUN
--    Paste into Supabase Dashboard → SQL Editor → Run.
--    Idempotent: only touches rows where apply_url is currently NULL.
-- ════════════════════════════════════════════════════════════════════

begin;

-- Andela
update public.job_listings set apply_url = 'https://andela.com/careers'
  where company_id = '11111111-1111-1111-1111-111111111111'::uuid and apply_url is null;

-- Flutterwave
update public.job_listings set apply_url = 'https://flutterwave.com/careers'
  where company_id = '22222222-2222-2222-2222-222222222222'::uuid and apply_url is null;

-- mPharma
update public.job_listings set apply_url = 'https://mpharma.com/careers'
  where company_id = '33333333-3333-3333-3333-333333333333'::uuid and apply_url is null;

-- One Acre Fund (covers "Field Coordinator Intern" and the other 3 odd-numbered)
update public.job_listings set apply_url = 'https://oneacrefund.org/careers'
  where company_id = '44444444-4444-4444-4444-444444444444'::uuid and apply_url is null;

-- Equity Bank
update public.job_listings set apply_url = 'https://equitygroupholdings.com/careers'
  where company_id = '55555555-5555-5555-5555-555555555555'::uuid and apply_url is null;

commit;

-- Verify: every company-posted listing should now have an apply_url.
-- (ALU school-posted listings can still have NULL — that's intentional.)
select
  p.company_name,
  count(*)                                            as total_jobs,
  count(*) filter (where j.apply_url is not null)     as with_url,
  count(*) filter (where j.apply_url is null)         as native_apply
from public.job_listings j
join public.profiles p on p.id = j.company_id
where coalesce(j.posted_by_role, 'company') = 'company'
group by p.company_name
order by p.company_name;
