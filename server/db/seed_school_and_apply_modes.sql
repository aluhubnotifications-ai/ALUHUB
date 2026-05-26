-- ════════════════════════════════════════════════════════════════════
--  ALUHUB — Seed ALU school account + ALU-posted jobs + apply-mode mix
--
--  RUN ORDER FROM A FRESH DB
--    1. server/db/schema.sql
--    2. server/db/custom_auth.sql
--    3. server/db/migration_school_and_apply_modes.sql   ← required for new cols
--    4. server/db/seed_companies_and_jobs.sql            ← 5 companies + 40 jobs
--    5. server/db/seed_school_and_apply_modes.sql        ← this file
--
--  IDEMPOTENT. Re-running is safe.
--
--  WHAT IT DOES
--    1. Creates ALU Career Services as a school account (with login).
--    2. Adds external `apply_url` to ALL 40 company-posted jobs so the
--       Apply button always redirects to the company's careers page.
--    3. Adds 5 ALU-posted jobs, mixing internal ALU roles and external
--       employer postings (Microsoft, Safaricom, World Bank), with
--       per-job year restrictions and a mix of external/native apply.
--
--  ALU LOGIN
--    Email:    careers@alu.edu
--    Password: Demo2026!
-- ════════════════════════════════════════════════════════════════════

begin;

-- ── 1. ALU school login ────────────────────────────────────────────
insert into public.app_users (id, email, password_hash, email_verified_at) values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'careers@alu.edu',
    crypt('Demo2026!', gen_salt('bf', 12)),
    now()
  )
on conflict do nothing;

-- ── 2. ALU school profile ──────────────────────────────────────────
insert into public.profiles (
  id, user_type, full_name, school, industry, company_size, bio, website,
  avatar_url, plan, plan_activated_at
) values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'school',
    'ALU Career Services',
    'African Leadership University',
    'Higher Education',
    '5000+',
    'Career Services at African Leadership University (ALU). We curate and post internships, fellowships, and full-time opportunities for ALU and CMU-Africa students — both from external employers and ALU''s own programs.',
    'https://alueducation.com',
    'https://ui-avatars.com/api/?name=ALU+Career&background=8B1A1A&color=fff&bold=true&size=256',
    'premium',
    now()
  )
on conflict (id) do nothing;

-- Refresh ALU avatar/bio if rerun (covers any edited rows)
update public.profiles
   set avatar_url = 'https://ui-avatars.com/api/?name=ALU+Career&background=8B1A1A&color=fff&bold=true&size=256'
 where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;


-- ── 3. Set external apply_url on ALL 40 company jobs ───────────────
-- Convention: any company-posted listing routes Apply to the company's
-- public careers page. Only ALU school's own native roles use the in-app
-- form (see ALU listings below). Per-company UPDATEs use the company_id
-- so re-running stays idempotent and picks up any new jobs.

update public.job_listings set apply_url = 'https://andela.com/careers'
  where company_id = '11111111-1111-1111-1111-111111111111'::uuid and apply_url is null;

update public.job_listings set apply_url = 'https://flutterwave.com/careers'
  where company_id = '22222222-2222-2222-2222-222222222222'::uuid and apply_url is null;

update public.job_listings set apply_url = 'https://mpharma.com/careers'
  where company_id = '33333333-3333-3333-3333-333333333333'::uuid and apply_url is null;

update public.job_listings set apply_url = 'https://oneacrefund.org/careers'
  where company_id = '44444444-4444-4444-4444-444444444444'::uuid and apply_url is null;

update public.job_listings set apply_url = 'https://equitygroupholdings.com/careers'
  where company_id = '55555555-5555-5555-5555-555555555555'::uuid and apply_url is null;


-- ── 4. ALU-posted jobs (5 listings) ────────────────────────────────
-- Mix of external/native apply, internal ALU roles vs forwarded employer
-- listings, and varied year restrictions.

