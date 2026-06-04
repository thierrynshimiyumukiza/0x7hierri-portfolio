import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSeoMetadata } from "@/lib/seo";
import StudiesCategorySearch from "@/components/site/StudiesCategorySearch";
import SectionHeader from "@/components/site/SectionHeader";

export async function generateMetadata(): Promise<Metadata> {
  return getSeoMetadata("studies");
}

export default async function StudiesPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("study_categories")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) return null;

  return (
    <section style={{ maxWidth: "760px", margin: "0 auto", padding: "2.5rem 2rem" }}>
      <SectionHeader title="studies" />
      <StudiesCategorySearch categories={data ?? []} />
    </section>
  );
}
