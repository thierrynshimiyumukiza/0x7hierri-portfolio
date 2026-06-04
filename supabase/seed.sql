-- my-portfolio starter data
-- Run this after schema.sql in Supabase SQL Editor.

-- Fixed IDs for singleton rows
insert into public.hero_settings (
  id, heading_line1, heading_line2, heading_line3, subheading, description,
  cta_primary_text, cta_primary_url, cta_secondary_text, cta_secondary_url, show_availability
)
values (
  '11111111-1111-1111-1111-111111111111',
  'Hi, I am Thierry',
  'Full-Stack Developer',
  'Building useful products',
  'Software Engineer',
  'I design and build scalable web applications with a strong focus on product quality.',
  'View Projects',
  '/projects',
  'Read Studies',
  '/studies',
  true
)
on conflict (id) do update set
  heading_line1 = excluded.heading_line1,
  heading_line2 = excluded.heading_line2,
  heading_line3 = excluded.heading_line3,
  subheading = excluded.subheading,
  description = excluded.description,
  cta_primary_text = excluded.cta_primary_text,
  cta_primary_url = excluded.cta_primary_url,
  cta_secondary_text = excluded.cta_secondary_text,
  cta_secondary_url = excluded.cta_secondary_url,
  show_availability = excluded.show_availability;

insert into public.profile (
  id, name, username, job_title, bio, location, email,
  github_url, linkedin_url, twitter_url, website_url,
  profile_picture_url, resume_url, availability_status, availability_text, skills
)
values (
  '22222222-2222-2222-2222-222222222222',
  'Thierry Nshimiyumukiza',
  '0x7hierri',
  'Full-Stack Developer',
  'I build performant, secure, and maintainable software products.',
  'Kigali, Rwanda',
  'thierrynshimiyumukiza@gmail.com',
  'https://github.com/0x7hierri',
  'https://linkedin.com/in/0x7hierri',
  null,
  'http://localhost:3001',
  null,
  null,
  true,
  'Available for collaboration',
  array['TypeScript', 'Next.js', 'Supabase', 'PostgreSQL']::text[]
)
on conflict (id) do update set
  name = excluded.name,
  username = excluded.username,
  job_title = excluded.job_title,
  bio = excluded.bio,
  location = excluded.location,
  email = excluded.email,
  github_url = excluded.github_url,
  linkedin_url = excluded.linkedin_url,
  twitter_url = excluded.twitter_url,
  website_url = excluded.website_url,
  profile_picture_url = excluded.profile_picture_url,
  resume_url = excluded.resume_url,
  availability_status = excluded.availability_status,
  availability_text = excluded.availability_text,
  skills = excluded.skills;

insert into public.about_settings (id, hero_text, biography, profile_image_url)
values (
  '33333333-3333-3333-3333-333333333333',
  'I am passionate about solving real-world problems through code.',
  'With a strong engineering mindset, I focus on clean architecture, solid DX, and high-quality UI implementation.',
  null
)
on conflict (id) do update set
  hero_text = excluded.hero_text,
  biography = excluded.biography,
  profile_image_url = excluded.profile_image_url;

insert into public.footer_settings (id, copyright_text, tech_stack_text, contact_email, show_social_links)
values (
  '44444444-4444-4444-4444-444444444444',
  '© 2026 Thierry. All rights reserved.',
  'Built with Next.js, Supabase, TypeScript, and Tailwind CSS',
  'thierrynshimiyumukiza@gmail.com',
  true
)
on conflict (id) do update set
  copyright_text = excluded.copyright_text,
  tech_stack_text = excluded.tech_stack_text,
  contact_email = excluded.contact_email,
  show_social_links = excluded.show_social_links;

insert into public.navigation (id, label, url, display_order, visible, is_external)
values
  ('55555555-5555-5555-5555-555555555551', 'Home', '/', 1, true, false),
  ('55555555-5555-5555-5555-555555555552', 'Projects', '/projects', 2, true, false),
  ('55555555-5555-5555-5555-555555555553', 'Studies', '/studies', 3, true, false),
  ('55555555-5555-5555-5555-555555555554', 'Blog', '/blog', 4, true, false),
  ('55555555-5555-5555-5555-555555555555', 'About', '/about', 5, true, false),
  ('55555555-5555-5555-5555-555555555556', 'Contact', '/contact', 6, true, false)
on conflict (id) do update set
  label = excluded.label,
  url = excluded.url,
  display_order = excluded.display_order,
  visible = excluded.visible,
  is_external = excluded.is_external;

