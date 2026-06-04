"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Updates } from "@/types/database";

export async function updateHeroSettings(id: string, data: Updates<"hero_settings">) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("hero_settings").update(data).eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/homepage");
}
