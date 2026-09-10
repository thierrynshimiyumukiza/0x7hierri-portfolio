"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bold,
  ChevronDown,
  Code2,
  Columns2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Pencil,
  Quote,
  Sigma,
  Strikethrough,
  Table as TableIcon,
  Workflow,
} from "lucide-react";
import MarkdownRenderer from "@/components/site/markdown/MarkdownRenderer";
import { COMMON_EDITOR_LANGUAGES } from "@/lib/code-languages";
import { countWords } from "@/lib/markdown-outline";

type RichEditorProps = {
  value: string;
  onChange: (nextValue: string) => void;
  mediaBucket?: string;
  placeholder?: string;
  minRows?: number;
};

type ViewMode = "write" | "split" | "preview";

type PendingSelection = { start: number; end: number };

const LIST_CONTINUATION = /^(\s*)([-*+]|\d+[.)])\s+(\[[ xX]\]\s+)?(.*)$/;

function fileNameToAltText(name: string): string {
  return (
    name
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Image"
  );
}

/** Markdown link destinations only need angle brackets when they contain spaces. */
function formatMarkdownUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) return trimmed;
  return /[\s()]/.test(trimmed) ? `<${trimmed}>` : trimmed;
}

function validateMarkdown(content: string): string[] {
  const issues: string[] = [];

  if ((content.match(/^```/gm) ?? []).length % 2 !== 0) {
    issues.push("A fenced code block is not closed. Add a matching ``` line.");
  }

  if (/^!\[[^\]]*\]\(\s*\)\s*$/m.test(content)) {
    issues.push("An image is missing its URL.");
  }

  if (/<img(?![^>]*\bsrc=)[^>]*>/i.test(content)) {
    issues.push("An HTML img tag is missing a src attribute.");
  }

  const headings = content.match(/^#{1,6}\s+/gm) ?? [];
  if (content.trim().length > 400 && headings.length === 0) {
    issues.push("Long posts read better with headings. Add at least one ## section.");
  }

  const imagesWithoutAlt = content.match(/!\[\s*\]\(/g) ?? [];
  if (imagesWithoutAlt.length > 0) {
    issues.push(`${imagesWithoutAlt.length} image(s) have no alt text.`);
  }

  return issues;
}

async function uploadToAdmin(file: File, bucket: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket || "media");

  const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
  const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error ?? "Upload failed");
  }

  return payload.url;
}

