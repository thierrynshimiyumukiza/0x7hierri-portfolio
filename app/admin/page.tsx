import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Plus,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import type { Tables } from "@/types/database";

export const dynamic = "force-dynamic";

type RecentPost = Pick<Tables<"blog_posts">, "id" | "title" | "status" | "updated_at">;
type AuditPost = Pick<
  Tables<"blog_posts">,
  "id" | "title" | "status" | "excerpt" | "meta_description" | "thumbnail_url" | "cover_image_url" | "tags" | "updated_at"
>;
type AuditMedia = Pick<Tables<"media_library">, "id" | "url" | "alt_text" | "file_name" | "file_size" | "media_type">;

type HealthCheck = {
  label: string;
  detail: string;
  count: number;
  href: string;
};

const STALE_DRAFT_DAYS = 30;

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const [projects, studies, recent, auditPosts, auditMedia] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("study_entries").select("id", { count: "exact", head: true }),
    supabase.from("blog_posts").select("id,title,status,updated_at").order("updated_at", { ascending: false }).limit(6),
    supabase
      .from("blog_posts")
      .select("id,title,status,excerpt,meta_description,thumbnail_url,cover_image_url,tags,updated_at"),
    supabase.from("media_library").select("id,url,alt_text,file_name,file_size,media_type"),
  ]);

  const recentPosts = (recent.data as RecentPost[] | null) ?? [];
  const posts = (auditPosts.data as AuditPost[] | null) ?? [];
  const media = (auditMedia.data as AuditMedia[] | null) ?? [];
  const published = posts.filter((post) => post.status === "published");
  const drafts = posts.filter((post) => post.status === "draft");

  const stats = [
    { label: "Published posts", value: published.length, href: "/admin/blog", icon: <FileText size={16} aria-hidden="true" /> },
    { label: "Drafts", value: drafts.length, href: "/admin/blog", icon: <FileText size={16} aria-hidden="true" /> },
    { label: "Projects", value: projects.count ?? 0, href: "/admin/projects", icon: <FolderKanban size={16} aria-hidden="true" /> },
    { label: "Study entries", value: studies.count ?? 0, href: "/admin/studies/entries", icon: <FolderKanban size={16} aria-hidden="true" /> },
    { label: "Media files", value: media.length, href: "/admin/media", icon: <ImageIcon size={16} aria-hidden="true" /> },
  ];

  // Two uploads of the same file share a name and byte size; URL-mode entries
  // are compared by URL instead.
  const seen = new Map<string, number>();
  media.forEach((item) => {
    const key = item.file_name && item.file_size ? `${item.file_name}:${item.file_size}` : item.url;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  });
  const duplicateMedia = Array.from(seen.values()).reduce((sum, count) => sum + (count > 1 ? count - 1 : 0), 0);

  const staleCutoff = Date.now() - STALE_DRAFT_DAYS * 24 * 60 * 60 * 1000;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const checks: HealthCheck[] = [
    {
      label: "Posts without a summary",
      detail: "Published posts with no excerpt or meta description show a blank snippet in search and link previews.",
      count: published.filter((post) => !post.excerpt?.trim() && !post.meta_description?.trim()).length,
      href: "/admin/blog",
    },
    {
      label: "Posts without a cover image",
      detail: "Shared links fall back to a generated placeholder.",
      count: published.filter((post) => !post.thumbnail_url && !post.cover_image_url).length,
      href: "/admin/blog",
    },
    {
      label: "Posts without tags",
      detail: "Untagged posts never appear in related reading.",
      count: published.filter((post) => (post.tags ?? []).length === 0).length,
      href: "/admin/blog",
    },
    {
      label: "Images missing alt text",
      detail: "Screen readers announce these as unlabelled images.",
      count: media.filter((item) => (item.media_type ?? "image") === "image" && !item.alt_text?.trim()).length,
      href: "/admin/media",
    },
    {
      label: "Duplicate media files",
      detail: "The same file uploaded more than once.",
      count: duplicateMedia,
      href: "/admin/media",
    },
    {
      label: `Drafts untouched for ${STALE_DRAFT_DAYS}+ days`,
      detail: "Finish, archive or delete them.",
      count: drafts.filter((post) => post.updated_at && new Date(post.updated_at).getTime() < staleCutoff).length,
      href: "/admin/blog",
    },
  ];

  const configWarnings = [
    !siteUrl || /localhost|127\.0\.0\.1/.test(siteUrl)
      ? "NEXT_PUBLIC_SITE_URL is unset or points at localhost, so canonical links and the sitemap are wrong in production."
      : null,
    !process.env.REVALIDATE_SECRET ? "REVALIDATE_SECRET is unset, so the revalidate endpoint is disabled." : null,
  ].filter((warning): warning is string => Boolean(warning));

  const issues = checks.filter((check) => check.count > 0);

  return (
    <div className="dash">
      <header className="cms-list-head">
        <div>
          <h1 className="cms-list-title">Dashboard</h1>
          <p className="admin-hint">Everything that powers the public site lives here.</p>
        </div>

        <Link href="/admin/blog/new" className="admin-button admin-button-primary">
          <Plus size={14} aria-hidden="true" />
          New post
        </Link>
      </header>

      <div className="dash-stats">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="dash-stat">
            <span className="dash-stat-icon">{stat.icon}</span>
            <span className="dash-stat-value">{stat.value}</span>
            <span className="dash-stat-label">{stat.label}</span>
            <ArrowUpRight size={14} aria-hidden="true" className="dash-stat-arrow" />
          </Link>
        ))}
      </div>

      <div className="dash-columns">
        <section className="cms-card">
          <div className="cms-card-head">
            <span className="admin-label">Recently edited</span>
            <Link href="/admin/blog" className="admin-link">
              All posts
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <p className="admin-hint">Nothing here yet. Create your first post to get started.</p>
          ) : (
            <ul className="dash-recent">
              {recentPosts.map((post) => (
                <li key={post.id}>
                  <Link href={`/admin/blog/${post.id}`}>{post.title}</Link>
                  <span className={`status-pill status-pill-${post.status ?? "draft"}`}>{post.status ?? "draft"}</span>
                  <span className="admin-hint">{formatDateTime(post.updated_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="cms-card" aria-labelledby="site-health-title">
          <div className="cms-card-head">
            <span className="admin-label" id="site-health-title">
              Site health
            </span>
            <span className={issues.length + configWarnings.length === 0 ? "dash-health-ok" : "dash-health-warn"}>
              {issues.length + configWarnings.length === 0
                ? "all clear"
                : `${issues.length + configWarnings.length} to fix`}
            </span>
          </div>

          <ul className="dash-health">
            {configWarnings.map((warning) => (
              <li key={warning} data-state="warn">
                <AlertTriangle size={16} aria-hidden="true" />
                <span className="dash-health-text">
                  <strong>Configuration</strong>
                  <span>{warning}</span>
                </span>
              </li>
            ))}
            {checks.map((check) => (
              <li key={check.label} data-state={check.count > 0 ? "warn" : "ok"}>
                {check.count > 0 ? (
                  <AlertTriangle size={16} aria-hidden="true" />
                ) : (
                  <CheckCircle2 size={16} aria-hidden="true" />
                )}
                <span className="dash-health-text">
                  <strong>{check.label}</strong>
                  {check.count > 0 ? <span>{check.detail}</span> : null}
                </span>
                {check.count > 0 ? (
                  <Link href={check.href} className="dash-health-count">
                    {check.count}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
