import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

type SitemapStudyEntry = Pick<Tables<"study_entries">, "slug" | "updated_at"> & {
  study_categories:
    | Pick<Tables<"study_categories">, "slug">
    | Pick<Tables<"study_categories">, "slug">[]
    | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = createClient();

  const [blogResult, categoryResult, entryResult] = await Promise.all([
    supabase.from("blog_posts").select("slug,updated_at").eq("status", "published"),
    supabase.from("study_categories").select("slug,updated_at").eq("status", "published"),
    supabase
      .from("study_entries")
      .select("slug,updated_at,study_categories(slug)")
      .eq("status", "published"),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "/",
    "/projects",
    "/studies",
    "/blog",
    "/about",
    "/contact",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  const blogItems = (blogResult.data as Pick<Tables<"blog_posts">, "slug" | "updated_at">[] | null) ?? [];
  const categories =
    (categoryResult.data as Pick<Tables<"study_categories">, "slug" | "updated_at">[] | null) ?? [];
  const entries = (entryResult.data as SitemapStudyEntry[] | null) ?? [];

  const blogRoutes: MetadataRoute.Sitemap = blogItems.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${base}/studies/${category.slug}`,
    lastModified: category.updated_at ? new Date(category.updated_at) : new Date(),
  }));

  const entryRoutes: MetadataRoute.Sitemap = entries.map((entry) => {
    const category = Array.isArray(entry.study_categories)
      ? entry.study_categories[0]
      : entry.study_categories;
    return {
      url: `${base}/studies/${category?.slug ?? ""}/${entry.slug}`,
      lastModified: entry.updated_at ? new Date(entry.updated_at) : new Date(),
    };
  });

  return [...staticRoutes, ...blogRoutes, ...categoryRoutes, ...entryRoutes];
}
