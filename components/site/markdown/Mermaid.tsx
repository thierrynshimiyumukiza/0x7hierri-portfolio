"use client";

import React, { useEffect, useState } from "react";
import type { MermaidConfig } from "mermaid";

interface MermaidProps {
  chart: string;
}

type ThemeMode = "light" | "dark";

function getThemeMode(): ThemeMode {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function createMermaidConfig(themeMode: ThemeMode): MermaidConfig {
  const isLightTheme = themeMode === "light";

  return {
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    flowchart: { useMaxWidth: true },
    sequence: { useMaxWidth: true },
    gantt: { useMaxWidth: true },
    themeVariables: {
      background: isLightTheme ? "#ffffff" : "#0d1117",
      primaryColor: isLightTheme ? "#eef2f9" : "#161b22",
      primaryBorderColor: isLightTheme ? "#1d67e3" : "#58a6ff",
      primaryTextColor: isLightTheme ? "#0d1726" : "#e6edf3",
      secondaryColor: isLightTheme ? "#f2f6fd" : "#0b1320",
      secondaryBorderColor: isLightTheme ? "#425a70" : "#8b949e",
      secondaryTextColor: isLightTheme ? "#0d1726" : "#e6edf3",
      tertiaryColor: isLightTheme ? "#eaf7ef" : "#132a20",
      tertiaryBorderColor: isLightTheme ? "#1b8f56" : "#3fb950",
      tertiaryTextColor: isLightTheme ? "#0d1726" : "#e6edf3",
      lineColor: isLightTheme ? "#425a70" : "#8b949e",
      textColor: isLightTheme ? "#0d1726" : "#e6edf3",
      mainBkg: isLightTheme ? "#ffffff" : "#0d1117",
      nodeBorder: isLightTheme ? "#1d67e3" : "#58a6ff",
      clusterBkg: isLightTheme ? "#f2f6fd" : "#161b22",
      clusterBorder: isLightTheme ? "#d4deea" : "#30363d",
      titleColor: isLightTheme ? "#0d1726" : "#e6edf3",
      edgeLabelBackground: isLightTheme ? "#ffffff" : "#0d1117",
      actorBkg: isLightTheme ? "#eef2f9" : "#161b22",
      actorBorder: isLightTheme ? "#1d67e3" : "#58a6ff",
      actorTextColor: isLightTheme ? "#0d1726" : "#e6edf3",
      signalColor: isLightTheme ? "#243447" : "#c9d1d9",
      signalTextColor: isLightTheme ? "#0d1726" : "#e6edf3",
      labelBoxBkgColor: isLightTheme ? "#ffffff" : "#0d1117",
      labelBoxBorderColor: isLightTheme ? "#d4deea" : "#30363d",
      labelTextColor: isLightTheme ? "#0d1726" : "#e6edf3",
      noteBkgColor: isLightTheme ? "#fff8c5" : "#332d12",
      noteBorderColor: isLightTheme ? "#b2761a" : "#e3b341",
      noteTextColor: isLightTheme ? "#0d1726" : "#e6edf3",
    },
  };
}

export default function Mermaid({ chart }: MermaidProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [renderedSvg, setRenderedSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncTheme = () => setThemeMode(getThemeMode());
    const observer = new MutationObserver(syncTheme);

    syncTheme();
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const source = chart.replace(/^\uFEFF/, "").trim();

    setRenderedSvg("");
    setError(null);

    const renderChart = async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        mermaid.initialize(createMermaidConfig(themeMode));

        const { svg } = await mermaid.render(id, source);
        if (!cancelled) {
          setRenderedSvg(svg);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown Mermaid render error";
        console.error("Failed to render Mermaid diagram.", { error: err, source });
        if (!cancelled) {
          setError(message);
        }
      }
    };

    renderChart();

    return () => {
      cancelled = true;
    };
  }, [chart, themeMode]);

  if (error) {
    return (
      <div className="my-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
        <p className="font-semibold">Failed to render Mermaid diagram.</p>
        <p className="mt-1 text-xs text-red-300">{error}</p>
        <pre className="mt-2 overflow-x-auto text-xs">{chart}</pre>
      </div>
    );
  }

  if (!renderedSvg) {
    return (
      <div
        className="my-6 flex min-h-24 items-center justify-center overflow-x-auto rounded-lg border border-[--border] bg-[--bg-surface] p-4 text-sm text-[--text-muted]"
        aria-busy="true"
      >
        Rendering diagram...
      </div>
    );
  }

  return (
    <div
      className="my-6 overflow-x-auto rounded-lg border border-[--border] bg-[--bg-surface] p-4 text-[--text-body] [&_svg]:mx-auto [&_svg]:block [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: renderedSvg }}
    />
  );
}