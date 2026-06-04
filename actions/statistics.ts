"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Inserts, Updates } from "@/types/database";

export async function createStatistic(data: Inserts<"statistics">) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("statistics").insert(data);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/homepage");
}

export async function updateStatistic(id: string, data: Updates<"statistics">) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("statistics").update(data).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/homepage");
}

export async function deleteStatistic(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("statistics").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/homepage");
}
