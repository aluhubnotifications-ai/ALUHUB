-- ════════════════════════════════════════════════════════════════════
--  ALUHUB — Seed 5 companies + 40 job listings (8 per company)
--
--  HOW TO RUN
--    Supabase Dashboard → SQL Editor → New Query → paste this file → Run.
--
--  IDEMPOTENT
--    Every insert uses a stable UUID and ON CONFLICT DO NOTHING,
--    so re-running this script will NOT create duplicates. Re-running
--    will also NOT overwrite edits you may have made to existing rows.
--    To force-refresh a row, DELETE it first then re-run.
--
--  WHAT IT DOES
--    1. Adds the missing `listing_type` column to job_listings
--       (frontend reads it but the column was never created).
--    2. Creates 5 company LOGIN accounts in app_users (emails below,
--       password "Demo2026!"). email_verified_at is set so login works
--       immediately — no verification email needed.
--    3. Creates a matching company profile (user_type='company') for
--       each login, with industry / size / bio / website.
--    4. Creates 8 jobs per company across varied roles, levels, and
--       contract types (intern / full-time).
--
--  DEMO LOGIN CREDENTIALS
--    Password (same for all 5):  Demo2026!
--    Emails:
--      andela@aluhub.com
--      flutterwave@aluhub.com
--      mpharma@aluhub.com
--      oneacrefund@aluhub.com
--      equitybank@aluhub.com
--
--  ⚠️  These are DEMO accounts with a publicly-visible password
--      committed to the repo. Do not store sensitive data in them.
--      Change the password via the normal forgot-password flow if you
--      want to lock any of them down for production use.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ── 0a. Ensure pgcrypto is available (used to bcrypt-hash passwords) ─
-- Supabase enables pgcrypto by default; this is a no-op if it's
-- already installed.
create extension if not exists pgcrypto;

-- ── 0b. Add missing listing_type column ─────────────────────────────
alter table public.job_listings
  add column if not exists listing_type text;

-- ── 1. Login accounts (app_users) ───────────────────────────────────
-- One row per demo company. The id MUST match the corresponding
-- profile id below — reconcile_profiles.sql documents that the app's
-- RLS policies assume `profiles.id = app_users.id` for every signed-in
-- user.
--
-- The password hash is produced by pgcrypto's bcrypt (`gen_salt('bf', 12)`),
-- which generates a `$2a$12$…` hash that Node's bcrypt.compare() reads
-- natively. Cost factor 12 matches the server default in
-- server/src/lib/passwords.ts (BCRYPT_ROUNDS).
--
-- email_verified_at = now() so the accounts are pre-verified and the
-- login flow won't ask for an email-verification code.

insert into public.app_users (
  id, email, password_hash, email_verified_at
) values
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'andela@aluhub.com',
    crypt('Demo2026!', gen_salt('bf', 12)),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'flutterwave@aluhub.com',
    crypt('Demo2026!', gen_salt('bf', 12)),
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333'::uuid,
    'mpharma@aluhub.com',
    crypt('Demo2026!', gen_salt('bf', 12)),
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444444'::uuid,
    'oneacrefund@aluhub.com',
    crypt('Demo2026!', gen_salt('bf', 12)),
    now()
  ),
  (
    '55555555-5555-5555-5555-555555555555'::uuid,
    'equitybank@aluhub.com',
    crypt('Demo2026!', gen_salt('bf', 12)),
    now()
  )
on conflict do nothing;  -- safe against either (id) or (email) collisions

-- ── 2. Company profiles ─────────────────────────────────────────────
-- user_type='company' so the row is treated as a company profile.
-- plan='premium' so the listings aren't hidden behind any free-tier gate.

