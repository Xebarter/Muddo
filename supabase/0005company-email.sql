-- 0005 — Company contact email
-- Run after 0004contact-messages.sql. Safe to run again.

update public.workspace_settings
set notification_email = 'muddogwaluyiiragroup@gmail.com'
where id = 1
  and notification_email = 'operations@mudogwaluyiira.ug';
