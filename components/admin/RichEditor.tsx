"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MarkdownRenderer from "@/components/site/markdown/MarkdownRenderer";

type RichEditorProps = {
  value: string;
  onChange: (nextValue: string) => void;
  mediaBucket?: string;
};

type ViewMode = "split" | "editor" | "preview";

type PendingSelection = {
  start: number;
  end: number;
};

const buttonClass =
  "rounded border border-[--border] px-2 py-1 text-xs text-[--text-muted] hover:border-[--border-muted]";

function fileNameToAltText(name: string): string {
  return name
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Image";
}

function buildImageMarkdown(url: string, altText: string): string {
  return `![${altText}](${formatMarkdownUrl(url)})`;
}

function formatMarkdownUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed;
  }

  return `<${trimmed}>`;
}

function validateMarkdown(content: string): string[] {
  const issues: string[] = [];

  const fenceCount = (content.match(/^```/gm) ?? []).length;
  if (fenceCount % 2 !== 0) {
    issues.push("Unclosed fenced code block detected. Add a matching closing ``` line.");
  }

  const missingImageUrl = content.match(/^!\[[^\]]*\]\(\s*\)$/gm);
  if (missingImageUrl?.length) {
    issues.push("One or more markdown images are missing a URL.");
  }

  const htmlImgWithoutSrc = content.match(/<img(?![^>]*\bsrc=)[^>]*>/gi);
  if (htmlImgWithoutSrc?.length) {
    issues.push("One or more HTML img tags are missing a src attribute.");
  }

  return issues;
}

async function uploadImageToAdmin(file: File, bucket: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket || "media");

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | { url?: string; error?: string }
    | null;

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error ?? "Image upload failed");
  }

  return payload.url;
}

