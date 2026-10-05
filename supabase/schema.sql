-- Mudogwaluyiira Group — Supabase setup
-- Run this entire script in the Supabase SQL editor.
-- It is safe to run again: existing rows are left in place.
-- Re-run it after updates so new tables, including mobile payments, exist.
--
-- Demo sign-in after the script finishes (change these passwords in production):
--   Customer  john.doe@example.com       / MuddoDemo2026!
--   Admin     admin@mudogwaluyiira.ug     / MuddoDemo2026!
-- Anyone who signs up with sebenock027@gmail.com is granted the admin role.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.admin_allowlist (
  email text primary key
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null unique,
  phone text not null default '',
  location text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  full_name text not null,
  email text not null unique,
  phone text not null default '',
  location text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  full_name text not null,
  phone text not null default '',
  email text not null,
  service text not null,
  location text not null default '',
  description text not null default '',
  status text not null default 'new' check (status in ('new', 'reviewing', 'contacted', 'converted', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid not null references public.customers (id) on delete cascade,
  title text not null,
  division text not null,
  location text not null default '',
  progress integer not null default 0 check (progress between 0 and 100),
  stage text not null default '',
  expected_completion date,
  status text not null default 'in_progress' check (status in ('planned', 'in_progress', 'completed', 'on_hold')),
  contract_value bigint not null default 0,
  updated_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.service_milestones (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  label text not null,
  occurred_on date,
  state text not null check (state in ('complete', 'current', 'upcoming')),
  sort_order integer not null default 0
);

create table if not exists public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  title text not null,
  body text not null default '',
  progress integer not null default 0 check (progress between 0 and 100),
  published_on date not null default current_date
);

create table if not exists public.installments (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  name text not null,
  amount bigint not null check (amount >= 0),
  due_on date not null,
  paid_on date,
  method text,
  status text not null check (status in ('paid', 'due', 'due_soon', 'pending', 'failed')),
  reference text not null unique,
  sort_order integer not null default 0
);

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  installment_id uuid not null references public.installments (id) on delete cascade,
  method text not null,
  phone text not null default '',
  note text not null default '',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed')),
  provider_id text,
  provider_status text not null default '',
  created_at timestamptz not null default now()
);

alter table public.payment_attempts add column if not exists provider_id text;
alter table public.payment_attempts add column if not exists provider_status text not null default '';
create unique index if not exists payment_attempts_provider_id_key on public.payment_attempts (provider_id) where provider_id is not null;

create table if not exists public.mobile_payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  email text not null,
  phone text not null,
  amount bigint not null check (amount > 0),
  method text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  reference text not null unique,
  provider_id text,
  created_at timestamptz not null default now()
);

create index if not exists mobile_payments_email_idx on public.mobile_payments (email);
create unique index if not exists mobile_payments_provider_id_key on public.mobile_payments (provider_id) where provider_id is not null;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete cascade,
  name text not null,
  doc_type text not null,
  status text not null default 'available' check (status in ('draft', 'awaiting_review', 'signed', 'published', 'available')),
  detail text not null default '',
  file_path text,
  filed_on date not null default current_date
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  title text not null,
  body text not null default '',
  href text not null default '/account',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.homepage_activities (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  category text not null,
  title text not null,
  body text not null,
  image_path text not null default '/mudogwaluyiira-hero.png',
  sort_order integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published'))
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  image_path text not null default '/mudogwaluyiira-hero.png',
  sort_order integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published'))
);

create table if not exists public.workspace_settings (
  id integer primary key default 1 check (id = 1),
  workspace_name text not null,
  contact_name text not null,
  role_label text not null,
  notification_email text not null,
  updated_at timestamptz not null default now()
);

create sequence if not exists public.request_number_seq start 8;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.owns_customer(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.customers
    where id = target and profile_id = auth.uid()
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role = old.role;
  end if;
  if new.role is distinct from old.role then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role)
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
for each row execute function public.protect_profile_role();

