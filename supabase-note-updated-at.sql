-- Run this in the Supabase SQL editor to persist the "recently edited" order.

alter table public.notes
  add column if not exists updated_at timestamptz;

update public.notes
  set updated_at = created_at
  where updated_at is null;

alter table public.notes
  alter column updated_at set default now(),
  alter column updated_at set not null;

create or replace function public.set_notes_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_set_updated_at on public.notes;

create trigger notes_set_updated_at
before update on public.notes
for each row
execute function public.set_notes_updated_at();
