"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateReadingTime, generateSlug } from "@/lib/utils";
import type { Database, Inserts, Tables, Updates } from "@/types/database";

type EntryStatus = Database["public"]["Enums"]["entry_status"];

function withSlugSuffix(baseSlug: string, attempt: number): string {
  return attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
}

function normalizeSlugValue(value?: string | null, fallback = "post"): string {
  return generateSlug(value ?? "") || fallback;
}

function revalidateBlog(slugs: (string | null | undefined)[] = []) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin/blog");

  slugs.filter(Boolean).forEach((slug) => revalidatePath(`/blog/${slug as string}`));
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
    updated_at: new Date().toISOString(),
  };

  let lastError: { message: string } | null = null;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const slug = withSlugSuffix(baseSlug, attempt);
    const { error } = await supabase.from("blog_posts").insert({ ...payload, slug });

    if (!error) {
      revalidateBlog([slug]);
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
  const { data: currentPost, error: currentPostError } = await supabase
    .from("blog_posts")
    .select("slug,published_at")
    .eq("id", id)
    .maybeSingle();

  if (currentPostError) throw new Error(currentPostError.message);

  const requestedSlug =
    data.slug !== undefined
      ? normalizeSlugValue(data.slug || data.title, "post")
      : data.title
        ? normalizeSlugValue(data.title, "post")
        : undefined;

  // Publishing for the first time stamps "now" so the post is not dated 1970.
  const shouldBackfillPublishedAt =
    data.status === "published" && !data.published_at && !currentPost?.published_at;

  const payload: Updates<"blog_posts"> = {
    ...data,
    slug: requestedSlug,
    published_at: shouldBackfillPublishedAt ? new Date().toISOString() : data.published_at,
    reading_time: data.content ? calculateReadingTime(data.content) : data.reading_time,
    updated_at: new Date().toISOString(),
  };

  // A slug collision must not wipe the edit, so fall back to a suffixed slug.
  if (requestedSlug && requestedSlug !== currentPost?.slug) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const slug = withSlugSuffix(requestedSlug, attempt);
      const { error } = await supabase.from("blog_posts").update({ ...payload, slug }).eq("id", id);

      if (!error) {
        revalidateBlog([currentPost?.slug, slug]);
        return;
      }

      if (error.code !== "23505") throw new Error(error.message);
    }

    throw new Error("Could not generate a unique blog slug.");
  }

  const { error } = await supabase.from("blog_posts").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  revalidateBlog([currentPost?.slug, payload.slug]);
}

export async function deleteBlogPost(id: string) {
  const supabase = createAdminClient();
  const { data: current } = await supabase.from("blog_posts").select("slug").eq("id", id).maybeSingle();

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateBlog([current?.slug]);
}

/** Quick status change from the post list, without opening the editor. */
export async function setBlogPostStatus(id: string, status: EntryStatus) {
  const supabase = createAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("blog_posts")
    .select("slug,published_at")
    .eq("id", id)
    .maybeSingle();

  if (currentError) throw new Error(currentError.message);

  const { error } = await supabase
    .from("blog_posts")
    .update({
      status,
      published_at:
        status === "published" && !current?.published_at ? new Date().toISOString() : current?.published_at ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidateBlog([current?.slug]);
}

export async function setBlogPostFeatured(id: string, featured: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("blog_posts")
    .update({ featured, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidateBlog();
}

/** Copies a post as a fresh draft so a similar piece can start from it. */
export async function duplicateBlogPost(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("That post no longer exists.");

  const source = data as Tables<"blog_posts">;

  await createBlogPost({
    title: `${source.title} (copy)`,
    slug: normalizeSlugValue(`${source.slug}-copy`, "post-copy"),
    excerpt: source.excerpt,
    content: source.content,
    thumbnail_url: source.thumbnail_url,
    cover_image_url: source.cover_image_url,
    og_image_url: source.og_image_url,
    meta_title: source.meta_title,
    meta_description: source.meta_description,
    tags: source.tags,
    featured: false,
    status: "draft",
    published_at: null,
  });
}
