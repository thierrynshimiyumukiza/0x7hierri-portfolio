"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlug } from "@/lib/utils";
import type { Inserts, Updates } from "@/types/database";

function withSlugSuffix(baseSlug: string, attempt: number): string {
  return attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
}

function normalizeSlugValue(value?: string | null, fallback = "project"): string {
  return generateSlug(value ?? "") || fallback;
}

export async function createProject(data: Inserts<"projects">) {
  const supabase = createAdminClient();
  const baseSlug = normalizeSlugValue(data.slug || data.title, "project");
  const normalizedStatus = data.status ?? "published";
  const payload: Inserts<"projects"> = {
    ...data,
    slug: baseSlug,
    status: normalizedStatus,
  };

  let lastError: { message: string } | null = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { error } = await supabase
      .from("projects")
      .insert({ ...payload, slug: withSlugSuffix(baseSlug, attempt) });

    if (!error) {
      revalidatePath("/");
      revalidatePath("/projects");
      revalidatePath("/admin/projects");
      return;
    }

    if (error.code !== "23505") {
      throw new Error(error.message);
    }

    lastError = error;
  }

  throw new Error(lastError?.message ?? "Could not generate a unique project slug.");
}

export async function updateProject(id: string, data: Updates<"projects">) {
  const supabase = createAdminClient();
  const normalizedSlug =
    data.slug !== undefined
      ? normalizeSlugValue(data.slug || data.title, "project")
      : data.title
        ? normalizeSlugValue(data.title, "project")
        : undefined;
  const payload: Updates<"projects"> = {
    ...data,
    slug: normalizedSlug,
  };

  const { error } = await supabase.from("projects").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
}

export async function deleteProject(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
}
