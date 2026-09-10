import type { Database, Inserts } from "@/types/database";

type EntryStatus = Database["public"]["Enums"]["entry_status"];

const STATUSES: EntryStatus[] = ["draft", "published", "archived"];

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/** datetime-local gives "2026-09-09T10:30" in the admin's own timezone. */
function toIsoTimestamp(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** Shared by the create and edit routes so both write exactly the same shape. */
export function blogValuesFromFormData(formData: FormData): Inserts<"blog_posts"> {
  const rawStatus = text(formData, "status") as EntryStatus;
  const status = STATUSES.includes(rawStatus) ? rawStatus : "draft";

  return {
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    excerpt: text(formData, "excerpt"),
    content: String(formData.get("content") ?? ""),
    thumbnail_url: text(formData, "thumbnail_url"),
    cover_image_url: text(formData, "cover_image_url"),
    og_image_url: text(formData, "og_image_url"),
    meta_title: text(formData, "meta_title"),
    meta_description: text(formData, "meta_description"),
    tags: text(formData, "tags")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    status,
    featured: formData.get("featured") === "on",
    published_at: toIsoTimestamp(text(formData, "published_at")),
  };
}

/** Turns a stored ISO timestamp back into a datetime-local input value. */
export function toDateTimeLocal(value?: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const offset = parsed.getTimezoneOffset() * 60000;
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
}