insert into public.statistics (id, number, label, display_order, visible)
values
  ('66666666-6666-6666-6666-666666666661', '25+', 'Projects Built', 1, true),
  ('66666666-6666-6666-6666-666666666662', '4+', 'Years Experience', 2, true),
  ('66666666-6666-6666-6666-666666666663', '40+', 'Articles & Notes', 3, true),
  ('66666666-6666-6666-6666-666666666664', '100%', 'Delivery Focus', 4, true)
on conflict (id) do update set
  number = excluded.number,
  label = excluded.label,
  display_order = excluded.display_order,
  visible = excluded.visible;

insert into public.seo_settings (id, page_key, meta_title, meta_description, og_image_url, canonical_url, robots, keywords)
values
  ('77777777-7777-7777-7777-777777777771', 'home', '0x7hierri | Portfolio', 'Personal portfolio and engineering studies.', null, 'http://localhost:3001', 'index, follow', array['portfolio', 'developer', 'next.js']::text[]),
  ('77777777-7777-7777-7777-777777777772', 'projects', 'Projects | 0x7hierri', 'Selected engineering work and shipped products.', null, 'http://localhost:3001/projects', 'index, follow', array['projects', 'software', 'engineering']::text[]),
  ('77777777-7777-7777-7777-777777777773', 'studies', 'Studies | 0x7hierri', 'Learning logs, technical studies, and implementation notes.', null, 'http://localhost:3001/studies', 'index, follow', array['studies', 'learning', 'engineering']::text[]),
  ('77777777-7777-7777-7777-777777777774', 'blog', 'Blog | 0x7hierri', 'Articles and engineering insights.', null, 'http://localhost:3001/blog', 'index, follow', array['blog', 'engineering', 'software']::text[]),
  ('77777777-7777-7777-7777-777777777775', 'about', 'About | 0x7hierri', 'Background, experience, and profile.', null, 'http://localhost:3001/about', 'index, follow', array['about', 'profile']::text[]),
  ('77777777-7777-7777-7777-777777777776', 'contact', 'Contact | 0x7hierri', 'Ways to connect and collaborate.', null, 'http://localhost:3001/contact', 'index, follow', array['contact', 'email']::text[])
on conflict (id) do update set
  page_key = excluded.page_key,
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description,
  og_image_url = excluded.og_image_url,
  canonical_url = excluded.canonical_url,
  robots = excluded.robots,
  keywords = excluded.keywords;

insert into public.projects (
  id, title, slug, description, thumbnail_url, github_url, demo_url,
  featured, status, sort_order, tags
)
values (
  '88888888-8888-8888-8888-888888888881',
  'Portfolio CMS Platform',
  'portfolio-cms-platform',
  'A production-ready personal portfolio with a custom admin CMS powered by Supabase.',
  null,
  'https://github.com/0x7hierri',
  'http://localhost:3001',
  true,
  'published',
  1,
  array['next.js', 'supabase', 'typescript']::text[]
)
on conflict (id) do update set
  title = excluded.title,
  slug = excluded.slug,
  description = excluded.description,
  thumbnail_url = excluded.thumbnail_url,
  github_url = excluded.github_url,
  demo_url = excluded.demo_url,
  featured = excluded.featured,
  status = excluded.status,
  sort_order = excluded.sort_order,
  tags = excluded.tags;

insert into public.blog_posts (
  id, title, slug, excerpt, content, thumbnail_url, cover_image_url, tags,
  reading_time, featured, status, meta_title, meta_description, og_image_url, published_at
)
values (
  '99999999-9999-9999-9999-999999999991',
  'Building a Practical Admin CMS with Next.js and Supabase',
  'building-admin-cms-nextjs-supabase',
  'How to structure a clean, maintainable portfolio CMS stack.',
  '## Why this stack\n\nNext.js + Supabase gives a strong DX and reliable backend for fast iteration.',
  null,
  null,
  array['next.js', 'supabase', 'cms']::text[],
  6,
  true,
  'published',
  'Building a Practical Admin CMS with Next.js and Supabase',
  'A practical walkthrough for creating an admin CMS with Next.js and Supabase.',
  null,
  now()
)
on conflict (id) do update set
  title = excluded.title,
  slug = excluded.slug,
  excerpt = excluded.excerpt,
  content = excluded.content,
  thumbnail_url = excluded.thumbnail_url,
  cover_image_url = excluded.cover_image_url,
  tags = excluded.tags,
  reading_time = excluded.reading_time,
  featured = excluded.featured,
  status = excluded.status,
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description,
  og_image_url = excluded.og_image_url,
  published_at = excluded.published_at;

