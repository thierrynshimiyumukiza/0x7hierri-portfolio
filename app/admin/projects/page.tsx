import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteProject } from "@/actions/projects";
import type { Tables } from "@/types/database";

export default async function AdminProjectsPage() {
  const supabase = createAdminClient();
  const { data: projectsData } = await supabase.from("projects").select("id,title,slug,status").order("created_at", { ascending: false });
  const projects =
    (projectsData as Pick<Tables<"projects">, "id" | "title" | "slug" | "status">[] | null) ?? [];

  async function remove(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await deleteProject(id);
  }

  return (
    <section className="space-y-4">
      <Link href="/admin/projects/new" className="inline-flex rounded border border-[--border] px-3 py-2 text-xs text-[--text-muted]">
        new
      </Link>

      {projects.map((project) => (
        <div key={project.id} className="surface-card flex items-center justify-between">
          <Link href={`/admin/projects/${project.id}`} className="text-sm text-[--text-primary]">
            {project.title} ({project.slug})
          </Link>
          <form action={remove}>
            <input type="hidden" name="id" value={project.id} />
            <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
          </form>
        </div>
      ))}
    </section>
  );
}
