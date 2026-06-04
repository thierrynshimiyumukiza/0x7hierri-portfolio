import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import type { Tables } from "@/types/database";
import SectionHeader from "@/components/site/SectionHeader";

type TimelineEntry = Pick<
  Tables<"study_entries">,
  "id" | "title" | "slug" | "summary" | "published_at" | "reading_time" | "pinned"
> & {
  study_categories:
    | Pick<Tables<"study_categories">, "title" | "slug">
    | Pick<Tables<"study_categories">, "title" | "slug">[]
    | null;
};

export default async function RecentStudiesTimeline() {
  const supabase = createAdminClient();
  const { data: timelineData, error } = await supabase
    .from("study_entries")
    .select("id,title,slug,summary,published_at,reading_time,pinned,study_categories(title,slug)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(3);
  const data = (timelineData as TimelineEntry[] | null) ?? [];

  if (error || !data?.length) {
    return null;
  }

  return (
    <div style={{ borderTop: "0.5px solid var(--border-muted)" }}>
      <section style={{ maxWidth: "760px", margin: "0 auto", padding: "2.5rem 2rem" }}>
        <SectionHeader title="recent studies" href="/studies" />
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

          {data.map((entry) => {
            const category = Array.isArray(entry.study_categories)
              ? entry.study_categories[0]
              : entry.study_categories;

            return (
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
                  {category?.title ? (
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
                  ) : null}
                  {entry.reading_time ? `${entry.reading_time} min read` : ""}
                </div>

                <Link
                  href={`/studies/${encodeURIComponent(category?.slug ?? "")}/${encodeURIComponent(entry.slug)}`}
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
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
