import { redirect } from "next/navigation";
import { createBlogPost } from "@/actions/blog";
import ImageInputField from "@/components/admin/ImageInputField";
import RichTextField from "@/components/admin/RichTextField";
import PublishGuard from "@/components/admin/PublishGuard";

export default function AdminBlogNewPage() {
  async function submit(formData: FormData) {
    "use server";

    await createBlogPost({
      title: String(formData.get("title") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      excerpt: String(formData.get("excerpt") ?? ""),
      content: String(formData.get("content") ?? ""),
      thumbnail_url: String(formData.get("thumbnail_url") ?? ""),
      cover_image_url: String(formData.get("cover_image_url") ?? ""),
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      status: String(formData.get("status") ?? "published") as "draft" | "published" | "archived",
      featured: formData.get("featured") === "on",
      meta_title: String(formData.get("meta_title") ?? ""),
      meta_description: String(formData.get("meta_description") ?? ""),
      og_image_url: String(formData.get("og_image_url") ?? ""),
      published_at: String(formData.get("published_at") ?? "") || null,
    });

    redirect("/admin/blog");
  }

  return (
    <form action={submit} className="surface-card grid gap-3">
      <input name="title" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
      <input name="slug" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <textarea name="excerpt" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <RichTextField name="content" label="Content" mediaBucket="media" />
      <ImageInputField name="thumbnail_url" label="Short thumbnail" bucket="media" />
      <ImageInputField name="cover_image_url" label="Cover image" bucket="media" />
      <input name="tags" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="featured" /> featured</label>
      <input name="meta_title" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <textarea name="meta_description" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <ImageInputField name="og_image_url" label="Open Graph image" bucket="media" />
      <input name="published_at" type="datetime-local" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <select name="status" defaultValue="published" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm">
        <option value="published">published</option>
        <option value="draft">draft</option>
        <option value="archived">archived</option>
      </select>
      <PublishGuard
        fields={[
          { name: "title", label: "title" },
          { name: "excerpt", label: "excerpt" },
          { name: "content", label: "content", type: "markdown" },
          { name: "thumbnail_url", label: "thumbnail URL", type: "url" },
          { name: "meta_description", label: "meta description" },
        ]}
      />
      <button className="rounded bg-[--accent-blue] px-3 py-2 text-sm font-medium text-[--bg-base]">save</button>
    </form>
  );
}
