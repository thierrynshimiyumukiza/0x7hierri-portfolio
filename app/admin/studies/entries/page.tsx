import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteStudyEntry } from "@/actions/studies";
import type { Tables } from "@/types/database";

export default async function AdminStudyEntriesPage() {
  const supabase = createAdminClient();
  const { data: entriesData } = await supabase
    .from("study_entries")
    .select("id,title,slug,status")
    .order("created_at", { ascending: false });
  const entries =
    (entriesData as Pick<Tables<"study_entries">, "id" | "title" | "slug" | "status">[] | null) ?? [];

  async function remove(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await deleteStudyEntry(id);
  }

  return (
    <section className="space-y-4">
      <Link href="/admin/studies/entries/new" className="inline-flex rounded border border-[--border] px-3 py-2 text-xs text-[--text-muted]">
        new
      </Link>
      {entries.map((entry) => (
        <div key={entry.id} className="surface-card flex items-center justify-between">
          <Link href={`/admin/studies/entries/${entry.id}`} className="text-sm text-[--text-primary]">
            {entry.title} ({entry.slug})
          </Link>
          <form action={remove}>
            <input type="hidden" name="id" value={entry.id} />
            <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
          </form>
        </div>
      ))}
    </section>
  );
}
