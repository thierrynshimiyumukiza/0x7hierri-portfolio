import { redirect } from "next/navigation";
import { createBlogPost } from "@/actions/blog";
import { createAdminClient } from "@/lib/supabase/admin";
import { blogValuesFromFormData } from "@/lib/blog-form";
import BlogEditor from "@/components/admin/blog/BlogEditor";

export const dynamic = "force-dynamic";

async function loadKnownTags(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("blog_posts").select("tags").limit(300);
  const rows = (data as { tags: string[] | null }[] | null) ?? [];
  return Array.from(new Set(rows.flatMap((row) => row.tags ?? []))).sort();
}

export default async function AdminBlogNewPage() {
  const knownTags = await loadKnownTags();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  async function submit(formData: FormData) {
    "use server";

    await createBlogPost(blogValuesFromFormData(formData));
    redirect("/admin/blog");
  }

  return (
    <BlogEditor
      mode="create"
      action={submit}
      knownTags={knownTags}
      siteUrl={siteUrl}
      initial={{
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        thumbnail_url: "",
        cover_image_url: "",
        og_image_url: "",
        meta_title: "",
        meta_description: "",
        tags: [],
        status: "draft",
        featured: false,
        published_at: "",
      }}
    />
  );
}
