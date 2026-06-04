"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type SocialLinkPayload = {
  label: string;
  platform: string;
  url: string;
  display_order: number;
  visible: boolean;
};

function revalidateSocialPaths() {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/admin/social-links");
}

export async function createSocialLink(payload: SocialLinkPayload) {
  const supabase = createAdminClient() as any;
  const { error } = await supabase.from("social_links").insert(payload);
  if (error) throw new Error(error.message);
  revalidateSocialPaths();
}

export async function updateSocialLink(id: string, payload: SocialLinkPayload) {
  const supabase = createAdminClient() as any;
  const { error } = await supabase.from("social_links").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateSocialPaths();
}

export async function deleteSocialLink(id: string) {
  const supabase = createAdminClient() as any;
  const { error } = await supabase.from("social_links").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateSocialPaths();
}
