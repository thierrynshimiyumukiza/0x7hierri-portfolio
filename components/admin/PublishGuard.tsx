"use client";

import { useEffect, useRef, useState } from "react";

type GuardField = {
  name: string;
  label: string;
  type?: "text" | "url" | "markdown";
};

type PublishGuardProps = {
  fields: GuardField[];
  title?: string;
};

type ValidationResult = {
  isPublished: boolean;
  missing: string[];
};

function isLikelyUrl(value: string): boolean {
  if (!value.trim()) return false;
  try {
    const url = new URL(value);
    return Boolean(url.protocol && url.host);
  } catch {
    return false;
  }
}

export default function PublishGuard({ fields, title = "Pre-publish checks" }: PublishGuardProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const form = anchorRef.current?.closest("form");
    if (!form) return;

    const getValue = (name: string): string => {
      const control = form.elements.namedItem(name);
      if (!control) return "";

      if (control instanceof RadioNodeList) {
        return (control.value ?? "").trim();
      }

      if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement) {
        return String(control.value ?? "").trim();
      }

      return "";
    };

    const runValidation = (): ValidationResult => {
      const statusValue = getValue("status").toLowerCase();
      const publishing = statusValue === "published";

      if (!publishing) {
        setIsPublished(false);
        setMissing([]);
        return { isPublished: false, missing: [] };
      }

      const nextMissing = fields
        .filter((field) => {
          const value = getValue(field.name);
          if (!value) return true;
          if (field.type === "url") return !isLikelyUrl(value);
          if (field.type === "markdown") return value.replace(/[#*_`\-\n\r\s]/g, "").length < 40;
          return false;
        })
        .map((field) => field.label);

      setIsPublished(true);
      setMissing(nextMissing);

      return { isPublished: true, missing: nextMissing };
    };

    const onFieldChange = () => {
      setBlocked(false);
      runValidation();
    };

    const onSubmit = (event: Event) => {
      const result = runValidation();
      if (result.isPublished && result.missing.length > 0) {
        event.preventDefault();
        setBlocked(true);
      }
    };

    form.addEventListener("input", onFieldChange);
    form.addEventListener("change", onFieldChange);
    form.addEventListener("submit", onSubmit);

    runValidation();

    return () => {
      form.removeEventListener("input", onFieldChange);
      form.removeEventListener("change", onFieldChange);
      form.removeEventListener("submit", onSubmit);
    };
  }, [fields]);

  return (
    <div ref={anchorRef} className="rounded border border-[--border] bg-[--bg-surface] px-3 py-2 text-xs">
      <p className="font-medium text-[--text-primary]">{title}</p>

      {!isPublished ? (
        <p className="mt-1 text-[--text-dim]">Checks activate when status is set to published.</p>
      ) : null}

      {isPublished && missing.length === 0 ? (
        <p className="mt-1 text-[--accent-green]">All publish checks passed.</p>
      ) : null}

      {isPublished && missing.length > 0 ? (
        <p className="mt-1 text-amber-300">Missing or invalid: {missing.join(", ")}</p>
      ) : null}

      {blocked ? (
        <p className="mt-1 text-red-400">Publish blocked until checks are fixed.</p>
      ) : null}
    </div>
  );
}
