"use client";

import { useEffect, useMemo, useState } from "react";
import UnifiedPreviewCard from "@/components/site/UnifiedPreviewCard";

type PathMode = "recruiter" | "collaborator" | "learner" | "builder";
type SpotlightOrder = "balanced" | "build-first" | "learn-first";

type ProjectPreview = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  demo_url: string | null;
  github_url: string | null;
  updated_at: string | null;
};

type StudyCategoryPreview = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  entry_count: number | null;
  progress_percent: number | null;
  updated_at: string | null;
};

type BlogPreview = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  reading_time: number | null;
  published_at: string | null;
};

type StudyEntryPreview = {
  id: string;
  title: string;
  slug: string;
  published_at: string | null;
  study_categories: { title: string; slug: string } | { title: string; slug: string }[] | null;
};

type HomeCommandCenterProps = {
  projects: ProjectPreview[];
  categories: StudyCategoryPreview[];
  posts: BlogPreview[];
  entries: StudyEntryPreview[];
};

type FeedItem = {
  id: string;
  label: string;
  href: string;
  type: "project" | "study" | "blog";
  timestamp: number;
};

const pathCopy: Record<PathMode, string> = {
  recruiter: "A quick story of execution, outcomes, and technical range.",
  collaborator: "Current builds, active studies, and where we can ship together.",
  learner: "Structured tracks, practical entries, and latest engineering notes.",
  builder: "Technical depth first, with implementation signals and architecture clues.",
};

