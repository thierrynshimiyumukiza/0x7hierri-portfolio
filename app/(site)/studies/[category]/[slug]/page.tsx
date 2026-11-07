/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, File, FileDown } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { displayTag, formatDateTime, generateSlug } from "@/lib/utils";
import { extractOutline } from "@/lib/markdown-outline";
import TableOfContents from "@/components/site/markdown/TableOfContents";
import MarkdownRenderer from "@/components/site/markdown/MarkdownRenderer";
import type { Tables } from "@/types/database";

type StudyEntryPageProps = {
  params: {
    category: string;
    slug: string;
  };
};

export async function generateMetadata({ params }: StudyEntryPageProps): Promise<Metadata> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("study_entries")
    .select("title,meta_title,meta_description")
    .eq("slug", params.slug)
    .maybeSingle();

  const entry =
    (data as Pick<Tables<"study_entries">, "title" | "meta_title" | "meta_description"> | null) ?? null;

  return {
    title: entry?.meta_title ?? entry?.title ?? process.env.NEXT_PUBLIC_SITE_NAME ?? "0x7hierri",
    description: entry?.meta_description ?? undefined,
    openGraph: {
      title: entry?.meta_title ?? entry?.title ?? process.env.NEXT_PUBLIC_SITE_NAME ?? "0x7hierri",
      description: entry?.meta_description ?? undefined,
    },
  };
}

export default async function StudyEntryPage({ params }: StudyEntryPageProps) {
  const supabase = createAdminClient();

  const { data: categoryData, error: categoryError } = await supabase
    .from("study_categories")
    .select("id,title,slug")
    .eq("slug", params.category)
    .eq("status", "published")
    .maybeSingle();

  const category = (categoryData as Pick<Tables<"study_categories">, "id" | "title" | "slug"> | null) ?? null;

  if (categoryError || !category) {
    notFound();
  }

  const { data: entriesData, error: entriesError } = await supabase
    .from("study_entries")
    .select("*")
    .eq("category_id", category.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const entries = (entriesData as Tables<"study_entries">[] | null) ?? [];
  const requestedSlug = decodeURIComponent(params.slug);
  const normalizedRequestedSlug = generateSlug(requestedSlug);
  const entry =
    entries.find((item) => item.slug === requestedSlug) ??
    entries.find((item) => generateSlug(item.slug) === normalizedRequestedSlug) ??
    null;

  if (entriesError || !entry) {
    notFound();
  }

  const { data: mediaData, error: mediaError } = await supabase
    .from("study_media")
    .select("id,url,caption,media_type")
    .eq("entry_id", entry.id)
    .order("display_order", { ascending: true });

  if (mediaError) {
    return null;
  }

  const media = (mediaData as Pick<Tables<"study_media">, "id" | "url" | "caption" | "media_type">[] | null) ?? [];
  const attachmentMedia = media.filter(
    (item) => item.media_type === "pdf" || item.media_type === "attachment",
  );

  // entries is newest-first, so the previous note sits one index later.
  const index = entries.findIndex((item) => item.id === entry.id);
  const prev = index >= 0 ? entries[index + 1] ?? null : null;
  const next = index > 0 ? entries[index - 1] ?? null : null;

  const content = entry.content ?? "";
  const outline = extractOutline(content);
  const trackHref = `/studies/${encodeURIComponent(category.slug)}`;

  return (
    <div className="article-page">
      <div className="article-shell">
        <header className="article-header">
          <Link href={trackHref} className="article-back">
            <ArrowLeft size={13} aria-hidden="true" />
            {category.title}
          </Link>

          {entry.entry_number ? (
            <p className="ui-label" style={{ color: "var(--accent-green)" }}>
              entry {String(entry.entry_number).padStart(2, "0")}
            </p>
          ) : null}

          <h1 className="article-title">{entry.title}</h1>

          {entry.summary ? <p className="article-lede">{entry.summary}</p> : null}

          <div className="article-meta">
            {entry.published_at ? (
              <span className="article-meta-item">
                <CalendarDays size={12} aria-hidden="true" />
                {formatDateTime(entry.published_at)}
              </span>
            ) : null}
            {entry.reading_time ? (
              <span className="article-meta-item">
                <Clock size={12} aria-hidden="true" />
                {entry.reading_time} min read
              </span>
            ) : null}
          </div>

          {(entry.tags ?? []).length > 0 ? (
            <ul className="article-tags">
              {(entry.tags ?? []).map((tag) => (
                <li key={`${entry.id}-${tag}`}>
                  <span className="article-tag">#{displayTag(tag)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        {entry.cover_image_url ? (
          <figure className="article-cover">
            <img src={entry.cover_image_url} alt={entry.title} loading="eager" style={{
                width: "100%",
                maxHeight: 360,
                objectFit: "contain",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--bg-sunken)",
              }} />
          </figure>
        ) : null}

        <div className="article-body">
          <aside className="article-aside">
            <TableOfContents items={outline} />
          </aside>

          <article className="article-content">
            {content.trim() ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="article-empty">This note has no content yet.</p>
            )}

            {attachmentMedia.length > 0 ? (
              <div className="ui-card" style={{ marginTop: 40, padding: "8px 0" }}>
                <p className="ui-label" style={{ padding: "12px 20px" }}>
                  attachments
                </p>
                {attachmentMedia.map((file) => {
                  const name = file.url.split("/").pop() ?? file.url;
                  return (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="ui-row-link flex items-center justify-between gap-4"
                      style={{ padding: "12px 20px", borderTop: "1px solid var(--border-muted)" }}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <File size={16} aria-hidden="true" style={{ color: "var(--text-dim)" }} />
                        <span className="ui-row-title truncate" style={{ fontSize: 15, color: "var(--text-body)" }}>
                          {file.caption || name}
                        </span>
                      </span>
                      <FileDown size={16} aria-hidden="true" style={{ color: "var(--text-dim)" }} />
                    </a>
                  );
                })}
              </div>
            ) : null}
          </article>
        </div>

        {prev || next ? (
          <nav className="article-pager" aria-label="More notes in this track">
            {prev ? (
              <Link href={`${trackHref}/${encodeURIComponent(prev.slug)}`} className="article-pager-link">
                <span className="article-pager-label">
                  <ArrowLeft size={12} aria-hidden="true" /> Previous
                </span>
                <span className="article-pager-title">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}

            {next ? (
              <Link href={`${trackHref}/${encodeURIComponent(next.slug)}`} className="article-pager-link article-pager-next">
                <span className="article-pager-label">
                  Next <ArrowRight size={12} aria-hidden="true" />
                </span>
                <span className="article-pager-title">{next.title}</span>
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
