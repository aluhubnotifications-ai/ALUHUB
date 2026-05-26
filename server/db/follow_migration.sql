-- ══════════════════════════════════════════════════════════════════
-- ALUHub Follow, Ratings & Notification Migration v3
-- Run in Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- ── 1. COMPANY FOLLOWS ────────────────────────────────────────────
create table if not exists company_follows (
  id                   uuid primary key default gen_random_uuid(),
  student_id           uuid not null references profiles(id) on delete cascade,
  company_id           uuid not null references profiles(id) on delete cascade,
  email_notifications  boolean default true,
  created_at           timestamptz default now(),
  unique(student_id, company_id)
);

alter table company_follows enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='company_follows' and policyname='Students can follow') then
    create policy "Students can follow" on company_follows for insert with check (auth.uid() = student_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='company_follows' and policyname='Students update prefs') then
    create policy "Students update prefs" on company_follows for update using (auth.uid() = student_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='company_follows' and policyname='Students can unfollow') then
    create policy "Students can unfollow" on company_follows for delete using (auth.uid() = student_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='company_follows' and policyname='Anyone reads follows') then
    create policy "Anyone reads follows" on company_follows for select using (true);
  end if;
end $$;

create index if not exists idx_company_follows_company on company_follows(company_id);
create index if not exists idx_company_follows_student on company_follows(student_id);

-- ── 2. COMPANY RATINGS ────────────────────────────────────────────
create table if not exists company_ratings (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references profiles(id) on delete cascade,
  company_id  uuid not null references profiles(id) on delete cascade,
  score       smallint not null check (score between 1 and 5),
  comment     text,
  updated_at  timestamptz default now(),
  unique(student_id, company_id)
);

alter table company_ratings enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='company_ratings' and policyname='Students submit ratings') then
    create policy "Students submit ratings" on company_ratings for insert with check (auth.uid() = student_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='company_ratings' and policyname='Students update ratings') then
    create policy "Students update ratings" on company_ratings for update using (auth.uid() = student_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='company_ratings' and policyname='Anyone reads ratings') then
    create policy "Anyone reads ratings" on company_ratings for select using (true);
  end if;
end $$;

create index if not exists idx_company_ratings_company on company_ratings(company_id);
create index if not exists idx_company_ratings_student on company_ratings(student_id);

-- ── 3. ADD email_notifications column if already ran earlier migration ──
alter table company_follows add column if not exists email_notifications boolean default true;

-- ── 4. SETUP NOTES ───────────────────────────────────────────────
-- After running this SQL, do the following:

-- A) Deploy Edge Functions:
--    supabase functions deploy send-follow-notification
--    supabase functions deploy send-company-notification

-- B) Set secrets:
--    supabase secrets set RESEND_API_KEY=re_xxxxx
--    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
--    supabase secrets set SUPABASE_URL=https://your-project.supabase.co
--    supabase secrets set ALU_HUB_URL=https://your-domain.com

-- C) Create Database Webhooks (Dashboard → Database → Webhooks):
--    1. job_listings INSERT  → send-follow-notification  (emails followers)
--    2. applications INSERT  → send-company-notification (emails company)
--    3. company_ratings INSERT → send-company-notification (emails company)
