const IMAGE_EXTENSION_PATTERN = /\.(avif|apng|bmp|gif|heic|heif|ico|jpe?g|jfif|png|svg|tiff?|webp)(\?|#|$)/i;

/**
 * Content authors paste URLs from many places: the markdown editor wraps them in
 * angle brackets, spreadsheets add quotes, and Supabase public URLs can contain
 * spaces. Anything that survives this function is safe to hand to an <img> tag.
 */
export function normalizeImageUrl(value?: string | null): string {
  if (!value) return "";

  let url = value.trim();
  if (!url) return "";

  if (url.startsWith("<") && url.endsWith(">")) {
    url = url.slice(1, -1).trim();
  }

  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }

  if (!url) return "";

  // Protocol-relative and bare domains would otherwise resolve against the app origin.
  if (url.startsWith("//")) {
    url = `https:${url}`;
  }

  const isSupported =
    /^https?:\/\//i.test(url) || url.startsWith("/") || url.startsWith("data:image/") || url.startsWith("blob:");

  if (!isSupported) return "";

  // Spaces are legal in Supabase object names but illegal in an unescaped src.
  return url.replace(/ /g, "%20");
}

export function looksLikeImageUrl(value?: string | null): boolean {
  const url = normalizeImageUrl(value);
  if (!url) return false;
  if (url.startsWith("data:image/")) return true;
  return IMAGE_EXTENSION_PATTERN.test(url) || /\/storage\/v1\/object\/public\//.test(url);
}

export function imageHostname(value?: string | null): string {
  const url = normalizeImageUrl(value);
  if (!url || !/^https?:\/\//i.test(url)) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

/** Deterministic monogram used by the thumbnail fallback so cards never look empty. */
export function monogramFor(value: string): string {
  const words = value
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "··";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/** Stable hue in [0, 360) so the same title always gets the same placeholder tint. */
export function hueFor(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 360000;
  }
  return hash % 360;
}
