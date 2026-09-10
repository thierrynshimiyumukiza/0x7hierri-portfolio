import Link from "next/link";
import Thumbnail from "@/components/site/Thumbnail";

type PreviewKind = "project" | "study" | "blog";

type UnifiedPreviewCardProps = {
  kind: PreviewKind;
  title: string;
  href: string;
  summary?: string | null;
  imageUrl?: string | null;
  tags?: string[] | null;
  primaryMetric?: string;
  secondaryMetric?: string;
  progressPercent?: number | null;
  actionLabel?: string;
  external?: boolean;
  className?: string;
};

const badgeMap: Record<PreviewKind, string> = {
  project: "prj",
  study: "std",
  blog: "blg",
};

const accentMap: Record<PreviewKind, string> = {
  project: "var(--accent-sky)",
  study: "var(--accent-mint)",
  blog: "var(--accent-amber)",
};

const bgMap: Record<PreviewKind, string> = {
  project: "rgba(111, 227, 255, 0.12)",
  study: "rgba(106, 237, 177, 0.12)",
  blog: "rgba(255, 195, 97, 0.12)",
};

export default function UnifiedPreviewCard({
  kind,
  title,
  href,
  summary,
  imageUrl,
  tags,
  primaryMetric,
  secondaryMetric,
  progressPercent,
  actionLabel = "open",
  external = false,
  className = "",
}: UnifiedPreviewCardProps) {
  const accent = accentMap[kind];
  const badgeLabel = badgeMap[kind];
  const limitedTags = (tags ?? []).slice(0, 4);

  const content = (
    <article className={`preview-card ${className}`.trim()}>
      <div className="preview-card-top">
        <span className="preview-kind-badge" style={{ color: accent, background: bgMap[kind] }}>
          {badgeLabel}
        </span>
        <span className="preview-action" style={{ color: accent }}>
          {actionLabel}
        </span>
      </div>

      <Thumbnail
        src={imageUrl}
        alt={title}
        seed={title}
        ratio="16/9"
        label={badgeLabel}
        radius={9}
      />

      <h3 className="preview-title">{title}</h3>

      {summary ? <p className="preview-summary">{summary}</p> : null}

      {primaryMetric || secondaryMetric ? (
        <div className="preview-metrics">
          <span>{primaryMetric ?? ""}</span>
          <span>{secondaryMetric ?? ""}</span>
        </div>
      ) : null}

      {typeof progressPercent === "number" ? (
        <div className="preview-progress-track" role="presentation">
          <div
            className="preview-progress-bar"
            style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%`, background: accent }}
          />
        </div>
      ) : null}

      {limitedTags.length > 0 ? (
        <div className="preview-tags">
          {limitedTags.map((tag) => (
            <span key={`${kind}-${title}-${tag}`} className="preview-tag" style={{ color: accent, background: bgMap[kind] }}>
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="preview-link-wrap">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className="preview-link-wrap">
      {content}
    </Link>
  );
}
