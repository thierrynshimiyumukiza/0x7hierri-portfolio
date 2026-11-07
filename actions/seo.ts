"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Inserts, Updates } from "@/types/database";

export async function createSeoSettings(data: Inserts<"seo_settings">) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("seo_settings").insert(data);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/studies");
  revalidatePath("/blog");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/admin/seo");
}

export async function updateSeoSettings(id: string, data: Updates<"seo_settings">) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("seo_settings").update(data).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/studies");
  revalidatePath("/blog");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/admin/seo");
}

export async function deleteSeoSettings(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("seo_settings").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/studies");
  revalidatePath("/blog");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/admin/seo");
}
