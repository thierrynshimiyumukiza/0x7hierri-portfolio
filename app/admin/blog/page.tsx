import { createAdminClient } from "@/lib/supabase/admin";
import {
  deleteBlogPost,
  duplicateBlogPost,
  setBlogPostFeatured,
  setBlogPostStatus,
} from "@/actions/blog";
import BlogPostsManager, { type AdminBlogRow } from "@/components/admin/blog/BlogPostsManager";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("id,title,slug,excerpt,thumbnail_url,tags,status,featured,reading_time,published_at,updated_at")
    .order("updated_at", { ascending: false });

  const posts = (data as AdminBlogRow[] | null) ?? [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  async function remove(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (id) await deleteBlogPost(id);
  }

  async function duplicate(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (id) await duplicateBlogPost(id);
  }

  async function toggleStatus(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "draft") as Database["public"]["Enums"]["entry_status"];
    if (id) await setBlogPostStatus(id, status);
  }

  async function toggleFeatured(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (id) await setBlogPostFeatured(id, formData.get("featured") === "true");
  }

  return (
    <BlogPostsManager
      posts={posts}
      siteUrl={siteUrl}
      onDelete={remove}
      onDuplicate={duplicate}
      onToggleStatus={toggleStatus}
      onToggleFeatured={toggleFeatured}
    />
  );
}
