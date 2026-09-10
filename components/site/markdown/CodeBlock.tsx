"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Download, WrapText } from "lucide-react";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark";
import oneLight from "react-syntax-highlighter/dist/esm/styles/prism/one-light";
import { resolveCodeLanguage } from "@/lib/code-languages";
import { useThemeMode } from "@/lib/use-theme-mode";

type CodeBlockProps = {
  /** Raw fence language exactly as the author typed it. */
  language: string;
  value: string;
  /** Everything after the language on the fence line, e.g. title="app.ts" {2,5-7} */
  meta?: string;
};

const COLLAPSE_THRESHOLD = 28;

type FenceOptions = {
  filename: string;
  highlightedLines: Set<number>;
  showLineNumbers: boolean | null;
  startLine: number;
};

/** Parses the fence info string: title/filename, {1,3-5} ranges and line-number flags. */
function parseFenceMeta(meta: string, lineCount: number): FenceOptions {
  const options: FenceOptions = {
    filename: "",
    highlightedLines: new Set<number>(),
    showLineNumbers: null,
    startLine: 1,
  };

  if (!meta) {
    return options;
  }

  const titleMatch = /(?:title|filename|file|name)\s*=\s*("([^"]*)"|'([^']*)'|([^\s]+))/i.exec(meta);
  if (titleMatch) {
    options.filename = (titleMatch[2] ?? titleMatch[3] ?? titleMatch[4] ?? "").trim();
  } else {
    // Shorthand used by many editors: ```ts:src/app.ts
    const shorthand = /^:?([\w./@-]+\.[\w]+)/.exec(meta.trim());
    if (shorthand) options.filename = shorthand[1];
  }

  const rangeMatch = /\{([\d,\s-]+)\}/.exec(meta);
  if (rangeMatch) {
    rangeMatch[1]
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => {
        const [rawStart, rawEnd] = part.split("-").map((piece) => Number.parseInt(piece, 10));
        const start = Number.isFinite(rawStart) ? rawStart : 0;
        const end = Number.isFinite(rawEnd) ? rawEnd : start;
        for (let line = start; line <= Math.min(end, lineCount); line += 1) {
          if (line > 0) options.highlightedLines.add(line);
        }
      });
  }

  if (/\bno-?line-?numbers\b/i.test(meta)) options.showLineNumbers = false;
  else if (/\bline-?numbers\b/i.test(meta)) options.showLineNumbers = true;

  const startMatch = /\bstart\s*=\s*(\d+)/i.exec(meta);
  if (startMatch) options.startLine = Math.max(1, Number.parseInt(startMatch[1], 10));

  return options;
}

function extensionFor(languageId: string): string {
  const map: Record<string, string> = {
    javascript: "js", typescript: "ts", jsx: "jsx", tsx: "tsx", python: "py", ruby: "rb", rust: "rs",
    csharp: "cs", cpp: "cpp", c: "c", java: "java", go: "go", kotlin: "kt", swift: "swift", php: "php",
    bash: "sh", "shell-session": "sh", powershell: "ps1", batch: "bat", yaml: "yml", json: "json",
    markup: "html", css: "css", scss: "scss", sql: "sql", markdown: "md", docker: "Dockerfile",
    makefile: "Makefile", toml: "toml", ini: "ini", graphql: "graphql", nasm: "asm", armasm: "s",
  };
  return map[languageId] ?? "txt";
}

