"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type HomepageSettingsPayload = {
  philosophy_quote: string;
  philosophy_description: string;
  show_philosophy: boolean;
  about_preview_title: string;
  about_preview_text: string;
  about_preview_button_text: string;
  about_preview_url: string;
  cta_title: string;
  cta_description: string;
  cta_button_text: string;
  cta_button_url: string;
};

export type HomepageExpertisePayload = {
  title: string;
  description: string;
  icon: string;
  display_order: number;
  visible: boolean;
};

function revalidateHomepage() {
  revalidatePath("/");
  revalidatePath("/admin/homepage");
}

export async function saveHomepageSettings(id: string | null, payload: HomepageSettingsPayload) {
  const supabase = createAdminClient() as any;

  if (id) {
    const { error } = await supabase.from("homepage_settings").update(payload).eq("id", id);
    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from("homepage_settings").insert(payload);
    if (error) {
      throw new Error(error.message);
    }
  }

  revalidateHomepage();
}

export async function createHomepageExpertise(payload: HomepageExpertisePayload) {
  const supabase = createAdminClient() as any;
  const { error } = await supabase.from("homepage_expertise").insert(payload);
  if (error) {
    throw new Error(error.message);
  }

  revalidateHomepage();
}

export async function updateHomepageExpertise(id: string, payload: HomepageExpertisePayload) {
  const supabase = createAdminClient() as any;
  const { error } = await supabase.from("homepage_expertise").update(payload).eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidateHomepage();
}

export async function deleteHomepageExpertise(id: string) {
  const supabase = createAdminClient() as any;
  const { error } = await supabase.from("homepage_expertise").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidateHomepage();
}