insert into public.study_categories (
  id, title, slug, description, thumbnail_url, cover_image_url, tags,
  difficulty, status, featured, sort_order, entry_count, progress_percent
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'System Design Track',
  'system-design-track',
  'Notes and experiments on scalable architecture patterns.',
  null,
  null,
  array['architecture', 'scalability']::text[],
  'intermediate',
  'published',
  true,
  1,
  1,
  25
)
on conflict (id) do update set
  title = excluded.title,
  slug = excluded.slug,
  description = excluded.description,
  thumbnail_url = excluded.thumbnail_url,
  cover_image_url = excluded.cover_image_url,
  tags = excluded.tags,
  difficulty = excluded.difficulty,
  status = excluded.status,
  featured = excluded.featured,
  sort_order = excluded.sort_order,
  entry_count = excluded.entry_count,
  progress_percent = excluded.progress_percent;

insert into public.study_entries (
  id, category_id, title, slug, summary, content, thumbnail_url, cover_image_url,
  tags, status, pinned, entry_number, reading_time, published_at, meta_title, meta_description
)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'Designing a Queue-Driven Notification Pipeline',
  'queue-driven-notification-pipeline',
  'A study on async processing, retries, and observability.',
  '## Study Goal\n\nDesign a resilient notification system using queues, retries, and idempotency keys.',
  null,
  null,
  array['queues', 'retries', 'observability']::text[],
  'published',
  true,
  1,
  8,
  now(),
  'Designing a Queue-Driven Notification Pipeline',
  'Study notes on building reliable queue-based notification architecture.'
)
on conflict (id) do update set
  category_id = excluded.category_id,
  title = excluded.title,
  slug = excluded.slug,
  summary = excluded.summary,
  content = excluded.content,
  thumbnail_url = excluded.thumbnail_url,
  cover_image_url = excluded.cover_image_url,
  tags = excluded.tags,
  status = excluded.status,
  pinned = excluded.pinned,
  entry_number = excluded.entry_number,
  reading_time = excluded.reading_time,
  published_at = excluded.published_at,
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description;

insert into public.study_media (
  id, entry_id, url, media_type, caption, alt_text, display_order, is_url_mode
)
values (
  'cccccccc-cccc-cccc-cccc-ccccccccccc1',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  'https://example.com/architecture-diagram.pdf',
  'pdf',
  'Reference diagram',
  'Notification system architecture diagram',
  1,
  true
)
on conflict (id) do update set
  entry_id = excluded.entry_id,
  url = excluded.url,
  media_type = excluded.media_type,
  caption = excluded.caption,
  alt_text = excluded.alt_text,
  display_order = excluded.display_order,
  is_url_mode = excluded.is_url_mode;

insert into public.career_timeline (
  id, title, organization, description, start_date, end_date, is_current, type, display_order
)
values (
  'dddddddd-dddd-dddd-dddd-ddddddddddd1',
  'Full-Stack Developer',
  'Independent',
  'Building production-focused web applications and tooling.',
  '2023-01-01',
  null,
  true,
  'experience',
  1
)
on conflict (id) do update set
  title = excluded.title,
  organization = excluded.organization,
  description = excluded.description,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  is_current = excluded.is_current,
  type = excluded.type,
  display_order = excluded.display_order;

insert into public.certifications (
  id, name, issuer, date_earned, url, badge_url, display_order
)
values (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
  'Cloud Fundamentals',
  'Example Academy',
  '2025-05-01',
  'https://example.com/cert/cloud-fundamentals',
  null,
  1
)
on conflict (id) do update set
  name = excluded.name,
  issuer = excluded.issuer,
  date_earned = excluded.date_earned,
  url = excluded.url,
  badge_url = excluded.badge_url,
  display_order = excluded.display_order;

insert into public.education_entries (
  id, school_name, degree, field_of_study, logo_url, school_url, location,
  start_date, end_date, is_current, description, display_order
)
values (
  'abababab-abab-abab-abab-ababababab01',
  'University of Rwanda',
  'Bachelor''s Degree',
  'Software Engineering',
  null,
  'https://ur.ac.rw',
  'Kigali, Rwanda',
  '2021-09-01',
  null,
  true,
  'Focused on software architecture, systems programming, and secure application development.',
  1
)
on conflict (id) do update set
  school_name = excluded.school_name,
  degree = excluded.degree,
  field_of_study = excluded.field_of_study,
  logo_url = excluded.logo_url,
  school_url = excluded.school_url,
  location = excluded.location,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  is_current = excluded.is_current,
  description = excluded.description,
  display_order = excluded.display_order;

insert into public.tags (id, name, slug, color)
values
  ('ffffffff-ffff-ffff-ffff-fffffffffff1', 'Next.js', 'nextjs', '#58a6ff'),
  ('ffffffff-ffff-ffff-ffff-fffffffffff2', 'Supabase', 'supabase', '#3fb950'),
  ('ffffffff-ffff-ffff-ffff-fffffffffff3', 'TypeScript', 'typescript', '#3178c6')
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  color = excluded.color;
