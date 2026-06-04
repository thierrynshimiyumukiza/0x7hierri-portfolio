"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type HorizontalRailProps = {
  title: string;
  description: string;
  href: string;
  linkLabel?: string;
  ariaLabel: string;
  children: ReactNode;
};

type DragState = {
  pointerId: number | null;
  startX: number;
  startScrollLeft: number;
};

export default function HorizontalRail({
  title,
  description,
  href,
  linkLabel = "View all",
  ariaLabel,
  children,
}: HorizontalRailProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState>({ pointerId: null, startX: 0, startScrollLeft: 0 });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const refreshScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    setCanScrollPrev(track.scrollLeft > 4);
    setCanScrollNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    refreshScrollState();

    const track = trackRef.current;
    if (!track) return;

    const observer = new ResizeObserver(() => refreshScrollState());
    observer.observe(track);

    return () => {
      observer.disconnect();
    };
  }, [refreshScrollState]);

  const getScrollStep = () => {
    const track = trackRef.current;
    if (!track) return 320;

    const firstCard = track.querySelector<HTMLElement>("[data-rail-card]");
    if (!firstCard) return Math.max(280, Math.floor(track.clientWidth * 0.85));

    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    return firstCard.offsetWidth + gap;
  };

  const scrollRail = (direction: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;

    const amount = getScrollStep();
    const delta = direction === "next" ? amount : -amount;

    track.scrollBy({ left: delta, behavior: "smooth" });
    window.requestAnimationFrame(() => refreshScrollState());
  };

  return (
    <section className="premium-rail-section" aria-label={ariaLabel}>
      <header className="premium-section-head">
        <div>
          <p className="premium-kicker">{title}</p>
          <p className="premium-description">{description}</p>
        </div>

        <a href={href} className="premium-more-link">
          {linkLabel}
        </a>
      </header>

      <div className="premium-rail-shell">
        <div className="premium-rail-controls">
          <button
            type="button"
            className="premium-rail-button"
            onClick={() => scrollRail("prev")}
            disabled={!canScrollPrev}
            aria-label={`Scroll ${title} left`}
          >
            Prev
          </button>
          <button
            type="button"
            className="premium-rail-button"
            onClick={() => scrollRail("next")}
            disabled={!canScrollNext}
            aria-label={`Scroll ${title} right`}
          >
            Next
          </button>
        </div>

        <div
          ref={trackRef}
          className="premium-rail-track"
          role="region"
          aria-label={`${title} horizontal preview list`}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              scrollRail("next");
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              scrollRail("prev");
            }
          }}
          onScroll={refreshScrollState}
          onPointerDown={(event) => {
            const track = trackRef.current;
            if (!track) return;

            dragRef.current = {
              pointerId: event.pointerId,
              startX: event.clientX,
              startScrollLeft: track.scrollLeft,
            };

            track.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const track = trackRef.current;
            const { pointerId, startX, startScrollLeft } = dragRef.current;
            if (!track || pointerId !== event.pointerId) return;

            const deltaX = event.clientX - startX;
            track.scrollLeft = startScrollLeft - deltaX;
            refreshScrollState();
          }}
          onPointerUp={(event) => {
            const track = trackRef.current;
            if (!track) return;

            if (dragRef.current.pointerId === event.pointerId) {
              dragRef.current.pointerId = null;
              track.releasePointerCapture(event.pointerId);
            }
          }}
          onPointerCancel={(event) => {
            const track = trackRef.current;
            if (!track) return;

            if (dragRef.current.pointerId === event.pointerId) {
              dragRef.current.pointerId = null;
              track.releasePointerCapture(event.pointerId);
            }
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