insert into public.profiles (
  id, user_type, full_name, company_name, industry,
  company_size, bio, website, avatar_url, plan, plan_activated_at
) values
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'company',
    'Andela',
    'Andela',
    'Technology',
    '501-1000',
    'Pan-African tech talent accelerator connecting Africa''s top engineers with global opportunities. Andela has placed 700+ engineers across 60+ companies globally.',
    'https://andela.com',
    'https://ui-avatars.com/api/?name=Andela&background=0A2E5C&color=fff&bold=true&size=256',
    'premium',
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'company',
    'Flutterwave',
    'Flutterwave',
    'Fintech',
    '201-500',
    'Africa''s leading payment technology company powering global commerce for African businesses. Processes $26B+ annually.',
    'https://flutterwave.com',
    'https://ui-avatars.com/api/?name=Flutterwave&background=f97316&color=fff&bold=true&size=256',
    'premium',
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333'::uuid,
    'company',
    'mPharma',
    'mPharma',
    'HealthTech',
    '201-500',
    'Making quality medicine accessible and affordable for every African through tech-enabled pharmacy networks across Ghana, Nigeria, Kenya, and beyond.',
    'https://mpharma.com',
    'https://ui-avatars.com/api/?name=mPharma&background=059669&color=fff&bold=true&size=256',
    'premium',
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444444'::uuid,
    'company',
    'One Acre Fund',
    'One Acre Fund',
    'NGO / Social Impact',
    '5000+',
    'Serving 1M+ smallholder farming families across 9 African countries with financing, training, and farm inputs. Field operations in Rwanda, Kenya, Tanzania, and beyond.',
    'https://oneacrefund.org',
    'https://ui-avatars.com/api/?name=One+Acre+Fund&background=16a34a&color=fff&bold=true&size=256',
    'premium',
    now()
  ),
  (
    '55555555-5555-5555-5555-555555555555'::uuid,
    'company',
    'Equity Bank',
    'Equity Bank',
    'Banking & Finance',
    '5000+',
    'East Africa''s largest bank by customer count, serving 10M+ customers and transforming lives through inclusive, accessible digital finance.',
    'https://equitygroupholdings.com',
    'https://ui-avatars.com/api/?name=Equity+Bank&background=dc2626&color=fff&bold=true&size=256',
    'premium',
    now()
  )
on conflict (id) do nothing;


-- ── 2b. Refresh avatar URLs ────────────────────────────────────────
-- The previous seed used a DiceBear URL format that returns 400.
-- This UPDATE runs every time and re-syncs the avatar_url for the 5
-- demo companies to working ui-avatars.com URLs. Targeted by id so
-- it never touches other companies. Safe to re-run.

update public.profiles set avatar_url =
  'https://ui-avatars.com/api/?name=Andela&background=0A2E5C&color=fff&bold=true&size=256'
  where id = '11111111-1111-1111-1111-111111111111'::uuid;

update public.profiles set avatar_url =
  'https://ui-avatars.com/api/?name=Flutterwave&background=f97316&color=fff&bold=true&size=256'
  where id = '22222222-2222-2222-2222-222222222222'::uuid;

update public.profiles set avatar_url =
  'https://ui-avatars.com/api/?name=mPharma&background=059669&color=fff&bold=true&size=256'
  where id = '33333333-3333-3333-3333-333333333333'::uuid;

update public.profiles set avatar_url =
  'https://ui-avatars.com/api/?name=One+Acre+Fund&background=16a34a&color=fff&bold=true&size=256'
  where id = '44444444-4444-4444-4444-444444444444'::uuid;

update public.profiles set avatar_url =
  'https://ui-avatars.com/api/?name=Equity+Bank&background=dc2626&color=fff&bold=true&size=256'
  where id = '55555555-5555-5555-5555-555555555555'::uuid;


-- ── 3. Jobs ─────────────────────────────────────────────────────────
-- 8 per company × 5 companies = 40 listings.
-- Variety: roles (eng, product, data, design, ops, finance, hr, marketing),
-- levels (intern, junior, mid, senior, lead), contract types
-- (Internship, Full-time, Contract).

insert into public.job_listings (
  id, company_id, title, description, type, listing_type,
  location, pay, duration, deadline, status, tags
) values

