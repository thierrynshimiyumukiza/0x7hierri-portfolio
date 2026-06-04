import React from "react";
import type { ReactNode } from "react";

export default function TableWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-[--border]">
      <table className="min-w-full border-collapse text-sm">{children}</table>
    </div>
  );
}
