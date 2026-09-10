import { createMediaItem, deleteMediaItem } from "@/actions/media";
import { createAdminClient } from "@/lib/supabase/admin";
import MediaLibraryManager, { type MediaRow } from "@/components/admin/media/MediaLibraryManager";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("media_library")
    .select("id,url,file_name,media_type,file_size,bucket,created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  const items = (data as MediaRow[] | null) ?? [];

  async function addUrl(formData: FormData) {
    "use server";

    const url = String(formData.get("url") ?? "").trim();
    if (!url) return;

    await createMediaItem({
      url,
      media_type: String(formData.get("media_type") ?? "image") as Database["public"]["Enums"]["media_type"],
      file_name: url.split("/").pop() ?? url,
      is_url_mode: true,
    });
  }

  async function remove(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    if (id) await deleteMediaItem(id);
  }

  return <MediaLibraryManager items={items} onAddUrl={addUrl} onDelete={remove} />;
}