-- ╔════════════════════════════════════════════════════════════════╗
-- ║  ANDELA — Technology                                           ║
-- ╚════════════════════════════════════════════════════════════════╝

  (
    'aaaa0001-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Software Engineer Intern',
    'Build world-class products with Africa''s top engineering talent network. Work alongside senior engineers on production systems. Build features, participate in code reviews, and collaborate with distributed teams.',
    'Software Engineering',
    'Internship',
    'Remote — Pan-Africa',
    '$800/mo',
    '3–6 months',
    '2026-08-31',
    'active',
    array['React','Node.js','Remote','Internship']
  ),
  (
    'aaaa0002-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Senior Backend Engineer',
    'Lead backend development on large-scale distributed systems. Design APIs, optimize performance, mentor junior engineers, and partner with product on architecture decisions.',
    'Software Engineering',
    'Full-time',
    'Remote',
    '$80,000–$120,000/yr',
    'Permanent',
    '2026-09-30',
    'active',
    array['Go','Postgres','Microservices','Senior','Remote']
  ),
  (
    'aaaa0003-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'DevOps Engineer',
    'Own our infrastructure on AWS. Build CI/CD pipelines, manage Kubernetes clusters, automate everything, and keep production rock-solid.',
    'DevOps',
    'Full-time',
    'Lagos · Remote',
    '$60,000–$90,000/yr',
    'Permanent',
    '2026-09-15',
    'active',
    array['AWS','Kubernetes','Terraform','CI/CD']
  ),
  (
    'aaaa0004-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Product Designer Intern',
    'Shape the UX of products used by thousands of engineers across Africa. Run user research, prototype in Figma, and partner with PMs and engineers.',
    'Design',
    'Internship',
    'Remote',
    '$700/mo',
    '4 months',
    '2026-07-31',
    'active',
    array['Figma','UX Research','Prototyping','Internship']
  ),
  (
    'aaaa0005-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Engineering Manager',
    'Lead and grow a team of 6–10 engineers. Coach, mentor, set technical direction, and own delivery for a critical product area.',
    'Engineering Management',
    'Full-time',
    'Nairobi · Remote',
    'Competitive',
    'Permanent',
    '2026-10-15',
    'active',
    array['Leadership','Mentorship','Strategy','Senior']
  ),
  (
    'aaaa0006-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Data Engineer',
    'Build the data platform that powers our analytics. Design pipelines, model warehouses, and partner with data scientists to make data accessible.',
    'Data',
    'Full-time',
    'Remote',
    '$55,000–$80,000/yr',
    'Permanent',
    '2026-09-20',
    'active',
    array['SQL','dbt','Airflow','BigQuery']
  ),
  (
    'aaaa0007-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Frontend Engineer',
    'Build polished, accessible interfaces in React + TypeScript. Partner with designers on a shared design system and ship features end-to-end.',
    'Software Engineering',
    'Full-time',
    'Remote',
    '$50,000–$75,000/yr',
    'Permanent',
    '2026-08-31',
    'active',
    array['React','TypeScript','Tailwind','Remote']
  ),
  (
    'aaaa0008-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Technical Recruiter',
    'Source, screen, and hire top engineering talent across Africa. Build the pipeline that fuels our growth and partner with hiring managers.',
    'People & Talent',
    'Full-time',
    'Lagos',
    'Competitive + bonus',
    'Permanent',
    '2026-08-15',
    'active',
    array['Sourcing','Talent','Tech Hiring']
  ),

