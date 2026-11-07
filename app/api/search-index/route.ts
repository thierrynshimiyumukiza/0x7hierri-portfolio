import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { releasedFilter } from "@/lib/publishing";

// Rebuilt at most every five minutes; publishing also revalidates the pages
// themselves, so a new post is searchable within that window.
export const revalidate = 300;

export type SearchDoc = {
  kind: "writeup" | "project" | "study" | "page";
  title: string;
  url: string;
  summary: string;
  tags: string[];
};

const PAGES: SearchDoc[] = [
  { kind: "page", title: "Home", url: "/", summary: "", tags: [] },
  { kind: "page", title: "About", url: "/about", summary: "Background, experience and skills", tags: [] },
  { kind: "page", title: "Projects", url: "/projects", summary: "", tags: [] },
  { kind: "page", title: "Study tracks", url: "/studies", summary: "", tags: [] },
  { kind: "page", title: "Writeups", url: "/blog", summary: "", tags: [] },
  { kind: "page", title: "Contact", url: "/contact", summary: "", tags: [] },
];

export async function GET() {
  // Only published rows are selected, so the service client exposes nothing
  // the public pages don't already show.
  const supabase = createAdminClient();
  const [posts, projects, categories, entries] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("title,slug,excerpt,tags")
      .eq("status", "published")
      .or(releasedFilter())
      .order("published_at", { ascending: false }),
    supabase.from("projects").select("title,slug,description,tags").eq("status", "published"),
    supabase.from("study_categories").select("id,title,slug,description,tags").eq("status", "published"),
    supabase.from("study_entries").select("title,slug,summary,tags,category_id").eq("status", "published"),
  ]);

  const categorySlug = new Map((categories.data ?? []).map((category) => [category.id, category.slug]));

  const docs: SearchDoc[] = [
    ...(posts.data ?? []).map((post) => ({
      kind: "writeup" as const,
      title: post.title,
      url: `/blog/${encodeURIComponent(post.slug)}`,
      summary: post.excerpt ?? "",
      tags: post.tags ?? [],
    })),
    ...(projects.data ?? []).map((project) => ({
      kind: "project" as const,
      title: project.title,
      url: `/projects#${encodeURIComponent(project.slug)}`,
      summary: project.description ?? "",
      tags: project.tags ?? [],
    })),
    ...(categories.data ?? []).map((category) => ({
      kind: "study" as const,
      title: category.title,
      url: `/studies/${encodeURIComponent(category.slug)}`,
      summary: category.description ?? "",
      tags: category.tags ?? [],
    })),
    ...(entries.data ?? [])
      .filter((entry) => entry.category_id && categorySlug.has(entry.category_id))
      .map((entry) => ({
        kind: "study" as const,
        title: entry.title,
        url: `/studies/${encodeURIComponent(categorySlug.get(entry.category_id!)!)}/${encodeURIComponent(entry.slug)}`,
        summary: entry.summary ?? "",
        tags: entry.tags ?? [],
      })),
    ...PAGES,
  ];

  return NextResponse.json(docs);
}