create or replace function public.assign_signup_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role text;
begin
  select case
    when exists (select 1 from public.admin_allowlist where lower(email) = lower(new.email)) then 'admin'
    else 'customer'
  end into next_role;

  new.raw_app_meta_data = coalesce(new.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', next_role);
  return new;
end;
$$;

drop trigger if exists on_auth_user_role on auth.users;
create trigger on_auth_user_role
before insert on auth.users
for each row execute function public.assign_signup_role();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role text := coalesce(new.raw_app_meta_data->>'role', 'customer');
begin
  insert into public.profiles (id, full_name, email, phone, location, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'location', ''),
    next_role
  )
  on conflict (id) do nothing;

  update public.customers
  set profile_id = new.id
  where lower(email) = lower(new.email) and profile_id is null;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.submit_service_request(
  p_full_name text,
  p_phone text,
  p_email text,
  p_service text,
  p_location text,
  p_description text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_reference text;
begin
  if length(trim(p_full_name)) < 2 then
    raise exception 'Enter a full name';
  end if;
  if position('@' in p_email) = 0 then
    raise exception 'Enter a valid email';
  end if;
  if length(trim(p_service)) < 2 then
    raise exception 'Choose a service';
  end if;

  next_reference := 'MG-REQ-' || lpad(nextval('public.request_number_seq')::text, 4, '0');

  insert into public.service_requests (reference, full_name, phone, email, service, location, description)
  values (
    next_reference,
    trim(p_full_name),
    coalesce(trim(p_phone), ''),
    lower(trim(p_email)),
    trim(p_service),
    coalesce(trim(p_location), ''),
    coalesce(trim(p_description), '')
  );

  return next_reference;
end;
$$;

revoke all on function public.submit_service_request(text, text, text, text, text, text) from public;
grant execute on function public.submit_service_request(text, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.admin_allowlist enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.service_requests enable row level security;
alter table public.services enable row level security;
alter table public.service_milestones enable row level security;
alter table public.progress_updates enable row level security;
alter table public.installments enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.mobile_payments enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.homepage_activities enable row level security;
alter table public.gallery_items enable row level security;
alter table public.workspace_settings enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "admin customers" on public.customers;
create policy "admin customers" on public.customers
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "read own customer" on public.customers;
create policy "read own customer" on public.customers
for select to authenticated
using (profile_id = auth.uid());

drop policy if exists "update own customer" on public.customers;
create policy "update own customer" on public.customers
for update to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "admin requests" on public.service_requests;
create policy "admin requests" on public.service_requests
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin services" on public.services;
create policy "admin services" on public.services
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "read own services" on public.services;
create policy "read own services" on public.services
for select to authenticated
using (public.owns_customer(customer_id));

drop policy if exists "admin milestones" on public.service_milestones;
create policy "admin milestones" on public.service_milestones
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "read own milestones" on public.service_milestones;
create policy "read own milestones" on public.service_milestones
for select to authenticated
using (exists (
  select 1 from public.services s
  where s.id = service_id and public.owns_customer(s.customer_id)
));

drop policy if exists "admin progress" on public.progress_updates;
create policy "admin progress" on public.progress_updates
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "read own progress" on public.progress_updates;
create policy "read own progress" on public.progress_updates
for select to authenticated
using (exists (
  select 1 from public.services s
  where s.id = service_id and public.owns_customer(s.customer_id)
));

drop policy if exists "admin installments" on public.installments;
create policy "admin installments" on public.installments
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "read own installments" on public.installments;
create policy "read own installments" on public.installments
for select to authenticated
using (exists (
  select 1 from public.services s
  where s.id = service_id and public.owns_customer(s.customer_id)
));

drop policy if exists "admin payment attempts" on public.payment_attempts;
create policy "admin payment attempts" on public.payment_attempts
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "customer payment attempts" on public.payment_attempts;
create policy "customer payment attempts" on public.payment_attempts
for select to authenticated
using (exists (
  select 1
  from public.installments i
  join public.services s on s.id = i.service_id
  where i.id = installment_id and public.owns_customer(s.customer_id)
));

drop policy if exists "admin mobile payments" on public.mobile_payments;
create policy "admin mobile payments" on public.mobile_payments
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "read own mobile payments" on public.mobile_payments;
create policy "read own mobile payments" on public.mobile_payments
for select to authenticated
using (
  lower(email) = lower(coalesce((select p.email from public.profiles p where p.id = auth.uid()), ''))
  or public.owns_customer(customer_id)
);

drop policy if exists "insert own payment attempts" on public.payment_attempts;
create policy "insert own payment attempts" on public.payment_attempts
for insert to authenticated
with check (exists (
  select 1
  from public.installments i
  join public.services s on s.id = i.service_id
  where i.id = installment_id and public.owns_customer(s.customer_id)
));

drop policy if exists "admin documents" on public.documents;
create policy "admin documents" on public.documents
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "read own documents" on public.documents;
create policy "read own documents" on public.documents
for select to authenticated
using (public.owns_customer(customer_id));

drop policy if exists "admin notifications" on public.notifications;
create policy "admin notifications" on public.notifications
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications
for select to authenticated
using (public.owns_customer(customer_id));

drop policy if exists "mark own notifications" on public.notifications;
create policy "mark own notifications" on public.notifications
for update to authenticated
using (public.owns_customer(customer_id))
with check (public.owns_customer(customer_id));

drop policy if exists "public activities" on public.homepage_activities;
create policy "public activities" on public.homepage_activities
for select to anon, authenticated
using (status = 'published' or public.is_admin());

drop policy if exists "admin activities" on public.homepage_activities;
create policy "admin activities" on public.homepage_activities
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public gallery" on public.gallery_items;
create policy "public gallery" on public.gallery_items
for select to anon, authenticated
using (status = 'published' or public.is_admin());

drop policy if exists "admin gallery" on public.gallery_items;
create policy "admin gallery" on public.gallery_items
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin settings" on public.workspace_settings;
create policy "admin settings" on public.workspace_settings
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.homepage_activities, public.gallery_items to anon;
grant usage, select on sequence public.request_number_seq to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Demo accounts
-- ---------------------------------------------------------------------------

insert into public.admin_allowlist (email)
values ('sebenock027@gmail.com'), ('admin@mudogwaluyiira.ug')
on conflict (email) do nothing;

create or replace function public.seed_auth_user(
  p_email text,
  p_password text,
  p_name text,
  p_phone text,
  p_location text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  user_id uuid;
begin
  select id into user_id from auth.users where lower(email) = lower(p_email);
  if user_id is not null then
    return user_id;
  end if;

  user_id := gen_random_uuid();

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    user_id,
    'authenticated',
    'authenticated',
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{}'::jsonb,
    jsonb_build_object('full_name', p_name, 'phone', p_phone, 'location', p_location),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    user_id,
    jsonb_build_object('sub', user_id::text, 'email', p_email),
    'email',
    user_id::text,
    now(),
    now(),
    now()
  );

  update public.profiles
  set phone = p_phone, location = p_location, full_name = p_name
  where id = user_id;

  return user_id;
end;
$$;

select public.seed_auth_user('john.doe@example.com', 'MuddoDemo2026!', 'John Doe', '+256 772 100 200', 'Kampala, Uganda');
select public.seed_auth_user('admin@mudogwaluyiira.ug', 'MuddoDemo2026!', 'Admin Manager', '+256 787 703 725', 'Kampala, Uganda');

revoke all on function public.seed_auth_user(text, text, text, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Operating data
-- ---------------------------------------------------------------------------

insert into public.customers (profile_id, full_name, email, phone, location)
select id, full_name, email, phone, location
from public.profiles
where email = 'john.doe@example.com'
on conflict (email) do update
set profile_id = excluded.profile_id,
    full_name = excluded.full_name,
    phone = excluded.phone,
    location = excluded.location;

insert into public.customers (full_name, email, phone, location)
values
  ('Mariam Namusoke', 'mariam.namusoke@example.com', '+256 701 220 110', 'Entebbe'),
  ('David Ouma', 'david.ouma@example.com', '+256 752 330 440', 'Jinja')
on conflict (email) do nothing;

insert into public.services (reference, customer_id, title, division, location, progress, stage, expected_completion, status, contract_value, updated_on)
select 'MG-SVC-2026-0042', c.id, 'Residential House Construction', 'Construction', 'Kampala, Uganda', 65, 'Roofing works', '2026-12-20', 'in_progress', 80000000, '2026-10-04'
from public.customers c where c.email = 'john.doe@example.com'
on conflict (reference) do nothing;

insert into public.services (reference, customer_id, title, division, location, progress, stage, expected_completion, status, contract_value, updated_on)
select 'MG-SVC-0138', c.id, 'Corporate event', 'Events Management', 'Entebbe', 80, 'Final rehearsals', '2026-10-18', 'in_progress', 8500000, '2026-10-03'
from public.customers c where c.email = 'mariam.namusoke@example.com'
on conflict (reference) do nothing;

insert into public.services (reference, customer_id, title, division, location, progress, stage, expected_completion, status, contract_value, updated_on)
select 'MG-SVC-0131', c.id, 'Talent programme', 'Talent Development', 'Jinja', 42, 'Training block', '2026-11-30', 'in_progress', 1200000, '2026-10-02'
from public.customers c where c.email = 'david.ouma@example.com'
on conflict (reference) do nothing;

insert into public.service_milestones (service_id, label, occurred_on, state, sort_order)
select s.id, m.label, m.occurred_on, m.state, m.sort_order
from public.services s
join (
  values
    ('Contract signed', date '2026-05-12', 'complete', 1),
    ('Foundation completed', date '2026-06-08', 'complete', 2),
    ('Wall construction', date '2026-07-22', 'complete', 3),
    ('Roofing works', null, 'current', 4),
    ('Plumbing & electrical', null, 'upcoming', 5),
    ('Finishing & handover', null, 'upcoming', 6)
) as m(label, occurred_on, state, sort_order) on true
where s.reference = 'MG-SVC-2026-0042'
  and not exists (
    select 1 from public.service_milestones existing
    where existing.service_id = s.id and existing.label = m.label
  );

insert into public.installments (service_id, name, amount, due_on, paid_on, method, status, reference, sort_order)
select s.id, p.name, p.amount, p.due_on, p.paid_on, p.method, p.status, p.reference, p.sort_order
from public.services s
join (
  values
    ('Deposit', 10000000::bigint, date '2026-05-10', date '2026-05-10', 'MTN Mobile Money', 'paid', 'TXN-2041', 1),
    ('Second payment', 15000000::bigint, date '2026-06-10', date '2026-06-10', 'Airtel Money', 'paid', 'TXN-2044', 2),
    ('Third payment', 20000000::bigint, date '2026-08-10', date '2026-10-04', 'Bank transfer', 'paid', 'TXN-2048', 3),
    ('Final payment', 35000000::bigint, date '2026-11-10', null, null, 'due_soon', 'TXN-2052', 4)
) as p(name, amount, due_on, paid_on, method, status, reference, sort_order) on true
where s.reference = 'MG-SVC-2026-0042'
on conflict (reference) do nothing;

insert into public.installments (service_id, name, amount, due_on, paid_on, method, status, reference, sort_order)
select s.id, 'Event fee', 8500000, '2026-10-03', '2026-10-03', 'MTN Mobile Money', 'paid', 'TXN-2047', 1
from public.services s where s.reference = 'MG-SVC-0138'
on conflict (reference) do nothing;

insert into public.installments (service_id, name, amount, due_on, paid_on, method, status, reference, sort_order)
select s.id, 'Programme fee', 1200000, '2026-10-02', null, 'Airtel Money', 'pending', 'TXN-2046', 1
from public.services s where s.reference = 'MG-SVC-0131'
on conflict (reference) do nothing;

insert into public.progress_updates (service_id, title, body, progress, published_on)
select s.id, 'Roofing work has started', 'Our team has commenced roofing works. The structure is progressing well and remains on schedule.', 65, '2026-10-04'
from public.services s
where s.reference = 'MG-SVC-2026-0042'
  and not exists (select 1 from public.progress_updates u where u.service_id = s.id and u.title = 'Roofing work has started');

insert into public.progress_updates (service_id, title, body, progress, published_on)
select s.id, 'Final rehearsals', 'The corporate event programme is in final rehearsal.', 80, '2026-10-03'
from public.services s
where s.reference = 'MG-SVC-0138'
  and not exists (select 1 from public.progress_updates u where u.service_id = s.id and u.title = 'Final rehearsals');

insert into public.documents (service_id, customer_id, name, doc_type, status, detail, filed_on)
select s.id, s.customer_id, d.name, d.doc_type, d.status, d.detail, d.filed_on
from public.services s
join (
  values
    ('House construction contract', 'Contract', 'signed', 'The signed agreement for residential construction at your Kampala site, including scope, programme and payment terms.', date '2026-05-12'),
    ('Payment receipt TXN-2048', 'Receipt', 'available', 'Receipt for the third installment of UGX 20,000,000, recorded against MG-SVC-2026-0042.', date '2026-10-04'),
    ('Project quotation', 'Quotation', 'available', 'The approved quotation that set the contract value at UGX 80,000,000 before works began.', date '2026-05-02')
) as d(name, doc_type, status, detail, filed_on) on true
where s.reference = 'MG-SVC-2026-0042'
  and not exists (
    select 1 from public.documents existing
    where existing.service_id = s.id and existing.name = d.name
  );

insert into public.notifications (customer_id, title, body, href, read_at, created_at)
select c.id, n.title, n.body, n.href, n.read_at, n.created_at
from public.customers c
join (
  values
    ('Roofing work has started', 'Our team has commenced roofing works. The structure is progressing well and remains on schedule.', '/account/services/mg-svc-2026-0042', null::timestamptz, timestamptz '2026-10-04 09:00:00+03'),
    ('Final installment due soon', 'UGX 35,000,000 is due on 10 November 2026. You can review the plan and start payment from your account.', '/account/payments', null::timestamptz, timestamptz '2026-10-01 09:00:00+03'),
    ('Site inspection complete', 'The July inspection was accepted. Wall construction is recorded as complete.', '/account/services/mg-svc-2026-0042', timestamptz '2026-07-22 12:00:00+03', timestamptz '2026-07-22 12:00:00+03')
) as n(title, body, href, read_at, created_at) on true
where c.email = 'john.doe@example.com'
  and not exists (
    select 1 from public.notifications existing
    where existing.customer_id = c.id and existing.title = n.title
  );

insert into public.service_requests (reference, full_name, phone, email, service, location, description, status, created_at)
values
  ('MG-REQ-0008', 'Sarah Nakato', '+256 770 111 222', 'sarah.nakato@example.com', 'House construction', 'Kampala', 'New family house.', 'new', timestamptz '2026-10-05 09:42:00+03'),
  ('MG-REQ-0007', 'Kato & Sons Ltd', '+256 700 333 444', 'hello@katosons.example', 'Corporate event', 'Entebbe', 'Annual founders forum.', 'reviewing', timestamptz '2026-10-04 15:10:00+03'),
  ('MG-REQ-0006', 'Grace Achieng', '+256 752 555 666', 'grace.achieng@example.com', 'Talent development', 'Jinja', 'Youth training cohort.', 'new', timestamptz '2026-10-06 08:00:00+03'),
  ('MG-REQ-0005', 'Mirembe Schools', '+256 772 777 888', 'office@mirembe.example', 'Education development', 'Mukono', 'Learning centre expansion.', 'contacted', timestamptz '2026-10-05 11:20:00+03')
on conflict (reference) do nothing;

insert into public.homepage_activities (slug, category, title, body, image_path, sort_order, status)
select v.slug, v.category, v.title, v.body, '/mudogwaluyiira-hero.png', v.sort_order, 'published'
from (
  values
    ('construction', 'Construction', 'We build places that move Uganda forward.', 'From homes and commercial spaces to civil works, our construction teams turn ambitious plans into durable places.', 1),
    ('education', 'Education', 'We create environments where people learn.', 'We support schools and education partners with thoughtful development, management and programmes that widen access to opportunity.', 2),
    ('financial-services', 'Financial services', 'We make progress more accessible.', 'Our financial services work is designed around trust, clarity and practical support for individuals and growing businesses.', 3),
    ('talent-development', 'Talent development', 'We develop the people behind the potential.', 'Through training, mentorship and talent programmes, we help young people and professionals build confidence and capability.', 4),
    ('events-management', 'Events management', 'We bring people together with purpose.', 'From corporate gatherings to private celebrations, our events team manages every detail with calm, professional execution.', 5)
) as v(slug, category, title, body, sort_order)
where not exists (select 1 from public.homepage_activities existing where existing.slug = v.slug);

insert into public.gallery_items (title, category, image_path, sort_order, status)
select v.title, v.category, '/mudogwaluyiira-hero.png', v.sort_order, 'published'
from (
  values
    ('Site progress at Kampala Heights', 'Construction', 1),
    ('Learning spaces for brighter futures', 'Education', 2),
    ('People, purpose and possibility', 'Talent development', 3),
    ('Events that bring communities together', 'Events management', 4)
) as v(title, category, sort_order)
where not exists (select 1 from public.gallery_items existing where existing.title = v.title);

insert into public.workspace_settings (id, workspace_name, contact_name, role_label, notification_email)
values (1, 'Mudogwaluyiira operations', 'Admin Manager', 'Operations', 'operations@mudogwaluyiira.ug')
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values
  ('documents', 'documents', false),
  ('gallery', 'gallery', true)
on conflict (id) do nothing;

drop policy if exists "public gallery files" on storage.objects;
create policy "public gallery files" on storage.objects
for select to anon, authenticated
using (bucket_id = 'gallery');

drop policy if exists "admin gallery files" on storage.objects;
create policy "admin gallery files" on storage.objects
for all to authenticated
using (bucket_id = 'gallery' and public.is_admin())
with check (bucket_id = 'gallery' and public.is_admin());

drop policy if exists "admin document files" on storage.objects;
create policy "admin document files" on storage.objects
for all to authenticated
using (bucket_id = 'documents' and public.is_admin())
with check (bucket_id = 'documents' and public.is_admin());

drop policy if exists "customer document files" on storage.objects;
create policy "customer document files" on storage.objects
for select to authenticated
using (
  bucket_id = 'documents'
  and exists (
    select 1 from public.documents d
    join public.customers c on c.id = d.customer_id
    where d.file_path = storage.objects.name and c.profile_id = auth.uid()
  )
);