insert into public.job_listings (
  id, company_id, title, description, type, listing_type,
  location, pay, duration, deadline, status, tags,
  posted_by_role, original_company_name, original_company_logo_url,
  apply_url, allowed_years
) values

  -- 1. Microsoft Africa — posted by ALU, EXTERNAL apply, Year 3+
  (
    'bbbb0001-0000-0000-0000-000000000001'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'Microsoft Africa Engineering Internship',
    'A 12-week paid summer internship at Microsoft''s African development centers. Work on Azure, AI, and productivity products alongside senior Microsoft engineers. Open to ALU and CMU-Africa students in their final two years of study.',
    'Software Engineering',
    'Internship',
    'Nairobi · Cape Town',
    'Competitive (Microsoft global intern band)',
    '12 weeks',
    '2026-08-15',
    'active',
    array['Microsoft','Internship','Year 3+','Year 4'],
    'school',
    'Microsoft',
    'https://ui-avatars.com/api/?name=Microsoft&background=0078d4&color=fff&bold=true&size=256',
    'https://careers.microsoft.com/students',
    array['Year 3','Year 4']
  ),

  -- 2. Safaricom DigiFarm — posted by ALU, NATIVE apply via ALUHub, Year 2-3
  (
    'bbbb0002-0000-0000-0000-000000000002'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'Safaricom DigiFarm Product Intern',
    'Safaricom''s DigiFarm platform connects 1.5M+ smallholder farmers to inputs, credit, and markets. As an intern, you''ll work on product research, run farmer interviews, and ship small product improvements. ALU forwards applications directly to the Safaricom DigiFarm team.',
    'Product',
    'Internship',
    'Nairobi',
    'KES 35,000/mo',
    '3 months',
    '2026-07-20',
    'active',
    array['Safaricom','AgriTech','Product','Internship'],
    'school',
    'Safaricom',
    'https://ui-avatars.com/api/?name=Safaricom&background=00B140&color=fff&bold=true&size=256',
    null,                                -- native apply
    array['Year 2','Year 3']
  ),

  -- 3. ALU Career Services Peer Coach — ALU's OWN role, NATIVE apply, Year 2-4
  (
    'bbbb0003-0000-0000-0000-000000000003'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'ALU Career Services Peer Coach',
    'Paid on-campus role for upper-year students. You''ll run CV-review office hours, mock interviews, and skills workshops for first-year students. ~6 hours/week during term. Great for anyone considering HR, coaching, or career-services careers.',
    'Education',
    'Part-time',
    'Kigali (on-campus)',
    'RWF 80,000/mo',
    '1 semester (renewable)',
    '2026-09-30',
    'active',
    array['ALU','On-campus','Part-time','Coaching'],
    'school',
    null,                                -- ALU's own role
    null,
    null,                                -- native apply
    array['Year 2','Year 3','Year 4']
  ),

  -- 4. World Bank Africa Fellowship — posted by ALU, EXTERNAL apply, Year 4 only
  (
    'bbbb0004-0000-0000-0000-000000000004'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'World Bank Africa Fellowship',
    'A two-year fellowship for graduating ALU and CMU-Africa students with strong analytical skills and a passion for development. Rotations across infrastructure, education, and health portfolios at the World Bank''s Africa Region.',
    'Policy & Development',
    'Fellowship',
    'Washington D.C. · Nairobi · Dakar',
    'USD 70,000/yr + benefits',
    '2 years',
    '2026-12-01',
    'active',
    array['World Bank','Fellowship','Year 4','Policy'],
    'school',
    'World Bank',
    'https://ui-avatars.com/api/?name=World+Bank&background=002244&color=fff&bold=true&size=256',
    'https://www.worldbank.org/en/about/careers/programs-and-internships',
    array['Year 4']
  ),

  -- 5. ALU Teaching Assistant — ALU's OWN role, NATIVE apply, all years
  (
    'bbbb0005-0000-0000-0000-000000000005'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'ALU Teaching Assistant (Various Subjects)',
    'ALU is hiring TAs across multiple subject areas: Software Engineering, Business, Data Analytics, Communication, and more. TAs lead small-group sessions, grade assignments, and hold office hours. Open to all years — strong performance in the relevant course required.',
    'Education',
    'Part-time',
    'Kigali (on-campus)',
    'RWF 60,000/mo per course',
    '1 semester (renewable)',
    '2026-09-15',
    'active',
    array['ALU','On-campus','TA','Part-time'],
    'school',
    null,                                -- ALU's own role
    null,
    null,                                -- native apply
    array[]::text[]                      -- open to all years
  )

on conflict (id) do nothing;


-- Refresh apply_url + posted_by_role + restrictions on ALU jobs (covers reruns
-- after manual edits in dashboard)
update public.job_listings
   set apply_url = 'https://careers.microsoft.com/students',
       allowed_years = array['Year 3','Year 4'],
       posted_by_role = 'school'
 where id = 'bbbb0001-0000-0000-0000-000000000001'::uuid;

update public.job_listings
   set apply_url = null,
       allowed_years = array['Year 2','Year 3'],
       posted_by_role = 'school'
 where id = 'bbbb0002-0000-0000-0000-000000000002'::uuid;

update public.job_listings
   set apply_url = null,
       allowed_years = array['Year 2','Year 3','Year 4'],
       posted_by_role = 'school'
 where id = 'bbbb0003-0000-0000-0000-000000000003'::uuid;

update public.job_listings
   set apply_url = 'https://www.worldbank.org/en/about/careers/programs-and-internships',
       allowed_years = array['Year 4'],
       posted_by_role = 'school'
 where id = 'bbbb0004-0000-0000-0000-000000000004'::uuid;

update public.job_listings
   set apply_url = null,
       allowed_years = array[]::text[],
       posted_by_role = 'school'
 where id = 'bbbb0005-0000-0000-0000-000000000005'::uuid;


-- ── 5. Report ──────────────────────────────────────────────────────
select
  (select count(*) from public.app_users
     where email = 'careers@alu.edu')          as alu_login_present,
  (select count(*) from public.profiles
     where user_type = 'school'
       and id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid) as alu_profile_present,
  (select count(*) from public.job_listings
     where posted_by_role = 'school')           as school_posted_jobs,
  (select count(*) from public.job_listings
     where apply_url is not null)               as jobs_with_external_apply,
  (select count(*) from public.job_listings
     where apply_url is null
       and posted_by_role = 'company')          as jobs_with_native_apply;

commit;
