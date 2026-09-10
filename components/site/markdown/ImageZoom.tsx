/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { normalizeImageUrl } from "@/lib/images";

type ImageZoomProps = {
  src: string;
  alt: string;
  title?: string;
};

export default function ImageZoom({ src, alt, title }: ImageZoomProps) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const renderableSrc = useMemo(() => normalizeImageUrl(src), [src]);
  const caption = useMemo(() => (title?.trim() || alt?.trim() || "").trim(), [alt, title]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    // A cached image finishes loading before hydration attaches onError.
    const element = imageRef.current;
    if (element?.complete && element.naturalWidth === 0) {
      setFailed(true);
    }
  }, [renderableSrc]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  if (!renderableSrc) {
    return null;
  }

  return (
    <>
      <span className="md-figure">
        {!failed ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="md-figure-button"
            aria-label={caption ? `Enlarge image: ${caption}` : "Enlarge image"}
          >
            <img
              ref={imageRef}
              src={renderableSrc}
              alt={alt}
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              className="md-figure-image"
            />
            <span className="md-figure-zoom" aria-hidden="true">
              <ZoomIn size={14} />
            </span>
          </button>
        ) : (
          <span className="md-figure-error">Image unavailable{caption ? `: ${caption}` : ""}</span>
        )}

        {caption ? <span className="md-figure-caption">{caption}</span> : null}
      </span>

      {open ? (
        <div role="dialog" aria-modal="true" aria-label={caption || "Image preview"} className="md-lightbox" onClick={close}>
          <button type="button" className="md-lightbox-close" onClick={close} aria-label="Close image preview">
            <X size={18} aria-hidden="true" />
          </button>
          <div className="md-lightbox-inner" onClick={(event) => event.stopPropagation()}>
            <img src={renderableSrc} alt={alt} className="md-lightbox-image" />
            {caption ? <p className="md-lightbox-caption">{caption}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
