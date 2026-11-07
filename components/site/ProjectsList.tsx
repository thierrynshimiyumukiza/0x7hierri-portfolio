"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Github } from "lucide-react";
import Thumbnail from "@/components/site/Thumbnail";
import { displayTag } from "@/lib/utils";

export type ProjectItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  tags: string[];
  githubUrl: string | null;
  demoUrl: string | null;
  featured: boolean;
  createdAt: string | null;
};

function normalize(tag: string) {
  return displayTag(tag).toLowerCase();
}

export default function ProjectsList({ projects }: { projects: ProjectItem[] }) {
  const [active, setActive] = useState<string | null>(null);

  // The most-used tags become filters; a long tail of one-off tags is noise.
  const filters = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((project) =>
      new Set(project.tags.map(normalize)).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)),
    );
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }));
  }, [projects]);

  const visible = active ? projects.filter((project) => project.tags.map(normalize).includes(active)) : projects;

  return (
    <>
      {projects.length > 1 && filters.length > 0 ? (
        <div role="group" aria-label="Filter projects by tag" className="flex flex-wrap gap-2" style={{ marginBottom: 28 }}>
          <button type="button" className="ui-chip" aria-pressed={active === null} onClick={() => setActive(null)}>
            all · {projects.length}
          </button>
          {filters.map(({ tag, count }) => (
            <button
              key={tag}
              type="button"
              className="ui-chip"
              aria-pressed={active === tag}
              onClick={() => setActive(active === tag ? null : tag)}
            >
              {tag} · {count}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-6">
        {visible.map((project) => (
          <article
            key={project.id}
            id={project.slug}
            className="ui-card grid overflow-hidden"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))", scrollMarginTop: 96 }}
          >
            <div className="ui-cover" style={{ minHeight: 280, borderRight: "1px solid var(--border)" }}>
              <Thumbnail
                src={project.thumbnailUrl}
                alt=""
                seed={project.title}
                ratio="4/3"
                radius={0}
                sizes="(max-width: 900px) 100vw, 560px"
              />
            </div>

            <div className="flex flex-col gap-5" style={{ padding: 36 }}>
              <div className="flex flex-wrap gap-2">
                {project.demoUrl ? <span className="ui-tag ui-tag-green">● live</span> : null}
                {project.featured ? <span className="ui-tag ui-tag-blue">featured</span> : null}
              </div>
              <div>
                {project.createdAt ? (
                  <div className="ui-mono" style={{ fontSize: 13, color: "var(--text-dim)" }}>
                    {new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(project.createdAt))}
                  </div>
                ) : null}
                <h2 style={{ marginTop: 8, fontSize: 30, letterSpacing: "-0.02em", fontWeight: 600, color: "var(--text-primary)" }}>
                  {project.title}
                </h2>
              </div>
              {project.description ? (
                <p style={{ color: "var(--text-body)", fontSize: 17, lineHeight: 1.65 }}>{project.description}</p>
              ) : null}
              {project.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className="ui-tag">
                      {displayTag(tag)}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-auto flex flex-wrap gap-3">
                {project.demoUrl ? (
                  <a href={project.demoUrl} target="_blank" rel="noreferrer" className="ui-btn ui-btn-primary">
                    Live site <ExternalLink size={14} aria-hidden="true" />
                  </a>
                ) : null}
                {project.githubUrl ? (
                  <a href={project.githubUrl} target="_blank" rel="noreferrer" className="ui-btn">
                    <Github size={15} aria-hidden="true" /> Source code
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
