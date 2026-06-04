"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SKIP_INPUT_TYPES = new Set([
  "hidden",
  "checkbox",
  "radio",
  "submit",
  "button",
  "file",
]);

function humanizeName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\burl\b/gi, "URL")
    .replace(/\bid\b/gi, "ID")
    .replace(/\bcta\b/gi, "CTA")
    .replace(/\bog\b/gi, "OG")
    .replace(/\bseo\b/gi, "SEO")
    .replace(/\bapi\b/gi, "API")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function enhanceAdminForms() {
  const scope = document.querySelector("main");
  if (!scope) return;

  const controls = scope.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >("input[name], textarea[name], select[name]");

  controls.forEach((control, index) => {
    if (control instanceof HTMLInputElement && SKIP_INPUT_TYPES.has(control.type)) {
      return;
    }

    if (control.closest("label")) {
      return;
    }

    const name = control.getAttribute("name");
    if (!name) return;

    const labelText = humanizeName(name);

    if (!control.id) {
      control.id = `field-${name}-${index}`;
    }

    if (!control.getAttribute("aria-label")) {
      control.setAttribute("aria-label", labelText);
    }

    if (
      (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) &&
      !control.placeholder
    ) {
      control.placeholder = labelText;
    }

    // Do not insert/remove elements here; changing form structure during hydration can cause mismatches.
  });
}

export default function AdminFormEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    const run = () => enhanceAdminForms();
    run();

    const timer = window.setTimeout(run, 50);
    const lateTimer = window.setTimeout(run, 300);

    const scope = document.querySelector("main");
    if (!scope) {
      return () => {
        window.clearTimeout(timer);
        window.clearTimeout(lateTimer);
      };
    }

    let rafId = 0;
    const observer = new MutationObserver(() => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        run();
      });
    });

    observer.observe(scope, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(lateTimer);
      observer.disconnect();
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [pathname]);

  return null;
}
