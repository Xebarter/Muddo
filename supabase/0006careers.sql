-- 0006 — Careers jobs and applications
-- Run after 0005company-email.sql. Safe to run again.

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  division text not null,
  location text not null default 'Kampala, Uganda',
  employment_type text not null default 'Full-time' check (employment_type in ('Full-time', 'Part-time', 'Contract', 'Internship')),
  summary text not null default '',
  description text not null default '',
  closing_on date,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null default '',
  cover_letter text not null default '',
  cv_path text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'shortlisted', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists job_applications_job_id_idx on public.job_applications (job_id);

alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;

drop policy if exists "public jobs" on public.jobs;
create policy "public jobs" on public.jobs
for select to anon, authenticated
using (status in ('published', 'closed') or public.is_admin());

drop policy if exists "admin jobs" on public.jobs;
create policy "admin jobs" on public.jobs
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin applications" on public.job_applications;
create policy "admin applications" on public.job_applications
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.jobs to anon;
grant select, insert, update, delete on public.jobs to authenticated;
grant select, update, delete on public.job_applications to authenticated;

insert into storage.buckets (id, name, public)
values ('applications', 'applications', false)
on conflict (id) do nothing;

drop policy if exists "admin application files" on storage.objects;
create policy "admin application files" on storage.objects
for all to authenticated
using (bucket_id = 'applications' and public.is_admin())
with check (bucket_id = 'applications' and public.is_admin());
