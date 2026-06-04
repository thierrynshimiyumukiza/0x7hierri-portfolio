-- Homepage + About CMS extension tables
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

alter table if exists public.statistics
  add column if not exists icon text;

create table if not exists public.homepage_settings (
  id uuid primary key default gen_random_uuid(),
  philosophy_quote text,
  philosophy_description text,
  show_philosophy boolean default true,
  about_preview_title text,
  about_preview_text text,
  about_preview_button_text text,
  about_preview_url text default '/about',
  cta_title text,
  cta_description text,
  cta_button_text text,
  cta_button_url text default '/contact',
  updated_at timestamptz default now()
);

create table if not exists public.homepage_expertise (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text,
  display_order int default 0,
  visible boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.about_focus_areas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text,
  display_order int default 0,
  visible boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.about_interests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text,
  display_order int default 0,
  visible boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.about_skill_groups (
  id uuid primary key default gen_random_uuid(),
  group_title text not null,
  items text[] default '{}',
  display_order int default 0,
  visible boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  platform text,
  url text not null,
  display_order int default 0,
  visible boolean default true,
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

drop trigger if exists set_updated_at_homepage_settings on public.homepage_settings;
create trigger set_updated_at_homepage_settings
before update on public.homepage_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_homepage_expertise on public.homepage_expertise;
create trigger set_updated_at_homepage_expertise
before update on public.homepage_expertise
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_about_focus_areas on public.about_focus_areas;
create trigger set_updated_at_about_focus_areas
before update on public.about_focus_areas
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_about_interests on public.about_interests;
create trigger set_updated_at_about_interests
before update on public.about_interests
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_about_skill_groups on public.about_skill_groups;
create trigger set_updated_at_about_skill_groups
before update on public.about_skill_groups
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_social_links on public.social_links;
create trigger set_updated_at_social_links
before update on public.social_links
for each row execute function public.set_updated_at();

alter table if exists public.homepage_settings disable row level security;
alter table if exists public.homepage_expertise disable row level security;
alter table if exists public.about_focus_areas disable row level security;
alter table if exists public.about_interests disable row level security;
alter table if exists public.about_skill_groups disable row level security;
alter table if exists public.social_links disable row level security;

grant select, insert, update, delete on public.homepage_settings to anon, authenticated, service_role;
grant select, insert, update, delete on public.homepage_expertise to anon, authenticated, service_role;
grant select, insert, update, delete on public.about_focus_areas to anon, authenticated, service_role;
grant select, insert, update, delete on public.about_interests to anon, authenticated, service_role;
grant select, insert, update, delete on public.about_skill_groups to anon, authenticated, service_role;
grant select, insert, update, delete on public.social_links to anon, authenticated, service_role;

insert into public.homepage_settings (
  philosophy_quote,
  philosophy_description,
  show_philosophy,
  about_preview_title,
  about_preview_text,
  about_preview_button_text,
  about_preview_url,
  cta_title,
  cta_description,
  cta_button_text,
  cta_button_url
)
select
  'Security is not a product. It is a continuous process of learning, understanding, and improvement.',
  'Driven by curiosity, disciplined by engineering, and focused on practical impact.',
  true,
  'About Me',
  'I''m a security researcher and builder focused on discovering and fixing vulnerabilities.',
  'about me',
  '/about',
  'Let''s build something secure together.',
  'I''m open to research collaborations, product security engineering, and practical vulnerability work.',
  'get in touch',
  '/contact'
where not exists (select 1 from public.homepage_settings);
