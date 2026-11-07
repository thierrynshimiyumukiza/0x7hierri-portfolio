import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { displayTag } from "@/lib/utils";
import { getSeoMetadata } from "@/lib/seo";
import type { Tables } from "@/types/database";

export async function generateMetadata(): Promise<Metadata> {
  return getSeoMetadata("studies");
}

type CategoryPageProps = {
  params: {
    category: string;
  };
};

type CategoryRow = Pick<
  Tables<"study_categories">,
  "id" | "title" | "slug" | "description" | "tags" | "difficulty" | "progress_percent"
>;

type EntryRow = Pick<
  Tables<"study_entries">,
  "id" | "title" | "slug" | "summary" | "tags" | "published_at" | "reading_time" | "pinned" | "entry_number"
>;

function shortDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
    : "";
}

export default async function CategoryTimelinePage({ params }: CategoryPageProps) {
  const supabase = createAdminClient();

  const { data: categoryData, error: categoryError } = await supabase
    .from("study_categories")
    .select("id,title,slug,description,tags,difficulty,progress_percent")
    .eq("slug", params.category)
    .eq("status", "published")
    .maybeSingle();

  const category = (categoryData as CategoryRow | null) ?? null;

  if (categoryError || !category) {
    notFound();
  }

  // A track reads in study order, so entries run oldest-first by their number.
  const { data: entriesData, error: entriesError } = await supabase
    .from("study_entries")
    .select("id,title,slug,summary,tags,published_at,reading_time,pinned,entry_number")
    .eq("category_id", category.id)
    .eq("status", "published")
    .order("entry_number", { ascending: true })
    .order("published_at", { ascending: true });

  if (entriesError) {
    return null;
  }

  const entries = (entriesData as EntryRow[] | null) ?? [];
  const progress = Math.max(0, Math.min(100, category.progress_percent ?? 0));
  const base = `/studies/${encodeURIComponent(category.slug)}`;

  return (
    <div className="ui-wrap" style={{ maxWidth: 920 }}>
      <section className="flex flex-col gap-4" style={{ paddingTop: 56, paddingBottom: 36 }}>
        <Link href="/studies" className="ui-link inline-flex items-center gap-2" style={{ fontSize: 14 }}>
          <ArrowLeft size={14} aria-hidden="true" /> All tracks
        </Link>
        <p className="ui-label">$ tree ./studies/{category.slug}</p>
        <h1 className="ui-h1">{category.title}</h1>
        {category.description ? <p className="ui-lead">{category.description}</p> : null}

        <div className="flex flex-wrap items-center gap-2.5" style={{ marginTop: 4 }}>
          <span className={progress >= 100 ? "ui-tag ui-tag-blue" : "ui-tag ui-tag-green"}>
            {progress >= 100 ? "complete" : "in progress"}
          </span>
          {category.difficulty ? <span className="ui-tag">{category.difficulty}</span> : null}
          <span className="ui-tag">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
          {(category.tags ?? []).map((tag) => (
            <span key={tag} className="ui-tag">
              {displayTag(tag)}
            </span>
          ))}
        </div>

        <div style={{ maxWidth: 420, marginTop: 8 }}>
          <div
            className="ui-progress"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Track progress"
          >
            <span style={{ width: `${Math.max(2, progress)}%` }} />
          </div>
          <p className="ui-mono" style={{ marginTop: 8, fontSize: 13, color: "var(--text-dim)" }}>
            {progress}% through the track
          </p>
        </div>
      </section>

      <section style={{ paddingBottom: 96 }}>
        {entries.length === 0 ? (
          <div className="ui-card-dashed" style={{ padding: 28, color: "var(--text-muted)" }}>
            No entries published in this track yet.
          </div>
        ) : (
          <ol className="ui-card" style={{ listStyle: "none", padding: "8px 0" }}>
            {entries.map((entry, index) => (
              <li key={entry.id} style={{ borderTop: index === 0 ? undefined : "1px solid var(--border-muted)" }}>
                <Link
                  href={`${base}/${encodeURIComponent(entry.slug)}`}
                  className="ui-row-link grid gap-4"
                  style={{ gridTemplateColumns: "48px 1fr", padding: "22px 28px" }}
                >
                  <span className="ui-mono" style={{ fontSize: 15, color: "var(--accent-green)", paddingTop: 2 }}>
                    {String(entry.entry_number || index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex min-w-0 flex-col gap-2">
                    <span className="ui-row-title" style={{ fontSize: 19, fontWeight: 600, color: "var(--text-primary)" }}>
                      {entry.title}
                      {entry.pinned ? (
                        <span className="ui-tag ui-tag-amber" style={{ marginLeft: 10, verticalAlign: "middle" }}>
                          pinned
                        </span>
                      ) : null}
                    </span>
                    {entry.summary ? (
                      <span style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)" }}>{entry.summary}</span>
                    ) : null}
                    <span className="ui-mono flex flex-wrap gap-3" style={{ fontSize: 12.5, color: "var(--text-dim)" }}>
                      {entry.published_at ? <span>{shortDate(entry.published_at)}</span> : null}
                      {entry.reading_time ? <span>{entry.reading_time} min read</span> : null}
                      {(entry.tags ?? []).slice(0, 4).map((tag) => (
                        <span key={tag}>#{displayTag(tag)}</span>
                      ))}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
