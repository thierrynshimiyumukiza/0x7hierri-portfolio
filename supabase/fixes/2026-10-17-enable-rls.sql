-- Turn on row level security everywhere and make the public API read-only.
--
-- Until now every table had RLS disabled and anon held insert/update/delete,
-- so the anon key that ships in the browser bundle could rewrite or wipe the
-- whole site through the Supabase REST API.
--
-- Access model after this script:
--   * anon / authenticated  -> SELECT only, and only what the public site shows
--                              (published rows for tables that carry a status).
--   * service_role          -> everything; it bypasses RLS. All CMS writes and
--                              admin reads go through it, behind requireAdmin().
--
-- Safe to re-run. Run it in the Supabase SQL editor after schema.sql and the
-- earlier fixes.

do $$
declare
  t text;
  -- Tables the public site reads in full.
  public_tables text[] := array[
    'hero_settings', 'profile', 'about_settings', 'footer_settings', 'seo_settings',
    'navigation', 'statistics', 'study_media', 'career_timeline', 'certifications',
    'education_entries', 'tags', 'homepage_settings', 'homepage_expertise',
    'about_focus_areas', 'about_interests', 'about_skill_groups', 'social_links'
  ];
  -- Tables whose drafts and archived rows must stay private.
  status_tables text[] := array['projects', 'blog_posts', 'study_categories', 'study_entries'];
  -- Tables the public never reads; only the service role may touch them.
  private_tables text[] := array['media_library'];
begin
  foreach t in array public_tables || status_tables || private_tables loop
    if to_regclass('public.' || t) is null then
      raise notice 'skipping missing table public.%', t;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);
    execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
    execute format('drop policy if exists "public read" on public.%I', t);

    if t = any(public_tables) then
      execute format(
        'create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    elsif t = 'blog_posts' then
      -- A published post with a future date is scheduled and stays hidden until then.
      execute format(
        'create policy "public read" on public.%I for select to anon, authenticated using (status = ''published'' and (published_at is null or published_at <= now()))', t);
    elsif t = any(status_tables) then
      execute format(
        'create policy "public read" on public.%I for select to anon, authenticated using (status = ''published'')', t);
    end if;
  end loop;
end
$$;

-- New tables must not inherit write access for the public roles either.
alter default privileges in schema public revoke insert, update, delete, truncate on tables from anon, authenticated;
