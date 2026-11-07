import Link from "next/link";
import { format } from "date-fns";
import { Github } from "lucide-react";
import Thumbnail from "@/components/site/Thumbnail";
import { displayTag } from "@/lib/utils";

export type HomeHero = {
  line1: string;
  line2: string;
  line3: string;
  subheading: string;
  description: string;
  ctaPrimary: { text: string; url: string } | null;
  ctaSecondary: { text: string; url: string } | null;
  availability: string | null;
};

export type HomeProfile = {
  username: string;
  location: string;
  githubUrl: string | null;
};

export type HomePost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnailUrl: string | null;
  tags: string[];
  readingTime: number;
  publishedAt: string | null;
};

export type HomeStudy = {
  id: string;
  title: string;
  slug: string;
  description: string;
  entryCount: number;
  difficulty: string;
  progress: number;
  tags: string[];
};

export type HomeProject = {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[];
};

type HomeViewProps = {
  hero: HomeHero;
  profile: HomeProfile;
  stats: { id: string; number: string; label: string }[];
  nowItems: string[];
  links: { label: string; url: string }[];
  featuredPost: HomePost | null;
  posts: HomePost[];
  study: HomeStudy | null;
  project: HomeProject | null;
};

function shortDate(value: string | null, pattern = "MMM d") {
  return value ? format(new Date(value), pattern) : "";
}

