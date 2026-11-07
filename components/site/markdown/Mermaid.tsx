"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import type { MermaidConfig } from "mermaid";
import { Check, Code2, Copy, Download, Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useThemeMode, type ThemeMode } from "@/lib/use-theme-mode";

interface MermaidProps {
  chart: string;
}

/**
 * Mermaid measures label text with the font it is given, so a CSS variable here
 * makes it measure with a fallback font and the boxes come out the wrong size.
 * Resolve the real family names from the page first.
 */
function resolveFontFamily() {
  if (typeof document === "undefined") return "system-ui, sans-serif";
  const value = getComputedStyle(document.documentElement).getPropertyValue("--font-sans").trim();
  return value ? `${value}, system-ui, sans-serif` : "system-ui, sans-serif";
}

function createMermaidConfig(themeMode: ThemeMode): MermaidConfig {
  const isLightTheme = themeMode === "light";

  return {
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    fontFamily: resolveFontFamily(),
    // Diagrams render at their natural size and the frame scrolls; shrinking a
    // wide flowchart to the column width is what made the labels unreadable.
    flowchart: { useMaxWidth: false, htmlLabels: true, padding: 14, nodeSpacing: 48, rankSpacing: 56, curve: "basis" },
    sequence: { useMaxWidth: false, actorFontSize: 15, messageFontSize: 15, noteFontSize: 14 },
    gantt: { useMaxWidth: false, fontSize: 14 },
    class: { useMaxWidth: false },
    state: { useMaxWidth: false },
    er: { useMaxWidth: false },
    journey: { useMaxWidth: false },
    pie: { useMaxWidth: false },
    mindmap: { useMaxWidth: false },
    themeVariables: {
      fontSize: "15px",
      background: isLightTheme ? "#ffffff" : "#0e141c",
      primaryColor: isLightTheme ? "#eef4ff" : "#152033",
      primaryBorderColor: isLightTheme ? "#1d67e3" : "#5aa9ff",
      primaryTextColor: isLightTheme ? "#0d1726" : "#e8edf3",
      secondaryColor: isLightTheme ? "#f2f6fd" : "#11161d",
      secondaryBorderColor: isLightTheme ? "#425a70" : "#7a8595",
      secondaryTextColor: isLightTheme ? "#0d1726" : "#e8edf3",
      tertiaryColor: isLightTheme ? "#eaf7ef" : "#12261c",
      tertiaryBorderColor: isLightTheme ? "#1b8f56" : "#3fb950",
      tertiaryTextColor: isLightTheme ? "#0d1726" : "#e8edf3",
      lineColor: isLightTheme ? "#425a70" : "#9aa6b5",
      textColor: isLightTheme ? "#0d1726" : "#e8edf3",
      mainBkg: isLightTheme ? "#eef4ff" : "#152033",
      nodeBorder: isLightTheme ? "#1d67e3" : "#5aa9ff",
      clusterBkg: isLightTheme ? "#f6f8fb" : "#11161d",
      clusterBorder: isLightTheme ? "#d4deea" : "#2a3340",
      titleColor: isLightTheme ? "#0d1726" : "#e8edf3",
      edgeLabelBackground: isLightTheme ? "#ffffff" : "#0e141c",
      actorBkg: isLightTheme ? "#eef4ff" : "#152033",
      actorBorder: isLightTheme ? "#1d67e3" : "#5aa9ff",
      actorTextColor: isLightTheme ? "#0d1726" : "#e8edf3",
      actorLineColor: isLightTheme ? "#9aa6b5" : "#4a5565",
      signalColor: isLightTheme ? "#243447" : "#c5cdd6",
      signalTextColor: isLightTheme ? "#0d1726" : "#e8edf3",
      labelBoxBkgColor: isLightTheme ? "#ffffff" : "#0e141c",
      labelBoxBorderColor: isLightTheme ? "#d4deea" : "#2a3340",
      labelTextColor: isLightTheme ? "#0d1726" : "#e8edf3",
      noteBkgColor: isLightTheme ? "#fff8c5" : "#2b2610",
      noteBorderColor: isLightTheme ? "#b2761a" : "#e3b341",
      noteTextColor: isLightTheme ? "#0d1726" : "#e8edf3",
    },
  };
}

// mermaid.render shares global state, so two diagrams rendering at once can
// corrupt each other. Every render waits its turn on this queue.
let renderQueue: Promise<unknown> = Promise.resolve();

