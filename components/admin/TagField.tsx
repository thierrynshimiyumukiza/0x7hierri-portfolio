"use client";

import { useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { displayTag } from "@/lib/utils";

type TagFieldProps = {
  name: string;
  label?: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  max?: number;
};

function normalizeTag(raw: string): string {
  return raw
    .trim()
    .replace(/^#/, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export default function TagField({ name, label, value, onChange, suggestions = [], max = 12 }: TagFieldProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const available = useMemo(() => {
    const term = normalizeTag(input);
    return suggestions
      .filter((tag) => !value.includes(tag))
      .filter((tag) => (term ? tag.toLowerCase().includes(term) : true))
      .slice(0, 8);
  }, [suggestions, value, input]);

  function addTag(raw: string) {
    const tag = normalizeTag(raw);
    if (!tag || value.includes(tag) || value.length >= max) {
      setInput("");
      return;
    }
    onChange([...value, tag]);
    setInput("");
  }

  return (
    <div className="tag-field">
      {label ? <span className="admin-label">{label}</span> : null}

      <div className="tag-field-input" onClick={() => inputRef.current?.focus()}>
        {value.map((tag) => (
          <span key={tag} className="tag-chip">
            #{displayTag(tag)}
            <button type="button" onClick={() => onChange(value.filter((item) => item !== tag))} aria-label={`Remove ${tag}`}>
              <X size={11} aria-hidden="true" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addTag(input);
              return;
            }
            if (event.key === "Backspace" && !input && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => addTag(input)}
          placeholder={value.length >= max ? "Tag limit reached" : "Add a tag and press Enter"}
          aria-label={label ?? "Tags"}
          disabled={value.length >= max}
        />

        {input ? (
          <button type="button" className="tag-field-add" onClick={() => addTag(input)} aria-label="Add tag">
            <Plus size={12} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {available.length > 0 ? (
        <div className="tag-suggestions">
          <span>Existing:</span>
          {available.map((tag) => (
            <button key={tag} type="button" onClick={() => addTag(tag)}>
              #{displayTag(tag)}
            </button>
          ))}
        </div>
      ) : null}

      <input type="hidden" name={name} value={value.join(",")} />
    </div>
  );
}
