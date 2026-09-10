/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Library, Link2, Loader2, Trash2, Upload } from "lucide-react";
import { normalizeImageUrl } from "@/lib/images";

type MediaItem = {
  id: string;
  url: string;
  file_name: string | null;
  media_type: string | null;
};

type MediaPickerFieldProps = {
  name: string;
  label: string;
  bucket?: string;
  defaultValue?: string;
  shape?: "rect" | "circle" | "wide";
  hint?: string;
  value?: string;
  onValueChange?: (next: string) => void;
};

type Mode = "upload" | "url" | "library";

const SHAPE_RATIO: Record<NonNullable<MediaPickerFieldProps["shape"]>, string> = {
  rect: "16 / 9",
  wide: "21 / 9",
  circle: "1 / 1",
};

export default function MediaPickerField({
  name,
  label,
  bucket = "media",
  defaultValue = "",
  shape = "rect",
  hint,
  value: controlledValue,
  onValueChange,
}: MediaPickerFieldProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;

  const [mode, setMode] = useState<Mode>("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const setValue = useCallback(
    (next: string) => {
      setInternalValue(next);
      onValueChange?.(next);
    },
    [onValueChange],
  );

  useEffect(() => {
    setPreviewFailed(false);
  }, [value]);

  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const params = new URLSearchParams({ type: "image", limit: "60" });
      if (librarySearch.trim()) params.set("q", librarySearch.trim());
      const response = await fetch(`/api/admin/media?${params.toString()}`);
      const payload = (await response.json().catch(() => null)) as { items?: MediaItem[] } | null;
      setLibrary(payload?.items ?? []);
    } catch {
      setLibrary([]);
    } finally {
      setLibraryLoading(false);
    }
  }, [librarySearch]);

  useEffect(() => {
    if (mode !== "library") return;
    const timer = window.setTimeout(() => void loadLibrary(), 200);
    return () => window.clearTimeout(timer);
  }, [mode, loadLibrary]);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError("");

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", bucket);

        const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

        if (!response.ok || !payload?.url) {
          throw new Error(payload?.error ?? "Upload failed");
        }

        setValue(payload.url);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [bucket, setValue],
  );

  const previewUrl = normalizeImageUrl(value);

  return (
    <div className="media-field">
      <div className="media-field-head">
        <span className="admin-label">{label}</span>
        {value ? (
          <button type="button" className="media-field-clear" onClick={() => setValue("")}>
            <Trash2 size={12} aria-hidden="true" />
            Clear
          </button>
        ) : null}
      </div>

      {hint ? <p className="admin-hint">{hint}</p> : null}

      <div className="media-field-tabs" role="tablist">
        {(
          [
            { id: "upload" as Mode, label: "Upload", icon: <Upload size={12} aria-hidden="true" /> },
            { id: "url" as Mode, label: "URL", icon: <Link2 size={12} aria-hidden="true" /> },
            { id: "library" as Mode, label: "Library", icon: <Library size={12} aria-hidden="true" /> },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            data-active={mode === tab.id ? "true" : "false"}
            onClick={() => setMode(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
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
            const file = event.dataTransfer.files?.[0];
            if (file) void upload(file);
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
              <ImagePlus size={16} aria-hidden="true" />
              <span>Drop an image here, or click to choose a file</span>
              <small>PNG, JPG, WebP, GIF or SVG up to 50MB</small>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </div>
      ) : null}

      {mode === "url" ? (
        <input
          type="url"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://example.com/image.png"
          aria-label={`${label} URL`}
          className="admin-input"
        />
      ) : null}

      {mode === "library" ? (
        <div className="media-library">
          <input
            type="search"
            value={librarySearch}
            onChange={(event) => setLibrarySearch(event.target.value)}
            placeholder="Search uploads"
            aria-label="Search media library"
            className="admin-input"
          />

          {libraryLoading ? <p className="admin-hint">Loading media…</p> : null}

          {!libraryLoading && library.length === 0 ? (
            <p className="admin-hint">No uploads yet. Anything you upload here appears in this list.</p>
          ) : null}

          <div className="media-library-grid">
            {library.map((item) => {
              const itemUrl = normalizeImageUrl(item.url);
              const selected = itemUrl === previewUrl;

              return (
                <button
                  key={item.id}
                  type="button"
                  className="media-library-item"
                  data-selected={selected ? "true" : "false"}
                  onClick={() => setValue(item.url)}
                  title={item.file_name ?? item.url}
                >
                  <img src={itemUrl} alt={item.file_name ?? ""} loading="lazy" />
                  {selected ? (
                    <span className="media-library-check">
                      <Check size={12} aria-hidden="true" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {error ? <p className="admin-error">{error}</p> : null}

      {previewUrl ? (
        <div className="media-preview">
          {!previewFailed ? (
            <img
              src={previewUrl}
              alt={`${label} preview`}
              onError={() => setPreviewFailed(true)}
              style={{
                aspectRatio: SHAPE_RATIO[shape],
                borderRadius: shape === "circle" ? "50%" : "10px",
                width: shape === "circle" ? "120px" : "100%",
              }}
            />
          ) : (
            <p className="admin-error">
              This URL did not load. Check the address, or upload the file instead.
            </p>
          )}
          <p className="media-preview-url">{value}</p>
        </div>
      ) : null}

      <input type="hidden" name={name} value={value} />
    </div>
  );
}
