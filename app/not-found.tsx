import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 py-16 text-center">
      <Link href="/" className="inline-flex rounded border border-[--border] px-4 py-2 text-sm text-[--text-muted]">
        /
      </Link>
    </section>
  );
}
