"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Inserts, Updates } from "@/types/database";

export async function createNavigationItem(data: Inserts<"navigation">) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("navigation").insert(data);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/navigation");
}

export async function updateNavigationItem(id: string, data: Updates<"navigation">) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("navigation").update(data).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/navigation");
}

export async function deleteNavigationItem(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("navigation").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/navigation");
}
