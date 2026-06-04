"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateReadingTime, generateSlug } from "@/lib/utils";
import type { Inserts, Updates } from "@/types/database";

function withSlugSuffix(baseSlug: string, attempt: number): string {
  return attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
}

function normalizeSlugValue(value?: string | null, fallback = "item"): string {
  return generateSlug(value ?? "") || fallback;
}

export async function createStudyCategory(data: Inserts<"study_categories">) {
  const supabase = createAdminClient();
  const baseSlug = normalizeSlugValue(data.slug || data.title, "category");
  const normalizedStatus = data.status ?? "published";
  const payload: Inserts<"study_categories"> = {
    ...data,
    slug: baseSlug,
    status: normalizedStatus,
  };

  let lastError: { message: string } | null = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { error } = await supabase
      .from("study_categories")
      .insert({ ...payload, slug: withSlugSuffix(baseSlug, attempt) });

    if (!error) {
      revalidatePath("/");
      revalidatePath("/studies");
      revalidatePath("/admin/studies/categories");
      return;
    }

    if (error.code !== "23505") {
      throw new Error(error.message);
    }

    lastError = error;
  }

  throw new Error(lastError?.message ?? "Could not generate a unique category slug.");
}

export async function updateStudyCategory(id: string, data: Updates<"study_categories">) {
  const supabase = createAdminClient();
  const normalizedSlug =
    data.slug !== undefined
      ? normalizeSlugValue(data.slug || data.title, "category")
      : data.title
        ? normalizeSlugValue(data.title, "category")
        : undefined;
  const payload: Updates<"study_categories"> = {
    ...data,
    slug: normalizedSlug,
  };

  const { error } = await supabase.from("study_categories").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/studies");
  revalidatePath("/admin/studies/categories");
}

export async function deleteStudyCategory(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("study_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/studies");
  revalidatePath("/admin/studies/categories");
}

export async function createStudyEntry(data: Inserts<"study_entries">) {
  const supabase = createAdminClient();
  const baseSlug = normalizeSlugValue(data.slug || data.title, "entry");
  const normalizedStatus = data.status ?? "published";
  const normalizedPublishedAt =
    normalizedStatus === "published"
      ? data.published_at || new Date().toISOString()
      : data.published_at ?? null;
  const payload: Inserts<"study_entries"> = {
    ...data,
    slug: baseSlug,
    status: normalizedStatus,
    published_at: normalizedPublishedAt,
    reading_time: calculateReadingTime(data.content ?? ""),
  };

  let lastError: { message: string } | null = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { error } = await supabase
      .from("study_entries")
      .insert({ ...payload, slug: withSlugSuffix(baseSlug, attempt) });

    if (!error) {
      revalidatePath("/");
      revalidatePath("/studies");
      revalidatePath("/admin/studies/entries");
      return;
    }

    if (error.code !== "23505") {
      throw new Error(error.message);
    }

    lastError = error;
  }

  throw new Error(lastError?.message ?? "Could not generate a unique entry slug.");
}

export async function updateStudyEntry(id: string, data: Updates<"study_entries">) {
  const supabase = createAdminClient();
  const shouldBackfillPublishedAt = data.status === "published" && data.published_at === null;
  const normalizedSlug =
    data.slug !== undefined
      ? normalizeSlugValue(data.slug || data.title, "entry")
      : data.title
        ? normalizeSlugValue(data.title, "entry")
        : undefined;
  const payload: Updates<"study_entries"> = {
    ...data,
    slug: normalizedSlug,
    published_at: shouldBackfillPublishedAt ? new Date().toISOString() : data.published_at,
    reading_time: data.content ? calculateReadingTime(data.content) : data.reading_time,
  };

  const { error } = await supabase.from("study_entries").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/studies");
  revalidatePath("/admin/studies/entries");
}

export async function deleteStudyEntry(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("study_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/studies");
  revalidatePath("/admin/studies/entries");
}

export async function createStudyMedia(data: Inserts<"study_media">) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("study_media").insert(data);
  if (error) throw new Error(error.message);

  revalidatePath("/studies");
  revalidatePath("/admin/studies/entries");
}

export async function deleteStudyMedia(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("study_media").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/studies");
  revalidatePath("/admin/studies/entries");
}
