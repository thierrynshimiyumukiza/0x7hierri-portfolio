import type { Metadata } from "next";
import { getSeoMetadata } from "@/lib/seo";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingTableError } from "@/lib/supabase/errors";
import type { Database, Tables } from "@/types/database";
import HomeView, { type HomePost } from "@/components/site/home/HomeView";
import { releasedFilter } from "@/lib/publishing";

export async function generateMetadata(): Promise<Metadata> {
  return getSeoMetadata("home");
}

type HomepageExpertiseRow = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
  visible: boolean | null;
};

function oneLine(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim();
}

export default async function HomePage() {
  const supabase = createAdminClient();

  const fromLooseTable = <T extends keyof Database["public"]["Tables"]>(table: T) =>
    supabase.from(table);

  const [
    hero,
    profile,
    stats,
    projects,
    studies,
    blogs,
    homepageExpertise,
    socialLinks,
  ] = await Promise.all([
    supabase.from("hero_settings").select("*").single(),
    supabase.from("profile").select("*").single(),
    supabase.from("statistics").select("*").eq("visible", true).order("display_order"),
    supabase
      .from("projects")
      .select("*")
      .eq("featured", true)
      .eq("status", "published")
      .order("sort_order")
      .limit(4),
    supabase
      .from("study_categories")
      .select("*")
      .eq("featured", true)
      .eq("status", "published")
      .order("sort_order")
      .limit(4),
    supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .or(releasedFilter())
      .order("published_at", { ascending: false })
      .limit(5),
    fromLooseTable("homepage_expertise").select("*").eq("visible", true).order("display_order"),
    fromLooseTable("social_links").select("*").eq("visible", true).order("display_order"),
  ]);

  const heroRow = (hero.data as Tables<"hero_settings"> | null) ?? null;
  const profileRow = (profile.data as Tables<"profile"> | null) ?? null;
  const statisticsRows = (stats.data as Tables<"statistics">[] | null) ?? [];
  const projectRows = (projects.data as Tables<"projects">[] | null) ?? [];
  const studyRows = (studies.data as Tables<"study_categories">[] | null) ?? [];
  const blogRows = (blogs.data as Tables<"blog_posts">[] | null) ?? [];

  const homepageExpertiseMissing = isMissingTableError(homepageExpertise.error ?? null, "homepage_expertise");
  const socialLinksMissing = isMissingTableError(socialLinks.error ?? null, "social_links");

  const homepageExpertiseRows =
    !homepageExpertise.error || homepageExpertiseMissing
      ? ((homepageExpertise.data as HomepageExpertiseRow[] | null) ?? [])
      : [];

  const socialLinkRows =
    !socialLinks.error || socialLinksMissing
      ? ((socialLinks.data as Array<{ id: string; label: string; url: string; platform: string | null }> | null) ?? [])
      : [];

  const toPost = (row: Tables<"blog_posts">): HomePost => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: oneLine(row.excerpt),
    thumbnailUrl: row.thumbnail_url ?? null,
    tags: row.tags ?? [],
    readingTime: row.reading_time ?? 1,
    publishedAt: row.published_at ?? null,
  });

  // The featured flag picks the big card; without one the newest post takes it.
  const featuredRow = blogRows.find((row) => row.featured) ?? blogRows[0] ?? null;
  const listRows = blogRows.filter((row) => row !== featuredRow).slice(0, 3);

  const cta = (text?: string | null, url?: string | null) =>
    oneLine(text) && oneLine(url) ? { text: oneLine(text), url: oneLine(url) } : null;

  // "cat now.txt" lists what the CMS says I focus on, falling back to study tracks.
  const nowItems = (
    homepageExpertiseRows.length > 0
      ? homepageExpertiseRows.map((item) => oneLine(item.title))
      : studyRows.map((row) => oneLine(row.title))
  )
    .filter(Boolean)
    .slice(0, 4);

  const links =
    socialLinkRows.length > 0
      ? socialLinkRows.map((item) => ({ label: oneLine(item.label) || oneLine(item.platform) || "link", url: oneLine(item.url) }))
      : [
          { label: "github", url: oneLine(profileRow?.github_url) },
          { label: "twitter", url: oneLine(profileRow?.twitter_url) },
          { label: "linkedin", url: oneLine(profileRow?.linkedin_url) },
        ];

  const studyRow = studyRows[0] ?? null;
  const projectRow = projectRows[0] ?? null;

  return (
    <HomeView
      hero={{
        line1: oneLine(heroRow?.heading_line1),
        line2: oneLine(heroRow?.heading_line2),
        line3: oneLine(heroRow?.heading_line3),
        subheading: oneLine(heroRow?.subheading),
        description: oneLine(heroRow?.description) || oneLine(profileRow?.bio),
        ctaPrimary: cta(heroRow?.cta_primary_text, heroRow?.cta_primary_url),
        ctaSecondary: cta(heroRow?.cta_secondary_text, heroRow?.cta_secondary_url),
        availability:
          heroRow?.show_availability && profileRow?.availability_status
            ? oneLine(profileRow?.availability_text) || "available for collaboration"
            : null,
      }}
      profile={{
        username: oneLine(profileRow?.username),
        location: oneLine(profileRow?.location),
        githubUrl: oneLine(profileRow?.github_url) || null,
      }}
      stats={statisticsRows.map((stat) => ({
        id: stat.id,
        number: oneLine(stat.number),
        label: oneLine(stat.label),
      }))}
      nowItems={nowItems}
      links={links.filter((link) => link.url)}
      featuredPost={featuredRow ? toPost(featuredRow) : null}
      posts={listRows.map(toPost)}
      study={
        studyRow
          ? {
              id: studyRow.id,
              title: studyRow.title,
              slug: studyRow.slug,
              description: oneLine(studyRow.description),
              entryCount: studyRow.entry_count ?? 0,
              difficulty: studyRow.difficulty ?? "beginner",
              progress: studyRow.progress_percent ?? 0,
              tags: studyRow.tags ?? [],
            }
          : null
      }
      project={
        projectRow
          ? {
              id: projectRow.id,
              title: projectRow.title,
              slug: projectRow.slug,
              description: oneLine(projectRow.description),
              tags: projectRow.tags ?? [],
            }
          : null
      }
    />
  );
}
