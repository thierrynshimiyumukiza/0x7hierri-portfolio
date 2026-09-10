/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { hueFor, monogramFor, normalizeImageUrl } from "@/lib/images";

export type ThumbnailRatio = "16/9" | "3/2" | "4/3" | "1/1" | "21/9";

type ThumbnailProps = {
  src?: string | null;
  alt: string;
  /** Seeds the placeholder monogram and tint. Defaults to the alt text. */
  seed?: string;
  ratio?: ThumbnailRatio;
  /** Small square badge instead of a full-width cover. */
  compact?: boolean;
  eager?: boolean;
  className?: string;
  radius?: number;
  label?: string;
  /**
   * Ceiling in pixels. Source images are frequently 4000px wide, and without a
   * cap a card or hero grew to whatever the column allowed, which pushed the
   * words that matter below the fold.
   */
  maxHeight?: number;
  /** Responsive hint for the browser's image picker. */
  sizes?: string;
};

/**
 * Thumbnails come from the CMS, so the URL may be blank, malformed, wrapped in
 * angle brackets by the markdown editor, or point at a host that later 404s.
 * Every one of those cases used to render a broken-image icon or collapse the
 * card's layout. The frame reserves its box, the monogram tile always sits
 * behind the image, and a failed load simply reveals the tile.
 */
export default function Thumbnail({
  src,
  alt,
  seed,
  ratio = "16/9",
  compact = false,
  eager = false,
  className = "",
  radius = 10,
  label,
  maxHeight,
  sizes,
}: ThumbnailProps) {
  const url = normalizeImageUrl(src);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [url]);

  useEffect(() => {
    // A cached image can finish loading before hydration attaches onError,
    // so the outcome has to be re-checked once on mount.
    const element = imageRef.current;
    if (!element?.complete) return;
    if (element.naturalWidth === 0) setFailed(true);
    else setLoaded(true);
  }, [url]);

  const identity = seed || alt || "untitled";
  const hue = hueFor(identity);
  const showImage = Boolean(url) && !failed;

  const frameStyle: React.CSSProperties = compact
    ? { width: "clamp(44px, 12vw, 58px)", aspectRatio: "1 / 1" }
    : { width: "100%", aspectRatio: ratio.replace("/", " / "), maxHeight };

  return (
    <div
      className={`thumb-frame ${className}`.trim()}
      data-loaded={showImage && loaded ? "true" : "false"}
      style={{
        ...frameStyle,
        borderRadius: radius,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        border: "0.5px solid var(--border)",
        background: `linear-gradient(140deg, hsl(${hue} 62% 26% / 0.5), hsl(${(hue + 58) % 360} 62% 18% / 0.45))`,
      }}
    >
      <div className="thumb-fallback" aria-hidden="true">
        <span
          className="thumb-monogram"
          style={{
            fontSize: compact ? "13px" : "clamp(14px, 2.2vw, 19px)",
            color: `hsl(${hue} 80% 76%)`,
            borderColor: `hsl(${hue} 60% 70% / 0.28)`,
          }}
        >
          {monogramFor(identity)}
        </span>
        {label && !compact ? <span className="thumb-fallback-label">{label}</span> : null}
      </div>

      {showImage ? (
        <img
          ref={imageRef}
          src={url}
          alt={alt}
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className="thumb-image"
        />
      ) : null}
    </div>
  );
}
