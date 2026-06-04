import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStudyEntry } from "@/actions/studies";
import ImageInputField from "@/components/admin/ImageInputField";
import RichTextField from "@/components/admin/RichTextField";
import PublishGuard from "@/components/admin/PublishGuard";
import type { Tables } from "@/types/database";

export default async function AdminStudyEntryNewPage() {
  const supabase = createAdminClient();
  const { data: categoriesData } = await supabase
    .from("study_categories")
    .select("id,title")
    .order("sort_order", { ascending: true });
  const categories = (categoriesData as Pick<Tables<"study_categories">, "id" | "title">[] | null) ?? [];

  async function submit(formData: FormData) {
    "use server";

    const categoryId = String(formData.get("category_id") ?? "").trim();

    await createStudyEntry({
      category_id: categoryId || null,
      title: String(formData.get("title") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      summary: String(formData.get("summary") ?? ""),
      content: String(formData.get("content") ?? ""),
      thumbnail_url: String(formData.get("thumbnail_url") ?? ""),
      cover_image_url: String(formData.get("cover_image_url") ?? ""),
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      status: String(formData.get("status") ?? "published") as "draft" | "published" | "archived",
      pinned: formData.get("pinned") === "on",
      entry_number: Number(formData.get("entry_number") ?? 0),
      published_at: String(formData.get("published_at") ?? "") || null,
      meta_title: String(formData.get("meta_title") ?? ""),
      meta_description: String(formData.get("meta_description") ?? ""),
    });

    redirect("/admin/studies/entries");
  }

  return (
    <form action={submit} className="surface-card grid gap-3">
      <select name="category_id" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.title}
          </option>
        ))}
      </select>
      <input name="title" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
      <input name="slug" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <textarea name="summary" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <RichTextField name="content" label="Content" mediaBucket="media" />
      <ImageInputField name="thumbnail_url" label="Short thumbnail" bucket="media" />
      <ImageInputField name="cover_image_url" label="Cover image" bucket="media" />
      <input name="tags" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="entry_number" type="number" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" defaultValue={0} />
      <input name="published_at" type="datetime-local" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="meta_title" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <textarea name="meta_description" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="pinned" /> pinned</label>
      <select name="status" defaultValue="published" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm">
        <option value="published">published</option>
        <option value="draft">draft</option>
        <option value="archived">archived</option>
      </select>
      <PublishGuard
        fields={[
          { name: "title", label: "title" },
          { name: "summary", label: "summary" },
          { name: "content", label: "content", type: "markdown" },
          { name: "thumbnail_url", label: "thumbnail URL", type: "url" },
          { name: "meta_description", label: "meta description" },
        ]}
      />
      <button className="rounded bg-[--accent-blue] px-3 py-2 text-sm font-medium text-[--bg-base]">save</button>
    </form>
  );
}
