"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Updates } from "@/types/database";

export async function updateProfile(id: string, data: Updates<"profile">) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("profile").update(data).eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/admin/profile");
}
