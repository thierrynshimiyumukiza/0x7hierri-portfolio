import { redirect } from "next/navigation";
import { createStudyCategory } from "@/actions/studies";
import ImageInputField from "@/components/admin/ImageInputField";
import PublishGuard from "@/components/admin/PublishGuard";

export default function AdminStudyCategoryNewPage() {
  async function submit(formData: FormData) {
    "use server";

    await createStudyCategory({
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
      <input name="title" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
      <input name="slug" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <textarea name="description" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <ImageInputField name="thumbnail_url" label="Short thumbnail" bucket="media" />
      <ImageInputField name="cover_image_url" label="Cover image" bucket="media" />
      <input name="tags" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input type="number" name="sort_order" defaultValue={0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input type="number" name="entry_count" defaultValue={0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input type="number" name="progress_percent" defaultValue={0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="featured" /> featured</label>
      </div>
      <select name="difficulty" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm">
        <option value="beginner">beginner</option>
        <option value="intermediate">intermediate</option>
        <option value="advanced">advanced</option>
      </select>
      <select name="status" defaultValue="published" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm">
        <option value="published">published</option>
        <option value="draft">draft</option>
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
