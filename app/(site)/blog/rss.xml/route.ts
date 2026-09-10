import { createClient } from "@/lib/supabase/server";
import { displayTag } from "@/lib/utils";
import type { Tables } from "@/types/database";

type FeedPost = Pick<
  Tables<"blog_posts">,
  "title" | "slug" | "excerpt" | "published_at" | "updated_at" | "tags"
>;

/** XML has no escape for a raw ampersand or angle bracket, and post titles have both. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const revalidate = 3600;

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "0x7hierri";

  const supabase = createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("title,slug,excerpt,published_at,updated_at,tags")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  const posts = (data as FeedPost[] | null) ?? [];

  const items = posts
    .map((post) => {
      const link = `${base}/blog/${encodeURIComponent(post.slug)}`;
      const published = post.published_at ?? post.updated_at;

      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        post.excerpt ? `      <description>${escapeXml(post.excerpt.trim())}</description>` : "",
        published ? `      <pubDate>${new Date(published).toUTCString()}</pubDate>` : "",
        ...(post.tags ?? []).map((tag) => `      <category>${escapeXml(displayTag(tag))}</category>`),
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(siteName)} — Blog</title>`,
    `    <link>${escapeXml(`${base}/blog`)}</link>`,
    "    <description>Notes on security research, engineering and things I am currently learning.</description>",
    "    <language>en</language>",
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(`${base}/blog/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
