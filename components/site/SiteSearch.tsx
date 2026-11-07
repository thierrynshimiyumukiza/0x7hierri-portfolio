"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, FileText, FolderKanban, GraduationCap, Hash, Search } from "lucide-react";
import type { SearchDoc } from "@/app/api/search-index/route";

const KIND_ICON = {
  writeup: <FileText size={16} aria-hidden="true" />,
  project: <FolderKanban size={16} aria-hidden="true" />,
  study: <GraduationCap size={16} aria-hidden="true" />,
  page: <Hash size={16} aria-hidden="true" />,
};

/** Title hits outrank tag hits, which outrank summary hits; every word must match somewhere. */
function score(doc: SearchDoc, words: string[]) {
  const title = doc.title.toLowerCase();
  const tags = doc.tags.join(" ").toLowerCase();
  const summary = doc.summary.toLowerCase();
  let total = 0;
  for (const word of words) {
    if (title.startsWith(word)) total += 6;
    else if (title.includes(word)) total += 4;
    else if (tags.includes(word)) total += 2;
    else if (summary.includes(word)) total += 1;
    else return 0;
  }
  return total;
}

export default function SiteSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The index is fetched the first time the palette opens, not on every page view.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    if (docs || failed) return;
    fetch("/api/search-index")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data: SearchDoc[]) => setDocs(data))
      .catch(() => setFailed(true));
  }, [open, docs, failed]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const results = useMemo(() => {
    if (!docs) return [];
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return docs.filter((doc) => doc.kind !== "page").slice(0, 8);
    return docs
      .map((doc) => ({ doc, rank: score(doc, words) }))
      .filter((item) => item.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 12)
      .map((item) => item.doc);
  }, [docs, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (doc: SearchDoc | undefined) => {
    if (!doc) return;
    close();
    router.push(doc.url);
  };

  return (
    <>
      <button
        type="button"
        className="ui-btn ui-search-trigger"
        onClick={() => setOpen(true)}
        aria-label="Search the site"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <Search size={15} aria-hidden="true" />
        <span className="ui-hide-mobile">search</span>
        <kbd className="ui-kbd ui-hide-mobile">⌘K</kbd>
      </button>

      {open ? (
        <div className="ui-search-backdrop" onMouseDown={close}>
          <div
            className="ui-search-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Search the site"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="ui-search-input">
              <Search size={18} aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search writeups, projects and notes"
                aria-label="Search"
                aria-controls="site-search-results"
                aria-activedescendant={results[active] ? `site-search-${active}` : undefined}
                role="combobox"
                aria-expanded="true"
                onKeyDown={(event) => {
                  if (event.key === "Escape") close();
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActive((index) => Math.min(results.length - 1, index + 1));
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActive((index) => Math.max(0, index - 1));
                  }
                  if (event.key === "Enter") {
                    event.preventDefault();
                    go(results[active]);
                  }
                }}
              />
              <kbd className="ui-kbd">esc</kbd>
            </div>

            <ul id="site-search-results" ref={listRef} role="listbox" className="ui-search-results">
              {failed ? <li className="ui-search-empty">Search is unavailable right now.</li> : null}
              {!failed && !docs ? <li className="ui-search-empty">Loading…</li> : null}
              {docs && results.length === 0 ? (
                <li className="ui-search-empty">Nothing matches &ldquo;{query}&rdquo;.</li>
              ) : null}
              {results.map((doc, index) => (
                <li
                  key={doc.url}
                  id={`site-search-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={index === active}
                  className="ui-search-result"
                  onMouseMove={() => setActive(index)}
                  onClick={() => go(doc)}
                >
                  <span className="ui-search-icon">{KIND_ICON[doc.kind]}</span>
                  <span className="ui-search-text">
                    <span className="ui-search-title">{doc.title}</span>
                    {doc.summary ? <span className="ui-search-summary">{doc.summary}</span> : null}
                  </span>
                  <span className="ui-search-kind">{doc.kind}</span>
                  {index === active ? <CornerDownLeft size={14} aria-hidden="true" className="ui-search-enter" /> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
