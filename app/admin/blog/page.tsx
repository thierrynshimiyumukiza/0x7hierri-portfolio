import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteBlogPost } from "@/actions/blog";
import type { Tables } from "@/types/database";

export default async function AdminBlogPage() {
  const supabase = createAdminClient();
  const { data: postsData } = await supabase.from("blog_posts").select("id,title,slug,status").order("created_at", { ascending: false });
  const posts = (postsData as Pick<Tables<"blog_posts">, "id" | "title" | "slug" | "status">[] | null) ?? [];

  async function remove(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await deleteBlogPost(id);
  }

  return (
    <section className="space-y-4">
      <Link href="/admin/blog/new" className="inline-flex rounded border border-[--border] px-3 py-2 text-xs text-[--text-muted]">
        new
      </Link>
      {posts.map((post) => (
        <div key={post.id} className="surface-card flex items-center justify-between">
          <Link href={`/admin/blog/${post.id}`} className="text-sm text-[--text-primary]">
            {post.title} ({post.slug})
          </Link>
          <form action={remove}>
            <input type="hidden" name="id" value={post.id} />
            <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
          </form>
        </div>
      ))}
    </section>
  );
}
