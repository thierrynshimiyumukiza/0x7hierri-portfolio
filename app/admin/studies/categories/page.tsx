import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteStudyCategory } from "@/actions/studies";
import type { Tables } from "@/types/database";

export default async function AdminStudyCategoriesPage() {
  const supabase = createAdminClient();
  const { data: categoriesData } = await supabase
    .from("study_categories")
    .select("id,title,slug")
    .order("sort_order", { ascending: true });
  const categories =
    (categoriesData as Pick<Tables<"study_categories">, "id" | "title" | "slug">[] | null) ?? [];

  async function remove(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await deleteStudyCategory(id);
  }

  return (
    <section className="space-y-4">
      <Link href="/admin/studies/categories/new" className="inline-flex rounded border border-[--border] px-3 py-2 text-xs text-[--text-muted]">
        new
      </Link>
      {categories.map((category) => (
        <div key={category.id} className="surface-card flex items-center justify-between">
          <Link href={`/admin/studies/categories/${category.id}`} className="text-sm text-[--text-primary]">
            {category.title} ({category.slug})
          </Link>
          <form action={remove}>
            <input type="hidden" name="id" value={category.id} />
            <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
          </form>
        </div>
      ))}
    </section>
  );
}
