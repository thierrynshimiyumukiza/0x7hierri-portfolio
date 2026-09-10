"use client";

import { useEffect, useState } from "react";
import { ArrowUp, Check, Link2, Share2 } from "lucide-react";

type ArticleToolbarProps = {
  title: string;
};

/** Reading-progress bar plus share/copy-link actions, shared by blog and study articles. */
export default function ArticleToolbar({ title }: ArticleToolbarProps) {
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");

    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function share() {
    try {
      await navigator.share({ title, url: window.location.href });
    } catch {
      // The reader dismissed the share sheet; nothing to recover from.
    }
  }

  return (
    <>
      <div className="reading-progress" role="presentation">
        <div className="reading-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="article-actions">
        <button type="button" onClick={() => void copyLink()} className="article-action">
          {copied ? <Check size={13} aria-hidden="true" /> : <Link2 size={13} aria-hidden="true" />}
          {copied ? "Link copied" : "Copy link"}
        </button>

        {canShare ? (
          <button type="button" onClick={() => void share()} className="article-action">
            <Share2 size={13} aria-hidden="true" />
            Share
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="article-action article-action-top"
          data-visible={progress > 12 ? "true" : "false"}
        >
          <ArrowUp size={13} aria-hidden="true" />
          Top
        </button>
      </div>
    </>
  );
}
