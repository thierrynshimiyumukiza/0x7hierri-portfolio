-- Fix for: Could not find table 'public.education_entries' in the schema cache
-- Run this in Supabase SQL Editor if your project was initialized without this table.

create table if not exists public.education_entries (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  degree text,
  field_of_study text,
  logo_url text,
  school_url text,
  location text,
  start_date date,
  end_date date,
  is_current boolean default false,
  description text,
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_education_entries'
  ) then
    create trigger set_updated_at_education_entries
    before update on public.education_entries
    for each row execute function public.set_updated_at();
  end if;
end
$$;

alter table public.education_entries disable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.education_entries to anon, authenticated, service_role;
