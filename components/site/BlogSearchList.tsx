/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Tables } from "@/types/database";
import { formatDateTime } from "@/lib/utils";

type BlogSearchListProps = {
  posts: Tables<"blog_posts">[];
};

export default function BlogSearchList({ posts }: BlogSearchListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return posts;

    return posts.filter((entry) => {
      const inTitle = entry.title.toLowerCase().includes(term);
      const inSummary = entry.excerpt?.toLowerCase().includes(term) ?? false;
      const inTags = (entry.tags ?? []).some((tag) => tag.toLowerCase().includes(term));
      return inTitle || inSummary || inTags;
    });
  }, [posts, query]);

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 2rem" }}>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder=""
        style={{
          width: "100%",
          background: "var(--bg-surface)",
          border: "0.5px solid var(--border)",
          borderRadius: "6px",
          color: "var(--text-body)",
          fontSize: "13px",
          padding: "8px 12px",
          outline: "none",
          marginBottom: "14px",
        }}
      />

      <div>
        {filtered.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${encodeURIComponent(post.slug)}`}
            style={{
              display: "grid",
              gridTemplateColumns: "52px 1fr 16px",
              alignItems: "start",
              gap: "12px",
              padding: "1rem 0",
              borderBottom: "0.5px solid var(--border-muted)",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                background: "var(--bg-surface)",
                border: "0.5px solid var(--border)",
                borderRadius: "7px",
                overflow: "hidden",
              }}
            >
              {post.thumbnail_url ? (
                <img
                  src={post.thumbnail_url}
                  alt={post.title}
                  loading="lazy"
                  style={{ width: "52px", height: "52px", objectFit: "cover" }}
                />
              ) : null}
            </div>

            <div>
              <div
                style={{
                  fontSize: "9.5px",
                  color: "var(--text-dim)",
                  fontFamily: "var(--font-mono), monospace",
                  marginBottom: "4px",
                }}
              >
                {formatDateTime(post.published_at)}
                {post.reading_time ? ` · ${post.reading_time} min` : ""}
              </div>

              <div style={{ fontSize: "13px", color: "var(--text-body)", fontWeight: 500, marginBottom: "4px" }}>
                {post.title}
              </div>

              {post.excerpt ? (
                <div style={{ fontSize: "11.5px", color: "var(--text-dim)", lineHeight: 1.6 }}>
                  {post.excerpt}
                </div>
              ) : null}
            </div>

            <div style={{ color: "var(--text-dim)", fontSize: "14px", paddingTop: "2px" }}>→</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
