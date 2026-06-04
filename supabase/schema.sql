-- my-portfolio schema bootstrap
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Enums
create type public.difficulty_level as enum ('beginner', 'intermediate', 'advanced');
create type public.entry_status as enum ('draft', 'published', 'archived');
create type public.media_type as enum ('image', 'video', 'pdf', 'attachment');

-- Core singleton/settings tables
create table public.hero_settings (
  id uuid primary key default gen_random_uuid(),
  heading_line1 text,
  heading_line2 text,
  heading_line3 text,
  subheading text,
  description text,
  cta_primary_text text,
  cta_primary_url text,
  cta_secondary_text text,
  cta_secondary_url text,
  show_availability boolean default false,
  updated_at timestamptz default now()
);

create table public.profile (
  id uuid primary key default gen_random_uuid(),
  name text not null default '0x7hierri',
  username text not null default '0x7hierri',
  job_title text,
  bio text,
  location text,
  email text,
  github_url text,
  linkedin_url text,
  twitter_url text,
  website_url text,
  profile_picture_url text,
  resume_url text,
  availability_status boolean default false,
  availability_text text,
  skills text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.about_settings (
  id uuid primary key default gen_random_uuid(),
  hero_text text,
  biography text,
  profile_image_url text,
  updated_at timestamptz default now()
);

create table public.footer_settings (
  id uuid primary key default gen_random_uuid(),
  copyright_text text,
  tech_stack_text text,
  contact_email text,
  show_social_links boolean default true,
  updated_at timestamptz default now()
);

create table public.seo_settings (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  meta_title text,
  meta_description text,
  og_image_url text,
  canonical_url text,
  robots text default 'index, follow',
  keywords text[] default '{}',
  updated_at timestamptz default now()
);

create table public.navigation (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  display_order int default 0,
  visible boolean default true,
  is_external boolean default false,
  created_at timestamptz default now()
);

create table public.statistics (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  label text not null,
  display_order int default 0,
  visible boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Content tables
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  thumbnail_url text,
  github_url text,
  demo_url text,
  featured boolean default false,
  status public.entry_status default 'draft',
  sort_order int default 0,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  thumbnail_url text,
  cover_image_url text,
  tags text[] default '{}',
  reading_time int,
  featured boolean default false,
  status public.entry_status default 'draft',
  meta_title text,
  meta_description text,
  og_image_url text,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.study_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  thumbnail_url text,
  cover_image_url text,
  tags text[] default '{}',
  difficulty public.difficulty_level default 'beginner',
  status public.entry_status default 'draft',
  featured boolean default false,
  sort_order int default 0,
  entry_count int default 0,
  progress_percent int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.study_entries (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.study_categories(id) on delete set null,
  title text not null,
  slug text not null,
  summary text,
  content text,
  thumbnail_url text,
  cover_image_url text,
  tags text[] default '{}',
  status public.entry_status default 'draft',
  pinned boolean default false,
  entry_number int default 0,
  reading_time int,
  published_at timestamptz,
  meta_title text,
  meta_description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (category_id, slug)
);

create table public.study_media (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references public.study_entries(id) on delete cascade,
  url text not null,
  media_type public.media_type default 'attachment',
  caption text,
  alt_text text,
  display_order int default 0,
  is_url_mode boolean default true,
  created_at timestamptz default now()
);

create table public.media_library (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  media_type public.media_type default 'image',
  bucket text,
  file_name text,
  file_size int,
  width int,
  height int,
  caption text,
  alt_text text,
  is_url_mode boolean default true,
  created_at timestamptz default now()
);

create table public.career_timeline (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text,
  description text,
  start_date date,
  end_date date,
  is_current boolean default false,
  type text,
  display_order int default 0,
  created_at timestamptz default now()
);

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  issuer text,
  date_earned date,
  url text,
  badge_url text,
  display_order int default 0,
  created_at timestamptz default now()
);

create table public.education_entries (
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

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text,
  created_at timestamptz default now()
);

-- Auto-update updated_at on updates
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_hero_settings before update on public.hero_settings for each row execute function public.set_updated_at();
create trigger set_updated_at_profile before update on public.profile for each row execute function public.set_updated_at();
create trigger set_updated_at_about_settings before update on public.about_settings for each row execute function public.set_updated_at();
create trigger set_updated_at_footer_settings before update on public.footer_settings for each row execute function public.set_updated_at();
create trigger set_updated_at_seo_settings before update on public.seo_settings for each row execute function public.set_updated_at();
create trigger set_updated_at_statistics before update on public.statistics for each row execute function public.set_updated_at();
create trigger set_updated_at_projects before update on public.projects for each row execute function public.set_updated_at();
create trigger set_updated_at_blog_posts before update on public.blog_posts for each row execute function public.set_updated_at();
create trigger set_updated_at_study_categories before update on public.study_categories for each row execute function public.set_updated_at();
create trigger set_updated_at_study_entries before update on public.study_entries for each row execute function public.set_updated_at();
create trigger set_updated_at_education_entries before update on public.education_entries for each row execute function public.set_updated_at();

-- Local/dev-friendly access model (you can tighten later)
alter table public.hero_settings disable row level security;
alter table public.profile disable row level security;
alter table public.about_settings disable row level security;
alter table public.footer_settings disable row level security;
alter table public.seo_settings disable row level security;
alter table public.navigation disable row level security;
alter table public.statistics disable row level security;
alter table public.projects disable row level security;
alter table public.blog_posts disable row level security;
alter table public.study_categories disable row level security;
alter table public.study_entries disable row level security;
alter table public.study_media disable row level security;
alter table public.media_library disable row level security;
alter table public.career_timeline disable row level security;
alter table public.certifications disable row level security;
alter table public.education_entries disable row level security;
alter table public.tags disable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated, service_role;
