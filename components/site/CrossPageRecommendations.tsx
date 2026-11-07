import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import type { Tables } from "@/types/database";
import { releasedFilter } from "@/lib/publishing";

type RecommendationType = "project" | "study" | "blog";

type RecommendationCard = {
  id: string;
  type: RecommendationType;
  slug: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  tags: string[];
  href: string;
  score: number;
  timestamp: number;
};

type CrossPageRecommendationsProps = {
  title?: string;
  seedTags?: string[] | null;
  currentType?: RecommendationType;
  currentSlug?: string;
  /** Leave a whole kind out, e.g. projects while already on the projects page. */
  excludeType?: RecommendationType;
  limit?: number;
};

function normalizeTags(tags?: string[] | null): string[] {
  return (tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean);
}

function scoreByTags(candidateTags: string[], seedTags: Set<string>): number {
  if (!seedTags.size) return 0;
  let score = 0;
  candidateTags.forEach((tag) => {
    if (seedTags.has(tag)) score += 1;
  });
  return score;
}

export default async function CrossPageRecommendations({
  title = "You may also like",
  seedTags,
  currentType,
  currentSlug,
  excludeType,
  limit = 4,
}: CrossPageRecommendationsProps) {
  const supabase = createAdminClient();
  const normalizedSeed = new Set(normalizeTags(seedTags));

  const [projectsResult, studiesResult, blogsResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id,title,slug,description,thumbnail_url,tags,updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("study_entries")
      .select("id,title,slug,summary,thumbnail_url,tags,published_at,study_categories(slug)")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(12),
    supabase
      .from("blog_posts")
      .select("id,title,slug,excerpt,thumbnail_url,tags,published_at,reading_time")
      .eq("status", "published")
      .or(releasedFilter())
      .order("published_at", { ascending: false })
      .limit(12),
  ]);

  if (projectsResult.error || studiesResult.error || blogsResult.error) {
    return null;
  }

  const projectRows = (projectsResult.data as Pick<
    Tables<"projects">,
    "id" | "title" | "slug" | "description" | "thumbnail_url" | "tags" | "updated_at"
  >[] | null) ?? [];

  const studyRows = (studiesResult.data as Array<
    Pick<Tables<"study_entries">, "id" | "title" | "slug" | "summary" | "thumbnail_url" | "tags" | "published_at"> & {
      study_categories: { slug: string } | { slug: string }[] | null;
    }
  > | null) ?? [];

  const blogRows = (blogsResult.data as Pick<
    Tables<"blog_posts">,
    "id" | "title" | "slug" | "excerpt" | "thumbnail_url" | "tags" | "published_at" | "reading_time"
  >[] | null) ?? [];

  const projectCards: RecommendationCard[] = projectRows
    .filter((row) => !(currentType === "project" && currentSlug === row.slug))
    .map((row) => {
      const tags = normalizeTags(row.tags);
      return {
        id: `project-${row.id}`,
        type: "project",
        slug: row.slug,
        title: row.title,
        summary: row.description,
        imageUrl: row.thumbnail_url,
        tags,
        href: `/projects#${encodeURIComponent(row.slug)}`,
        score: scoreByTags(tags, normalizedSeed),
        timestamp: new Date(row.updated_at ?? 0).getTime(),
      };
    });

  const studyCards: RecommendationCard[] = studyRows
    .filter((row) => !(currentType === "study" && currentSlug === row.slug))
    .map((row) => {
      const category = Array.isArray(row.study_categories)
        ? row.study_categories[0]
        : row.study_categories;
      const tags = normalizeTags(row.tags);
      return {
        id: `study-${row.id}`,
        type: "study",
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        imageUrl: row.thumbnail_url,
        tags,
        href: category
          ? `/studies/${encodeURIComponent(category.slug)}/${encodeURIComponent(row.slug)}`
          : "/studies",
        score: scoreByTags(tags, normalizedSeed),
        timestamp: new Date(row.published_at ?? 0).getTime(),
      };
    });

  const blogCards: RecommendationCard[] = blogRows
    .filter((row) => !(currentType === "blog" && currentSlug === row.slug))
    .map((row) => {
      const tags = normalizeTags(row.tags);
      return {
        id: `blog-${row.id}`,
        type: "blog",
        slug: row.slug,
        title: row.title,
        summary: row.excerpt,
        imageUrl: row.thumbnail_url,
        tags,
        href: `/blog/${encodeURIComponent(row.slug)}`,
        score: scoreByTags(tags, normalizedSeed),
        timestamp: new Date(row.published_at ?? 0).getTime(),
      };
    });

  const candidates = [...projectCards, ...studyCards, ...blogCards]
    .filter((item) => item.type !== excludeType)
    .filter((item) => Number.isFinite(item.timestamp))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.timestamp - a.timestamp;
    })
    .slice(0, limit);

  if (!candidates.length) {
    return null;
  }

  const kindLabel: Record<RecommendationType, string> = { project: "project", study: "study", blog: "writeup" };

  return (
    <section className="ui-section" aria-labelledby="related-heading">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="related-heading" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
          {title}
        </h2>
        <Link href="/blog" className="ui-link ui-mono" style={{ fontSize: 14 }}>
          all writeups →
        </Link>
      </div>
      <div className="ui-grid-auto" style={{ ["--ui-min" as string]: "300px", ["--ui-gap" as string]: "16px" }}>
        {candidates.map((item) => (
          <Link key={item.id} href={item.href} className="ui-card ui-row-link flex flex-col gap-2.5" style={{ padding: 24 }}>
            <span className="ui-mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>
              {kindLabel[item.type]}
            </span>
            <span className="ui-row-title" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.4, color: "var(--text-primary)" }}>
              {item.title}
            </span>
            {item.summary ? (
              <span className="line-clamp-2" style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.55 }}>
                {item.summary}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