export default function RichEditor({ value, onChange, mediaBucket = "media" }: RichEditorProps) {
  const [draft, setDraft] = useState(value);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingSelectionRef = useRef<PendingSelection | null>(null);

  const validationIssues = useMemo(() => validateMarkdown(draft), [draft]);

  useEffect(() => {
    if (value === draft) return;
    setDraft(value);
  }, [value, draft]);

  useEffect(() => {
    const pending = pendingSelectionRef.current;
    const textarea = textareaRef.current;

    if (!pending || !textarea) return;

    textarea.focus();
    textarea.setSelectionRange(pending.start, pending.end);
    pendingSelectionRef.current = null;
  }, [draft]);

  function commitDraft(next: string, selection?: PendingSelection) {
    setDraft(next);
    onChange(next);
    if (selection) {
      pendingSelectionRef.current = selection;
    }
  }

  function replaceRange(rangeStart: number, rangeEnd: number, replacement: string, cursorStartOffset: number, cursorEndOffset: number) {
    const next = `${draft.slice(0, rangeStart)}${replacement}${draft.slice(rangeEnd)}`;
    commitDraft(next, {
      start: rangeStart + cursorStartOffset,
      end: rangeStart + cursorEndOffset,
    });
  }

  function withSelection(handler: (ctx: { start: number; end: number; selected: string }) => void) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = draft.slice(start, end);
    handler({ start, end, selected });
  }

  function wrapSelection(prefix: string, suffix: string, placeholder: string) {
    withSelection(({ start, end, selected }) => {
      const inner = selected || placeholder;
      const replacement = `${prefix}${inner}${suffix}`;
      replaceRange(start, end, replacement, prefix.length, prefix.length + inner.length);
    });
  }

  function prefixSelectedLines(prefix: string) {
    withSelection(({ start, end }) => {
      const lineStart = draft.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      const lineEndIndex = draft.indexOf("\n", end);
      const lineEnd = lineEndIndex === -1 ? draft.length : lineEndIndex;
      const segment = draft.slice(lineStart, lineEnd);
      const replacement = segment.split("\n").map((line) => `${prefix}${line}`).join("\n");

      replaceRange(lineStart, lineEnd, replacement, replacement.length, replacement.length);
    });
  }

  function applyHeading(level: 1 | 2 | 3) {
    withSelection(({ start, end }) => {
      const lineStart = draft.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      const lineEndIndex = draft.indexOf("\n", end);
      const lineEnd = lineEndIndex === -1 ? draft.length : lineEndIndex;
      const segment = draft.slice(lineStart, lineEnd).replace(/^#{1,6}\s+/, "");
      const replacement = `${"#".repeat(level)} ${segment}`;

      replaceRange(lineStart, lineEnd, replacement, replacement.length, replacement.length);
    });
  }

  function insertSnippet(snippet: string) {
    withSelection(({ start, end }) => {
      replaceRange(start, end, snippet, snippet.length, snippet.length);
    });
  }

  function insertCodeBlock(language: string) {
    withSelection(({ start, end, selected }) => {
      const body = selected || "code";
      const lang = language.trim();
      const prefix = `\n\`\`\`${lang}\n`;
      const suffix = "\n\`\`\`\n";
      const replacement = `${prefix}${body}${suffix}`;

      replaceRange(start, end, replacement, prefix.length, prefix.length + body.length);
    });
  }

  function insertTable() {
    const template = [
      "| Name | Value |",
      "| ---- | ----- |",
      "| A | B |",
      "",
    ].join("\n");

    insertSnippet(template);
  }

  function insertDivider() {
    insertSnippet("\n---\n");
  }

  function insertLink() {
    withSelection(({ start, end, selected }) => {
      const label = selected || "link text";
      const href = window.prompt("Enter link URL", "https://");
      if (!href) return;

      const replacement = `[${label}](${formatMarkdownUrl(href)})`;
      replaceRange(start, end, replacement, replacement.length, replacement.length);
    });
  }

  function insertImageByUrl() {
    const src = window.prompt("Enter image URL", "https://");
    if (!src) return;

    withSelection(({ start, end, selected }) => {
      const alt = selected || "Description";
      const markdown = buildImageMarkdown(src.trim(), alt);
      replaceRange(start, end, markdown, markdown.length, markdown.length);
    });
  }

  async function insertUploadedImage(file: File) {
    setUploading(true);
    setUploadError("");

    try {
      const url = await uploadImageToAdmin(file, mediaBucket);
      const alt = fileNameToAltText(file.name);
      const markdown = buildImageMarkdown(url, alt);
      insertSnippet(markdown);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDroppedFiles(files: FileList | null) {
    if (!files?.length) return;
    const image = Array.from(files).find((file) => file.type.startsWith("image/"));
    if (!image) return;

    await insertUploadedImage(image);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={buttonClass} onClick={() => applyHeading(1)}>h1</button>
        <button type="button" className={buttonClass} onClick={() => applyHeading(2)}>h2</button>
        <button type="button" className={buttonClass} onClick={() => applyHeading(3)}>h3</button>
        <button type="button" className={buttonClass} onClick={() => wrapSelection("**", "**", "bold")}>bold</button>
        <button type="button" className={buttonClass} onClick={() => wrapSelection("*", "*", "italic")}>italic</button>
        <button type="button" className={buttonClass} onClick={() => wrapSelection("~~", "~~", "strike")}>strike</button>
        <button type="button" className={buttonClass} onClick={() => wrapSelection("`", "`", "inline code")}>inline code</button>
        <button type="button" className={buttonClass} onClick={() => insertCodeBlock("")}>code block</button>
        <button type="button" className={buttonClass} onClick={() => prefixSelectedLines("> ")}>quote</button>
        <button type="button" className={buttonClass} onClick={() => prefixSelectedLines("- ")}>bullet</button>
        <button type="button" className={buttonClass} onClick={() => prefixSelectedLines("1. ")}>ordered</button>
        <button type="button" className={buttonClass} onClick={() => prefixSelectedLines("- [ ] ")}>checklist</button>
        <button type="button" className={buttonClass} onClick={insertTable}>table</button>
        <button type="button" className={buttonClass} onClick={insertLink}>link</button>
        <button type="button" className={buttonClass} onClick={insertImageByUrl}>image url</button>
        <button type="button" className={buttonClass} onClick={() => fileInputRef.current?.click()}>Insert Image</button>
        <button type="button" className={buttonClass} onClick={insertDivider}>divider</button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`${buttonClass} ${viewMode === "editor" ? "border-[--accent-blue] text-[--text-primary]" : ""}`}
          onClick={() => setViewMode("editor")}
        >
          editor
        </button>
        <button
          type="button"
          className={`${buttonClass} ${viewMode === "split" ? "border-[--accent-blue] text-[--text-primary]" : ""}`}
          onClick={() => setViewMode("split")}
        >
          split
        </button>
        <button
          type="button"
          className={`${buttonClass} ${viewMode === "preview" ? "border-[--accent-blue] text-[--text-primary]" : ""}`}
          onClick={() => setViewMode("preview")}
        >
          preview
        </button>

        <span className="ml-auto text-xs text-[--text-dim]">
          {draft.trim().split(/\s+/).filter(Boolean).length} words
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleDroppedFiles(event.target.files);
        }}
      />

      {uploading ? <p className="text-xs text-[--text-dim]">Uploading image...</p> : null}
      {uploadError ? <p className="text-xs text-red-400">{uploadError}</p> : null}

      {validationIssues.length > 0 ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-[--text-muted]">
          <p className="mb-1 text-[--text-primary]">Markdown validation</p>
          {validationIssues.map((issue) => (
            <p key={issue}>- {issue}</p>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-[--border] bg-[--bg-surface] px-3 py-2 text-xs text-[--text-dim]">
          Markdown validation: no issues found.
        </div>
      )}

      <div className={viewMode === "split" ? "grid gap-3 lg:grid-cols-2" : "grid gap-3"}>
        {viewMode !== "preview" ? (
          <div
            className={`rounded-md border ${dragActive ? "border-[--accent-blue]" : "border-[--border]"} bg-[--bg-base] p-2`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              void handleDroppedFiles(event.dataTransfer.files);
            }}
          >
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => commitDraft(event.target.value)}
              onPaste={(event) => {
                const files = event.clipboardData.files;
                if (!files?.length) return;

                const hasImage = Array.from(files).some((file) => file.type.startsWith("image/"));
                if (!hasImage) return;

                event.preventDefault();
                void handleDroppedFiles(files);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Tab") return;

                event.preventDefault();
                withSelection(({ start, end, selected }) => {
                  const replacement = selected
                    ? selected
                        .split("\n")
                        .map((line) => `  ${line}`)
                        .join("\n")
                    : "  ";

                  replaceRange(start, end, replacement, replacement.length, replacement.length);
                });
              }}
              rows={20}
              placeholder="Write markdown..."
              className="w-full resize-y bg-transparent p-2 font-mono text-sm leading-6 text-[--text-body] outline-none"
            />
          </div>
        ) : null}

        {viewMode !== "editor" ? (
          <div className="min-h-[320px] overflow-auto rounded-md border border-[--border] bg-[--bg-base] p-4">
            <MarkdownRenderer content={draft || "*Nothing to preview yet.*"} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