export default function HomeCommandCenter({ projects, categories, posts, entries }: HomeCommandCenterProps) {
  const [pathMode, setPathMode] = useState<PathMode>("builder");
  const [spotlightOrder, setSpotlightOrder] = useState<SpotlightOrder>("balanced");

  useEffect(() => {
    const cachedPath = window.localStorage.getItem("site-path-mode");
    const cachedOrder = window.localStorage.getItem("site-spotlight-order");

    if (cachedPath === "recruiter" || cachedPath === "collaborator" || cachedPath === "learner" || cachedPath === "builder") {
      setPathMode(cachedPath);
    }

    if (cachedOrder === "balanced" || cachedOrder === "build-first" || cachedOrder === "learn-first") {
      setSpotlightOrder(cachedOrder);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("site-path-mode", pathMode);
  }, [pathMode]);

  useEffect(() => {
    window.localStorage.setItem("site-spotlight-order", spotlightOrder);
  }, [spotlightOrder]);

  const feedItems = useMemo(() => {
    const projectFeed = projects.map<FeedItem>((project) => ({
      id: `project-${project.id}`,
      label: `project · ${project.title}`,
      href: `/projects#${encodeURIComponent(project.slug)}`,
      type: "project",
      timestamp: new Date(project.updated_at ?? 0).getTime(),
    }));

    const studyFeed = entries.map<FeedItem>((entry) => {
      const category = Array.isArray(entry.study_categories)
        ? entry.study_categories[0]
        : entry.study_categories;
      return {
        id: `study-${entry.id}`,
        label: `study · ${entry.title}`,
        href: category
          ? `/studies/${encodeURIComponent(category.slug)}/${encodeURIComponent(entry.slug)}`
          : "/studies",
        type: "study",
        timestamp: new Date(entry.published_at ?? 0).getTime(),
      };
    });

    const blogFeed = posts.map<FeedItem>((post) => ({
      id: `blog-${post.id}`,
      label: `blog · ${post.title}`,
      href: `/blog/${encodeURIComponent(post.slug)}`,
      type: "blog",
      timestamp: new Date(post.published_at ?? 0).getTime(),
    }));

    return [...projectFeed, ...studyFeed, ...blogFeed]
      .filter((item) => Number.isFinite(item.timestamp) && item.timestamp > 0)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8);
  }, [entries, posts, projects]);

  const spotlightCards = useMemo(() => {
    const projectCards = projects.slice(0, 2).map((project) => ({
      id: `project-${project.id}`,
      weight: pathMode === "recruiter" || pathMode === "collaborator" || pathMode === "builder" ? 3 : 1,
      kind: "project" as const,
      node: (
        <UnifiedPreviewCard
          kind="project"
          title={project.title}
          href={project.demo_url || project.github_url || `/projects#${project.slug}`}
          summary={project.description}
          imageUrl={project.thumbnail_url}
          tags={project.tags}
          primaryMetric={project.demo_url ? "live available" : "code-first"}
          secondaryMetric={project.github_url ? "source linked" : "case view"}
          actionLabel={project.demo_url ? "demo" : "details"}
          external={Boolean(project.demo_url || project.github_url)}
        />
      ),
    }));

    const studyCards = categories.slice(0, 2).map((category) => ({
      id: `study-${category.id}`,
      weight: pathMode === "learner" || pathMode === "builder" ? 3 : 1,
      kind: "study" as const,
      node: (
        <UnifiedPreviewCard
          kind="study"
          title={category.title}
          href={`/studies/${encodeURIComponent(category.slug)}`}
          summary={category.description}
          imageUrl={category.thumbnail_url}
          tags={category.tags}
          primaryMetric={`${category.entry_count ?? 0} entries`}
          secondaryMetric={category.difficulty ?? "active track"}
          progressPercent={category.progress_percent}
          actionLabel="track"
        />
      ),
    }));

    const blogCards = posts.slice(0, 2).map((post) => ({
      id: `blog-${post.id}`,
      weight: pathMode === "collaborator" || pathMode === "learner" ? 3 : 1,
      kind: "blog" as const,
      node: (
        <UnifiedPreviewCard
          kind="blog"
          title={post.title}
          href={`/blog/${encodeURIComponent(post.slug)}`}
          summary={post.excerpt}
          imageUrl={post.thumbnail_url}
          tags={post.tags}
          primaryMetric={post.reading_time ? `${post.reading_time} min read` : "fresh note"}
          secondaryMetric={post.published_at ? post.published_at.slice(0, 10) : "published"}
          actionLabel="read"
        />
      ),
    }));

    const baseline = [...projectCards, ...studyCards, ...blogCards];

    if (spotlightOrder === "build-first") {
      const order = { project: 0, study: 1, blog: 2 } as const;
      return baseline
        .sort((a, b) => (order[a.kind] - order[b.kind]) || (b.weight - a.weight))
        .map((card) => ({ id: card.id, node: card.node }));
    }

    if (spotlightOrder === "learn-first") {
      const order = { study: 0, blog: 1, project: 2 } as const;
      return baseline
        .sort((a, b) => (order[a.kind] - order[b.kind]) || (b.weight - a.weight))
        .map((card) => ({ id: card.id, node: card.node }));
    }

    return baseline.sort((a, b) => b.weight - a.weight).map((card) => ({ id: card.id, node: card.node }));
  }, [categories, pathMode, posts, projects, spotlightOrder]);

  return (
    <section className="home-command-center">
      <div className="home-command-backdrop" aria-hidden="true" />

      <div className="home-command-shell">
        <header className="home-command-header">
          <p className="mono-label">home preview command center</p>
          <h2>Pick a path. Preview the whole website in one scroll.</h2>
          <p>{pathCopy[pathMode]}</p>
        </header>

        <div className="home-control-row">
          <div className="path-tabs" role="tablist" aria-label="Visitor path mode">
            {(["recruiter", "collaborator", "learner", "builder"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={pathMode === mode}
                className={pathMode === mode ? "is-active" : ""}
                onClick={() => setPathMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>

          <label className="spotlight-select">
            <span>spotlight order</span>
            <select
              value={spotlightOrder}
              onChange={(event) => {
                const value = event.target.value;
                setSpotlightOrder(
                  value === "build-first" || value === "learn-first" ? value : "balanced",
                );
              }}
            >
              <option value="balanced">balanced</option>
              <option value="build-first">build first</option>
              <option value="learn-first">learn first</option>
            </select>
          </label>
        </div>

        {feedItems.length > 0 ? (
          <div className="live-feed-strip" aria-label="Live feed preview">
            {feedItems.map((item) => (
              <a key={item.id} href={item.href} className={`feed-chip type-${item.type}`}>
                {item.label}
              </a>
            ))}
          </div>
        ) : null}

        <div className="spotlight-grid">
          {spotlightCards.map((card) => (
            <div key={card.id}>{card.node}</div>
          ))}
        </div>

        <div className="home-preview-links">
          <a href="/projects">projects index</a>
          <a href="/studies">studies index</a>
          <a href="/blog">blog index</a>
          <a href="/about">about profile</a>
          <a href="/contact">contact action</a>
        </div>
      </div>
    </section>
  );
}
