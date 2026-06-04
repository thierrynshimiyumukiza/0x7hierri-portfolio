"use client";

import { useMemo, useState } from "react";

type TagInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
};

export default function TagInput({ value, onChange }: TagInputProps) {
  const [input, setInput] = useState("");

  const normalized = useMemo(() => value.filter(Boolean), [value]);

  function addTag() {
    const cleaned = input.trim();
    if (!cleaned) return;
    if (normalized.includes(cleaned)) {
      setInput("");
      return;
    }
    onChange([...normalized, cleaned]);
    setInput("");
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag();
            }
          }}
          className="w-full rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm text-[--text-body]"
        />
        <button
          type="button"
          onClick={addTag}
          className="rounded border border-[--border] px-3 py-2 text-xs text-[--text-muted]"
        >
          add
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {normalized.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onChange(normalized.filter((item) => item !== tag))}
            className="rounded-full border border-[--border] px-2 py-1 font-mono text-[10px] text-[--text-dim]"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