export default function RichEditor({
  value,
  onChange,
  mediaBucket = "media",
  placeholder = "Write in Markdown. Drag an image in to upload it.",
  minRows = 22,
}: RichEditorProps) {
  const [draft, setDraft] = useState(value);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [fullscreen, setFullscreen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [openMenu, setOpenMenu] = useState<"insert" | "language" | "">("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const pendingSelectionRef = useRef<PendingSelection | null>(null);
  const syncingRef = useRef(false);

  const issues = useMemo(() => validateMarkdown(draft), [draft]);
  const words = useMemo(() => countWords(draft), [draft]);
  const readingTime = Math.max(1, Math.ceil(words / 200));
  const headingCount = (draft.match(/^#{1,6}\s+/gm) ?? []).length;

  useEffect(() => {
    if (value === draft) return;
    setDraft(value);
    // Only external resets (loading a different post) should overwrite the buffer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const pending = pendingSelectionRef.current;
    const textarea = textareaRef.current;
    if (!pending || !textarea) return;

    textarea.focus();
    textarea.setSelectionRange(pending.start, pending.end);
    pendingSelectionRef.current = null;
  }, [draft]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [fullscreen]);

  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu("");
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openMenu]);

  const commit = useCallback(
    (next: string, selection?: PendingSelection) => {
      setDraft(next);
      onChange(next);
      if (selection) pendingSelectionRef.current = selection;
    },
    [onChange],
  );

  /**
   * Writing through execCommand keeps the browser's native undo stack intact, so
   * Ctrl+Z still works after a toolbar action. The manual splice is the fallback
   * for browsers that have dropped the API.
   */
  const replaceRange = useCallback(
    (rangeStart: number, rangeEnd: number, replacement: string, cursorStart: number, cursorEnd: number) => {
      const textarea = textareaRef.current;

      if (textarea && typeof document.execCommand === "function") {
        textarea.focus();
        textarea.setSelectionRange(rangeStart, rangeEnd);
        let inserted = false;
        try {
          inserted = document.execCommand("insertText", false, replacement);
        } catch {
          inserted = false;
        }

        if (inserted) {
          const next = textarea.value;
          setDraft(next);
          onChange(next);
          textarea.setSelectionRange(rangeStart + cursorStart, rangeStart + cursorEnd);
          return;
        }
      }

      const next = `${draft.slice(0, rangeStart)}${replacement}${draft.slice(rangeEnd)}`;
      commit(next, { start: rangeStart + cursorStart, end: rangeStart + cursorEnd });
    },
    [commit, draft, onChange],
  );

  const withSelection = useCallback(
    (handler: (context: { start: number; end: number; selected: string }) => void) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      handler({ start, end, selected: textarea.value.slice(start, end) });
    },
    [],
  );

  const wrapSelection = useCallback(
    (prefix: string, suffix: string, placeholderText: string) => {
      withSelection(({ start, end, selected }) => {
        const inner = selected || placeholderText;
        replaceRange(start, end, `${prefix}${inner}${suffix}`, prefix.length, prefix.length + inner.length);
      });
    },
    [replaceRange, withSelection],
  );

  const prefixLines = useCallback(
    (prefix: string | ((index: number) => string)) => {
      withSelection(({ start, end }) => {
        const source = textareaRef.current?.value ?? draft;
        const lineStart = source.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
        const lineEndIndex = source.indexOf("\n", end);
        const lineEnd = lineEndIndex === -1 ? source.length : lineEndIndex;
        const replacement = source
          .slice(lineStart, lineEnd)
          .split("\n")
          .map((line, index) => {
            const marker = typeof prefix === "function" ? prefix(index) : prefix;
            return line.startsWith(marker) ? line.slice(marker.length) : `${marker}${line}`;
          })
          .join("\n");

        replaceRange(lineStart, lineEnd, replacement, replacement.length, replacement.length);
      });
    },
    [draft, replaceRange, withSelection],
  );

  const applyHeading = useCallback(
    (level: 1 | 2 | 3) => {
      withSelection(({ start, end }) => {
        const source = textareaRef.current?.value ?? draft;
        const lineStart = source.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
        const lineEndIndex = source.indexOf("\n", end);
        const lineEnd = lineEndIndex === -1 ? source.length : lineEndIndex;
        const current = source.slice(lineStart, lineEnd);
        const bare = current.replace(/^#{1,6}\s+/, "");
        const marker = "#".repeat(level);
        // Clicking the same level again removes the heading.
        const replacement = current.startsWith(`${marker} `) ? bare : `${marker} ${bare}`;

        replaceRange(lineStart, lineEnd, replacement, replacement.length, replacement.length);
      });
    },
    [draft, replaceRange, withSelection],
  );

  const insertSnippet = useCallback(
    (snippet: string, cursorOffset?: number) => {
      withSelection(({ start, end }) => {
        const offset = cursorOffset ?? snippet.length;
        replaceRange(start, end, snippet, offset, offset);
      });
    },
    [replaceRange, withSelection],
  );

  const insertCodeBlock = useCallback(
    (language: string) => {
      withSelection(({ start, end, selected }) => {
        const body = selected || "";
        const prefix = `\n\`\`\`${language}\n`;
        const suffix = "\n```\n";
        replaceRange(start, end, `${prefix}${body}${suffix}`, prefix.length, prefix.length + body.length);
      });
    },
    [replaceRange, withSelection],
  );

  const insertLink = useCallback(() => {
    withSelection(({ start, end, selected }) => {
      const label = selected || "link text";
      const href = window.prompt("Link URL", "https://");
      if (!href) return;
      const replacement = `[${label}](${formatMarkdownUrl(href)})`;
      replaceRange(start, end, replacement, 1, 1 + label.length);
    });
  }, [replaceRange, withSelection]);

  const insertImageByUrl = useCallback(() => {
    const src = window.prompt("Image URL", "https://");
    if (!src) return;

    withSelection(({ start, end, selected }) => {
      const alt = selected || "Describe this image";
      const markdown = `![${alt}](${formatMarkdownUrl(src)})`;
      replaceRange(start, end, markdown, 2, 2 + alt.length);
    });
  }, [replaceRange, withSelection]);

  const uploadAndInsert = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadError("");

      try {
        const url = await uploadToAdmin(file, mediaBucket);
        insertSnippet(`\n![${fileNameToAltText(file.name)}](${formatMarkdownUrl(url)})\n`);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [insertSnippet, mediaBucket],
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      const image = Array.from(files).find((file) => file.type.startsWith("image/"));
      if (!image) return;
      await uploadAndInsert(image);
    },
    [uploadAndInsert],
  );

  function onEditorKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const modifier = event.metaKey || event.ctrlKey;

    if (modifier && !event.altKey) {
      const key = event.key.toLowerCase();
      if (key === "b") {
        event.preventDefault();
        wrapSelection("**", "**", "bold text");
        return;
      }
      if (key === "i") {
        event.preventDefault();
        wrapSelection("_", "_", "italic text");
        return;
      }
      if (key === "k") {
        event.preventDefault();
        insertLink();
        return;
      }
      if (key === "e") {
        event.preventDefault();
        wrapSelection("`", "`", "code");
        return;
      }
    }

    if (event.key === "Tab") {
      event.preventDefault();
      withSelection(({ start, end, selected }) => {
        if (selected.includes("\n")) {
          prefixLines("  ");
          return;
        }
        replaceRange(start, end, "  ", 2, 2);
      });
      return;
    }

    if (event.key === "Enter" && !event.shiftKey && !modifier) {
      const textarea = event.currentTarget;
      const caret = textarea.selectionStart;
      if (caret !== textarea.selectionEnd) return;

      const lineStart = textarea.value.lastIndexOf("\n", Math.max(0, caret - 1)) + 1;
      const currentLine = textarea.value.slice(lineStart, caret);
      const match = LIST_CONTINUATION.exec(currentLine);
      if (!match) return;

      const [, indent, bullet, checkbox, body] = match;

      event.preventDefault();

      if (!body.trim()) {
        // Enter on an empty bullet ends the list instead of adding another one.
        replaceRange(lineStart, caret, "", 0, 0);
        return;
      }

      const nextBullet = /^\d+[.)]$/.test(bullet)
        ? `${Number.parseInt(bullet, 10) + 1}${bullet.slice(-1)}`
        : bullet;
      const marker = `\n${indent}${nextBullet} ${checkbox ? "[ ] " : ""}`;
      replaceRange(caret, caret, marker, marker.length, marker.length);
    }
  }

  function syncScroll(source: "editor" | "preview") {
    if (viewMode !== "split") return;
    if (syncingRef.current) return;

    const editor = textareaRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;

    syncingRef.current = true;
    const from = source === "editor" ? editor : preview;
    const to = source === "editor" ? preview : editor;
    const range = from.scrollHeight - from.clientHeight;
    const ratio = range > 0 ? from.scrollTop / range : 0;
    to.scrollTop = ratio * (to.scrollHeight - to.clientHeight);

    window.requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  }

  const insertItems: { label: string; snippet: string; icon: React.ReactNode }[] = [
    {
      label: "Table",
      icon: <TableIcon size={13} aria-hidden="true" />,
      snippet: "\n| Column | Column |\n| --- | --- |\n| Value | Value |\n\n",
    },
    {
      label: "Note callout",
      icon: <AlertTriangle size={13} aria-hidden="true" />,
      snippet: "\n> [!NOTE]\n> Something worth knowing.\n\n",
    },
    {
      label: "Warning callout",
      icon: <AlertTriangle size={13} aria-hidden="true" />,
      snippet: "\n> [!WARNING]\n> Be careful with this.\n\n",
    },
    {
      label: "Collapsible section",
      icon: <ChevronDown size={13} aria-hidden="true" />,
      snippet: "\n<details>\n<summary>Show details</summary>\n\nHidden content.\n\n</details>\n\n",
    },
    {
      label: "Mermaid diagram",
      icon: <Workflow size={13} aria-hidden="true" />,
      snippet: "\n```mermaid\nflowchart LR\n  A[Start] --> B{Choice}\n  B -->|yes| C[Done]\n  B -->|no| A\n```\n\n",
    },
    {
      label: "Math block",
      icon: <Sigma size={13} aria-hidden="true" />,
      snippet: "\n$$\nE = mc^2\n$$\n\n",
    },
    {
      label: "Table of contents",
      icon: <List size={13} aria-hidden="true" />,
      snippet: "\n[TOC]\n\n",
    },
    {
      label: "Footnote",
      icon: <Pencil size={13} aria-hidden="true" />,
      snippet: "Text with a note[^1]\n\n[^1]: The note itself.\n\n",
    },
  ];

  const editorPane = (
    <div
      className={`editor-pane${dragActive ? " editor-pane-drop" : ""}`}
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
        void handleFiles(event.dataTransfer.files);
      }}
    >
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(event) => commit(event.target.value)}
        onScroll={() => syncScroll("editor")}
        onKeyDown={onEditorKeyDown}
        onPaste={(event) => {
          const files = event.clipboardData.files;
          if (!files?.length) return;
          if (!Array.from(files).some((file) => file.type.startsWith("image/"))) return;
          event.preventDefault();
          void handleFiles(files);
        }}
        rows={minRows}
        spellCheck
        placeholder={placeholder}
        aria-label="Markdown content"
        className="editor-textarea"
      />
      {dragActive ? <div className="editor-drop-hint">Drop to upload</div> : null}
    </div>
  );

  const previewPane = (
    <div className="editor-preview" ref={previewRef} onScroll={() => syncScroll("preview")}>
      {draft.trim() ? (
        <MarkdownRenderer content={draft} compact />
      ) : (
        <p className="editor-preview-empty">Nothing to preview yet.</p>
      )}
    </div>
  );

  return (
    <div className={`editor-root${fullscreen ? " editor-root-fullscreen" : ""}`}>
      <div className="editor-toolbar" onClick={(event) => event.stopPropagation()}>
        <div className="editor-toolbar-group">
          <button type="button" className="editor-tool" onClick={() => applyHeading(1)} title="Heading 1">
            <Heading1 size={14} aria-hidden="true" />
          </button>
          <button type="button" className="editor-tool" onClick={() => applyHeading(2)} title="Heading 2">
            <Heading2 size={14} aria-hidden="true" />
          </button>
          <button type="button" className="editor-tool" onClick={() => applyHeading(3)} title="Heading 3">
            <Heading3 size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="editor-toolbar-group">
          <button
            type="button"
            className="editor-tool"
            onClick={() => wrapSelection("**", "**", "bold text")}
            title="Bold (Ctrl+B)"
          >
            <Bold size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="editor-tool"
            onClick={() => wrapSelection("_", "_", "italic text")}
            title="Italic (Ctrl+I)"
          >
            <Italic size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="editor-tool"
            onClick={() => wrapSelection("~~", "~~", "struck text")}
            title="Strikethrough"
          >
            <Strikethrough size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="editor-tool"
            onClick={() => wrapSelection("==", "==", "highlight")}
            title="Highlight"
          >
            <Highlighter size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="editor-tool"
            onClick={() => wrapSelection("`", "`", "code")}
            title="Inline code (Ctrl+E)"
          >
            <Code2 size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="editor-toolbar-group">
          <button type="button" className="editor-tool" onClick={() => prefixLines("> ")} title="Quote">
            <Quote size={14} aria-hidden="true" />
          </button>
          <button type="button" className="editor-tool" onClick={() => prefixLines("- ")} title="Bullet list">
            <List size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="editor-tool"
            onClick={() => prefixLines((index) => `${index + 1}. `)}
            title="Numbered list"
          >
            <ListOrdered size={14} aria-hidden="true" />
          </button>
          <button type="button" className="editor-tool" onClick={() => prefixLines("- [ ] ")} title="Task list">
            <ListTodo size={14} aria-hidden="true" />
          </button>
          <button type="button" className="editor-tool" onClick={() => insertSnippet("\n---\n")} title="Divider">
            <Minus size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="editor-toolbar-group">
          <button type="button" className="editor-tool" onClick={insertLink} title="Link (Ctrl+K)">
            <Link2 size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="editor-tool"
            onClick={() => fileInputRef.current?.click()}
            title="Upload image"
          >
            {uploading ? <Loader2 size={14} className="editor-spin" aria-hidden="true" /> : <ImageIcon size={14} aria-hidden="true" />}
          </button>
          <button type="button" className="editor-tool" onClick={insertImageByUrl} title="Image from URL">
            <Link2 size={14} aria-hidden="true" style={{ transform: "rotate(45deg)" }} />
          </button>

          <div className="editor-menu-wrap">
            <button
              type="button"
              className="editor-tool editor-tool-wide"
              onClick={() => setOpenMenu((current) => (current === "language" ? "" : "language"))}
              aria-expanded={openMenu === "language"}
              title="Insert code block"
            >
              <Code2 size={14} aria-hidden="true" />
              Code
              <ChevronDown size={11} aria-hidden="true" />
            </button>

            {openMenu === "language" ? (
              <div className="editor-menu editor-menu-scroll" role="menu">
                {COMMON_EDITOR_LANGUAGES.map((language) => (
                  <button
                    key={language.id || "plain"}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenMenu("");
                      insertCodeBlock(language.id);
                    }}
                  >
                    {language.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="editor-menu-wrap">
            <button
              type="button"
              className="editor-tool editor-tool-wide"
              onClick={() => setOpenMenu((current) => (current === "insert" ? "" : "insert"))}
              aria-expanded={openMenu === "insert"}
              title="Insert block"
            >
              Insert
              <ChevronDown size={11} aria-hidden="true" />
            </button>

            {openMenu === "insert" ? (
              <div className="editor-menu" role="menu">
                {insertItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenMenu("");
                      insertSnippet(item.snippet);
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="editor-toolbar-group editor-toolbar-right">
          <div className="editor-view-switch" role="group" aria-label="Editor view">
            <button
              type="button"
              onClick={() => setViewMode("write")}
              data-active={viewMode === "write" ? "true" : "false"}
              title="Write only"
            >
              <Pencil size={13} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              data-active={viewMode === "split" ? "true" : "false"}
              title="Split view"
            >
              <Columns2 size={13} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              data-active={viewMode === "preview" ? "true" : "false"}
              title="Preview only"
            >
              <Eye size={13} aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            className="editor-tool"
            onClick={() => setFullscreen((current) => !current)}
            title={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
          >
            {fullscreen ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <div className={`editor-panes editor-panes-${viewMode}`}>
        {viewMode !== "preview" ? editorPane : null}
        {viewMode !== "write" ? previewPane : null}
      </div>

      <div className="editor-status">
        <span>{words} words</span>
        <span>{draft.length} characters</span>
        <span>{headingCount} headings</span>
        <span>~{readingTime} min read</span>
        {uploading ? <span className="editor-status-busy">Uploading image…</span> : null}
        {uploadError ? <span className="editor-status-error">{uploadError}</span> : null}
        <span className="editor-status-spacer" />
        <span className="editor-status-hint">Ctrl+B bold · Ctrl+I italic · Ctrl+K link · Ctrl+E code</span>
      </div>

      {issues.length > 0 ? (
        <ul className="editor-issues">
          {issues.map((issue) => (
            <li key={issue}>
              <AlertTriangle size={12} aria-hidden="true" />
              {issue}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
