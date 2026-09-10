"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

function readThemeMode(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/**
 * The theme lives on <html data-theme>, set by an inline script before paint and
 * flipped at runtime by the site toggle. Components that render their own colours
 * (code blocks, diagrams) subscribe here instead of duplicating the observer.
 */
export function useThemeMode(): ThemeMode {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const sync = () => setMode(readThemeMode());
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => observer.disconnect();
  }, []);

  return mode;
}
