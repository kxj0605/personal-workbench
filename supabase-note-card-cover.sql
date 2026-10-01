-- Run this in the Supabase SQL editor before using per-note card covers in production.

alter table public.notes
  add column if not exists card_cover_visible boolean not null default false;
