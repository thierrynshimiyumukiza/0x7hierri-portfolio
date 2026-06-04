import { createMediaItem, deleteMediaItem } from "@/actions/media";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

export default async function AdminMediaPage() {
  const supabase = createAdminClient();
  const { data: itemsData } = await supabase
    .from("media_library")
    .select("id,url,media_type,bucket")
    .order("created_at", { ascending: false });
  const items =
    (itemsData as Pick<Tables<"media_library">, "id" | "url" | "media_type" | "bucket">[] | null) ?? [];

  async function add(formData: FormData) {
    "use server";
    await createMediaItem({
      url: String(formData.get("url") ?? ""),
      media_type: String(formData.get("media_type") ?? "image") as "image" | "video" | "pdf" | "attachment",
      bucket: String(formData.get("bucket") ?? ""),
      file_name: String(formData.get("file_name") ?? ""),
      is_url_mode: true,
    });
  }

  async function remove(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await deleteMediaItem(id);
  }

  return (
    <section className="space-y-4">
      <form action={add} className="surface-card grid gap-3 sm:grid-cols-4">
        <input name="url" className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
        <input name="file_name" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="bucket" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <select name="media_type" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm">
          <option value="image">image</option>
          <option value="video">video</option>
          <option value="pdf">pdf</option>
          <option value="attachment">attachment</option>
        </select>
        <button className="rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted] sm:col-span-4">add</button>
      </form>

      {items.map((item) => (
        <form key={item.id} action={remove} className="surface-card flex items-center justify-between">
          <p className="text-sm text-[--text-body]">{item.media_type} {item.url}</p>
          <input type="hidden" name="id" value={item.id} />
          <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
        </form>
      ))}
    </section>
  );
}