export default function HomeView({
  hero,
  profile,
  stats,
  nowItems,
  links,
  featuredPost,
  posts,
  study,
  project,
}: HomeViewProps) {
  const location = profile.location;
  const kicker = [hero.availability, location].filter(Boolean).join(" · ");

  return (
    <>
      <section className="ui-wrap ui-hero">
        <div className="flex flex-col gap-[26px]">
          {kicker ? (
            <p className="ui-mono flex items-center gap-[10px]" style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {hero.availability ? <span className="ui-dot" aria-hidden="true" /> : null}
              {kicker.toLowerCase()}
            </p>
          ) : null}

          <h1
            style={{
              fontSize: "clamp(40px, 4.8vw, 64px)",
              lineHeight: 1.04,
              letterSpacing: "-0.035em",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {hero.line1 || profile.username}
            {hero.line2 ? (
              <>
                <br />
                <span style={{ color: "var(--accent-blue)" }}>{hero.line2}</span>
              </>
            ) : null}
            {hero.line3 ? (
              <>
                <br />
                <span style={{ color: "var(--text-dim)" }}>{hero.line3}</span>
              </>
            ) : null}
          </h1>

          {hero.description ? (
            <p style={{ fontSize: 19, lineHeight: 1.6, color: "var(--text-body)", maxWidth: "34em" }}>
              {hero.description}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {hero.ctaPrimary ? (
              <Link href={hero.ctaPrimary.url} className="ui-btn ui-btn-primary">
                {hero.ctaPrimary.text}
              </Link>
            ) : null}
            {hero.ctaSecondary ? (
              <Link href={hero.ctaSecondary.url} className="ui-btn">
                {hero.ctaSecondary.text}
              </Link>
            ) : null}
            {profile.githubUrl ? (
              <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="ui-btn">
                <Github size={16} aria-hidden="true" />
                GitHub
              </a>
            ) : null}
          </div>
        </div>

        <div className="ui-card ui-term" role="group" aria-label="About me, terminal style">
          <div className="ui-term-bar" aria-hidden="true">
            <span />
            <span />
            <span />
            <span className="ui-mono" style={{ marginLeft: 8, fontSize: 12, color: "var(--text-dim)" }}>
              {(profile.username || "guest").toLowerCase()}@0x7hierri: ~
            </span>
          </div>
          <div className="ui-term-body">
            <div>
              <span className="ui-term-prompt">$ </span>whoami
            </div>
            <div>
              {profile.username || "0x7hierri"}
              {hero.subheading ? ` — ${hero.subheading.toLowerCase()}` : ""}
            </div>

            {nowItems.length > 0 ? (
              <>
                <div style={{ marginTop: 12 }}>
                  <span className="ui-term-prompt">$ </span>cat now.txt
                </div>
                {nowItems.map((item) => (
                  <div key={item}>
                    <span className="ui-term-bullet">▸ </span>
                    {item}
                  </div>
                ))}
              </>
            ) : null}

            {links.length > 0 ? (
              <>
                <div style={{ marginTop: 12 }}>
                  <span className="ui-term-prompt">$ </span>ls ./links
                </div>
                <div className="flex flex-wrap gap-x-[18px]">
                  {links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      className="ui-link"
                      target={link.url.startsWith("http") ? "_blank" : undefined}
                      rel={link.url.startsWith("http") ? "noreferrer" : undefined}
                    >
                      {link.label.toLowerCase()}
                    </a>
                  ))}
                </div>
              </>
            ) : null}

            <div style={{ marginTop: 12 }}>
              <span className="ui-term-prompt">$ </span>
              <span className="ui-term-cursor" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {stats.length > 0 ? (
        <section className="ui-wrap" style={{ paddingBottom: 80 }} aria-label="Stats">
          <div className="ui-card grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            {stats.map((stat, index) => (
              <div
                key={stat.id}
                style={{
                  padding: "24px 26px",
                  borderLeft: index === 0 ? undefined : "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                  {stat.number}
                </div>
                <div className="ui-label" style={{ marginTop: 6 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {featuredPost || posts.length > 0 ? (
        <section className="ui-wrap ui-section">
          <div className="mb-[22px] flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="ui-h2">Latest writeups</h2>
            <Link href="/blog" className="ui-link ui-mono" style={{ fontSize: 14 }}>
              all writeups →
            </Link>
          </div>

          <div className="ui-grid-auto" style={{ ["--ui-min" as string]: "480px" }}>
            {featuredPost ? (
              <Link href={`/blog/${featuredPost.slug}`} className="ui-card ui-row-link flex flex-col overflow-hidden">
                <div className="ui-cover" style={{ borderBottom: "1px solid var(--border)" }}>
                  <Thumbnail
                    src={featuredPost.thumbnailUrl}
                    alt=""
                    seed={featuredPost.title}
                    ratio="21/9"
                    radius={0}
                    eager
                    sizes="(max-width: 900px) 100vw, 600px"
                  />
                </div>
                <div className="flex flex-col gap-[10px]" style={{ padding: "24px 26px 26px" }}>
                  <div className="ui-mono" style={{ fontSize: 13, color: "var(--text-dim)" }}>
                    {shortDate(featuredPost.publishedAt, "MMM d, yyyy")} · {featuredPost.readingTime} min
                  </div>
                  <h3
                    className="ui-row-title"
                    style={{ fontSize: 23, lineHeight: 1.3, letterSpacing: "-0.01em", fontWeight: 600 }}
                  >
                    {featuredPost.title}
                  </h3>
                  {featuredPost.excerpt ? (
                    <p className="line-clamp-2" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
                      {featuredPost.excerpt}
                    </p>
                  ) : null}
                </div>
              </Link>
            ) : null}

            <div className="flex flex-col">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="ui-row-link grid gap-5"
                  style={{
                    gridTemplateColumns: "84px 1fr",
                    padding: "22px 4px",
                    borderBottom: "1px solid var(--border-muted)",
                  }}
                >
                  <span className="ui-mono" style={{ fontSize: 13, color: "var(--text-dim)", paddingTop: 4 }}>
                    {shortDate(post.publishedAt)}
                  </span>
                  <span className="flex min-w-0 flex-col gap-2">
                    <span className="ui-row-title" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.4 }}>
                      {post.title}
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="ui-tag">
                          {displayTag(tag)}
                        </span>
                      ))}
                      <span className="ui-mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>
                        {post.readingTime} min
                      </span>
                    </span>
                  </span>
                </Link>
              ))}
              <a href="/blog/rss.xml" className="ui-link ui-mono" style={{ padding: "20px 4px", fontSize: 14 }}>
                subscribe via RSS →
              </a>
            </div>
          </div>
        </section>
      ) : null}

      {study || project ? (
        <section className="ui-wrap ui-section ui-grid-auto" style={{ ["--ui-min" as string]: "420px" }}>
          {study ? (
            <div className="ui-card flex flex-col gap-[18px]" style={{ padding: 28 }}>
              <div className="flex items-center justify-between">
                <span className="ui-label">now studying</span>
                <Link href="/studies" className="ui-link ui-mono" style={{ fontSize: 13 }}>
                  all tracks →
                </Link>
              </div>
              <Link href={`/studies/${study.slug}`} className="ui-row-link flex items-center gap-[18px]">
                <span
                  className="ui-mono flex flex-none items-center justify-center"
                  aria-hidden="true"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: "var(--accent-green-soft)",
                    border: "1px solid var(--accent-green-line)",
                    color: "var(--accent-green)",
                    fontSize: 18,
                    fontWeight: 500,
                  }}
                >
                  {study.title
                    .split(/\s+/)
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="ui-row-title block" style={{ fontSize: 20, fontWeight: 600 }}>
                    {study.title}
                  </span>
                  {study.description ? (
                    <span
                      className="line-clamp-2"
                      style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 15, lineHeight: 1.5 }}
                    >
                      {study.description}
                    </span>
                  ) : null}
                </span>
              </Link>
              <div>
                <div className="ui-mono flex justify-between" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  <span>
                    {study.entryCount} {study.entryCount === 1 ? "entry" : "entries"}
                  </span>
                  <span>{study.difficulty}</span>
                </div>
                <div className="ui-progress" style={{ marginTop: 8 }} aria-label={`${study.progress}% complete`}>
                  <span style={{ width: `${Math.max(3, Math.min(100, study.progress))}%` }} />
                </div>
              </div>
            </div>
          ) : null}

          {project ? (
            <div className="ui-card flex flex-col gap-[18px]" style={{ padding: 28 }}>
              <div className="flex items-center justify-between">
                <span className="ui-label">project</span>
                <Link href="/projects" className="ui-link ui-mono" style={{ fontSize: 13 }}>
                  all projects →
                </Link>
              </div>
              <Link href={`/projects#${project.slug}`} className="ui-row-link ui-row-title" style={{ fontSize: 20, fontWeight: 600 }}>
                {project.title}
              </Link>
              {project.description ? (
                <p style={{ color: "var(--text-muted)", lineHeight: 1.6, fontSize: 15 }}>{project.description}</p>
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
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
