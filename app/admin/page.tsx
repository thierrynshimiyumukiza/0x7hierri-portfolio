import Link from "next/link";
import { ArrowUpRight, FileText, FolderKanban, Image as ImageIcon, Plus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import type { Tables } from "@/types/database";

export const dynamic = "force-dynamic";

type RecentPost = Pick<Tables<"blog_posts">, "id" | "title" | "status" | "updated_at">;

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const [projects, studies, blogTotal, blogPublished, blogDrafts, media, recent] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("study_entries").select("id", { count: "exact", head: true }),
    supabase.from("blog_posts").select("id", { count: "exact", head: true }),
    supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("media_library").select("id", { count: "exact", head: true }),
    supabase.from("blog_posts").select("id,title,status,updated_at").order("updated_at", { ascending: false }).limit(6),
  ]);

  const recentPosts = (recent.data as RecentPost[] | null) ?? [];

  const stats = [
    { label: "Published posts", value: blogPublished.count ?? 0, href: "/admin/blog", icon: <FileText size={14} aria-hidden="true" /> },
    { label: "Drafts", value: blogDrafts.count ?? 0, href: "/admin/blog", icon: <FileText size={14} aria-hidden="true" /> },
    { label: "Projects", value: projects.count ?? 0, href: "/admin/projects", icon: <FolderKanban size={14} aria-hidden="true" /> },
    { label: "Study entries", value: studies.count ?? 0, href: "/admin/studies/entries", icon: <FolderKanban size={14} aria-hidden="true" /> },
    { label: "Media files", value: media.count ?? 0, href: "/admin/media", icon: <ImageIcon size={14} aria-hidden="true" /> },
    { label: "Total posts", value: blogTotal.count ?? 0, href: "/admin/blog", icon: <FileText size={14} aria-hidden="true" /> },
  ];

  return (
    <div className="dash">
      <header className="cms-list-head">
        <div>
          <h1 className="cms-list-title">Dashboard</h1>
          <p className="admin-hint">Everything that powers the public site lives here.</p>
        </div>

        <Link href="/admin/blog/new" className="admin-button admin-button-primary">
          <Plus size={13} aria-hidden="true" />
          New post
        </Link>
      </header>

      <div className="dash-stats">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="dash-stat">
            <span className="dash-stat-icon">{stat.icon}</span>
            <span className="dash-stat-value">{stat.value}</span>
            <span className="dash-stat-label">{stat.label}</span>
            <ArrowUpRight size={13} aria-hidden="true" className="dash-stat-arrow" />
          </Link>
        ))}
      </div>

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
    </div>
  );
}
