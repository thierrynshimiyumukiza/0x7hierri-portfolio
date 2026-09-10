import { format } from "date-fns";

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "MMM dd, yyyy · hh:mm a");
}

export function parseTags(tags?: string[] | null): string[] {
  return Array.isArray(tags) ? tags.filter(Boolean) : [];
}

/**
 * Tags are stored inconsistently: some rows already carry a leading "#" from
 * older imports, so rendering "#{tag}" produced "##kernel". Strip it once here.
 */
export function displayTag(tag: string): string {
  return tag.trim().replace(/^#+/, "");
}
