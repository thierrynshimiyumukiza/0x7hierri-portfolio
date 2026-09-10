import type { Metadata } from "next";
import { Rss } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSeoMetadata } from "@/lib/seo";
import BlogSearchList from "@/components/site/BlogSearchList";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getSeoMetadata("blog");

  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      types: { "application/rss+xml": "/blog/rss.xml" },
    },
  };
}

type BlogPageProps = {
  searchParams?: { tag?: string };
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,title,slug,excerpt,thumbnail_url,tags,published_at,reading_time,featured")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const posts = data ?? [];

  return (
    <section className="blog-page">
      <header className="blog-page-header">
        <p className="blog-page-kicker">writing</p>
        <h1 className="blog-page-title">Blog</h1>
        <p className="blog-page-subtitle">
          Notes on security research, engineering and the things I am currently learning.
        </p>

        <a href="/blog/rss.xml" className="blog-page-feed">
          <Rss size={12} aria-hidden="true" />
          Subscribe via RSS
        </a>
      </header>

      {error ? (
        <p className="blog-page-error">Posts could not be loaded right now. Please try again shortly.</p>
      ) : (
        <BlogSearchList posts={posts} initialTag={searchParams?.tag ?? ""} />
      )}
    </section>
  );
}
