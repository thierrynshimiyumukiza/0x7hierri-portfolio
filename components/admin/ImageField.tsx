/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import MediaUploader from "@/components/admin/MediaUploader";

type ImageFieldProps = {
  label: string;
  bucket: string;
  value: string;
  onChange: (value: string) => void;
  shape?: "rect" | "circle";
};

export default function ImageField({ label, bucket, value, onChange, shape = "rect" }: ImageFieldProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [previewError, setPreviewError] = useState(false);
  const imageClassName =
    shape === "circle"
      ? "mx-auto h-32 w-32 rounded-full border border-[--border] object-cover"
      : "h-40 w-full rounded-md border border-[--border] object-cover";

  useEffect(() => {
    setPreviewError(false);
  }, [value]);

  return (
    <div className="space-y-3 rounded-md border border-[--border] p-4">
      <p className="text-sm text-[--text-muted]">{label}</p>

      <div className="inline-flex rounded border border-[--border]">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`px-3 py-1 text-xs ${mode === "upload" ? "bg-[--bg-elevated]" : ""}`}
        >
          upload
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`px-3 py-1 text-xs ${mode === "url" ? "bg-[--bg-elevated]" : ""}`}
        >
          url
        </button>
      </div>

      {mode === "upload" ? (
        <MediaUploader bucket={bucket} onUploaded={onChange} />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://..."
          className="w-full rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm text-[--text-body]"
        />
      )}

      {value && !previewError ? (
        <img
          src={value}
          alt={label}
          loading="lazy"
          onError={() => setPreviewError(true)}
          className={imageClassName}
        />
      ) : null}

      {value && previewError ? (
        <p className="text-xs text-[--text-dim]">
          Preview unavailable for this URL. You can still save if the URL is correct.
        </p>
      ) : null}
    </div>
  );
}
