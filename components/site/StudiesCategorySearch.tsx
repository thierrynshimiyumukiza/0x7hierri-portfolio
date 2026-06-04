/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Tables } from "@/types/database";

type StudiesCategorySearchProps = {
  categories: Tables<"study_categories">[];
};

export default function StudiesCategorySearch({ categories }: StudiesCategorySearchProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return categories;

    return categories.filter((entry) => {
      const inTitle = entry.title.toLowerCase().includes(term);
      const inSummary = entry.description?.toLowerCase().includes(term) ?? false;
      const inTags = (entry.tags ?? []).some((tag) => tag.toLowerCase().includes(term));
      return inTitle || inSummary || inTags;
    });
  }, [categories, query]);

  return (
    <div>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder=""
        style={{
          width: "100%",
          background: "var(--bg-surface)",
          border: "0.5px solid var(--border)",
          borderRadius: "6px",
          color: "var(--text-body)",
          fontSize: "13px",
          padding: "8px 12px",
          outline: "none",
          marginBottom: "14px",
        }}
      />

      <div style={{ display: "grid", gap: "12px" }}>
        {filtered.map((category) => (
          <Link
            key={category.id}
            href={`/studies/${encodeURIComponent(category.slug)}`}
            className="category-card"
            style={{ display: "flex", flexDirection: "column", gap: "10px", textDecoration: "none" }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "7px",
                background: "var(--bg-base)",
                border: "0.5px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.9rem",
                color: "var(--accent-purple)",
                fontFamily: "var(--font-mono), monospace",
                fontSize: "10px",
              }}
            >
              std
            </div>
            {category.thumbnail_url ? (
              <img
                src={category.thumbnail_url}
                alt={category.title}
                loading="lazy"
                style={{ width: "100%", height: "140px", borderRadius: "7px", objectFit: "cover", border: "0.5px solid var(--border)" }}
              />
            ) : null}

            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{category.title}</p>
            {category.description ? (
              <p style={{ fontSize: "11.5px", color: "var(--text-dim)", lineHeight: 1.6 }}>{category.description}</p>
            ) : null}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10.5px", color: "var(--text-dim)", fontFamily: "var(--font-mono), monospace" }}>
              <span>{category.entry_count ?? 0} entries</span>
              <span>{category.difficulty}</span>
            </div>

            <div style={{ height: "4px", width: "100%", overflow: "hidden", borderRadius: "999px", background: "var(--border-muted)" }}>
              <div
                style={{
                  height: "100%",
                  background: "var(--accent-blue)",
                  width: `${Math.max(0, Math.min(100, category.progress_percent ?? 0))}%`,
                }}
              />
            </div>

            {(category.tags ?? []).length > 0 ? (
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                {(category.tags ?? []).map((tag) => (
                  <span
                    key={`${category.id}-${tag}`}
                    style={{
                      fontSize: "9.5px",
                      fontFamily: "var(--font-mono), monospace",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      display: "inline-block",
                      color: "var(--accent-purple)",
                      background: "rgba(210,168,255,0.1)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </Link>
        ))}
      </div>
      <style jsx>{`
        .category-card {
          background: var(--bg-surface);
          border: 0.5px solid var(--bg-elevated);
          border-radius: 8px;
          padding: 1.2rem;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }

        .category-card:hover {
          background: var(--bg-elevated);
          border: 0.5px solid var(--border);
        }
      `}</style>
    </div>
  );
}
