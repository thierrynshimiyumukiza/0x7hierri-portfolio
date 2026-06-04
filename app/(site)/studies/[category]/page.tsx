import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
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

export default async function CategoryTimelinePage({ params }: CategoryPageProps) {
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
    .select("id,title,slug,summary,thumbnail_url,tags,published_at,reading_time,pinned,status")
    .eq("category_id", category.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (entriesError) {
    return null;
  }

  const entries =
    (entriesData as Pick<
      Tables<"study_entries">,
      "id" | "title" | "slug" | "summary" | "thumbnail_url" | "tags" | "published_at" | "reading_time" | "pinned" | "status"
    >[] | null) ?? [];

  return (
    <section style={{ maxWidth: "760px", margin: "0 auto", padding: "2.5rem 2rem" }}>
      <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
        <div
          style={{
            position: "absolute",
            left: "5px",
            top: "10px",
            bottom: 0,
            width: "0.5px",
            background: "var(--border-muted)",
          }}
        />

        {entries.map((entry) => (
          <div key={entry.id} style={{ position: "relative", marginBottom: "1.8rem" }}>
            <div
              style={{
                position: "absolute",
                left: "-1.5rem",
                top: "4px",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "var(--bg-base)",
                border: "0.5px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: entry.pinned ? "var(--accent-green)" : "var(--accent-blue)",
                }}
              />
            </div>

            <div
              style={{
                fontSize: "10px",
                color: "var(--text-dim)",
                fontFamily: "var(--font-mono), monospace",
                marginBottom: "5px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {formatDateTime(entry.published_at)}
              <span
                style={{
                  color: "var(--accent-blue)",
                  background: "rgba(88,166,255,0.1)",
                  padding: "1px 6px",
                  borderRadius: "8px",
                }}
              >
                {category.title}
              </span>
              {entry.reading_time ? `${entry.reading_time} min read` : ""}
            </div>

            <Link
              href={`/studies/${encodeURIComponent(category.slug)}/${encodeURIComponent(entry.slug)}`}
              style={{
                fontSize: "13px",
                color: "var(--text-primary)",
                fontWeight: 500,
                marginBottom: "4px",
                cursor: "pointer",
                textDecoration: "none",
                display: "block",
              }}
            >
              {entry.title}
            </Link>

            {entry.summary ? (
              <div
                style={{
                  fontSize: "11.5px",
                  color: "var(--text-dim)",
                  lineHeight: 1.6,
                  marginBottom: "8px",
                }}
              >
                {entry.summary}
              </div>
            ) : null}

            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
              {(entry.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "9.5px",
                    color: "var(--text-dim)",
                    fontFamily: "var(--font-mono), monospace",
                    background: "var(--bg-surface)",
                    border: "0.5px solid var(--border)",
                    padding: "1px 7px",
                    borderRadius: "4px",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
