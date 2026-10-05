-- 0004 — Contact page messages
-- Run after 0001schem.sql. Safe to run again.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null default '',
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "admin contact messages" on public.contact_messages;
create policy "admin contact messages" on public.contact_messages
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

revoke all on public.contact_messages from public, anon;
grant select, update, delete on public.contact_messages to authenticated;

create or replace function public.submit_contact_message(
  p_full_name text,
  p_email text,
  p_phone text,
  p_subject text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_id uuid;
begin
  if length(trim(p_full_name)) < 2 then
    raise exception 'Enter your name';
  end if;
  if position('@' in p_email) = 0 or position('.' in p_email) = 0 then
    raise exception 'Enter a valid email';
  end if;
  if length(trim(p_subject)) < 2 then
    raise exception 'Enter a subject';
  end if;
  if length(trim(p_message)) < 10 then
    raise exception 'Enter a message';
  end if;

  insert into public.contact_messages (full_name, email, phone, subject, message)
  values (
    trim(p_full_name),
    lower(trim(p_email)),
    coalesce(trim(p_phone), ''),
    trim(p_subject),
    trim(p_message)
  )
  returning id into created_id;

  return created_id;
end;
$$;

revoke all on function public.submit_contact_message(text, text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text, text) to anon, authenticated;
