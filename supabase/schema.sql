-- SOCHUNT tables for an existing Supabase project.
-- These names are intentionally prefixed and do not touch food_logs, activity_logs,
-- workouts, wellness_logs, or user_goals from your health tracker.
-- Run in Supabase Dashboard > SQL Editor.
create table if not exists public.soc_hunt_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  location text not null default 'Dubai, UAE',
  source text not null default 'LinkedIn',
  url text not null default '',
  status text not null default 'Saved',
  application_date date not null default current_date,
  salary text not null default '',
  contact text not null default '',
  notes text not null default '',
  next_action text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint soc_hunt_jobs_status_check check (status in ('Saved','Applied','Recruiter Screen','Technical Round','Final Round','Offer','Rejected','No Response'))
);
create index if not exists soc_hunt_jobs_user_date_idx on public.soc_hunt_jobs(user_id, application_date desc);

create table if not exists public.soc_hunt_interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  interview_date date,
  stage text not null default 'Technical Round',
  format text not null default 'Online',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists soc_hunt_interviews_user_date_idx on public.soc_hunt_interviews(user_id, interview_date);

alter table public.soc_hunt_jobs enable row level security;
alter table public.soc_hunt_interviews enable row level security;
drop policy if exists "Users manage their own SOCHUNT jobs" on public.soc_hunt_jobs;
create policy "Users manage their own SOCHUNT jobs" on public.soc_hunt_jobs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage their own SOCHUNT interviews" on public.soc_hunt_interviews;
create policy "Users manage their own SOCHUNT interviews" on public.soc_hunt_interviews for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Supabase's default grants normally expose public tables to authenticated users.
-- If your project has customized grants, enable these explicitly:
grant select, insert, update, delete on public.soc_hunt_jobs to authenticated;
grant select, insert, update, delete on public.soc_hunt_interviews to authenticated;
