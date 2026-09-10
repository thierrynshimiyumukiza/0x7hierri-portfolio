"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as ReactDOM from "react-dom";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  Save,
  Search,
  Settings2,
  Star,
} from "lucide-react";
import RichEditor from "@/components/admin/RichEditor";
import MediaPickerField from "@/components/admin/MediaPickerField";
import TagField from "@/components/admin/TagField";
import { generateSlug } from "@/lib/utils";
import { countWords } from "@/lib/markdown-outline";

type EntryStatus = "draft" | "published" | "archived";

export type BlogEditorValues = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail_url: string;
  cover_image_url: string;
  og_image_url: string;
  meta_title: string;
  meta_description: string;
  tags: string[];
  status: EntryStatus;
  featured: boolean;
  published_at: string;
};

type BlogEditorProps = {
  mode: "create" | "edit";
  action: (formData: FormData) => Promise<void>;
  initial: BlogEditorValues;
  knownTags: string[];
  siteUrl: string;
};

type PanelId = "content" | "media" | "seo" | "settings";

const PANELS: { id: PanelId; label: string; icon: React.ReactNode }[] = [
  { id: "content", label: "Content", icon: <FileText size={13} aria-hidden="true" /> },
  { id: "media", label: "Media", icon: <ImageIcon size={13} aria-hidden="true" /> },
  { id: "seo", label: "SEO", icon: <Search size={13} aria-hidden="true" /> },
  { id: "settings", label: "Settings", icon: <Settings2 size={13} aria-hidden="true" /> },
];

/**
 * useFormStatus only exists in the React canary that Next bundles for the App
 * Router. Resolving it defensively keeps the component renderable anywhere else,
 * such as the standalone render checks in scripts/.
 */
const useFormStatus: () => { pending: boolean } =
  (ReactDOM as { useFormStatus?: () => { pending: boolean } }).useFormStatus ?? (() => ({ pending: false }));

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="admin-button admin-button-primary" disabled={pending}>
      {pending ? <Loader2 size={13} className="editor-spin" aria-hidden="true" /> : <Save size={13} aria-hidden="true" />}
      {pending ? "Saving…" : label}
    </button>
  );
}

function meterState(length: number, min: number, max: number): "low" | "good" | "high" {
  if (length < min) return "low";
  if (length > max) return "high";
  return "good";
}

