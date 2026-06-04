"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Updates } from "@/types/database";

export async function updateFooterSettings(id: string, data: Updates<"footer_settings">) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("footer_settings").update(data).eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/admin/footer");
}