-- ╔════════════════════════════════════════════════════════════════╗
-- ║  FLUTTERWAVE — Fintech                                         ║
-- ╚════════════════════════════════════════════════════════════════╝

  (
    'aaaa0001-2222-2222-2222-222222222222'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Product Management Intern',
    'Shape the future of African payments. Work with PMs to define roadmaps, run competitive analysis, write PRDs, and launch features used by millions.',
    'Product',
    'Internship',
    'Lagos · Nairobi',
    '$900/mo',
    '6 months',
    '2026-06-30',
    'active',
    array['Product','Fintech','Agile','Internship']
  ),
  (
    'aaaa0002-2222-2222-2222-222222222222'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Senior Software Engineer (Payments)',
    'Build the systems that move billions across Africa. Design payment flows, optimize for latency, and partner with risk and ops teams.',
    'Software Engineering',
    'Full-time',
    'Lagos',
    '$90,000–$130,000/yr',
    'Permanent',
    '2026-10-31',
    'active',
    array['Java','Microservices','Payments','Senior']
  ),
  (
    'aaaa0003-2222-2222-2222-222222222222'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Fraud Analyst',
    'Identify fraud patterns in real-time transaction data. Build risk models, tune detection rules, and partner with engineering on automated mitigations.',
    'Risk & Compliance',
    'Full-time',
    'Nairobi',
    '$40,000–$65,000/yr',
    'Permanent',
    '2026-09-15',
    'active',
    array['SQL','Risk Modeling','Fraud','Analytics']
  ),
  (
    'aaaa0004-2222-2222-2222-222222222222'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Compliance Officer',
    'Own AML/KYC compliance across our African markets. Liaise with regulators, audit transaction flows, and keep us ahead of changing regulations.',
    'Risk & Compliance',
    'Full-time',
    'Lagos',
    'Competitive',
    'Permanent',
    '2026-08-31',
    'active',
    array['AML','KYC','Regulations','Compliance']
  ),
  (
    'aaaa0005-2222-2222-2222-222222222222'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'UI/UX Designer',
    'Design payment experiences that work for everyone from market traders to enterprise CFOs. Own end-to-end design, from research to high-fidelity mockups.',
    'Design',
    'Full-time',
    'Remote',
    '$45,000–$70,000/yr',
    'Permanent',
    '2026-09-30',
    'active',
    array['Figma','Design Systems','Mobile','Remote']
  ),
  (
    'aaaa0006-2222-2222-2222-222222222222'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Customer Success Intern',
    'Be the first responder for merchants integrating Flutterwave. Triage support tickets, escalate bugs, and build resources that scale our help.',
    'Customer Success',
    'Internship',
    'Lagos · Remote',
    '$500/mo',
    '3 months',
    '2026-07-15',
    'active',
    array['Support','Communication','Internship']
  ),
  (
    'aaaa0007-2222-2222-2222-222222222222'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Mobile Engineer (iOS)',
    'Build native iOS experiences for our merchant and consumer apps. Ship features, optimize performance, and work cross-functionally with Android and backend.',
    'Software Engineering',
    'Full-time',
    'Lagos · Cape Town',
    '$55,000–$85,000/yr',
    'Permanent',
    '2026-10-15',
    'active',
    array['Swift','SwiftUI','iOS','Mobile']
  ),
  (
    'aaaa0008-2222-2222-2222-222222222222'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Data Analyst',
    'Turn transaction data into product and business insights. Build dashboards, partner with PMs on experiments, and inform strategy with data.',
    'Data',
    'Full-time',
    'Nairobi · Remote',
    '$35,000–$55,000/yr',
    'Permanent',
    '2026-09-20',
    'active',
    array['SQL','Tableau','Python','Analytics']
  ),

