import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateProject } from "@/actions/projects";
import ImageInputField from "@/components/admin/ImageInputField";
import PublishGuard from "@/components/admin/PublishGuard";
import type { Tables } from "@/types/database";

type AdminProjectEditPageProps = {
  params: {
    id: string;
  };
};

export default async function AdminProjectEditPage({ params }: AdminProjectEditPageProps) {
  const supabase = createAdminClient();
  const { data: projectData } = await supabase.from("projects").select("*").eq("id", params.id).maybeSingle();
  const project = (projectData as Tables<"projects"> | null) ?? null;

  if (!project) notFound();

  async function submit(formData: FormData) {
    "use server";

    await updateProject(params.id, {
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
      <input name="title" defaultValue={project.title} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
      <input name="slug" defaultValue={project.slug} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <textarea name="description" defaultValue={project.description ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <ImageInputField
        name="thumbnail_url"
        label="Project thumbnail"
        bucket="media"
        defaultValue={project.thumbnail_url ?? ""}
      />
      <input name="github_url" defaultValue={project.github_url ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="demo_url" defaultValue={project.demo_url ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="tags" defaultValue={(project.tags ?? []).join(",")} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input type="number" name="sort_order" defaultValue={project.sort_order ?? 0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="featured" defaultChecked={project.featured ?? false} /> featured</label>
      <select name="status" defaultValue={project.status ?? "draft"} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm">
        <option value="draft">draft</option>
        <option value="published">published</option>
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
