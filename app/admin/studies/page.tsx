import Link from "next/link";

export default function AdminStudiesPage() {
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      <Link href="/admin/studies/categories" className="surface-card text-sm text-[--text-primary]">
        categories
      </Link>
      <Link href="/admin/studies/entries" className="surface-card text-sm text-[--text-primary]">
        entries
      </Link>
    </section>
  );
}
