-- 0003 — Service images
-- Run after 0002homepage-hero.sql. Safe to run again.

alter table public.services add column if not exists image_path text not null default '';
