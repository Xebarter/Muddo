-- 0002 — Homepage hero image
-- Run after 0001schem.sql. Safe to run again.

create table if not exists public.homepage_settings (
  id integer primary key default 1 check (id = 1),
  hero_image_path text not null default '/mudogwaluyiira-hero.png'
);

alter table public.homepage_settings enable row level security;

drop policy if exists "public homepage settings" on public.homepage_settings;
create policy "public homepage settings" on public.homepage_settings
for select to anon, authenticated
using (true);

drop policy if exists "admin homepage settings" on public.homepage_settings;
create policy "admin homepage settings" on public.homepage_settings
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update, delete on public.homepage_settings to authenticated;
grant select on public.homepage_settings to anon;

insert into public.homepage_settings (id, hero_image_path)
values (1, '/mudogwaluyiira-hero.png')
on conflict (id) do nothing;
