-- ============================================================
--  ALU HUB - SUPABASE SCHEMA
--  Safe to run repeatedly: every statement is idempotent.
--  Includes the auth_refresh_tokens table the backend needs.
-- ============================================================

-- 1. Profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamptz default now(),
  full_name text,
  user_type text check (user_type in ('student', 'company')),
  school text,                    -- ALU or CMU-Africa
  major text,
  year text,
  company_name text,
  industry text,
  company_size text,
  plan text default 'free',       -- free | pro | basic | standard | premium | pending_payment
  plan_activated_at timestamptz,
  flw_tx_ref text,                -- Flutterwave transaction ref
  avatar_url text,                -- Supabase Storage public URL (WebP, compressed)
  bio text,
  linkedin text,
  github text,
  twitter text,
  website text,
  cv_filename text,
  cv_uploaded_at timestamptz,
  cv_last_matched_at timestamptz,
  -- Career preference fields (used by AI matching)
  desired_roles     text[]  default '{}',         -- e.g. ["Software Engineer","Product Manager"]
  preferred_industries text[] default '{}',        -- e.g. ["Tech","Finance"]
  work_type         text    default 'any' check (work_type in ('remote','onsite','hybrid','any')),
  location_pref     text,                          -- e.g. "Kigali" or "Open to relocation"
  open_to_internship boolean default true,
  open_to_fulltime  boolean default false
);

-- ▼ If the table already existed, ensure the newer columns are present
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists linkedin text;
alter table public.profiles add column if not exists github text;
alter table public.profiles add column if not exists twitter text;
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists cv_filename text;
alter table public.profiles add column if not exists cv_uploaded_at timestamptz;
alter table public.profiles add column if not exists cv_last_matched_at timestamptz;
alter table public.profiles add column if not exists desired_roles text[] default '{}';
alter table public.profiles add column if not exists preferred_industries text[] default '{}';
alter table public.profiles add column if not exists work_type text default 'any';
alter table public.profiles add column if not exists location_pref text;
alter table public.profiles add column if not exists open_to_internship boolean default true;
alter table public.profiles add column if not exists open_to_fulltime boolean default false;

-- 2. Row-level security
alter table public.profiles enable row level security;
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "Public can discover student profiles" on public.profiles;
create policy "Public can discover student profiles" on public.profiles
  for select using (user_type = 'student');

-- 3. Student skills database
create table if not exists public.student_skills (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  skill_name text not null,
  level text default 'beginner' check (level in ('beginner','intermediate','advanced','expert')),
  years_experience numeric default 0,
  portfolio_url text,
  verified boolean default false,
  unique(student_id, skill_name)
);
create index if not exists student_skills_student_idx on public.student_skills(student_id);
create index if not exists student_skills_skill_idx on public.student_skills(skill_name);
alter table public.student_skills enable row level security;
drop policy if exists "Anyone can view student skills" on public.student_skills;
create policy "Anyone can view student skills" on public.student_skills
  for select using (true);
drop policy if exists "Students can manage own skills" on public.student_skills;
create policy "Students can manage own skills" on public.student_skills
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

-- 3b. Skill session bookings — separate table so any signed-in student
-- can record a booking (the RLS on student_skills only lets the owner
-- update, so we can't reliably bump a sessions counter there). Sessions
-- count is computed as count(*) of bookings.
create table if not exists public.skill_bookings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  skill_id uuid references public.student_skills(id) on delete cascade not null,
  booker_id uuid references public.profiles(id) on delete cascade not null,
  tutor_id uuid references public.profiles(id) on delete cascade not null,
  preferred_at timestamptz,
  message text,
  status text default 'pending' check (status in ('pending','confirmed','completed','cancelled'))
);
create index if not exists skill_bookings_skill_idx on public.skill_bookings(skill_id);
create index if not exists skill_bookings_booker_idx on public.skill_bookings(booker_id);
create index if not exists skill_bookings_tutor_idx on public.skill_bookings(tutor_id);
alter table public.skill_bookings enable row level security;
drop policy if exists "Anyone authenticated can book" on public.skill_bookings;
create policy "Anyone authenticated can book" on public.skill_bookings
  for insert with check (auth.uid() = booker_id);
drop policy if exists "Booker and tutor can view own bookings" on public.skill_bookings;
create policy "Booker and tutor can view own bookings" on public.skill_bookings
  for select using (auth.uid() in (booker_id, tutor_id));