-- ╔════════════════════════════════════════════════════════════════╗
-- ║  mPHARMA — HealthTech                                          ║
-- ╚════════════════════════════════════════════════════════════════╝

  (
    'aaaa0001-3333-3333-3333-333333333333'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    'Data Analyst Intern',
    'Use data to improve healthcare access across Africa. Analyse prescription patterns, supply chains, and patient outcomes to inform decisions that affect millions.',
    'Data',
    'Internship',
    'Accra · Nairobi',
    '$600/mo',
    '4 months',
    '2026-06-15',
    'active',
    array['SQL','Tableau','HealthTech','Internship']
  ),
  (
    'aaaa0002-3333-3333-3333-333333333333'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    'Pharmacy Operations Lead',
    'Run operations across our network of pharmacies in Ghana. Own KPIs for inventory, customer experience, and clinical quality. Lead a team of pharmacy supervisors.',
    'Operations',
    'Full-time',
    'Accra',
    'Competitive',
    'Permanent',
    '2026-09-30',
    'active',
    array['Operations','Leadership','Healthcare']
  ),
  (
    'aaaa0003-3333-3333-3333-333333333333'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    'Supply Chain Analyst',
    'Optimize our medicine supply chain across multiple countries. Forecast demand, reduce stockouts, and partner with suppliers and logistics.',
    'Operations',
    'Full-time',
    'Nairobi',
    '$30,000–$45,000/yr',
    'Permanent',
    '2026-08-31',
    'active',
    array['SQL','Logistics','Forecasting','Healthcare']
  ),
  (
    'aaaa0004-3333-3333-3333-333333333333'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    'Software Engineer (Backend)',
    'Build the platform that powers our pharmacy network. APIs, integrations with payment and inventory systems, and tooling that lets ops scale.',
    'Software Engineering',
    'Full-time',
    'Accra · Remote',
    '$40,000–$60,000/yr',
    'Permanent',
    '2026-10-15',
    'active',
    array['Python','Django','Postgres','APIs']
  ),
  (
    'aaaa0005-3333-3333-3333-333333333333'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    'Business Development Intern',
    'Help identify and close partnerships with health insurers, clinics, and corporate clients. Research markets, prepare pitch decks, and sit in on deal calls.',
    'Business Development',
    'Internship',
    'Lagos',
    '$500/mo',
    '3 months',
    '2026-07-31',
    'active',
    array['BD','Sales','Healthcare','Internship']
  ),
  (
    'aaaa0006-3333-3333-3333-333333333333'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    'Clinical Pharmacist',
    'Provide clinical pharmacy services to patients across our network. Dispense, counsel, and partner with prescribers on medication therapy management.',
    'Clinical',
    'Full-time',
    'Accra',
    'Competitive',
    'Permanent',
    '2026-08-15',
    'active',
    array['Pharmacy','Clinical','Licensed']
  ),
  (
    'aaaa0007-3333-3333-3333-333333333333'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    'Marketing Intern',
    'Own social media and content for mPharma''s consumer brand. Write copy, design simple creatives, and run small campaigns that move the needle.',
    'Marketing',
    'Internship',
    'Remote',
    '$400/mo',
    '4 months',
    '2026-07-15',
    'active',
    array['Content','Social Media','Internship']
  ),
  (
    'aaaa0008-3333-3333-3333-333333333333'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    'HR Generalist',
    'Support the full employee lifecycle for our Accra team: recruiting, onboarding, people ops, and culture. Partner with managers on team health.',
    'People & Talent',
    'Full-time',
    'Accra',
    'Competitive',
    'Permanent',
    '2026-09-15',
    'active',
    array['Recruiting','People Ops','HR']
  ),

