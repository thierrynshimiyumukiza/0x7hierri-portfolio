import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, PenLine, RefreshCw, Tag } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { displayTag, formatDateTime, generateSlug } from "@/lib/utils";
import { extractOutline } from "@/lib/markdown-outline";
import { normalizeImageUrl } from "@/lib/images";
import MarkdownRenderer from "@/components/site/markdown/MarkdownRenderer";
import TableOfContents from "@/components/site/markdown/TableOfContents";
import ArticleToolbar from "@/components/site/markdown/ArticleToolbar";
import Thumbnail from "@/components/site/Thumbnail";
import type { Tables } from "@/types/database";

type BlogPostPageProps = {
  params: {
    slug: string;
  };
};

type PostRow = Tables<"blog_posts">;

/**
 * Slugs are stored normalised, but older links and hand-typed URLs can differ in
 * case or punctuation, so an exact lookup falls back to a normalised comparison.
 */
async function findPublishedPost(rawSlug: string): Promise<PostRow | null> {
  const supabase = createAdminClient();
  const requestedSlug = decodeURIComponent(rawSlug);

  const { data: exact } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .eq("slug", requestedSlug)
    .maybeSingle();

  if (exact) return exact as PostRow;

  const normalizedRequestedSlug = generateSlug(requestedSlug);
  const { data: candidates } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(400);

  const rows = (candidates as PostRow[] | null) ?? [];
  return rows.find((row) => generateSlug(row.slug) === normalizedRequestedSlug) ?? null;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await findPublishedPost(params.slug);
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "0x7hierri";

  if (!post) {
    return { title: `Post not found · ${siteName}` };
  }

  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || undefined;
  const image = normalizeImageUrl(post.og_image_url || post.cover_image_url || post.thumbnail_url);

  return {
    title,
    description,
    keywords: post.tags ?? undefined,
    alternates: {
      canonical: `/blog/${post.slug}`,
      types: { "application/rss+xml": "/blog/rss.xml" },
    },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
      tags: post.tags ?? undefined,
      images: image ? [image] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await findPublishedPost(params.slug);

  if (!post) {
    notFound();
  }

  const supabase = createAdminClient();
  const { data: siblingsData } = await supabase
    .from("blog_posts")
    .select("id,title,slug,excerpt,thumbnail_url,published_at,reading_time,tags")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(400);

  type Sibling = Pick<
    PostRow,
    "id" | "title" | "slug" | "excerpt" | "thumbnail_url" | "published_at" | "reading_time" | "tags"
  >;

  const siblings = (siblingsData as Sibling[] | null) ?? [];
  const currentIndex = siblings.findIndex((row) => row.id === post.id);
  const newerPost = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const olderPost = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  const postTags = post.tags ?? [];
  const related = siblings
    .filter((row) => row.id !== post.id)
    .map((row) => ({
      row,
      overlap: (row.tags ?? []).filter((tag) => postTags.includes(tag)).length,
    }))
    .filter((entry) => entry.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3)
    .map((entry) => entry.row);

  const content = post.content ?? "";
  const outline = extractOutline(content);
  const author = process.env.NEXT_PUBLIC_SITE_NAME ?? "0x7hierri";

  // A revision only deserves its own line when it lands a day or more after
  // publication; anything closer is just the author fixing a typo on the way out.
  const publishedStamp = post.published_at ? new Date(post.published_at).getTime() : 0;
  const updatedStamp = post.updated_at ? new Date(post.updated_at).getTime() : 0;
  const meaningfullyUpdated =
    publishedStamp > 0 && updatedStamp > publishedStamp + 24 * 60 * 60 * 1000;
  const coverUrl = normalizeImageUrl(post.cover_image_url || post.thumbnail_url);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description || post.excerpt || undefined,
    image: normalizeImageUrl(post.og_image_url || post.cover_image_url || post.thumbnail_url) || undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at ?? post.published_at ?? undefined,
    keywords: postTags.join(", ") || undefined,
    author: { "@type": "Person", name: process.env.NEXT_PUBLIC_SITE_NAME ?? "0x7hierri" },
  };

  return (
    <div className="article-page">
      <ArticleToolbar title={post.title} />

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="article-shell">
        <header className="article-header">
          <Link href="/blog" className="article-back">
            <ArrowLeft size={13} aria-hidden="true" />
            All posts
          </Link>

          <h1 className="article-title">{post.title}</h1>

          {post.excerpt ? <p className="article-lede">{post.excerpt}</p> : null}

          <div className="article-meta">
            <span className="article-meta-item article-byline">
              <PenLine size={12} aria-hidden="true" />
              {author}
            </span>

            {post.published_at ? (
              <span className="article-meta-item">
                <CalendarDays size={12} aria-hidden="true" />
                {formatDateTime(post.published_at)}
              </span>
            ) : null}

            {post.reading_time ? (
              <span className="article-meta-item">
                <Clock size={12} aria-hidden="true" />
                {post.reading_time} min read
              </span>
            ) : null}

            {postTags.length > 0 ? (
              <span className="article-meta-item">
                <Tag size={12} aria-hidden="true" />
                {postTags.length} {postTags.length === 1 ? "tag" : "tags"}
              </span>
            ) : null}

            {meaningfullyUpdated ? (
              <span className="article-meta-item">
                <RefreshCw size={12} aria-hidden="true" />
                Updated {formatDateTime(post.updated_at)}
              </span>
            ) : null}
          </div>

          {postTags.length > 0 ? (
            <ul className="article-tags">
              {postTags.map((tag) => (
                <li key={`${post.id}-${tag}`}>
                  <Link href={`/blog?tag=${encodeURIComponent(tag)}`} className="article-tag">
                    #{displayTag(tag)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        {coverUrl ? (
          <figure className="article-cover">
            <Thumbnail
              src={coverUrl}
              alt={post.title}
              seed={post.title}
              ratio="16/9"
              maxHeight={310}
              sizes="(max-width: 700px) 100vw, 640px"
              eager
              radius={12}
            />
          </figure>
        ) : null}

        <div className="article-body">
          <aside className="article-aside">
            <TableOfContents items={outline} />
          </aside>

          <article className="article-content">
            {content.trim() ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="article-empty">This post has no content yet.</p>
            )}
          </article>
        </div>

        {newerPost || olderPost ? (
          <nav className="article-pager" aria-label="More posts">
            {olderPost ? (
              <Link href={`/blog/${encodeURIComponent(olderPost.slug)}`} className="article-pager-link">
                <span className="article-pager-label">
                  <ArrowLeft size={12} aria-hidden="true" /> Previous
                </span>
                <span className="article-pager-title">{olderPost.title}</span>
              </Link>
            ) : (
              <span />
            )}

            {newerPost ? (
              <Link
                href={`/blog/${encodeURIComponent(newerPost.slug)}`}
                className="article-pager-link article-pager-next"
              >
                <span className="article-pager-label">
                  Next <ArrowRight size={12} aria-hidden="true" />
                </span>
                <span className="article-pager-title">{newerPost.title}</span>
              </Link>
            ) : null}
          </nav>
        ) : null}

        {related.length > 0 ? (
          <section className="article-related">
            <h2 className="article-related-heading">Related reading</h2>
            <div className="article-related-grid">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/blog/${encodeURIComponent(item.slug)}`}
                  className="article-related-card"
                >
                  <Thumbnail
                    src={item.thumbnail_url}
                    alt={item.title}
                    seed={item.title}
                    ratio="16/9"
                    maxHeight={140}
                    sizes="(max-width: 700px) 100vw, 300px"
                    radius={9}
                  />
                  <span className="article-related-title">{item.title}</span>
                  {item.excerpt ? <span className="article-related-excerpt">{item.excerpt}</span> : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
