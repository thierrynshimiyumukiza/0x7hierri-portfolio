/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, generateSlug } from "@/lib/utils";
import MarkdownRenderer from "@/components/site/markdown/MarkdownRenderer";
import type { Tables } from "@/types/database";

type BlogPostPageProps = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const supabase = createAdminClient();
  const requestedSlug = decodeURIComponent(params.slug);
  const normalizedRequestedSlug = generateSlug(requestedSlug);

  const { data } = await supabase
    .from("blog_posts")
    .select("title,slug,meta_title,meta_description,og_image_url")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(60);

  const rows = (data as Pick<Tables<"blog_posts">, "title" | "slug" | "meta_title" | "meta_description" | "og_image_url">[] | null) ?? [];
  const post =
    rows.find((item) => item.slug === requestedSlug) ??
    rows.find((item) => generateSlug(item.slug) === normalizedRequestedSlug) ??
    null;

  return {
    title: post?.meta_title ?? post?.title ?? process.env.NEXT_PUBLIC_SITE_NAME ?? "0x7hierri",
    description: post?.meta_description ?? undefined,
    openGraph: {
      title: post?.meta_title ?? post?.title ?? process.env.NEXT_PUBLIC_SITE_NAME ?? "0x7hierri",
      description: post?.meta_description ?? undefined,
      images: post?.og_image_url ? [post.og_image_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const supabase = createAdminClient();
  const requestedSlug = decodeURIComponent(params.slug);
  const normalizedRequestedSlug = generateSlug(requestedSlug);

  const { data: rowsData, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(60);

  const rows = (rowsData as Tables<"blog_posts">[] | null) ?? [];
  const post =
    rows.find((item) => item.slug === requestedSlug) ??
    rows.find((item) => generateSlug(item.slug) === normalizedRequestedSlug) ??
    null;

  if (error || !post) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {post.cover_image_url ? (
        <img
          src={post.cover_image_url}
          alt={post.title}
          loading="eager"
          className="mb-6 h-auto w-full rounded-lg border border-[--border] object-cover"
        />
      ) : null}

      <h1 className="text-3xl font-medium tracking-[-1.1px] text-[--text-primary] sm:text-4xl">{post.title}</h1>
      <p className="mt-2 text-sm text-[--text-dim]">
        {formatDateTime(post.published_at)}
        {post.reading_time ? ` · ${post.reading_time} min` : ""}
      </p>

      {(post.tags ?? []).length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {(post.tags ?? []).map((tag) => (
            <span
              key={`${post.id}-${tag}`}
              className="rounded-full border border-[--border] px-2 py-0.5 font-mono text-[10px] text-[--text-dim]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        <MarkdownRenderer content={post.content ?? ""} />
      </div>
    </section>
  );
}
