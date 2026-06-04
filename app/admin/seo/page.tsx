import { createSeoSettings, deleteSeoSettings, updateSeoSettings } from "@/actions/seo";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

export default async function AdminSeoPage() {
  const supabase = createAdminClient();
  const { data: rowsData } = await supabase.from("seo_settings").select("*").order("page_key", { ascending: true });
  const rows = (rowsData as Tables<"seo_settings">[] | null) ?? [];

  async function add(formData: FormData) {
    "use server";
    await createSeoSettings({
      page_key: String(formData.get("page_key") ?? ""),
      meta_title: String(formData.get("meta_title") ?? ""),
      meta_description: String(formData.get("meta_description") ?? ""),
      og_image_url: String(formData.get("og_image_url") ?? ""),
      canonical_url: String(formData.get("canonical_url") ?? ""),
      robots: String(formData.get("robots") ?? "index, follow"),
      keywords: String(formData.get("keywords") ?? "")
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    });
  }

  async function save(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) return;

    await updateSeoSettings(id, {
      page_key: String(formData.get("page_key") ?? ""),
      meta_title: String(formData.get("meta_title") ?? ""),
      meta_description: String(formData.get("meta_description") ?? ""),
      og_image_url: String(formData.get("og_image_url") ?? ""),
      canonical_url: String(formData.get("canonical_url") ?? ""),
      robots: String(formData.get("robots") ?? "index, follow"),
      keywords: String(formData.get("keywords") ?? "")
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    });
  }

  async function remove(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await deleteSeoSettings(id);
  }

  return (
    <section className="space-y-4">
      <form action={add} className="surface-card grid gap-3">
        <input name="page_key" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
        <input name="meta_title" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <textarea name="meta_description" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="og_image_url" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="canonical_url" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="keywords" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="robots" defaultValue="index, follow" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <button className="rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">add</button>
      </form>

      {rows.map((row) => (
        <div key={row.id} className="surface-card space-y-2">
          <form action={save} className="grid gap-2">
            <input type="hidden" name="id" value={row.id} />
            <input name="page_key" defaultValue={row.page_key} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
            <input name="meta_title" defaultValue={row.meta_title ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <textarea name="meta_description" defaultValue={row.meta_description ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input name="og_image_url" defaultValue={row.og_image_url ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input name="canonical_url" defaultValue={row.canonical_url ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input name="keywords" defaultValue={(row.keywords ?? []).join(",")} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input name="robots" defaultValue={row.robots ?? "index, follow"} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <button className="rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">save</button>
          </form>
          <form action={remove}>
            <input type="hidden" name="id" value={row.id} />
            <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
          </form>
        </div>
      ))}
    </section>
  );
}
