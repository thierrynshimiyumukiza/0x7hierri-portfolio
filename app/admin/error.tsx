"use client";

import { useEffect } from "react";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <div className="space-y-3 px-4 py-6">
      <p className="text-sm font-medium text-red-400">Admin page crashed.</p>
      <p className="text-xs text-[--text-dim]">{error.message || "Unknown error"}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]"
      >
        retry
      </button>
    </div>
  );
}
