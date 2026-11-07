"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Tables } from "@/types/database";
import { displayTag } from "@/lib/utils";

export type StudyEntryRow = Pick<
  Tables<"study_entries">,
  "id" | "category_id" | "title" | "slug" | "summary" | "entry_number" | "reading_time" | "published_at"
>;

type StudiesCategorySearchProps = {
  categories: Tables<"study_categories">[];
  entries: StudyEntryRow[];
};

function monogram(title: string) {
  const words = title.split(/\s+/).filter(Boolean);
  // "C Programming" reads better as "C" than "CP".
  if (words[0]?.length === 1) return words[0].toUpperCase();
  return words
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function shortDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value)) : "";
}

export default function StudiesCategorySearch({ categories, entries }: StudiesCategorySearchProps) {
  const [query, setQuery] = useState("");

  const entriesByCategory = useMemo(() => {
    const map = new Map<string, StudyEntryRow[]>();
    entries.forEach((entry) => {
      if (!entry.category_id) return;
      const list = map.get(entry.category_id) ?? [];
      list.push(entry);
      map.set(entry.category_id, list);
    });
    map.forEach((list) => list.sort((a, b) => (a.entry_number ?? 0) - (b.entry_number ?? 0)));
    return map;
  }, [entries]);

  const term = query.trim().toLowerCase();

  // A search matches a whole track, or narrows a track down to the entries that match.
  const results = useMemo(
    () =>
      categories
        .map((category) => {
          const list = entriesByCategory.get(category.id) ?? [];
          if (!term) return { category, list };

          const trackMatch =
            category.title.toLowerCase().includes(term) ||
            (category.description ?? "").toLowerCase().includes(term) ||
            (category.tags ?? []).some((tag) => tag.toLowerCase().includes(term));
          const matchingEntries = list.filter(
            (entry) => entry.title.toLowerCase().includes(term) || (entry.summary ?? "").toLowerCase().includes(term),
          );

          if (trackMatch) return { category, list };
          if (matchingEntries.length > 0) return { category, list: matchingEntries };
          return null;
        })
        .filter((item): item is { category: Tables<"study_categories">; list: StudyEntryRow[] } => item !== null),
    [categories, entriesByCategory, term],
  );

  return (
    <div className="flex flex-col gap-6">
      <label
        className="flex items-center gap-3"
        style={{
          minHeight: 48,
          padding: "0 16px",
          border: "1px solid var(--border)",
          borderRadius: 12,
          background: "var(--bg-sunken)",
          maxWidth: 520,
        }}
      >
        <Search size={16} aria-hidden="true" style={{ color: "var(--text-dim)" }} />
        <span className="ui-sr-only">Search study notes</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tracks and notes, e.g. pointers"
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: 0,
            outline: "none",
            color: "var(--text-primary)",
            font: "inherit",
            fontSize: 15,
          }}
        />
      </label>

      {results.length === 0 ? (
        <div className="ui-card-dashed" style={{ padding: 28, color: "var(--text-muted)" }}>
          Nothing matches &ldquo;{query}&rdquo;.
        </div>
      ) : null}

      {results.map(({ category, list }) => {
        const progress = Math.max(0, Math.min(100, category.progress_percent ?? 0));
        const complete = progress >= 100;
        const totalEntries = Math.max(category.entry_count ?? 0, entriesByCategory.get(category.id)?.length ?? 0);
        const href = `/studies/${encodeURIComponent(category.slug)}`;

        return (
          <article key={category.id} className="ui-card overflow-hidden">
            <div
              className="grid gap-8"
              style={{
                padding: 32,
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
                borderBottom: list.length > 0 ? "1px solid var(--border)" : undefined,
              }}
            >
              <div className="flex items-start gap-5">
                <span
                  className="ui-mono flex flex-none items-center justify-center"
                  aria-hidden="true"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    background: "var(--accent-green-soft)",
                    border: "1px solid var(--accent-green-line)",
                    color: "var(--accent-green)",
                    fontSize: 22,
                    fontWeight: 500,
                  }}
                >
                  {monogram(category.title)}
                </span>
                <div className="flex min-w-0 flex-col gap-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 style={{ fontSize: 26, letterSpacing: "-0.02em", fontWeight: 600 }}>
                      <Link href={href} className="ui-row-link">
                        <span className="ui-row-title">{category.title}</span>
                      </Link>
                    </h2>
                    <span className={complete ? "ui-tag ui-tag-blue" : "ui-tag ui-tag-green"}>
                      {complete ? "complete" : "in progress"}
                    </span>
                  </div>
                  {category.description ? (
                    <p style={{ color: "var(--text-body)", lineHeight: 1.65, fontSize: 16 }}>{category.description}</p>
                  ) : null}
                  {(category.tags ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(category.tags ?? []).map((tag) => (
                        <span key={tag} className="ui-tag">
                          {displayTag(tag)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid content-start gap-3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                {[
                  { value: String(totalEntries), label: totalEntries === 1 ? "entry" : "entries" },
                  { value: category.difficulty ?? "beginner", label: "level", small: true },
                  { value: `${progress}%`, label: "progress" },
                ].map((tile) => (
                  <div
                    key={tile.label}
                    style={{ padding: 18, borderRadius: 12, background: "var(--bg-sunken)", border: "1px solid var(--border-muted)" }}
                  >
                    <div
                      style={{
                        fontSize: tile.small ? 17 : 26,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        paddingTop: tile.small ? 6 : 0,
                      }}
                    >
                      {tile.value}
                    </div>
                    <div className="ui-label" style={{ marginTop: tile.small ? 8 : 4 }}>
                      {tile.label}
                    </div>
                  </div>
                ))}
                <div style={{ gridColumn: "span 3" }}>
                  <div className="ui-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${category.title} progress`}>
                    <span style={{ width: `${Math.max(2, progress)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {list.length > 0 ? (
              <ol style={{ listStyle: "none", padding: "8px 0" }}>
                {list.map((entry, index) => (
                  <li key={entry.id} style={{ borderTop: index === 0 ? undefined : "1px solid var(--border-muted)" }}>
                    <Link
                      href={`${href}/${encodeURIComponent(entry.slug)}`}
                      className="ui-row-link grid items-center gap-4"
                      style={{ gridTemplateColumns: "48px 1fr auto", padding: "18px 32px" }}
                    >
                      <span className="ui-mono" style={{ fontSize: 14, color: "var(--accent-green)" }}>
                        {String(entry.entry_number || index + 1).padStart(2, "0")}
                      </span>
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="ui-row-title" style={{ fontSize: 17, fontWeight: 500, color: "var(--text-primary)" }}>
                          {entry.title}
                        </span>
                        {entry.summary ? (
                          <span className="line-clamp-1" style={{ fontSize: 14, color: "var(--text-muted)" }}>
                            {entry.summary}
                          </span>
                        ) : null}
                      </span>
                      <span className="ui-mono ui-hide-mobile" style={{ fontSize: 13, color: "var(--text-dim)" }}>
                        {[shortDate(entry.published_at), entry.reading_time ? `${entry.reading_time} min` : ""]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
