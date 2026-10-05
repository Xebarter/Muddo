-- 0008 — Grant admin to the company email
-- Run after 0007site-settings.sql. Safe to run again.
-- Sign out of the site and sign back in before opening /admin.

insert into public.admin_allowlist (email)
values ('muddogwaluyiiragroup@gmail.com')
on conflict (email) do nothing;

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
where lower(email) = lower('muddogwaluyiiragroup@gmail.com');

alter table public.profiles disable trigger profiles_protect_role;

update public.profiles
set role = 'admin'
where lower(email) = lower('muddogwaluyiiragroup@gmail.com');

alter table public.profiles enable trigger profiles_protect_role;
