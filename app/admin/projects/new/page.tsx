import { redirect } from "next/navigation";
import { createProject } from "@/actions/projects";
import ImageInputField from "@/components/admin/ImageInputField";
import PublishGuard from "@/components/admin/PublishGuard";

export default function AdminProjectNewPage() {
  async function submit(formData: FormData) {
    "use server";

    await createProject({
      title: String(formData.get("title") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      description: String(formData.get("description") ?? ""),
      thumbnail_url: String(formData.get("thumbnail_url") ?? ""),
      github_url: String(formData.get("github_url") ?? ""),
      demo_url: String(formData.get("demo_url") ?? ""),
      featured: formData.get("featured") === "on",
      status: String(formData.get("status") ?? "published") as "draft" | "published" | "archived",
      sort_order: Number(formData.get("sort_order") ?? 0),
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });

    redirect("/admin/projects");
  }

  return (
    <form action={submit} className="surface-card grid gap-3">
      <input name="title" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
      <input name="slug" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <textarea name="description" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <ImageInputField name="thumbnail_url" label="Project thumbnail" bucket="media" />
      <input name="github_url" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="demo_url" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="tags" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input type="number" name="sort_order" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" defaultValue={0} />
      <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="featured" /> featured</label>
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
          { name: "demo_url", label: "demo URL", type: "url" },
        ]}
      />
      <button className="rounded bg-[--accent-blue] px-3 py-2 text-sm font-medium text-[--bg-base]">save</button>
    </form>
  );
}
