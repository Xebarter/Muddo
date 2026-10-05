create table if not exists public.disbursements (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  recipient_name text not null default '',
  email text not null,
  phone text not null,
  amount bigint not null check (amount > 0),
  currency text not null default 'UGX',
  channel text not null check (channel in ('mobile', 'bank')),
  description text not null default '',
  reference text not null unique,
  provider_id text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  bank_name text not null default '',
  bank_code text not null default '',
  bank_account_name text not null default '',
  bank_account_number text not null default '',
  provider_message text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists disbursements_provider_id_key on public.disbursements (provider_id) where provider_id is not null;

alter table public.disbursements enable row level security;

drop policy if exists "admin disbursements" on public.disbursements;
create policy "admin disbursements" on public.disbursements
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update, delete on public.disbursements to authenticated;