-- ╔════════════════════════════════════════════════════════════════╗
-- ║  ONE ACRE FUND — NGO / Agriculture                             ║
-- ╚════════════════════════════════════════════════════════════════╝

  (
    'aaaa0001-4444-4444-4444-444444444444'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'Field Operations Intern',
    'Work directly with smallholder farmers in Rwanda or Kenya. Conduct farmer surveys, analyse operational data, and support program coordinators in the field.',
    'Operations',
    'Internship',
    'Kigali · Nairobi',
    'Stipend provided',
    '3 months',
    '2026-07-01',
    'active',
    array['Agriculture','Field Work','Internship']
  ),
  (
    'aaaa0002-4444-4444-4444-444444444444'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'Monitoring & Evaluation Officer',
    'Measure the impact of our farmer programs across 9 countries. Design surveys, run analyses, and turn evidence into program improvements.',
    'Impact & Analytics',
    'Full-time',
    'Kigali',
    'Competitive',
    'Permanent',
    '2026-09-30',
    'active',
    array['M&E','Impact','Stata','R']
  ),
  (
    'aaaa0003-4444-4444-4444-444444444444'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'Agricultural Research Associate',
    'Run on-farm trials of new crop varieties and inputs. Partner with agronomists to make data-driven recommendations for 1M+ smallholder farmers.',
    'Research',
    'Full-time',
    'Bungoma, Kenya',
    'Competitive',
    'Permanent',
    '2026-08-31',
    'active',
    array['Agronomy','Field Trials','Research']
  ),
  (
    'aaaa0004-4444-4444-4444-444444444444'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'Finance Analyst',
    'Own forecasting and budgeting for one of our country programs. Build financial models, support board reporting, and partner with country leads on planning.',
    'Finance',
    'Full-time',
    'Nairobi',
    '$35,000–$55,000/yr',
    'Permanent',
    '2026-09-15',
    'active',
    array['Excel','Financial Modeling','NGO']
  ),
  (
    'aaaa0005-4444-4444-4444-444444444444'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'Field Coordinator Intern',
    'Spend 6 months embedded with a country program. Coordinate field activities, support trainings, and learn how rural development actually works.',
    'Operations',
    'Internship',
    'Rural Kenya',
    'Stipend + housing',
    '6 months',
    '2026-08-15',
    'active',
    array['Field Work','Rural','Agriculture','Internship']
  ),
  (
    'aaaa0006-4444-4444-4444-444444444444'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'Communications Lead',
    'Tell the story of 1M+ farmers we serve. Manage press, write thought leadership, and craft narratives that move funders and policy makers.',
    'Communications',
    'Full-time',
    'Kigali · Nairobi',
    'Competitive',
    'Permanent',
    '2026-10-01',
    'active',
    array['Storytelling','Press','Comms','Impact']
  ),
  (
    'aaaa0007-4444-4444-4444-444444444444'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'Software Engineer (Mobile)',
    'Build the mobile tools used by our field officers across 9 countries. Offline-first apps, low-bandwidth design, and tooling that scales rural ops.',
    'Software Engineering',
    'Full-time',
    'Nairobi · Remote',
    '$40,000–$60,000/yr',
    'Permanent',
    '2026-10-31',
    'active',
    array['Flutter','Offline-first','Mobile','Impact']
  ),
  (
    'aaaa0008-4444-4444-4444-444444444444'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'People & Culture Intern',
    'Support hiring, onboarding, and culture initiatives across our regional teams. Great window into how high-impact organizations build their teams.',
    'People & Talent',
    'Internship',
    'Kigali',
    'Stipend provided',
    '4 months',
    '2026-07-31',
    'active',
    array['HR','People','Internship']
  ),

