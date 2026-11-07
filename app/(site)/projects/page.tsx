import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSeoMetadata } from "@/lib/seo";
import type { Tables } from "@/types/database";
import CrossPageRecommendations from "@/components/site/CrossPageRecommendations";
import ProjectsList from "@/components/site/ProjectsList";

export async function generateMetadata(): Promise<Metadata> {
  return getSeoMetadata("projects");
}

export default async function ProjectsPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id,title,slug,description,thumbnail_url,tags,github_url,demo_url,featured,created_at")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) {
    return null;
  }

  const projects = (data as Tables<"projects">[] | null) ?? [];
  const recommendationTags = projects.flatMap((project) => project.tags ?? []).slice(0, 12);

  return (
    <div className="ui-wrap">
      <section className="flex flex-col gap-[18px]" style={{ paddingTop: 72, paddingBottom: 36 }}>
        <p className="ui-label">$ ls ./projects</p>
        <h1 className="ui-h1">Projects</h1>
        <p className="ui-lead">Tools, exploits and builds, each with what it does, how it&apos;s built and where to see it.</p>
      </section>

      <section style={{ paddingBottom: 72 }}>
        {projects.length > 0 ? (
          <ProjectsList
            projects={projects.map((project) => ({
              id: project.id,
              title: project.title,
              slug: project.slug,
              description: project.description ?? "",
              thumbnailUrl: project.thumbnail_url ?? null,
              tags: project.tags ?? [],
              githubUrl: project.github_url ?? null,
              demoUrl: project.demo_url ?? null,
              featured: Boolean(project.featured),
              createdAt: project.created_at ?? null,
            }))}
          />
        ) : (
          <div className="ui-card-dashed" style={{ padding: 32, color: "var(--text-muted)" }}>
            No projects published yet.
          </div>
        )}
      </section>

      <CrossPageRecommendations title="Related writeups and studies" seedTags={recommendationTags} excludeType="project" limit={3} />
    </div>
  );
}
