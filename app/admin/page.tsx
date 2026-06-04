import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const [projects, studies, blog] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("study_entries").select("id", { count: "exact", head: true }),
    supabase.from("blog_posts").select("id", { count: "exact", head: true }),
  ]);

  const cards = [projects.count ?? 0, studies.count ?? 0, blog.count ?? 0];

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {cards.map((value, index) => (
        <article key={index} className="surface-card">
          <p className="text-3xl text-[--text-primary]">{value}</p>
        </article>
      ))}
    </section>
  );
}
