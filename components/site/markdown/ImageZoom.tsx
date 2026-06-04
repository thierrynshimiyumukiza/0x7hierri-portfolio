/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { useMemo, useState } from "react";

type ImageZoomProps = {
  src: string;
  alt: string;
  title?: string;
};

function toRenderableSrc(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";

  // react-markdown already normalizes URLs; re-encoding here can double-encode
  // existing %XX sequences and break otherwise valid image links.
  if (/\s/.test(normalized)) {
    return normalized.replace(/\s/g, "%20");
  }

  return normalized;
}

export default function ImageZoom({ src, alt, title }: ImageZoomProps) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const normalizedSrc = src.trim();
  const renderableSrc = toRenderableSrc(normalizedSrc);
  const caption = useMemo(() => (title?.trim() || alt?.trim() || "").trim(), [alt, title]);

  if (!renderableSrc) {
    return null;
  }

  return (
    <>
      <span className="my-6 block">
        {!failed ? (
          <button type="button" onClick={() => setOpen(true)} className="block w-full">
            <img
              src={renderableSrc}
              alt={alt}
              loading="lazy"
              onError={() => setFailed(true)}
              className="h-auto max-h-[70vh] w-full rounded-lg border border-[--border] object-contain"
            />
          </button>
        ) : (
          <div className="rounded-lg border border-[--border] bg-[--bg-surface] px-4 py-3 text-sm text-[--text-dim]">
            Failed to load image: {normalizedSrc}
          </div>
        )}

        {caption ? <span className="mt-2 block text-sm text-[--text-dim]">{caption}</span> : null}
      </span>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div className="max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <img src={renderableSrc} alt={alt} loading="lazy" className="max-h-[85vh] max-w-full rounded-lg object-contain" />
            {caption ? <p className="mt-2 text-center text-sm text-[--text-muted]">{caption}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
