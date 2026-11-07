import type { Metadata } from "next";
import { Rss } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSeoMetadata } from "@/lib/seo";
import BlogSearchList from "@/components/site/BlogSearchList";
import { releasedFilter } from "@/lib/publishing";

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
    .or(releasedFilter())
    .order("published_at", { ascending: false });

  const posts = data ?? [];

  return (
    <div className="ui-wrap">
      <section className="flex flex-col gap-4" style={{ paddingTop: 72, paddingBottom: 28 }}>
        <p className="ui-label">$ ls ./blog</p>
        <h1 className="ui-h1">Writeups</h1>
        <p className="ui-lead">Notes on security research, engineering and the things I am currently learning.</p>
        <div>
          <a href="/blog/rss.xml" className="ui-btn ui-btn-sm">
            <Rss size={13} aria-hidden="true" />
            Subscribe via RSS
          </a>
        </div>
      </section>

      <section style={{ paddingBottom: 96 }}>
        {error ? (
          <p className="blog-page-error">Posts could not be loaded right now. Please try again shortly.</p>
        ) : (
          <BlogSearchList posts={posts} initialTag={searchParams?.tag ?? ""} />
        )}
      </section>
    </div>
  );
}
