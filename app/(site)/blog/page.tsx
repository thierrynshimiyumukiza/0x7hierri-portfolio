import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSeoMetadata } from "@/lib/seo";
import BlogSearchList from "@/components/site/BlogSearchList";
import SectionHeader from "@/components/site/SectionHeader";

export async function generateMetadata(): Promise<Metadata> {
  return getSeoMetadata("blog");
}

export default async function BlogPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    return null;
  }

  return (
    <section style={{ maxWidth: "760px", margin: "0 auto", padding: "2.5rem 2rem" }}>
      <SectionHeader title="blog" />
      <BlogSearchList posts={data ?? []} />
    </section>
  );
}