-- ╔════════════════════════════════════════════════════════════════╗
-- ║  EQUITY BANK — Banking & Finance                               ║
-- ╚════════════════════════════════════════════════════════════════╝

  (
    'aaaa0001-5555-5555-5555-555555555555'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    'Digital Product Manager',
    'Own the roadmap for mobile banking features serving 10M+ customers. Work with UX, engineering, and compliance to launch impactful products.',
    'Product',
    'Full-time',
    'Nairobi · Kampala',
    'KES 120,000–160,000/mo',
    'Permanent',
    '2026-09-30',
    'active',
    array['Product','Banking','Mobile','Senior']
  ),
  (
    'aaaa0002-5555-5555-5555-555555555555'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    'Banking Operations Intern',
    'Learn retail banking operations from the inside. Rotate through branches, support transaction reconciliation, and shadow senior ops leads.',
    'Operations',
    'Internship',
    'Nairobi',
    'KES 30,000/mo',
    '6 months',
    '2026-07-15',
    'active',
    array['Banking','Operations','Internship']
  ),
  (
    'aaaa0003-5555-5555-5555-555555555555'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    'Credit Risk Analyst',
    'Build and maintain credit scoring models for SME and consumer lending. Partner with data and product on automated underwriting.',
    'Risk & Compliance',
    'Full-time',
    'Nairobi',
    'KES 100,000–140,000/mo',
    'Permanent',
    '2026-09-15',
    'active',
    array['Risk','Credit','SQL','Modeling']
  ),
  (
    'aaaa0004-5555-5555-5555-555555555555'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    'Branch Customer Officer',
    'Be the face of Equity for our customers. Open accounts, advise on products, resolve complaints, and hit branch growth targets.',
    'Retail Banking',
    'Full-time',
    'Multiple branches — Kenya',
    'KES 60,000–80,000/mo',
    'Permanent',
    '2026-08-31',
    'active',
    array['Retail','Customer Service','Sales']
  ),
  (
    'aaaa0005-5555-5555-5555-555555555555'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    'IT Security Analyst',
    'Protect customer data and bank infrastructure. Run pen-tests, respond to incidents, harden systems, and stay ahead of evolving threats.',
    'Security',
    'Full-time',
    'Nairobi',
    'KES 130,000–180,000/mo',
    'Permanent',
    '2026-10-15',
    'active',
    array['Cybersecurity','SIEM','Incident Response']
  ),
  (
    'aaaa0006-5555-5555-5555-555555555555'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    'Marketing Intern',
    'Support brand campaigns and digital marketing for our consumer banking products. Write copy, brief agencies, and track campaign performance.',
    'Marketing',
    'Internship',
    'Nairobi',
    'KES 25,000/mo',
    '3 months',
    '2026-07-31',
    'active',
    array['Marketing','Content','Brand','Internship']
  ),
  (
    'aaaa0007-5555-5555-5555-555555555555'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    'Senior Software Engineer',
    'Build core banking and digital channels infrastructure. Java + Spring backend, partner with mobile and web teams, mentor junior engineers.',
    'Software Engineering',
    'Full-time',
    'Nairobi · Remote',
    'KES 200,000–280,000/mo',
    'Permanent',
    '2026-10-31',
    'active',
    array['Java','Spring','Microservices','Senior']
  ),
  (
    'aaaa0008-5555-5555-5555-555555555555'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    'Compliance Officer',
    'Own AML, KYC, and regulatory compliance for our Uganda operations. Liaise with the central bank and audit internal controls.',
    'Risk & Compliance',
    'Full-time',
    'Kampala',
    'KES 110,000–150,000/mo',
    'Permanent',
    '2026-09-15',
    'active',
    array['AML','KYC','Banking','Compliance']
  )

on conflict (id) do nothing;


-- ── 4. Report results ───────────────────────────────────────────────
select
  (select count(*) from public.app_users
     where email in (
       'andela@aluhub.com',
       'flutterwave@aluhub.com',
       'mpharma@aluhub.com',
       'oneacrefund@aluhub.com',
       'equitybank@aluhub.com'
     )
  ) as seed_logins_present,
  (select count(*) from public.profiles
     where user_type = 'company'
       and id in (
         '11111111-1111-1111-1111-111111111111'::uuid,
         '22222222-2222-2222-2222-222222222222'::uuid,
         '33333333-3333-3333-3333-333333333333'::uuid,
         '44444444-4444-4444-4444-444444444444'::uuid,
         '55555555-5555-5555-5555-555555555555'::uuid
       )
  ) as seed_companies_present,
  (select count(*) from public.job_listings
     where company_id in (
       '11111111-1111-1111-1111-111111111111'::uuid,
       '22222222-2222-2222-2222-222222222222'::uuid,
       '33333333-3333-3333-3333-333333333333'::uuid,
       '44444444-4444-4444-4444-444444444444'::uuid,
       '55555555-5555-5555-5555-555555555555'::uuid
     )
  ) as seed_jobs_present;

commit;
