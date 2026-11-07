import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSeoMetadata } from "@/lib/seo";
import StudiesCategorySearch, { type StudyEntryRow } from "@/components/site/StudiesCategorySearch";

export async function generateMetadata(): Promise<Metadata> {
  return getSeoMetadata("studies");
}

export default async function StudiesPage() {
  const supabase = createAdminClient();
  const [categoriesResult, entriesResult] = await Promise.all([
    supabase.from("study_categories").select("*").eq("status", "published").order("sort_order", { ascending: true }),
    supabase
      .from("study_entries")
      .select("id,category_id,title,slug,summary,entry_number,reading_time,published_at")
      .eq("status", "published"),
  ]);

  if (categoriesResult.error) return null;

  return (
    <div className="ui-wrap">
      <section className="flex flex-col gap-4" style={{ paddingTop: 72, paddingBottom: 36 }}>
        <p className="ui-label">$ tree ./studies</p>
        <h1 className="ui-h1">Study tracks</h1>
        <p className="ui-lead">
          Structured notes from what I&apos;m learning right now: one track per subject, in the order I studied it.
        </p>
      </section>

      <section style={{ paddingBottom: 96 }}>
        <StudiesCategorySearch
          categories={categoriesResult.data ?? []}
          entries={(entriesResult.data as StudyEntryRow[] | null) ?? []}
        />
      </section>
    </div>
  );
}
