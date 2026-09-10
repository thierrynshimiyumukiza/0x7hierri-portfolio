/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import type { Tables } from "@/types/database";
import SectionHeader from "@/components/site/SectionHeader";
import Thumbnail from "@/components/site/Thumbnail";

export default async function LatestBlogPosts() {
  const supabase = createClient();
  const { data: postsData, error } = await supabase
    .from("blog_posts")
    .select("id,title,slug,excerpt,thumbnail_url,published_at,reading_time,tags")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(2);
  const data =
    (postsData as Pick<
      Tables<"blog_posts">,
      "id" | "title" | "slug" | "excerpt" | "thumbnail_url" | "published_at" | "reading_time" | "tags"
    >[] | null) ?? [];

  if (error || !data?.length) {
    return null;
  }

  return (
    <div style={{ borderTop: "0.5px solid var(--border-muted)" }}>
      <section style={{ maxWidth: "760px", margin: "0 auto", padding: "2.5rem 2rem" }}>
        <SectionHeader title="latest blog posts" href="/blog" />
        <div style={{ display: "grid", gap: "12px" }}>
          {data.map((post) => (
            <article key={post.id} className="post-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "7px",
                  background: "var(--bg-base)",
                  border: "0.5px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "0.9rem",
                  color: "var(--accent-green)",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "10px",
                }}
              >
                blg
              </div>
              <Thumbnail
                src={post.thumbnail_url}
                alt={post.title}
                seed={post.title}
                ratio="16/9"
                maxHeight={190}
                sizes="(max-width: 800px) 100vw, 700px"
                label="blg"
                radius={7}
              />

              <p style={{ fontSize: "9.5px", color: "var(--text-dim)", fontFamily: "var(--font-mono), monospace" }}>
                {formatDateTime(post.published_at)}
                {post.reading_time ? ` · ${post.reading_time} min` : ""}
              </p>

              <Link href={`/blog/${encodeURIComponent(post.slug)}`} style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500, textDecoration: "none" }}>
                {post.title}
              </Link>

              {post.excerpt ? (
                <p style={{ fontSize: "11.5px", color: "var(--text-dim)", lineHeight: 1.6 }}>{post.excerpt}</p>
              ) : null}

              {(post.tags ?? []).length > 0 ? (
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  {(post.tags ?? []).map((tag) => (
                    <span
                      key={`${post.id}-${tag}`}
                      style={{
                        fontSize: "9.5px",
                        fontFamily: "var(--font-mono), monospace",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        display: "inline-block",
                        color: "var(--accent-green)",
                        background: "rgba(63,185,80,0.1)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
