"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import Thumbnail from "@/components/site/Thumbnail";
import { displayTag, formatDateTime } from "@/lib/utils";
import type { Tables } from "@/types/database";

export type AdminBlogRow = Pick<
  Tables<"blog_posts">,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "thumbnail_url"
  | "tags"
  | "status"
  | "featured"
  | "reading_time"
  | "published_at"
  | "updated_at"
>;

type BlogPostsManagerProps = {
  posts: AdminBlogRow[];
  siteUrl: string;
  onDelete: (formData: FormData) => Promise<void>;
  onDuplicate: (formData: FormData) => Promise<void>;
  onToggleStatus: (formData: FormData) => Promise<void>;
  onToggleFeatured: (formData: FormData) => Promise<void>;
};

type StatusFilter = "all" | "published" | "draft" | "archived";
type SortMode = "updated" | "published" | "title";

function timeOf(value?: string | null): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function BlogPostsManager({
  posts,
  siteUrl,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onToggleFeatured,
}: BlogPostsManagerProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tagFilter, setTagFilter] = useState("");
  const [sort, setSort] = useState<SortMode>("updated");
  const [confirmingId, setConfirmingId] = useState("");

  const counts = useMemo(
    () => ({
      all: posts.length,
      published: posts.filter((post) => post.status === "published").length,
      draft: posts.filter((post) => post.status === "draft").length,
      archived: posts.filter((post) => post.status === "archived").length,
    }),
    [posts],
  );

  const allTags = useMemo(
    () => Array.from(new Set(posts.flatMap((post) => post.tags ?? []))).sort(),
    [posts],
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();

    const filtered = posts.filter((post) => {
      if (statusFilter !== "all" && post.status !== statusFilter) return false;
      if (tagFilter && !(post.tags ?? []).includes(tagFilter)) return false;
      if (!term) return true;

      return (
        post.title.toLowerCase().includes(term) ||
        post.slug.toLowerCase().includes(term) ||
        (post.excerpt ?? "").toLowerCase().includes(term)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "published") return timeOf(b.published_at) - timeOf(a.published_at);
      return timeOf(b.updated_at) - timeOf(a.updated_at);
    });
  }, [posts, query, statusFilter, tagFilter, sort]);

  return (
    <section className="cms-list">
      <header className="cms-list-head">
        <div>
          <h1 className="cms-list-title">Blog</h1>
          <p className="admin-hint">
            {counts.all} posts · {counts.published} published · {counts.draft} drafts
          </p>
        </div>

        <Link href="/admin/blog/new" className="admin-button admin-button-primary">
          <Plus size={13} aria-hidden="true" />
          New post
        </Link>
      </header>

      <div className="cms-list-controls">
        <div className="blog-search">
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, slug or summary"
            aria-label="Search posts"
          />
        </div>

        <div className="cms-filter-row">
          {(["all", "published", "draft", "archived"] as StatusFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              className="cms-filter-chip"
              data-active={statusFilter === value ? "true" : "false"}
              onClick={() => setStatusFilter(value)}
            >
              {value}
              <span>{counts[value]}</span>
            </button>
          ))}

          <select
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
            aria-label="Filter by tag"
            className="admin-input cms-select"
          >
            <option value="">All tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                #{displayTag(tag)}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            aria-label="Sort posts"
            className="admin-input cms-select"
          >
            <option value="updated">Recently updated</option>
            <option value="published">Recently published</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="cms-empty">
          <p>No posts match these filters.</p>
          <button
            type="button"
            className="admin-button admin-button-ghost"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
              setTagFilter("");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="cms-rows">
          {visible.map((post) => (
            <li key={post.id} className="cms-row">
              <Thumbnail
                src={post.thumbnail_url}
                alt={post.title}
                seed={post.title}
                compact
                radius={9}
                className="cms-row-thumb"
              />

              <div className="cms-row-body">
                <div className="cms-row-title-line">
                  <Link href={`/admin/blog/${post.id}`} className="cms-row-title">
                    {post.title}
                  </Link>
                  <span className={`status-pill status-pill-${post.status ?? "draft"}`}>{post.status ?? "draft"}</span>
                  {post.featured ? (
                    <span className="status-pill status-pill-featured">
                      <Star size={10} aria-hidden="true" /> featured
                    </span>
                  ) : null}
                </div>

                <p className="cms-row-meta">
                  /{post.slug}
                  {post.published_at ? ` · ${formatDateTime(post.published_at)}` : " · not published"}
                  {post.reading_time ? ` · ${post.reading_time} min` : ""}
                </p>

                {post.excerpt ? <p className="cms-row-excerpt">{post.excerpt}</p> : null}

                {(post.tags ?? []).length > 0 ? (
                  <div className="cms-row-tags">
                    {(post.tags ?? []).slice(0, 5).map((tag) => (
                      <button key={`${post.id}-${tag}`} type="button" onClick={() => setTagFilter(tag)}>
                        #{displayTag(tag)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="cms-row-actions">
                <Link href={`/admin/blog/${post.id}`} className="icon-button" title="Edit post">
                  <Pencil size={13} aria-hidden="true" />
                  <span className="sr-only">Edit</span>
                </Link>

                {post.status === "published" ? (
                  <a
                    href={`${siteUrl}/blog/${post.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="icon-button"
                    title="Open live post"
                  >
                    <ExternalLink size={13} aria-hidden="true" />
                    <span className="sr-only">Open live post</span>
                  </a>
                ) : null}

                <form action={onToggleStatus}>
                  <input type="hidden" name="id" value={post.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={post.status === "published" ? "draft" : "published"}
                  />
                  <button
                    type="submit"
                    className="icon-button"
                    title={post.status === "published" ? "Move back to draft" : "Publish now"}
                  >
                    {post.status === "published" ? (
                      <EyeOff size={13} aria-hidden="true" />
                    ) : (
                      <Eye size={13} aria-hidden="true" />
                    )}
                    <span className="sr-only">{post.status === "published" ? "Unpublish" : "Publish"}</span>
                  </button>
                </form>

                <form action={onToggleFeatured}>
                  <input type="hidden" name="id" value={post.id} />
                  <input type="hidden" name="featured" value={post.featured ? "false" : "true"} />
                  <button
                    type="submit"
                    className="icon-button"
                    data-active={post.featured ? "true" : "false"}
                    title={post.featured ? "Remove from featured" : "Mark as featured"}
                  >
                    <Star size={13} aria-hidden="true" />
                    <span className="sr-only">Toggle featured</span>
                  </button>
                </form>

                <form action={onDuplicate}>
                  <input type="hidden" name="id" value={post.id} />
                  <button type="submit" className="icon-button" title="Duplicate as draft">
                    <Copy size={13} aria-hidden="true" />
                    <span className="sr-only">Duplicate</span>
                  </button>
                </form>

                {confirmingId === post.id ? (
                  <form action={onDelete} className="cms-confirm">
                    <input type="hidden" name="id" value={post.id} />
                    <button type="submit" className="admin-button admin-button-danger">
                      Delete
                    </button>
                    <button
                      type="button"
                      className="admin-button admin-button-ghost"
                      onClick={() => setConfirmingId("")}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="icon-button icon-button-danger"
                    onClick={() => setConfirmingId(post.id)}
                    title="Delete post"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    <span className="sr-only">Delete</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
