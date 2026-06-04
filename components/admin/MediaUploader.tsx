"use client";

import { useState } from "react";

type MediaUploaderProps = {
  bucket: string;
  onUploaded: (url: string) => void;
};

export default function MediaUploader({ bucket, onUploaded }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket || "media");

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json().catch(() => null)) as
      | { url?: string; error?: string }
      | null;

    if (!response.ok || !payload?.url) {
      setError(payload?.error ?? "Upload failed");
      setUploading(false);
      return;
    }

    onUploaded(payload.url);
    setUploading(false);
  }

  return (
    <div className="space-y-2 rounded-md border border-dashed border-[--border] p-4">
      <input
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          void handleUpload(file);
        }}
        className="block w-full text-xs text-[--text-muted]"
      />
      {uploading ? <p className="text-xs text-[--text-dim]">uploading</p> : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
