import type { Metadata } from "next";
import { format, formatDistanceToNow } from "date-fns";
import { getSeoMetadata } from "@/lib/seo";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingTableError } from "@/lib/supabase/errors";
import type { Database, Tables } from "@/types/database";
import HomePageClient from "@/components/site/home/HomePageClient";

export async function generateMetadata(): Promise<Metadata> {
  return getSeoMetadata("home");
}

type FeedItem = {
  id: string;
  type: "project" | "study" | "blog";
  title: string;
  description: string;
  thumbnail_url: string | null;
  tags: string[];
  url: string;
  meta: string;
  date: string;
  progress?: number;
};

type LiveItem = {
  type: "published" | "updated" | "in_progress";
  title: string;
  url: string;
  date: string;
};

type HomepageSettingsRow = {
  id: string;
  about_preview_title: string | null;
  about_preview_text: string | null;
  about_preview_button_text: string | null;
  about_preview_url: string | null;
};

type HomepageExpertiseRow = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
  visible: boolean | null;
};

function oneLine(text: string | null | undefined): string {
  if (!text) {
    return "";
  }

  return text.replace(/\s+/g, " ").trim();
}

export default async function HomePage() {
  const supabase = createAdminClient();
  const fromLooseTable = <T extends keyof Database["public"]["Tables"]>(
  table: T
) => {
  return supabase.from(table);
};                                                                                                                                                                                                                                                
  
  const [hero, profile, stats, projects, studies, blogs, navItems, homepageSettings, homepageExpertise, socialLinks] = await Promise.all([
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
      .order("published_at", { ascending: false })
      .limit(4),
    supabase.from("navigation").select("*").eq("visible", true).order("display_order"),
    fromLooseTable("homepage_settings").select("*").maybeSingle(),
    fromLooseTable("homepage_expertise").select("*").eq("visible", true).order("display_order"),
    fromLooseTable("social_links").select("*").eq("visible", true).order("display_order"),
  ]);

  const heroRow = (hero.data as Tables<"hero_settings"> | null) ?? null;
  const profileRow = (profile.data as Tables<"profile"> | null) ?? null;
  const statisticsRows = (stats.data as Tables<"statistics">[] | null) ?? [];
  const projectRows = (projects.data as Tables<"projects">[] | null) ?? [];
  const studyRows = (studies.data as Tables<"study_categories">[] | null) ?? [];
  const blogRows = (blogs.data as Tables<"blog_posts">[] | null) ?? [];
  const navigationRows = (navItems.data as Tables<"navigation">[] | null) ?? [];
  const homepageSettingsMissing = isMissingTableError(homepageSettings.error ?? null, "homepage_settings");
  const homepageExpertiseMissing = isMissingTableError(homepageExpertise.error ?? null, "homepage_expertise");
  const socialLinksMissing = isMissingTableError(socialLinks.error ?? null, "social_links");

  const homepageSettingsRow =
    (!homepageSettings.error || homepageSettingsMissing)
      ? ((homepageSettings.data as HomepageSettingsRow | null) ?? null)
      : null;

  const homepageExpertiseRows =
    (!homepageExpertise.error || homepageExpertiseMissing)
      ? ((homepageExpertise.data as HomepageExpertiseRow[] | null) ?? [])
      : [];

  const socialLinkRows =
    (!socialLinks.error || socialLinksMissing)
      ? (((socialLinks.data as Array<{ id: string; label: string; url: string; platform: string | null }> | null) ?? []))
      : [];

  const aboutLink = navigationRows.find((item) => item.url.startsWith("/about"))?.url ?? "/about";

  const feedItems: FeedItem[] = [
    ...projectRows.map((p) => ({
      id: p.id,
      type: "project" as const,
      title: p.title,
      description: p.description ?? "",
      thumbnail_url: p.thumbnail_url ?? null,
      tags: p.tags ?? [],
      url: `/projects/${p.slug}`,
      meta: "project",
      date: p.created_at ? format(new Date(p.created_at), "MMM dd") : "",
      progress: undefined,
    })),
    ...studyRows.map((s) => ({
      id: s.id,
      type: "study" as const,
      title: s.title,
      description: s.description ?? "",
      thumbnail_url: s.thumbnail_url ?? null,
      tags: s.tags ?? [],
      url: `/studies/${s.slug}`,
      meta: `${s.entry_count ?? 0} entries · ${s.difficulty ?? "beginner"}`,
      date: s.updated_at ? format(new Date(s.updated_at), "MMM dd") : "",
      progress: s.progress_percent ?? 0,
    })),
    ...blogRows.map((b) => ({
      id: b.id,
      type: "blog" as const,
      title: b.title,
      description: b.excerpt ?? "",
      thumbnail_url: b.thumbnail_url ?? null,
      tags: b.tags ?? [],
      url: `/blog/${b.slug}`,
      meta: `${b.reading_time ?? 1} min read`,
      date: b.published_at ? format(new Date(b.published_at), "MMM dd") : "",
      progress: undefined,
    })),
  ];

  const liveItems: LiveItem[] = [
    ...(blogRows ?? []).slice(0, 3).map((b) => ({
      type: "published" as const,
      title: b.title,
      url: `/blog/${b.slug}`,
      date: b.published_at
        ? formatDistanceToNow(new Date(b.published_at), { addSuffix: true })
        : "",
    })),
    ...(studyRows ?? []).slice(0, 2).map((s) => ({
      type: "updated" as const,
      title: s.title,
      url: `/studies/${s.slug}`,
      date: s.updated_at
        ? formatDistanceToNow(new Date(s.updated_at), { addSuffix: true })
        : "",
    })),
    ...(projectRows ?? []).slice(0, 2).map((p) => ({
      type: "in_progress" as const,
      title: p.title,
      url: `/projects/${p.slug}`,
      date: p.updated_at
        ? formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })
        : "",
    })),
  ].slice(0, 5);

  return (
    <HomePageClient
      hero={{
        heading_line1: oneLine(heroRow?.heading_line1),
        heading_line2: oneLine(heroRow?.heading_line2),
        heading_line3: oneLine(heroRow?.heading_line3),
        subheading: oneLine(heroRow?.subheading),
        description: oneLine(heroRow?.description) || oneLine(profileRow?.bio),
        cta_primary_text: oneLine(heroRow?.cta_primary_text),
        cta_primary_url: oneLine(heroRow?.cta_primary_url),
        cta_secondary_text: oneLine(heroRow?.cta_secondary_text),
        cta_secondary_url: oneLine(heroRow?.cta_secondary_url),
        show_availability: Boolean(heroRow?.show_availability),
        availability_text: oneLine(profileRow?.availability_text),
      }}
      profile={{
        profile_picture_url: oneLine(profileRow?.profile_picture_url) || null,
        username: oneLine(profileRow?.username),
        location: oneLine(profileRow?.location),
        bio: oneLine(profileRow?.bio),
        availability_status: Boolean(profileRow?.availability_status),
        availability_text: oneLine(profileRow?.availability_text),
        github_url: oneLine(profileRow?.github_url) || null,
        twitter_url: oneLine(profileRow?.twitter_url) || null,
        linkedin_url: oneLine(profileRow?.linkedin_url) || null,
      }}
      stats={statisticsRows.map((stat) => ({
        id: stat.id,
        number: oneLine(stat.number),
        label: oneLine(stat.label),
      }))}
      feedItems={feedItems}
      liveItems={liveItems}
      aboutLink={aboutLink}
      expertiseItems={homepageExpertiseRows.map((item) => ({
        id: item.id,
        title: oneLine(item.title),
        description: oneLine(item.description),
        icon: oneLine(item.icon) || "shield",
      }))}
      homepageSettings={{
        about_preview_title: oneLine(homepageSettingsRow?.about_preview_title),
        about_preview_text: oneLine(homepageSettingsRow?.about_preview_text) || profileRow?.bio || "",
        about_preview_button_text: oneLine(homepageSettingsRow?.about_preview_button_text),
        about_preview_url: oneLine(homepageSettingsRow?.about_preview_url) || aboutLink,
      }}
      socialLinks={socialLinkRows.map((item) => ({
        id: item.id,
        label: oneLine(item.label) || oneLine(item.platform) || "social",
        url: oneLine(item.url),
      }))}
    />
  );
}