function renderSerially(id: string, source: string, themeMode: ThemeMode) {
  const task = renderQueue.then(async () => {
    const { default: mermaid } = await import("mermaid");
    mermaid.initialize(createMermaidConfig(themeMode));
    return mermaid.render(id, source);
  });
  renderQueue = task.catch(() => undefined);
  return task;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

function DiagramViewer({ svg, onClose }: { svg: string; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "+" || event.key === "=") setZoom((z) => Math.min(MAX_ZOOM, z * 1.2));
      if (event.key === "-") setZoom((z) => Math.max(MIN_ZOOM, z / 1.2));
      if (event.key === "0") {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="mermaid-viewer" role="dialog" aria-modal="true" aria-label="Diagram viewer">
      <div className="mermaid-viewer-bar">
        <span className="mermaid-viewer-hint">drag to pan · scroll or +/− to zoom · 0 to reset</span>
        <div className="mermaid-viewer-actions">
          <button type="button" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.2))} aria-label="Zoom out">
            <Minus size={16} aria-hidden="true" />
          </button>
          <span className="mermaid-viewer-zoom">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.2))} aria-label="Zoom in">
            <Plus size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            aria-label="Reset view"
          >
            <RotateCcw size={15} aria-hidden="true" />
          </button>
          <button type="button" ref={closeRef} onClick={onClose} aria-label="Close diagram viewer">
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        className="mermaid-viewer-stage"
        onWheel={(event) => {
          const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
          setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor)));
        }}
        onPointerDown={(event) => {
          (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          setOffset({
            x: drag.current.ox + event.clientX - drag.current.x,
            y: drag.current.oy + event.clientY - drag.current.y,
          });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        <div
          className="mermaid-viewer-canvas"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}

export default function Mermaid({ chart }: MermaidProps) {
  const themeMode = useThemeMode();
  const reactId = useId();
  const baseId = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const renderCount = useRef(0);
  const [renderedSvg, setRenderedSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const source = chart.replace(/^﻿/, "").trim();

  useEffect(() => {
    let cancelled = false;
    // While typing in the editor the chart changes on every keystroke; waiting a
    // moment avoids rendering (and flashing errors for) half-typed syntax.
    const timer = window.setTimeout(() => {
      renderCount.current += 1;
      renderSerially(`${baseId}-${renderCount.current}`, source, themeMode)
        .then(({ svg }) => {
          if (cancelled) return;
          setRenderedSvg(svg);
          setError(null);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          // Keep the last good diagram on screen and report the error under it.
          setError(err instanceof Error ? err.message : "Unknown Mermaid render error");
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [source, themeMode, baseId]);

  // A diagram up to ~40% wider than the column is scaled to fit, which keeps
  // labels at a readable size; anything wider keeps its natural size and scrolls.
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [fit, setFit] = useState(false);

  useEffect(() => {
    const surface = surfaceRef.current;
    const svg = surface?.querySelector("svg");
    if (!surface || !svg) return;

    const naturalWidth = svg.viewBox?.baseVal?.width || svg.getBoundingClientRect().width;
    const measure = () => {
      const styles = getComputedStyle(surface);
      const available = surface.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
      setFit(naturalWidth > available && naturalWidth <= available * 1.4);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(surface);
    return () => observer.disconnect();
  }, [renderedSvg, showSource]);

  const closeViewer = useCallback(() => setExpanded(false), []);

  const download = () => {
    const blob = new Blob([renderedSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "diagram.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be refused; the source toggle still shows the text.
    }
  };

  if (!renderedSvg && error) {
    return (
      <div className="mermaid-error" role="alert">
        <p className="mermaid-error-title">This diagram could not be rendered.</p>
        <p className="mermaid-error-message">{error}</p>
        <pre>{source}</pre>
      </div>
    );
  }

  if (!renderedSvg) {
    return (
      <div className="mermaid-loading" aria-busy="true">
        Rendering diagram…
      </div>
    );
  }

  return (
    <figure className="mermaid-figure">
      <div className="mermaid-frame">
        <div className="mermaid-toolbar">
          <span className="mermaid-kind">diagram</span>
          <div className="mermaid-toolbar-actions">
            <button type="button" onClick={() => setShowSource((v) => !v)} aria-pressed={showSource}>
              <Code2 size={14} aria-hidden="true" />
              <span>{showSource ? "Diagram" : "Source"}</span>
            </button>
            <button type="button" onClick={copySource} aria-label="Copy diagram source">
              {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            </button>
            <button type="button" onClick={download} aria-label="Download diagram as SVG">
              <Download size={14} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setExpanded(true)} aria-label="Open diagram full screen">
              <Maximize2 size={14} aria-hidden="true" />
            </button>
          </div>
        </div>

        {showSource ? (
          <pre className="mermaid-source">{source}</pre>
        ) : (
          // Mermaid's HTML labels are block elements, which a <button> cannot
          // contain, so the surface is a plain region and the toolbar opens it.
          <div
            ref={surfaceRef}
            className="mermaid-surface"
            data-fit={fit ? "true" : "false"}
            role="img"
            aria-label="Diagram"
            onDoubleClick={() => setExpanded(true)}
            dangerouslySetInnerHTML={{ __html: renderedSvg }}
          />
        )}
      </div>

      {error ? <p className="mermaid-stale">Showing the last version that rendered. {error}</p> : null}

      {expanded ? <DiagramViewer svg={renderedSvg} onClose={closeViewer} /> : null}
    </figure>
  );
}
