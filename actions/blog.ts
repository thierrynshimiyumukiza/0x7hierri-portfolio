"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateReadingTime, generateSlug } from "@/lib/utils";
import type { Inserts, Updates } from "@/types/database";

function withSlugSuffix(baseSlug: string, attempt: number): string {
  return attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
}

function normalizeSlugValue(value?: string | null, fallback = "post"): string {
  return generateSlug(value ?? "") || fallback;
}

export async function createBlogPost(data: Inserts<"blog_posts">) {
  const supabase = createAdminClient();
  const baseSlug = normalizeSlugValue(data.slug || data.title, "post");
  const normalizedStatus = data.status ?? "published";
  const normalizedPublishedAt =
    normalizedStatus === "published"
      ? data.published_at || new Date().toISOString()
      : data.published_at ?? null;
  const payload: Inserts<"blog_posts"> = {
    ...data,
    slug: baseSlug,
    status: normalizedStatus,
    published_at: normalizedPublishedAt,
    reading_time: calculateReadingTime(data.content ?? ""),
  };

  let lastError: { message: string } | null = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { error } = await supabase
      .from("blog_posts")
      .insert({ ...payload, slug: withSlugSuffix(baseSlug, attempt) });

    if (!error) {
      revalidatePath("/");
      revalidatePath("/blog");
      revalidatePath("/admin/blog");
      return;
    }

    if (error.code !== "23505") {
      throw new Error(error.message);
    }

    lastError = error;
  }

  throw new Error(lastError?.message ?? "Could not generate a unique blog slug.");
}

export async function updateBlogPost(id: string, data: Updates<"blog_posts">) {
  const supabase = createAdminClient();
  const shouldBackfillPublishedAt = data.status === "published" && data.published_at === null;
  const normalizedSlug =
    data.slug !== undefined
      ? normalizeSlugValue(data.slug || data.title, "post")
      : data.title
        ? normalizeSlugValue(data.title, "post")
        : undefined;

  const payload: Updates<"blog_posts"> = {
    ...data,
    slug: normalizedSlug,
    published_at: shouldBackfillPublishedAt ? new Date().toISOString() : data.published_at,
    reading_time: data.content ? calculateReadingTime(data.content) : data.reading_time,
  };

  const { error } = await supabase.from("blog_posts").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
}

export async function deleteBlogPost(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
}