drop policy if exists "Booker or tutor can update status" on public.skill_bookings;
create policy "Booker or tutor can update status" on public.skill_bookings
  for update using (auth.uid() in (booker_id, tutor_id));

-- 4. Resource library
create table if not exists public.resources (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  author text,
  type text default 'Notes',
  price numeric default 0,
  sales integer default 0,
  emoji text default '📄',
  file_url text,
  file_name text,
  file_type text,
  file_size bigint
);
alter table public.resources enable row level security;
drop policy if exists "Anyone can read resources" on public.resources;
create policy "Anyone can read resources" on public.resources
  for select using (true);
drop policy if exists "Authenticated can publish resources" on public.resources;
create policy "Authenticated can publish resources" on public.resources
  for insert with check (auth.uid() = author_id);

-- 5. Survival guide content
create table if not exists public.survival_guide (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  icon text default '🗺',
  title text not null,
  items jsonb not null default '[]'::jsonb
);
alter table public.survival_guide enable row level security;
drop policy if exists "Anyone can read guide" on public.survival_guide;
create policy "Anyone can read guide" on public.survival_guide
  for select using (true);
drop policy if exists "Authenticated can manage guide" on public.survival_guide;
create policy "Authenticated can manage guide" on public.survival_guide
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 6. Job listings (companies)
create table if not exists public.job_listings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  company_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  type text,
  location text,
  pay text,
  duration text,
  deadline date,
  status text default 'active' check (status in ('active', 'closed', 'draft')),
  tags text[]
);
alter table public.job_listings enable row level security;
drop policy if exists "Anyone can view active listings" on public.job_listings;
create policy "Anyone can view active listings" on public.job_listings
  for select using (status = 'active');
drop policy if exists "Companies can manage their listings" on public.job_listings;
create policy "Companies can manage their listings" on public.job_listings
  for all using (auth.uid() = company_id);

-- 7. Applications (students apply to jobs)
create table if not exists public.applications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  student_id uuid references public.profiles(id) on delete cascade,
  job_id uuid references public.job_listings(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'reviewed', 'shortlisted', 'hired', 'rejected')),
  cv_url text,
  cover_note text,
  unique(student_id, job_id)
);
alter table public.applications enable row level security;
drop policy if exists "Students see their own applications" on public.applications;
create policy "Students see their own applications" on public.applications
  for select using (auth.uid() = student_id);
drop policy if exists "Students can apply" on public.applications;
create policy "Students can apply" on public.applications
  for insert with check (auth.uid() = student_id);
drop policy if exists "Companies see applications to their listings" on public.applications;
create policy "Companies see applications to their listings" on public.applications
  for select using (
    auth.uid() in (
      select company_id from public.job_listings where id = job_id
    )
  );
drop policy if exists "Companies can update application status" on public.applications;
create policy "Companies can update application status" on public.applications
  for update using (
    auth.uid() in (
      select company_id from public.job_listings where id = job_id
    )
  );

-- 8. Payments log
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references public.profiles(id) on delete cascade,
  amount numeric,
  currency text,
  method text,                    -- mtn | airtel | card
  flw_tx_ref text,
  plan text,
  status text default 'success'
);
alter table public.payments enable row level security;
drop policy if exists "Users see their own payments" on public.payments;
create policy "Users see their own payments" on public.payments
  for select using (auth.uid() = user_id);

-- 9. Messages table (per-application threads)
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  application_id uuid references public.applications(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  text text,
  message_kind text default 'text' check (message_kind in ('text','image','file')),
  attachment_url text,
  attachment_name text,
  attachment_type text,
  attachment_size bigint
);
alter table public.messages enable row level security;
drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages" on public.messages
  for select using (
    auth.uid() = sender_id or
    auth.uid() in (
      select student_id from public.applications where id = application_id
      union
      select company_id from public.job_listings jl
      join public.applications a on a.job_id = jl.id where a.id = application_id
    )
  );
drop policy if exists "Authenticated can send messages" on public.messages;
create policy "Authenticated can send messages" on public.messages
  for insert with check (auth.uid() = sender_id);

-- 10. Notifications table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text, -- new_job | status_change | message
  title text,
  body text,
  read boolean default false
);
alter table public.notifications enable row level security;
drop policy if exists "Users see own notifications" on public.notifications;
create policy "Users see own notifications" on public.notifications
  for select using (auth.uid() = user_id);
drop policy if exists "System can insert notifications" on public.notifications;
create policy "System can insert notifications" on public.notifications
  for insert with check (true);
