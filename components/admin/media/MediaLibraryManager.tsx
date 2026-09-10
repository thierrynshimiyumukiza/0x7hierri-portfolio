/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, FileText, Film, Link2, Loader2, Search, Trash2, Upload } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/images";
import type { Tables } from "@/types/database";

export type MediaRow = Pick<
  Tables<"media_library">,
  "id" | "url" | "file_name" | "media_type" | "file_size" | "bucket" | "created_at"
>;

type MediaLibraryManagerProps = {
  items: MediaRow[];
  onDelete: (formData: FormData) => Promise<void>;
  onAddUrl: (formData: FormData) => Promise<void>;
};

type TypeFilter = "all" | "image" | "video" | "pdf" | "attachment";

function formatBytes(size: number | null): string {
  if (!size || size <= 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibraryManager({ items, onDelete, onAddUrl }: MediaLibraryManagerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [copiedId, setCopiedId] = useState("");
  const [confirmingId, setConfirmingId] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const counts = useMemo(
    () => ({
      all: items.length,
      image: items.filter((item) => item.media_type === "image").length,
      video: items.filter((item) => item.media_type === "video").length,
      pdf: items.filter((item) => item.media_type === "pdf").length,
      attachment: items.filter((item) => item.media_type === "attachment").length,
    }),
    [items],
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter !== "all" && item.media_type !== typeFilter) return false;
      if (!term) return true;
      return (item.file_name ?? "").toLowerCase().includes(term) || item.url.toLowerCase().includes(term);
    });
  }, [items, query, typeFilter]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;

    setUploading(true);
    setUploadError("");

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "media");

        const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;

        if (!response.ok) {
          throw new Error(payload?.error ?? `Could not upload ${file.name}`);
        }
      }

      router.refresh();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function copyUrl(item: MediaRow) {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId(""), 1800);
    } catch {
      setCopiedId("");
    }
  }

  return (
    <section className="cms-list">
      <header className="cms-list-head">
        <div>
          <h1 className="cms-list-title">Media</h1>
          <p className="admin-hint">
            {counts.all} files. Anything uploaded here is available in every image picker.
          </p>
        </div>
      </header>

      <div
        className={`media-dropzone${dragActive ? " media-dropzone-active" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          void uploadFiles(event.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        {uploading ? (
          <>
            <Loader2 size={16} className="editor-spin" aria-hidden="true" />
            <span>Uploading…</span>
          </>
        ) : (
          <>
            <Upload size={16} aria-hidden="true" />
            <span>Drop files here, or click to choose. Multiple files are fine.</span>
            <small>Images, video, PDFs and other attachments up to 50MB each</small>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(event) => void uploadFiles(event.target.files)}
        />
      </div>

      {uploadError ? <p className="admin-error">{uploadError}</p> : null}

      <form action={onAddUrl} className="media-url-form">
        <Link2 size={13} aria-hidden="true" />
        <input
          name="url"
          type="url"
          required
          placeholder="Or record an external URL: https://…"
          aria-label="External media URL"
          className="admin-input"
        />
        <select name="media_type" aria-label="Media type" className="admin-input cms-select">
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="pdf">PDF</option>
          <option value="attachment">Attachment</option>
        </select>
        <button type="submit" className="admin-button">
          Add
        </button>
      </form>

      <div className="cms-list-controls">
        <div className="blog-search">
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by file name or URL"
            aria-label="Search media"
          />
        </div>

        <div className="cms-filter-row">
          {(["all", "image", "video", "pdf", "attachment"] as TypeFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              className="cms-filter-chip"
              data-active={typeFilter === value ? "true" : "false"}
              onClick={() => setTypeFilter(value)}
            >
              {value}
              <span>{counts[value]}</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="cms-empty">
          <p>{items.length === 0 ? "No media yet. Upload a file to get started." : "Nothing matches these filters."}</p>
        </div>
      ) : (
        <ul className="media-grid">
          {visible.map((item) => {
            const url = normalizeImageUrl(item.url);
            const isImage = item.media_type === "image";

            return (
              <li key={item.id} className="media-tile">
                <div className="media-tile-preview">
                  {isImage && url ? (
                    <img src={url} alt={item.file_name ?? ""} loading="lazy" />
                  ) : (
                    <span className="media-tile-icon">
                      {item.media_type === "video" ? <Film size={18} aria-hidden="true" /> : <FileText size={18} aria-hidden="true" />}
                    </span>
                  )}
                </div>

                <div className="media-tile-body">
                  <p className="media-tile-name" title={item.file_name ?? item.url}>
                    {item.file_name || item.url.split("/").pop()}
                  </p>
                  <p className="media-tile-meta">
                    {item.media_type}
                    {formatBytes(item.file_size) ? ` · ${formatBytes(item.file_size)}` : ""}
                    {item.created_at ? ` · ${formatDateTime(item.created_at)}` : ""}
                  </p>
                </div>

                <div className="media-tile-actions">
                  <button type="button" className="icon-button" onClick={() => void copyUrl(item)} title="Copy URL">
                    {copiedId === item.id ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                    <span className="sr-only">Copy URL</span>
                  </button>

                  {confirmingId === item.id ? (
                    <form action={onDelete} className="cms-confirm">
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="admin-button admin-button-danger">
                        Delete
                      </button>
                      <button
                        type="button"
                        className="admin-button admin-button-ghost"
                        onClick={() => setConfirmingId("")}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="icon-button icon-button-danger"
                      onClick={() => setConfirmingId(item.id)}
                      title="Remove from library"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      <span className="sr-only">Remove</span>
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
