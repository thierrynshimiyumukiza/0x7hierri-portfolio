/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { File, FileDown } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, generateSlug } from "@/lib/utils";
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

  const [{ data: mediaData, error: mediaError }, { data: timelineData, error: timelineError }] =
    await Promise.all([
      supabase
        .from("study_media")
        .select("id,url,caption,media_type")
        .eq("entry_id", entry.id)
        .order("display_order", { ascending: true }),
      supabase
        .from("study_entries")
        .select("id,slug,title,published_at")
        .eq("category_id", category.id)
        .eq("status", "published")
        .order("published_at", { ascending: false }),
    ]);

  if (mediaError || timelineError) {
    return null;
  }

  const media = (mediaData as Pick<Tables<"study_media">, "id" | "url" | "caption" | "media_type">[] | null) ?? [];
  const timelineEntries =
    (timelineData as Pick<Tables<"study_entries">, "id" | "slug" | "title" | "published_at">[] | null) ?? [];

  const attachmentMedia = media.filter(
    (item) => item.media_type === "pdf" || item.media_type === "attachment",
  );

  const index = timelineEntries.findIndex((item) => item.id === entry.id);
  const prev = index >= 0 ? timelineEntries[index + 1] ?? null : null;
  const next = index > 0 ? timelineEntries[index - 1] ?? null : null;

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/studies/${encodeURIComponent(category.slug)}`}
        className="mono-label mb-6 inline-block hover:text-[--text-primary]"
      >
        {category.title}
      </Link>

      {entry.cover_image_url ? (
        <img
          src={entry.cover_image_url}
          alt={entry.title}
          loading="eager"
          className="mb-6 h-auto w-full rounded-lg border border-[--border] object-cover"
        />
      ) : null}

      <h1 className="text-3xl font-medium tracking-[-1.1px] text-[--text-primary] sm:text-4xl">{entry.title}</h1>

      <p className="mt-2 text-sm text-[--text-dim]">
        {formatDateTime(entry.published_at)}
        {entry.reading_time ? ` · ${entry.reading_time} min` : ""}
        {` · ${category.title}`}
      </p>

      {(entry.tags ?? []).length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {(entry.tags ?? []).map((tag) => (
            <span
              key={`${entry.id}-${tag}`}
              className="rounded-full border border-[--border] px-2 py-0.5 font-mono text-[10px] text-[--text-dim]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        <MarkdownRenderer content={entry.content ?? ""} />
      </div>

      {attachmentMedia.length > 0 ? (
        <div className="mt-10 rounded-lg border border-[--border] bg-[--bg-surface] p-4">
          <div className="space-y-2">
            {attachmentMedia.map((file) => {
              const name = file.url.split("/").pop() ?? file.url;
              return (
                <div key={file.id} className="flex items-center justify-between gap-4 border-b border-[--border] pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-[--text-muted]" />
                    <span className="text-sm text-[--text-body]">{name}</span>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-[--border] px-2 py-1 text-xs text-[--text-muted]"
                  >
                    <FileDown className="h-3 w-3" />
                    <span>{file.caption ?? ""}</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/studies/${encodeURIComponent(category.slug)}/${encodeURIComponent(prev.slug)}`}
            className="surface-card block"
          >
            <p className="text-sm text-[--text-primary]">{prev.title}</p>
          </Link>
        ) : <span />}

        {next ? (
          <Link
            href={`/studies/${encodeURIComponent(category.slug)}/${encodeURIComponent(next.slug)}`}
            className="surface-card block"
          >
            <p className="text-right text-sm text-[--text-primary]">{next.title}</p>
          </Link>
        ) : <span />}
      </div>
    </section>
  );
}
