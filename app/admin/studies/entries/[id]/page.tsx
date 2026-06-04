import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStudyMedia, deleteStudyMedia, updateStudyEntry } from "@/actions/studies";
import ImageInputField from "@/components/admin/ImageInputField";
import RichTextField from "@/components/admin/RichTextField";
import PublishGuard from "@/components/admin/PublishGuard";
import type { Tables } from "@/types/database";

type AdminEntryEditPageProps = {
  params: {
    id: string;
  };
};

export default async function AdminEntryEditPage({ params }: AdminEntryEditPageProps) {
  const supabase = createAdminClient();
  const [{ data: entryData }, { data: categoriesData }, { data: mediaData }] = await Promise.all([
    supabase.from("study_entries").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("study_categories").select("id,title").order("sort_order", { ascending: true }),
    supabase.from("study_media").select("id,url,media_type").eq("entry_id", params.id).order("display_order", { ascending: true }),
  ]);

  const entry = (entryData as Tables<"study_entries"> | null) ?? null;
  const categories = (categoriesData as Pick<Tables<"study_categories">, "id" | "title">[] | null) ?? [];
  const media = (mediaData as Pick<Tables<"study_media">, "id" | "url" | "media_type">[] | null) ?? [];

  if (!entry) notFound();

  async function submit(formData: FormData) {
    "use server";

    const categoryId = String(formData.get("category_id") ?? "").trim();

    await updateStudyEntry(params.id, {
      category_id: categoryId || null,
      title: String(formData.get("title") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      summary: String(formData.get("summary") ?? ""),
      content: String(formData.get("content") ?? ""),
      thumbnail_url: String(formData.get("thumbnail_url") ?? ""),
      cover_image_url: String(formData.get("cover_image_url") ?? ""),
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      status: String(formData.get("status") ?? "published") as "draft" | "published" | "archived",
      pinned: formData.get("pinned") === "on",
      entry_number: Number(formData.get("entry_number") ?? 0),
      published_at: String(formData.get("published_at") ?? "") || null,
      meta_title: String(formData.get("meta_title") ?? ""),
      meta_description: String(formData.get("meta_description") ?? ""),
    });

    redirect("/admin/studies/entries");
  }

  async function addMedia(formData: FormData) {
    "use server";

    const url = String(formData.get("url") ?? "").trim();
    if (!url) return;

    await createStudyMedia({
      entry_id: params.id,
      url,
      media_type: String(formData.get("media_type") ?? "attachment") as "image" | "video" | "pdf" | "attachment",
      caption: String(formData.get("caption") ?? ""),
      display_order: Number(formData.get("display_order") ?? 0),
      is_url_mode: true,
    });
  }

  async function removeMedia(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await deleteStudyMedia(id);
  }

  return (
    <section className="space-y-4">
      <form action={submit} className="surface-card grid gap-3">
        <select name="category_id" defaultValue={entry.category_id ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </select>
        <input name="title" defaultValue={entry.title} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
        <input name="slug" defaultValue={entry.slug} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <textarea name="summary" defaultValue={entry.summary ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <RichTextField name="content" label="Content" defaultValue={entry.content ?? ""} mediaBucket="media" />
        <ImageInputField
          name="thumbnail_url"
          label="Short thumbnail"
          bucket="media"
          defaultValue={entry.thumbnail_url ?? ""}
        />
        <ImageInputField
          name="cover_image_url"
          label="Cover image"
          bucket="media"
          defaultValue={entry.cover_image_url ?? ""}
        />
        <input name="tags" defaultValue={(entry.tags ?? []).join(",")} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="entry_number" type="number" defaultValue={entry.entry_number ?? 0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="published_at" type="datetime-local" defaultValue={entry.published_at ? entry.published_at.slice(0, 16) : ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="meta_title" defaultValue={entry.meta_title ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <textarea name="meta_description" defaultValue={entry.meta_description ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="pinned" defaultChecked={entry.pinned ?? false} /> pinned</label>
        <select name="status" defaultValue={entry.status ?? "draft"} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm">
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>
        <PublishGuard
          fields={[
            { name: "title", label: "title" },
            { name: "summary", label: "summary" },
            { name: "content", label: "content", type: "markdown" },
            { name: "thumbnail_url", label: "thumbnail URL", type: "url" },
            { name: "meta_description", label: "meta description" },
          ]}
        />
        <button className="rounded bg-[--accent-blue] px-3 py-2 text-sm font-medium text-[--bg-base]">save</button>
      </form>

      <form action={addMedia} className="surface-card grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-4">
          <ImageInputField name="url" label="Media URL or upload image" bucket="media" />
        </div>
        <select name="media_type" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm">
          <option value="attachment">attachment</option>
          <option value="pdf">pdf</option>
          <option value="image">image</option>
          <option value="video">video</option>
        </select>
        <input name="caption" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="display_order" type="number" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" defaultValue={0} />
        <button className="rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted] sm:col-span-4">add media</button>
      </form>

      <div className="grid gap-2">
        {media.map((item) => (
          <form key={item.id} action={removeMedia} className="surface-card flex items-center justify-between">
            <p className="text-sm text-[--text-body]">{item.media_type} {item.url}</p>
            <input type="hidden" name="id" value={item.id} />
            <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
          </form>
        ))}
      </div>
    </section>
  );
}
