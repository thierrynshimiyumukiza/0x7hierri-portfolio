import { createAdminClient } from "@/lib/supabase/admin";
import { createNavigationItem, deleteNavigationItem, updateNavigationItem } from "@/actions/navigation";
import type { Tables } from "@/types/database";

export default async function AdminNavigationPage() {
  const supabase = createAdminClient();
  const { data: itemsData } = await supabase.from("navigation").select("*").order("display_order", { ascending: true });
  const items = (itemsData as Tables<"navigation">[] | null) ?? [];

  async function add(formData: FormData) {
    "use server";
    await createNavigationItem({
      label: String(formData.get("label") ?? ""),
      url: String(formData.get("url") ?? ""),
      display_order: Number(formData.get("display_order") ?? 0),
      visible: formData.get("visible") === "on",
      is_external: formData.get("is_external") === "on",
    });
  }

  async function save(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) return;

    await updateNavigationItem(id, {
      label: String(formData.get("label") ?? ""),
      url: String(formData.get("url") ?? ""),
      display_order: Number(formData.get("display_order") ?? 0),
      visible: formData.get("visible") === "on",
      is_external: formData.get("is_external") === "on",
    });
  }

  async function remove(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) return;

    await deleteNavigationItem(id);
  }

  return (
    <section className="space-y-4">
      <form action={add} className="surface-card grid gap-3 sm:grid-cols-5">
        <input name="label" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
        <input name="url" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
        <input name="display_order" type="number" defaultValue={0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="visible" defaultChecked /> visible</label>
        <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="is_external" /> external</label>
        <button className="rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted] sm:col-span-5">add</button>
      </form>

      {items.map((item) => (
        <div key={item.id} className="surface-card space-y-2">
          <form action={save} className="grid gap-2 sm:grid-cols-5">
            <input type="hidden" name="id" value={item.id} />
            <input name="label" defaultValue={item.label} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
            <input name="url" defaultValue={item.url} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
            <input name="display_order" type="number" defaultValue={item.display_order ?? 0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="visible" defaultChecked={item.visible ?? false} /> visible</label>
            <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="is_external" defaultChecked={item.is_external ?? false} /> external</label>
            <button className="rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted] sm:col-span-5">save</button>
          </form>
          <form action={remove}>
            <input type="hidden" name="id" value={item.id} />
            <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
          </form>
        </div>
      ))}
    </section>
  );
}
