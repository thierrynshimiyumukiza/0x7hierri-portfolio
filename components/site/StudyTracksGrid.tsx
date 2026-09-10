/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";
import SectionHeader from "@/components/site/SectionHeader";
import Thumbnail from "@/components/site/Thumbnail";

export default async function StudyTracksGrid() {
  const supabase = createAdminClient();
  const { data: tracksData, error } = await supabase
    .from("study_categories")
    .select("id,title,slug,description,thumbnail_url,entry_count,progress_percent,difficulty,tags")
    .eq("featured", true)
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  const data =
    (tracksData as Pick<
      Tables<"study_categories">,
      "id" | "title" | "slug" | "description" | "thumbnail_url" | "entry_count" | "progress_percent" | "difficulty" | "tags"
    >[] | null) ?? [];

  if (error || !data?.length) {
    return null;
  }

  return (
    <div style={{ borderTop: "0.5px solid var(--border-muted)" }}>
      <section style={{ maxWidth: "760px", margin: "0 auto", padding: "2.5rem 2rem" }}>
        <SectionHeader title="study tracks" href="/studies" />
        <div style={{ display: "grid", gap: "12px" }}>
          {data.map((track) => (
            <Link key={track.id} href={`/studies/${encodeURIComponent(track.slug)}`} className="track-card" style={{ display: "flex", flexDirection: "column", gap: "10px", textDecoration: "none" }}>
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
                  color: "var(--accent-purple)",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "10px",
                }}
              >
                std
              </div>
              <Thumbnail
                src={track.thumbnail_url}
                alt={track.title}
                seed={track.title}
                ratio="16/9"
                label="std"
                radius={7}
              />

              <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{track.title}</p>
              {track.description ? (
                <p style={{ fontSize: "11.5px", color: "var(--text-dim)", lineHeight: 1.6 }}>{track.description}</p>
              ) : null}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "8px",
                  fontSize: "10.5px",
                  color: "var(--text-dim)",
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                <span>{track.entry_count ?? 0} entries</span>
                <span>{track.difficulty}</span>
              </div>

              <div style={{ height: "4px", width: "100%", overflow: "hidden", borderRadius: "999px", background: "var(--border-muted)" }}>
                <div
                  style={{
                    height: "100%",
                    background: "var(--accent-blue)",
                    width: `${Math.max(0, Math.min(100, track.progress_percent ?? 0))}%`,
                  }}
                />
              </div>

              {(track.tags ?? []).length > 0 ? (
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  {(track.tags ?? []).map((tag) => (
                    <span
                      key={`${track.id}-${tag}`}
                      style={{
                        fontSize: "9.5px",
                        fontFamily: "var(--font-mono), monospace",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        display: "inline-block",
                        color: "var(--accent-purple)",
                        background: "rgba(210,168,255,0.1)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
