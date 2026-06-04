"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMissingTableHelpMessage, isMissingTableError } from "@/lib/supabase/errors";
import type { Inserts, Updates } from "@/types/database";

export async function updateAboutSettings(id: string, data: Updates<"about_settings">) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("about_settings").update(data).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/about");
  revalidatePath("/admin/about");
}

export async function createTimelineItem(data: Inserts<"career_timeline">) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("career_timeline").insert(data);
  if (error) throw new Error(error.message);

  revalidatePath("/about");
  revalidatePath("/admin/about");
}

export async function updateTimelineItem(id: string, data: Updates<"career_timeline">) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("career_timeline").update(data).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/about");
  revalidatePath("/admin/about");
}

export async function deleteTimelineItem(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("career_timeline").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/about");
  revalidatePath("/admin/about");
}

export async function createCertification(data: Inserts<"certifications">) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("certifications").insert(data);
  if (error) throw new Error(error.message);

  revalidatePath("/about");
  revalidatePath("/admin/about");
}

export async function updateCertification(id: string, data: Updates<"certifications">) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("certifications").update(data).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/about");
  revalidatePath("/admin/about");
}

export async function deleteCertification(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("certifications").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/about");
  revalidatePath("/admin/about");
}

export async function createEducationEntry(data: Inserts<"education_entries">) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("education_entries").insert(data);
  if (error) {
    if (isMissingTableError(error, "education_entries")) {
      throw new Error(getMissingTableHelpMessage("education_entries"));
    }
    throw new Error(error.message);
  }

  revalidatePath("/about");
  revalidatePath("/admin/about");
}

export async function updateEducationEntry(id: string, data: Updates<"education_entries">) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("education_entries").update(data).eq("id", id);
  if (error) {
    if (isMissingTableError(error, "education_entries")) {
      throw new Error(getMissingTableHelpMessage("education_entries"));
    }
    throw new Error(error.message);
  }

  revalidatePath("/about");
  revalidatePath("/admin/about");
}

export async function deleteEducationEntry(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("education_entries").delete().eq("id", id);
  if (error) {
    if (isMissingTableError(error, "education_entries")) {
      throw new Error(getMissingTableHelpMessage("education_entries"));
    }
    throw new Error(error.message);
  }

  revalidatePath("/about");
  revalidatePath("/admin/about");
}

type AboutCollectionPayload = {
  title: string;
  description: string;
  icon: string;
  display_order: number;
  visible: boolean;
};

type AboutSkillGroupPayload = {
  group_title: string;
  items: string[];
  display_order: number;
  visible: boolean;
};

async function insertAboutRow(table: string, payload: Record<string, unknown>) {
  const supabase = createAdminClient() as any;
  const { error } = await supabase.from(table).insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath("/about");
  revalidatePath("/admin/about");
}

async function updateAboutRow(table: string, id: string, payload: Record<string, unknown>) {
  const supabase = createAdminClient() as any;
  const { error } = await supabase.from(table).update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/about");
  revalidatePath("/admin/about");
}

async function deleteAboutRow(table: string, id: string) {
  const supabase = createAdminClient() as any;
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/about");
  revalidatePath("/admin/about");
}

export async function createAboutFocusArea(data: AboutCollectionPayload) {
  await insertAboutRow("about_focus_areas", data);
}

export async function updateAboutFocusArea(id: string, data: AboutCollectionPayload) {
  await updateAboutRow("about_focus_areas", id, data);
}

export async function deleteAboutFocusArea(id: string) {
  await deleteAboutRow("about_focus_areas", id);
}

export async function createAboutInterest(data: AboutCollectionPayload) {
  await insertAboutRow("about_interests", data);
}

export async function updateAboutInterest(id: string, data: AboutCollectionPayload) {
  await updateAboutRow("about_interests", id, data);
}

export async function deleteAboutInterest(id: string) {
  await deleteAboutRow("about_interests", id);
}

export async function createAboutSkillGroup(data: AboutSkillGroupPayload) {
  await insertAboutRow("about_skill_groups", data);
}

export async function updateAboutSkillGroup(id: string, data: AboutSkillGroupPayload) {
  await updateAboutRow("about_skill_groups", id, data);
}

export async function deleteAboutSkillGroup(id: string) {
  await deleteAboutRow("about_skill_groups", id);
}