export default function BlogEditor({ mode, action, initial, knownTags, siteUrl }: BlogEditorProps) {
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugLocked, setSlugLocked] = useState(Boolean(initial.slug));
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [content, setContent] = useState(initial.content);
  const [thumbnail, setThumbnail] = useState(initial.thumbnail_url);
  const [cover, setCover] = useState(initial.cover_image_url);
  const [ogImage, setOgImage] = useState(initial.og_image_url);
  const [metaTitle, setMetaTitle] = useState(initial.meta_title);
  const [metaDescription, setMetaDescription] = useState(initial.meta_description);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [status, setStatus] = useState<EntryStatus>(initial.status);
  const [featured, setFeatured] = useState(initial.featured);
  const [publishedAt, setPublishedAt] = useState(initial.published_at);

  const [panel, setPanel] = useState<PanelId>("content");
  const [restorable, setRestorable] = useState<BlogEditorValues | null>(null);
  const [savedAt, setSavedAt] = useState<string>("");
  const [queuedSubmit, setQueuedSubmit] = useState(false);

  const formRef = useRef<HTMLFormElement | null>(null);
  const storageKey = useMemo(() => `cms:blog:${initial.id ?? "new"}`, [initial.id]);

  const words = useMemo(() => countWords(content), [content]);
  const readingTime = Math.max(1, Math.ceil(words / 200));

  const effectiveSlug = slug || generateSlug(title) || "post";

  useEffect(() => {
    if (slugLocked) return;
    setSlug(generateSlug(title));
  }, [title, slugLocked]);

  // Restore an unsaved draft left behind by a crash, refresh or closed tab.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return;

      const parsed = JSON.parse(stored) as BlogEditorValues & { savedAt?: string };
      const changed = parsed.title !== initial.title || parsed.content !== initial.content;
      if (changed) setRestorable(parsed);
    } catch {
      // A corrupt entry is not worth surfacing; the editor still works.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const snapshot = useMemo<BlogEditorValues>(
    () => ({
      id: initial.id,
      title,
      slug: effectiveSlug,
      excerpt,
      content,
      thumbnail_url: thumbnail,
      cover_image_url: cover,
      og_image_url: ogImage,
      meta_title: metaTitle,
      meta_description: metaDescription,
      tags,
      status,
      featured,
      published_at: publishedAt,
    }),
    [
      initial.id, title, effectiveSlug, excerpt, content, thumbnail, cover, ogImage,
      metaTitle, metaDescription, tags, status, featured, publishedAt,
    ],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ ...snapshot, savedAt: new Date().toISOString() }));
        setSavedAt(new Date().toLocaleTimeString());
      } catch {
        // Storage can be full or blocked; autosave is a convenience, not a requirement.
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [snapshot, storageKey]);

  useEffect(() => {
    if (!queuedSubmit) return;
    setQueuedSubmit(false);
    formRef.current?.requestSubmit();
  }, [queuedSubmit]);

  const checks = useMemo(() => {
    const list: { label: string; ok: boolean }[] = [
      { label: "Title", ok: title.trim().length >= 3 },
      { label: "Summary", ok: excerpt.trim().length >= 20 },
      { label: "Body content", ok: countWords(content) >= 30 },
      { label: "Thumbnail", ok: thumbnail.trim().length > 0 },
      { label: "Meta description", ok: metaDescription.trim().length >= 50 },
    ];
    return list;
  }, [title, excerpt, content, thumbnail, metaDescription]);

  const failedChecks = checks.filter((check) => !check.ok);
  const blockedFromPublishing = status === "published" && failedChecks.length > 0;

  function saveAs(next: EntryStatus) {
    setStatus(next);
    setQueuedSubmit(true);
  }

  function restoreDraft() {
    if (!restorable) return;
    setTitle(restorable.title ?? "");
    setSlug(restorable.slug ?? "");
    setSlugLocked(true);
    setExcerpt(restorable.excerpt ?? "");
    setContent(restorable.content ?? "");
    setThumbnail(restorable.thumbnail_url ?? "");
    setCover(restorable.cover_image_url ?? "");
    setOgImage(restorable.og_image_url ?? "");
    setMetaTitle(restorable.meta_title ?? "");
    setMetaDescription(restorable.meta_description ?? "");
    setTags(restorable.tags ?? []);
    setStatus(restorable.status ?? "draft");
    setFeatured(Boolean(restorable.featured));
    setPublishedAt(restorable.published_at ?? "");
    setRestorable(null);
  }

  const serpTitle = (metaTitle || title || "Untitled post").slice(0, 70);
  const serpDescription = (metaDescription || excerpt || "No description yet.").slice(0, 165);
  const titleState = meterState(serpTitle.length, 20, 60);
  const descriptionState = meterState(serpDescription.length, 50, 160);

  return (
    <form
      ref={formRef}
      action={action}
      className="cms-editor"
      onSubmit={() => {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          // Nothing to clean up if storage is unavailable.
        }
      }}
    >
      <header className="cms-topbar">
        <div className="cms-topbar-left">
          <Link href="/admin/blog" className="admin-button admin-button-ghost">
            <ArrowLeft size={13} aria-hidden="true" />
            <span className="cms-hide-sm">Posts</span>
          </Link>

          <div className="cms-topbar-title">
            <p>{mode === "create" ? "New post" : "Editing"}</p>
            <strong>{title || "Untitled post"}</strong>
          </div>
        </div>

        <div className="cms-topbar-right">
          <span className={`status-pill status-pill-${status}`}>{status}</span>

          {savedAt ? <span className="cms-autosave">Draft saved {savedAt}</span> : null}

          {mode === "edit" && initial.status === "published" ? (
            <a
              href={`${siteUrl}/blog/${effectiveSlug}`}
              target="_blank"
              rel="noreferrer"
              className="admin-button admin-button-ghost"
            >
              <ExternalLink size={13} aria-hidden="true" />
              <span className="cms-hide-sm">View</span>
            </a>
          ) : null}

          <button type="button" className="admin-button admin-button-ghost" onClick={() => saveAs("draft")}>
            Save draft
          </button>

          <SubmitButton label={status === "published" ? "Publish" : "Save"} />
        </div>
      </header>

      {restorable ? (
        <div className="cms-banner">
          <CircleAlert size={14} aria-hidden="true" />
          <span>An unsaved draft from an earlier session was found.</span>
          <button type="button" onClick={restoreDraft}>
            Restore it
          </button>
          <button
            type="button"
            onClick={() => {
              window.localStorage.removeItem(storageKey);
              setRestorable(null);
            }}
          >
            Discard
          </button>
        </div>
      ) : null}

      {blockedFromPublishing ? (
        <div className="cms-banner cms-banner-warning">
          <CircleAlert size={14} aria-hidden="true" />
          <span>
            Publishing with gaps: {failedChecks.map((check) => check.label).join(", ")}. You can still save, but the
            post will look unfinished.
          </span>
        </div>
      ) : null}

      <nav className="cms-panel-tabs" role="tablist">
        {PANELS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={panel === item.id}
            data-active={panel === item.id ? "true" : "false"}
            onClick={() => setPanel(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="cms-grid">
        <div className="cms-main" data-panel={panel}>
          <section className="cms-card cms-section-content">
            <label className="admin-field">
              <span className="admin-label">Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                name="title"
                required
                placeholder="A clear, specific headline"
                className="admin-input admin-input-title"
              />
            </label>

            <div className="cms-slug-row">
              <label className="admin-field">
                <span className="admin-label">Slug</span>
                <input
                  value={slug}
                  onChange={(event) => {
                    setSlugLocked(true);
                    setSlug(event.target.value);
                  }}
                  name="slug"
                  placeholder="auto-generated-from-title"
                  className="admin-input"
                />
              </label>

              <button
                type="button"
                className="admin-button admin-button-ghost"
                onClick={() => {
                  setSlugLocked(false);
                  setSlug(generateSlug(title));
                }}
                title="Regenerate the slug from the title"
              >
                Reset
              </button>
            </div>

            <p className="cms-permalink">
              {siteUrl}/blog/<strong>{effectiveSlug}</strong>
            </p>

            <label className="admin-field">
              <span className="admin-label">
                Summary
                <span className="admin-counter" data-state={excerpt.length > 220 ? "high" : "good"}>
                  {excerpt.length}/220
                </span>
              </span>
              <textarea
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                name="excerpt"
                rows={3}
                placeholder="One or two sentences shown on cards and in search results."
                className="admin-input"
              />
            </label>
          </section>

          <section className="cms-card cms-section-content cms-card-flush">
            <div className="cms-card-head">
              <span className="admin-label">Body</span>
              <span className="admin-hint">
                {words} words · about {readingTime} min
              </span>
            </div>

            <RichEditor value={content} onChange={setContent} mediaBucket="media" />
            <input type="hidden" name="content" value={content} />
          </section>

          <section className="cms-card cms-section-media">
            <MediaPickerField
              name="thumbnail_url"
              label="Card thumbnail"
              hint="Shown on the blog index and recommendation cards. 16:9 works best."
              value={thumbnail}
              onValueChange={setThumbnail}
            />
          </section>

          <section className="cms-card cms-section-media">
            <MediaPickerField
              name="cover_image_url"
              label="Cover image"
              hint="Shown at the top of the post, cropped to 16:9. Falls back to the thumbnail."
              value={cover}
              onValueChange={setCover}
            />
          </section>

          <section className="cms-card cms-section-seo">
            <div className="cms-card-head">
              <span className="admin-label">Search and social</span>
            </div>

            <label className="admin-field">
              <span className="admin-label">
                Meta title
                <span className="admin-counter" data-state={titleState}>
                  {serpTitle.length}/60
                </span>
              </span>
              <input
                value={metaTitle}
                onChange={(event) => setMetaTitle(event.target.value)}
                name="meta_title"
                placeholder={title || "Defaults to the post title"}
                className="admin-input"
              />
            </label>

            <label className="admin-field">
              <span className="admin-label">
                Meta description
                <span className="admin-counter" data-state={descriptionState}>
                  {metaDescription.length}/160
                </span>
              </span>
              <textarea
                value={metaDescription}
                onChange={(event) => setMetaDescription(event.target.value)}
                name="meta_description"
                rows={3}
                placeholder="What someone sees under the link in search results."
                className="admin-input"
              />
            </label>

            <div className="serp-preview" aria-label="Search result preview">
              <p className="serp-url">
                {siteUrl.replace(/^https?:\/\//, "")} › blog › {effectiveSlug}
              </p>
              <p className="serp-title">{serpTitle}</p>
              <p className="serp-description">{serpDescription}</p>
            </div>

            <MediaPickerField
              name="og_image_url"
              label="Social share image"
              hint="Used by link previews. 1200×630 is the safe size."
              value={ogImage}
              onValueChange={setOgImage}
            />
          </section>
        </div>

        <aside className="cms-side" data-panel={panel}>
          <section className="cms-card cms-section-settings">
            <div className="cms-card-head">
              <span className="admin-label">Publishing</span>
            </div>

            <label className="admin-field">
              <span className="admin-label">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as EntryStatus)}
                name="status"
                className="admin-input"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <label className="admin-field">
              <span className="admin-label">Publish date</span>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(event) => setPublishedAt(event.target.value)}
                name="published_at"
                className="admin-input"
              />
              <span className="admin-hint">Leave empty to stamp the moment you publish.</span>
            </label>

            <label className="admin-switch">
              <input
                type="checkbox"
                name="featured"
                checked={featured}
                onChange={(event) => setFeatured(event.target.checked)}
              />
              <span>
                <Star size={12} aria-hidden="true" /> Feature this post
              </span>
            </label>
          </section>

          <section className="cms-card cms-section-settings">
            <div className="cms-card-head">
              <span className="admin-label">Pre-publish checks</span>
            </div>

            <ul className="cms-checklist">
              {checks.map((check) => (
                <li key={check.label} data-ok={check.ok ? "true" : "false"}>
                  {check.ok ? <Check size={12} aria-hidden="true" /> : <CircleAlert size={12} aria-hidden="true" />}
                  {check.label}
                </li>
              ))}
            </ul>
          </section>

          <section className="cms-card cms-section-settings">
            <TagField name="tags" label="Tags" value={tags} onChange={setTags} suggestions={knownTags} />
          </section>
        </aside>
      </div>
    </form>
  );
}
