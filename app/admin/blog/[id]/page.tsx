import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateBlogPost } from "@/actions/blog";
import { blogValuesFromFormData, toDateTimeLocal } from "@/lib/blog-form";
import BlogEditor from "@/components/admin/blog/BlogEditor";
import type { Tables } from "@/types/database";

export const dynamic = "force-dynamic";

type AdminBlogEditPageProps = {
  params: { id: string };
};

export default async function AdminBlogEditPage({ params }: AdminBlogEditPageProps) {
  const supabase = createAdminClient();

  const [{ data: postData }, { data: tagRows }] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("blog_posts").select("tags").limit(300),
  ]);

  const post = (postData as Tables<"blog_posts"> | null) ?? null;
  if (!post) notFound();

  const knownTags = Array.from(
    new Set(((tagRows as { tags: string[] | null }[] | null) ?? []).flatMap((row) => row.tags ?? [])),
  ).sort();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  async function submit(formData: FormData) {
    "use server";

    await updateBlogPost(params.id, blogValuesFromFormData(formData));
    redirect("/admin/blog");
  }

  return (
    <BlogEditor
      mode="edit"
      action={submit}
      knownTags={knownTags}
      siteUrl={siteUrl}
      initial={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        content: post.content ?? "",
        thumbnail_url: post.thumbnail_url ?? "",
        cover_image_url: post.cover_image_url ?? "",
        og_image_url: post.og_image_url ?? "",
        meta_title: post.meta_title ?? "",
        meta_description: post.meta_description ?? "",
        tags: post.tags ?? [],
        status: post.status ?? "draft",
        featured: post.featured ?? false,
        published_at: toDateTimeLocal(post.published_at),
      }}
    />
  );
}
