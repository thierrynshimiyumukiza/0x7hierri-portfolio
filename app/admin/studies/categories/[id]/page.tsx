import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateStudyCategory } from "@/actions/studies";
import ImageInputField from "@/components/admin/ImageInputField";
import PublishGuard from "@/components/admin/PublishGuard";
import type { Tables } from "@/types/database";

type AdminCategoryEditPageProps = {
  params: {
    id: string;
  };
};

export default async function AdminCategoryEditPage({ params }: AdminCategoryEditPageProps) {
  const supabase = createAdminClient();
  const { data: categoryData } = await supabase.from("study_categories").select("*").eq("id", params.id).maybeSingle();
  const category = (categoryData as Tables<"study_categories"> | null) ?? null;

  if (!category) notFound();

  async function submit(formData: FormData) {
    "use server";

    await updateStudyCategory(params.id, {
      title: String(formData.get("title") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      description: String(formData.get("description") ?? ""),
      thumbnail_url: String(formData.get("thumbnail_url") ?? ""),
      cover_image_url: String(formData.get("cover_image_url") ?? ""),
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      difficulty: String(formData.get("difficulty") ?? "beginner") as "beginner" | "intermediate" | "advanced",
      status: String(formData.get("status") ?? "published") as "draft" | "published" | "archived",
      featured: formData.get("featured") === "on",
      sort_order: Number(formData.get("sort_order") ?? 0),
      entry_count: Number(formData.get("entry_count") ?? 0),
      progress_percent: Number(formData.get("progress_percent") ?? 0),
    });

    redirect("/admin/studies/categories");
  }

  return (
    <form action={submit} className="surface-card grid gap-3">
      <input name="title" defaultValue={category.title} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
      <input name="slug" defaultValue={category.slug} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <textarea name="description" defaultValue={category.description ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <ImageInputField
        name="thumbnail_url"
        label="Short thumbnail"
        bucket="media"
        defaultValue={category.thumbnail_url ?? ""}
      />
      <ImageInputField
        name="cover_image_url"
        label="Cover image"
        bucket="media"
        defaultValue={category.cover_image_url ?? ""}
      />
      <input name="tags" defaultValue={(category.tags ?? []).join(",")} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input type="number" name="sort_order" defaultValue={category.sort_order ?? 0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input type="number" name="entry_count" defaultValue={category.entry_count ?? 0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input type="number" name="progress_percent" defaultValue={category.progress_percent ?? 0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="featured" defaultChecked={category.featured ?? false} /> featured</label>
      </div>
      <select name="difficulty" defaultValue={category.difficulty ?? "beginner"} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm">
        <option value="beginner">beginner</option>
        <option value="intermediate">intermediate</option>
        <option value="advanced">advanced</option>
      </select>
      <select name="status" defaultValue={category.status ?? "draft"} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm">
        <option value="draft">draft</option>
        <option value="published">published</option>
        <option value="archived">archived</option>
      </select>
      <PublishGuard
        fields={[
          { name: "title", label: "title" },
          { name: "description", label: "description" },
          { name: "thumbnail_url", label: "thumbnail URL", type: "url" },
        ]}
      />
      <button className="rounded bg-[--accent-blue] px-3 py-2 text-sm font-medium text-[--bg-base]">save</button>
    </form>
  );
}