export default function CodeBlock({ language, value, meta = "" }: CodeBlockProps) {
  const themeMode = useThemeMode();
  const [copied, setCopied] = useState(false);
  // The highlighter loads Prism grammars in the browser only, and it picks its
  // palette from the runtime theme. Rendering it during hydration therefore
  // produced markup the server could never match, so it waits for the mount and
  // a plain, deterministic <pre> stands in until then.
  const [mounted, setMounted] = useState(false);
  const [wrapped, setWrapped] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const regionRef = useRef<HTMLDivElement | null>(null);

  const resolved = useMemo(() => resolveCodeLanguage(language), [language]);
  const lines = useMemo(() => value.split("\n"), [value]);
  const options = useMemo(() => parseFenceMeta(meta, lines.length), [meta, lines.length]);

  // refractor throws a TypeError the moment it is asked whether `undefined` is a
  // registered language, which is exactly what an unlabelled or unknown fence used
  // to send it. "text" is its own opt-out for "render this verbatim".
  const highlighterLanguage = resolved.id || "text";
  const isLong = lines.length > COLLAPSE_THRESHOLD;
  const showLineNumbers = options.showLineNumbers ?? lines.length > 3;
  const style = themeMode === "light" ? oneLight : oneDark;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard access can be denied; select the text so the reader can copy manually.
      const region = regionRef.current;
      if (!region) return;
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(region);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [value]);

  const downloadSnippet = useCallback(() => {
    const name = options.filename || `snippet.${extensionFor(resolved.id)}`;
    const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
  }, [options.filename, resolved.id, value]);

  const lineProps = useCallback(
    (lineNumber: number): React.HTMLProps<HTMLElement> => ({
      style: {
        display: "block",
        width: "100%",
        background: options.highlightedLines.has(lineNumber)
          ? themeMode === "light"
            ? "rgba(29, 103, 227, 0.10)"
            : "rgba(88, 166, 255, 0.14)"
          : undefined,
        boxShadow: options.highlightedLines.has(lineNumber)
          ? `inset 2px 0 0 ${themeMode === "light" ? "#1d67e3" : "#58a6ff"}`
          : undefined,
      },
    }),
    [options.highlightedLines, themeMode],
  );

  const hasHighlights = options.highlightedLines.size > 0;

  return (
    <figure className="code-block" data-collapsed={isLong && !expanded ? "true" : "false"}>
      <figcaption className="code-block-head">
        <div className="code-block-identity">
          <span className="code-block-language">{resolved.label}</span>
          {options.filename ? <span className="code-block-filename">{options.filename}</span> : null}
          {!resolved.recognized ? (
            <span className="code-block-unknown" title="No syntax highlighting is available for this language">
              no highlighter
            </span>
          ) : null}
        </div>

        <div className="code-block-actions">
          <button
            type="button"
            onClick={() => setWrapped((current) => !current)}
            className="code-block-button"
            aria-pressed={wrapped}
            title={wrapped ? "Disable line wrapping" : "Wrap long lines"}
          >
            <WrapText size={14} aria-hidden="true" />
            <span className="sr-only">{wrapped ? "Disable line wrapping" : "Wrap long lines"}</span>
          </button>

          <button type="button" onClick={downloadSnippet} className="code-block-button" title="Download snippet">
            <Download size={14} aria-hidden="true" />
            <span className="sr-only">Download snippet</span>
          </button>

          <button
            type="button"
            onClick={() => void copyToClipboard()}
            className="code-block-button"
            title={copied ? "Copied" : "Copy code"}
          >
            {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            <span className="sr-only">{copied ? "Code copied" : "Copy code"}</span>
          </button>
        </div>
      </figcaption>

      <div
        ref={regionRef}
        className="code-block-scroll"
        tabIndex={0}
        role="region"
        aria-label={`${resolved.label} code${options.filename ? `, ${options.filename}` : ""}`}
      >
        {mounted ? (
          <SyntaxHighlighter
            language={highlighterLanguage}
            style={style}
            showLineNumbers={showLineNumbers}
            startingLineNumber={options.startLine}
            wrapLines={hasHighlights}
            wrapLongLines={wrapped}
            lineProps={hasHighlights ? lineProps : undefined}
            lineNumberStyle={{
              minWidth: "2.4em",
              paddingRight: "1em",
              textAlign: "right",
              color: "var(--text-faint)",
              userSelect: "none",
            }}
            customStyle={{
              margin: 0,
              padding: "0.95rem 1rem",
              background: "transparent",
              fontSize: "13px",
              lineHeight: 1.65,
            }}
            codeTagProps={{
              style: {
                fontFamily: "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "13px",
                whiteSpace: wrapped ? "pre-wrap" : "pre",
                wordBreak: wrapped ? "break-word" : "normal",
              },
            }}
          >
            {value}
          </SyntaxHighlighter>
        ) : (
          <pre className="code-block-plain">
            <code>{value}</code>
          </pre>
        )}
      </div>

      {isLong ? (
        <button type="button" className="code-block-expand" onClick={() => setExpanded((current) => !current)}>
          <ChevronDown size={13} aria-hidden="true" style={{ transform: expanded ? "rotate(180deg)" : undefined }} />
          {expanded ? "Collapse" : `Show all ${lines.length} lines`}
        </button>
      ) : null}
    </figure>
  );
}
