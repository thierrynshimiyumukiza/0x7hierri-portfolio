"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Inserts } from "@/types/database";

export async function createMediaItem(data: Inserts<"media_library">) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("media_library").insert(data);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/media");
}

export async function deleteMediaItem(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("media_library").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/media");
}
