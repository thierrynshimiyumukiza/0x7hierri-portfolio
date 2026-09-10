export type OutlineItem = {
  depth: number;
  text: string;
  slug: string;
};

/**
 * Mirrors github-slugger, which is what rehype-slug uses to build heading ids.
 * The table of contents is generated from the raw markdown, so both sides have to
 * agree character for character or every anchor link lands nowhere.
 */
export function headingSlug(rawHeading: string, seen?: Map<string, number>): string {
  const plain = rawHeading
    .replace(/<[^>]*>/g, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~]/g, "")
    .trim();

  const base = plain
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");

  const slug = base || "section";

  if (!seen) return slug;

  const count = seen.get(slug) ?? 0;
  seen.set(slug, count + 1);
  return count === 0 ? slug : `${slug}-${count}`;
}

/** Headings outside fenced code, in document order, with their anchor ids. */
export function extractOutline(content: string, maxDepth = 3): OutlineItem[] {
  const withoutFences = content.replace(/\r\n/g, "\n").replace(/^```[\s\S]*?^```/gm, "");
  const seen = new Map<string, number>();
  const items: OutlineItem[] = [];

  for (const match of withoutFences.matchAll(/^(#{1,6})\s+(.+?)\s*#*\s*$/gm)) {
    const depth = match[1].length;
    const text = match[2]
      .replace(/<[^>]*>/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_~]/g, "")
      .trim();

    const slug = headingSlug(match[2], seen);
    if (depth <= maxDepth && text) {
      items.push({ depth, text, slug });
    }
  }

  return items;
}

/** Rough word count that ignores code fences, so reading time is not inflated. */
export function countWords(content: string): number {
  const prose = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  return prose.trim().split(/\s+/).filter(Boolean).length;
}
