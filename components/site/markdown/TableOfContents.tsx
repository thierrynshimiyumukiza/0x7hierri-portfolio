"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";
import type { OutlineItem } from "@/lib/markdown-outline";

type TableOfContentsProps = {
  items: OutlineItem[];
};

export default function TableOfContents({ items }: TableOfContentsProps) {
  const [activeSlug, setActiveSlug] = useState<string>(items[0]?.slug ?? "");
  const [openOnMobile, setOpenOnMobile] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;

    const headings = items
      .map((item) => document.getElementById(item.slug))
      .filter((element): element is HTMLElement => Boolean(element));

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]?.target.id) {
          setActiveSlug(visible[0].target.id);
        }
      },
      { rootMargin: "-88px 0px -70% 0px", threshold: [0, 1] },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  const minDepth = Math.min(...items.map((item) => item.depth));

  return (
    <nav className="toc" aria-label="Table of contents" data-open={openOnMobile ? "true" : "false"}>
      <button type="button" className="toc-toggle" onClick={() => setOpenOnMobile((open) => !open)}>
        <List size={13} aria-hidden="true" />
        On this page
        <span className="toc-count">{items.length}</span>
      </button>

      <p className="toc-heading">On this page</p>

      <ol className="toc-list">
        {items.map((item) => (
          <li
            key={item.slug}
            className="toc-item"
            data-active={activeSlug === item.slug ? "true" : "false"}
            style={{ paddingLeft: `${(item.depth - minDepth) * 12}px` }}
          >
            <a href={`#${item.slug}`} onClick={() => setOpenOnMobile(false)}>
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
