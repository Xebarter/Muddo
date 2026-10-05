-- 0007 — Public contact details for workspace settings
-- Run after 0006careers.sql. Safe to run again.

alter table public.workspace_settings add column if not exists public_email text not null default 'muddogwaluyiiragroup@gmail.com';
alter table public.workspace_settings add column if not exists phone text not null default '+256 787 703 725';
alter table public.workspace_settings add column if not exists whatsapp text not null default '+256 787 703 725';
alter table public.workspace_settings add column if not exists address text not null default 'Kampala, Uganda';
alter table public.workspace_settings add column if not exists hours text not null default '';