drop policy if exists "Users can mark own read" on public.notifications;
create policy "Users can mark own read" on public.notifications
  for update using (auth.uid() = user_id);

-- 11. Housing requests table
create table if not exists public.housing_requests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  area text,
  dates text,
  people integer default 1,
  urgent boolean default false,
  status text default 'active' check (status in ('active','filled','deleted')),
  posted_by text
);
alter table public.housing_requests enable row level security;
drop policy if exists "Anyone can view active housing requests" on public.housing_requests;
create policy "Anyone can view active housing requests" on public.housing_requests
  for select using (status = 'active');
drop policy if exists "Auth users can post housing requests" on public.housing_requests;
create policy "Auth users can post housing requests" on public.housing_requests
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own housing requests" on public.housing_requests;
create policy "Users can update own housing requests" on public.housing_requests
  for update using (auth.uid() = user_id);

-- 12. Direct messages (student-to-student)
create table if not exists public.direct_messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  thread_id text not null,           -- sorted(user_a__user_b) deterministic key
  sender_id uuid references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  text text,
  message_kind text default 'text' check (message_kind in ('text','image','file')),
  attachment_url text,
  attachment_name text,
  attachment_type text,
  attachment_size bigint,
  read boolean default false
);
create index if not exists direct_messages_thread_idx on public.direct_messages(thread_id);
create index if not exists direct_messages_recipient_read_idx on public.direct_messages(recipient_id, read);
alter table public.direct_messages enable row level security;
drop policy if exists "Participants can read DMs" on public.direct_messages;
create policy "Participants can read DMs" on public.direct_messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
drop policy if exists "Auth users can send DMs" on public.direct_messages;
create policy "Auth users can send DMs" on public.direct_messages
  for insert with check (auth.uid() = sender_id);
drop policy if exists "Recipients can mark DMs read" on public.direct_messages;
create policy "Recipients can mark DMs read" on public.direct_messages
  for update using (auth.uid() = recipient_id);

-- 13. Refresh-token store (required by the backend's token rotation)
create table if not exists public.auth_refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists auth_refresh_tokens_user_idx on public.auth_refresh_tokens(user_id);
create index if not exists auth_refresh_tokens_hash_idx on public.auth_refresh_tokens(token_hash);
alter table public.auth_refresh_tokens enable row level security;

-- 14. AI match cache — stores scored job matches per student
--     Populated by a background job / edge function when new jobs are posted.
--     Students see these on the AI Insights → Job Matches tab.
create table if not exists public.ai_match_cache (
  id             uuid default gen_random_uuid() primary key,
  student_id     uuid references public.profiles(id) on delete cascade not null,
  job_id         uuid references public.job_listings(id) on delete cascade not null,
  score          integer not null check (score between 0 and 100),
  match_reasons  jsonb   default '[]'::jsonb,  -- [{label, detail}]
  matched_skills text[]  default '{}',
  matched_at     timestamptz default now(),
  stale          boolean default false,         -- set true when job or profile changes
  unique(student_id, job_id)
);
create index if not exists ai_match_cache_student_idx on public.ai_match_cache(student_id);
create index if not exists ai_match_cache_job_idx     on public.ai_match_cache(job_id);
create index if not exists ai_match_cache_score_idx   on public.ai_match_cache(student_id, score desc);
alter table public.ai_match_cache enable row level security;
drop policy if exists "Students can read own matches" on public.ai_match_cache;
create policy "Students can read own matches" on public.ai_match_cache
  for select using (auth.uid() = student_id);
drop policy if exists "Service role can write matches" on public.ai_match_cache;
create policy "Service role can write matches" on public.ai_match_cache
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Mark cached matches stale when a student's profile preferences change
create or replace function public.mark_matches_stale_on_profile_change()
returns trigger language plpgsql as $$
begin
  if (
    new.desired_roles       is distinct from old.desired_roles or
    new.preferred_industries is distinct from old.preferred_industries or
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
drop trigger if exists trg_profile_match_stale on public.profiles;
create trigger trg_profile_match_stale
  after update on public.profiles
  for each row execute procedure public.mark_matches_stale_on_profile_change();

-- Mark cached matches stale when a job listing changes
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

-- 15. Enable realtime on key tables (skips tables already published)
do $$
declare
  t text;
begin
  foreach t in array array[
    'applications','messages','notifications',
    'direct_messages','housing_requests','student_skills'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then
      null; -- already part of the publication
    end;
  end loop;
end $$;
