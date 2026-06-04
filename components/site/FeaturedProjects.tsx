/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import SectionHeader from "@/components/site/SectionHeader";

export default async function FeaturedProjects() {
  const supabase = createClient();
  const { data: projectsData, error } = await supabase
    .from("projects")
    .select("id,title,slug,description,thumbnail_url,tags,github_url,demo_url")
    .eq("featured", true)
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  const data =
    (projectsData as Pick<
      Tables<"projects">,
      "id" | "title" | "slug" | "description" | "thumbnail_url" | "tags" | "github_url" | "demo_url"
    >[] | null) ?? [];

  if (error || !data?.length) {
    return null;
  }

  return (
    <div style={{ borderTop: "0.5px solid var(--border-muted)" }}>
      <section style={{ maxWidth: "760px", margin: "0 auto", padding: "2.5rem 2rem" }}>
        <SectionHeader title="featured projects" href="/projects" />
        <div style={{ display: "grid", gap: "12px" }}>
          {data.map((project) => (
            <article key={project.id} className="design-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                  color: "var(--accent-blue)",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "10px",
                }}
              >
                prj
              </div>

              {project.thumbnail_url ? (
                <img
                  src={project.thumbnail_url}
                  alt={project.title}
                  loading="lazy"
                  style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "7px", border: "0.5px solid var(--border)" }}
                />
              ) : null}

              <Link
                href={`/projects#${project.slug}`}
                style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", textDecoration: "none" }}
              >
                {project.title}
              </Link>

              {project.description ? (
                <p style={{ fontSize: "11.5px", color: "var(--text-dim)", lineHeight: 1.6 }}>
                  {project.description}
                </p>
              ) : null}

              {(project.tags ?? []).length > 0 ? (
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  {(project.tags ?? []).map((tag, index) => {
                    const tagStyle =
                      index % 3 === 0
                        ? { color: "var(--accent-blue)", background: "rgba(88,166,255,0.1)" }
                        : index % 3 === 1
                          ? { color: "var(--accent-purple)", background: "rgba(210,168,255,0.1)" }
                          : { color: "var(--accent-green)", background: "rgba(63,185,80,0.1)" };

                    return (
                      <span
                        key={`${project.id}-${tag}`}
                        style={{
                          fontSize: "9.5px",
                          fontFamily: "var(--font-mono), monospace",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          display: "inline-block",
                          ...tagStyle,
                        }}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
