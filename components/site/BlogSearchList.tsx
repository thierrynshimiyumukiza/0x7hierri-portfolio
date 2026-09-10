"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, LayoutGrid, Rows3, Search, Star, X } from "lucide-react";
import type { Tables } from "@/types/database";
import { displayTag, formatDateTime } from "@/lib/utils";
import Thumbnail from "@/components/site/Thumbnail";

type BlogPost = Pick<
  Tables<"blog_posts">,
  "id" | "title" | "slug" | "excerpt" | "thumbnail_url" | "tags" | "published_at" | "reading_time" | "featured"
>;

type BlogSearchListProps = {
  posts: BlogPost[];
  initialTag?: string;
};

type SortMode = "newest" | "oldest" | "longest" | "shortest";
type Layout = "grid" | "list";

const SORT_LABELS: Record<SortMode, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  longest: "Longest read",
  shortest: "Quickest read",
};

function publishedTime(post: BlogPost): number {
  const value = post.published_at ? new Date(post.published_at).getTime() : 0;
  return Number.isNaN(value) ? 0 : value;
}

export default function BlogSearchList({ posts, initialTag = "" }: BlogSearchListProps) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState(initialTag);
  const [sort, setSort] = useState<SortMode>("newest");
  const [layout, setLayout] = useState<Layout>("grid");
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setActiveTag(initialTag);
  }, [initialTag]);

  // "/" jumps to the search box the way it does in every developer tool, and
  // Escape hands focus back so the shortcut never traps a keyboard reader.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (event.key === "Escape" && target === searchRef.current) {
        searchRef.current?.blur();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((post) => {
      (post.tags ?? []).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 14)
      .map(([tag, count]) => ({ tag, count }));
  }, [posts]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    const matched = posts.filter((post) => {
      if (activeTag && !(post.tags ?? []).includes(activeTag)) return false;
      if (!term) return true;

      return (
        post.title.toLowerCase().includes(term) ||
        (post.excerpt ?? "").toLowerCase().includes(term) ||
        (post.tags ?? []).some((tag) => tag.toLowerCase().includes(term))
      );
    });

    const sorted = [...matched];
    sorted.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return publishedTime(a) - publishedTime(b);
        case "longest":
          return (b.reading_time ?? 0) - (a.reading_time ?? 0);
        case "shortest":
          return (a.reading_time ?? 0) - (b.reading_time ?? 0);
        default:
          return publishedTime(b) - publishedTime(a);
      }
    });

    return sorted;
  }, [posts, query, activeTag, sort]);

  // The lead slot is an editorial choice, so it only appears on the unfiltered
  // grid. Once the reader is searching or filtering, every result ranks equally.
  const browsing = !query.trim() && !activeTag && sort === "newest" && layout === "grid";
  const lead = browsing ? filtered.find((post) => post.featured) ?? filtered[0] ?? null : null;
  const rest = lead ? filtered.filter((post) => post.id !== lead.id) : filtered;

  return (
    <div className="blog-index">
      <div className="blog-controls">
        <div className="blog-search">
          <Search size={14} aria-hidden="true" />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search posts, summaries and tags"
            aria-label="Search blog posts"
            type="search"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={13} aria-hidden="true" />
            </button>
          ) : (
            <kbd className="blog-search-hint" aria-hidden="true">
              /
            </kbd>
          )}
        </div>

        <div className="blog-control-row">
          <label className="blog-sort">
            <span className="sr-only">Sort posts</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
              {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {SORT_LABELS[mode]}
                </option>
              ))}
            </select>
          </label>

          <div className="blog-layout-toggle" role="group" aria-label="Layout">
            <button
              type="button"
              onClick={() => setLayout("grid")}
              data-active={layout === "grid" ? "true" : "false"}
              aria-label="Grid layout"
            >
              <LayoutGrid size={13} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setLayout("list")}
              data-active={layout === "list" ? "true" : "false"}
              aria-label="List layout"
            >
              <Rows3 size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {allTags.length > 0 ? (
        <div className="blog-tag-filter">
          <button
            type="button"
            onClick={() => setActiveTag("")}
            data-active={activeTag === "" ? "true" : "false"}
            className="blog-tag-chip"
          >
            All
            <span>{posts.length}</span>
          </button>

          {allTags.map(({ tag, count }) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag((current) => (current === tag ? "" : tag))}
              data-active={activeTag === tag ? "true" : "false"}
              className="blog-tag-chip"
            >
              #{displayTag(tag)}
              <span>{count}</span>
            </button>
          ))}
        </div>
      ) : null}

      <p className="blog-result-count" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "post" : "posts"}
        {activeTag ? ` tagged #${displayTag(activeTag)}` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="blog-empty">
          <p>No posts match that search.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveTag("");
            }}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <>
          {lead ? (
            <Link href={`/blog/${encodeURIComponent(lead.slug)}`} className="blog-lead">
              <Thumbnail
                src={lead.thumbnail_url}
                alt={lead.title}
                seed={lead.title}
                ratio="16/9"
                maxHeight={240}
                sizes="(max-width: 780px) 100vw, 420px"
                label="blog"
                radius={11}
                eager
              />

              <div className="blog-lead-body">
                <span className="blog-lead-kicker">
                  {lead.featured ? <Star size={10} aria-hidden="true" /> : null}
                  {lead.featured ? "Featured" : "Latest"}
                </span>

                <h2 className="blog-lead-title">{lead.title}</h2>

                {lead.excerpt ? <p className="blog-lead-excerpt">{lead.excerpt}</p> : null}

                <div className="blog-entry-meta">
                  {lead.published_at ? <span>{formatDateTime(lead.published_at)}</span> : null}
                  {lead.reading_time ? <span>{lead.reading_time} min read</span> : null}
                </div>

                <span className="blog-lead-cta">
                  Read the post
                  <ArrowRight size={12} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ) : null}

          <div className={layout === "grid" ? "blog-grid" : "blog-list"}>
            {rest.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${encodeURIComponent(post.slug)}`}
                className={layout === "grid" ? "blog-card" : "blog-row"}
              >
                <Thumbnail
                  src={post.thumbnail_url}
                  alt={post.title}
                  seed={post.title}
                  ratio="16/9"
                  compact={layout === "list"}
                  maxHeight={layout === "list" ? undefined : 168}
                  sizes="(max-width: 640px) 100vw, 320px"
                  label="blog"
                  radius={layout === "list" ? 9 : 11}
                />

                <div className="blog-entry-body">
                  <div className="blog-entry-meta">
                    {post.published_at ? <span>{formatDateTime(post.published_at)}</span> : null}
                    {post.reading_time ? <span>{post.reading_time} min</span> : null}
                    {post.featured ? (
                      <span className="blog-entry-featured">
                        <Star size={10} aria-hidden="true" /> Featured
                      </span>
                    ) : null}
                  </div>

                  <h3 className="blog-entry-title">{post.title}</h3>

                  {post.excerpt ? <p className="blog-entry-excerpt">{post.excerpt}</p> : null}

                  {(post.tags ?? []).length > 0 ? (
                    <div className="blog-entry-tags">
                      {(post.tags ?? []).slice(0, 4).map((tag) => (
                        <span key={`${post.id}-${tag}`}>#{displayTag(tag)}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
