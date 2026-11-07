"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { EditorState, Prec, type Extension } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  keymap,
  placeholder as placeholderExtension,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentLess, indentMore } from "@codemirror/commands";
import { HighlightStyle, bracketMatching, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import {
  autocompletion,
  completionKeymap,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { tags } from "@lezer/highlight";

export type SlashCommand = {
  label: string;
  detail?: string;
  /** Text that replaces the typed "/command". */
  snippet: string;
  /** Caret position inside the snippet; defaults to its end. */
  cursor?: number;
};

export type MarkdownCodeEditorHandle = {
  getValue: () => string;
  getSelection: () => { start: number; end: number };
  /** Replaces [from, to) and selects [from + selStart, from + selEnd), as one undo step. */
  replaceRange: (from: number, to: number, text: string, selStart: number, selEnd: number) => void;
  focus: () => void;
  scroller: () => HTMLElement | null;
};

type MarkdownCodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onShortcut: (key: "bold" | "italic" | "link" | "code") => void;
  onFiles: (files: FileList) => void;
  onScroll?: () => void;
  slashCommands: SlashCommand[];
  placeholder?: string;
  minHeight?: number;
};

const highlightStyle = HighlightStyle.define([
  { tag: tags.heading1, fontSize: "1.3em", fontWeight: "700", color: "var(--text-primary)" },
  { tag: tags.heading2, fontSize: "1.18em", fontWeight: "700", color: "var(--text-primary)" },
  { tag: [tags.heading3, tags.heading4, tags.heading5, tags.heading6], fontWeight: "700", color: "var(--text-primary)" },
  { tag: tags.strong, fontWeight: "700", color: "var(--text-primary)" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: [tags.link, tags.url], color: "var(--accent-blue)" },
  { tag: tags.processingInstruction, color: "var(--text-dim)" },
  { tag: tags.monospace, color: "var(--accent-amber)" },
  { tag: tags.quote, color: "var(--text-muted)", fontStyle: "italic" },
  { tag: [tags.list, tags.contentSeparator], color: "var(--accent-blue)" },
  { tag: tags.meta, color: "var(--text-dim)" },
  // Tokens inside fenced code, highlighted by the fence's own language.
  { tag: [tags.keyword, tags.controlKeyword, tags.modifier, tags.operatorKeyword], color: "#f47067" },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: "#96d0ff" },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: "#6cb6ff" },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: "var(--text-dim)", fontStyle: "italic" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "#dcbdfb" },
  { tag: [tags.typeName, tags.className, tags.namespace], color: "#f69d50" },
  { tag: [tags.propertyName, tags.attributeName], color: "#8ddb8c" },
  { tag: [tags.tagName, tags.definition(tags.variableName)], color: "#8ddb8c" },
]);

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    color: "var(--text-body)",
    backgroundColor: "transparent",
    fontSize: "15px",
  },
  ".cm-scroller": {
    fontFamily: "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
    lineHeight: "1.75",
    overflow: "auto",
  },
  ".cm-content": { padding: "20px 0", caretColor: "var(--accent-blue)" },
  ".cm-line": { padding: "0 24px" },
  "&.cm-focused": { outline: "none" },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--bg-elevated) 70%, transparent)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "var(--accent-blue-soft) !important",
  },
  ".cm-cursor": { borderLeftColor: "var(--accent-blue)", borderLeftWidth: "2px" },
  ".cm-placeholder": { color: "var(--text-faint)" },
  ".cm-gutters": { backgroundColor: "transparent", border: "none" },
  ".cm-tooltip": {
    backgroundColor: "var(--bg-elevated)",
    border: "1px solid var(--border-strong)",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
  },
  ".cm-tooltip-autocomplete > ul": { fontFamily: "inherit", maxHeight: "320px" },
  ".cm-tooltip-autocomplete > ul > li": { padding: "6px 12px !important", fontSize: "14px" },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
    backgroundColor: "var(--accent-blue-soft)",
    color: "var(--text-primary)",
  },
  ".cm-completionDetail": { color: "var(--text-dim)", fontStyle: "normal", marginLeft: "12px" },
  ".cm-diagnostic": { padding: "8px 12px", fontSize: "13px" },
  ".cm-diagnostic-error": { borderLeft: "3px solid var(--accent-red)" },
  ".cm-lintRange-error": {
    backgroundImage: "none",
    textDecoration: "underline wavy var(--accent-red)",
    textUnderlineOffset: "4px",
  },
});

/** Finds each ```mermaid fence and reports what mermaid.parse rejects. */
async function lintMermaid(view: EditorView): Promise<Diagnostic[]> {
  const doc = view.state.doc;
  const text = doc.toString();
  const fence = /^(`{3,}|~{3,})[ \t]*(mermaid|mmd)\b[^\n]*\n([\s\S]*?)^\1[ \t]*$/gm;
  const blocks: { from: number; bodyFrom: number; to: number; body: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = fence.exec(text))) {
    const bodyFrom = match.index + match[0].indexOf("\n") + 1;
    blocks.push({ from: match.index, bodyFrom, to: match.index + match[0].length, body: match[3] });
  }
  if (blocks.length === 0) return [];

  const { default: mermaid } = await import("mermaid");
  const diagnostics: Diagnostic[] = [];

  for (const block of blocks) {
    try {
      await mermaid.parse(block.body);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Mermaid's parser errors name the offending line inside the diagram.
      const lineMatch = /line (\d+)/i.exec(message);
      let from = block.from;
      let to = block.to;
      if (lineMatch) {
        const firstBodyLine = doc.lineAt(block.bodyFrom).number;
        const lineNumber = Math.min(doc.lines, firstBodyLine + Number(lineMatch[1]) - 1);
        const line = doc.line(lineNumber);
        from = line.from;
        to = Math.max(line.to, line.from + 1);
      }
      diagnostics.push({
        from,
        to: Math.min(to, doc.length),
        severity: "error",
        source: "mermaid",
        message: message.split("\n").slice(0, 4).join("\n"),
      });
    }
  }
  return diagnostics;
}

function slashSource(commands: SlashCommand[]) {
  return (context: CompletionContext): CompletionResult | null => {
    // Only at the start of a line (after optional indentation), so a "/" in a
    // URL or a path never opens the menu.
    const match = context.matchBefore(/^\s*\/[\w-]*$/);
    if (!match) return null;
    const slashAt = match.from + match.text.indexOf("/");

    return {
      from: slashAt,
      filter: true,
      options: commands.map<Completion>((command) => ({
        label: `/${command.label.toLowerCase().replace(/\s+/g, "-")}`,
        displayLabel: command.label,
        detail: command.detail,
        apply: (view, _completion, from, to) => {
          const cursor = from + (command.cursor ?? command.snippet.length);
          view.dispatch({
            changes: { from, to, insert: command.snippet },
            selection: { anchor: cursor },
            scrollIntoView: true,
          });
        },
      })),
    };
  };
}

const MarkdownCodeEditor = forwardRef<MarkdownCodeEditorHandle, MarkdownCodeEditorProps>(function MarkdownCodeEditor(
  { value, onChange, onShortcut, onFiles, onScroll, slashCommands, placeholder = "", minHeight = 520 },
  ref,
) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  // Callbacks change identity every render; the editor reads them through refs
  // so it never has to be rebuilt (which would lose undo history).
  const callbacks = useRef({ onChange, onShortcut, onFiles, onScroll });
  callbacks.current = { onChange, onShortcut, onFiles, onScroll };
  const commandsRef = useRef(slashCommands);
  commandsRef.current = slashCommands;

  useImperativeHandle(ref, () => ({
    getValue: () => viewRef.current?.state.doc.toString() ?? "",
    getSelection: () => {
      const range = viewRef.current?.state.selection.main;
      return { start: range?.from ?? 0, end: range?.to ?? 0 };
    },
    replaceRange: (from, to, text, selStart, selEnd) => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + selStart, head: from + selEnd },
        scrollIntoView: true,
      });
      view.focus();
    },
    focus: () => viewRef.current?.focus(),
    scroller: () => viewRef.current?.scrollDOM ?? null,
  }));

  useEffect(() => {
    if (!hostRef.current) return;

    const shortcut = (key: "bold" | "italic" | "link" | "code") => () => {
      callbacks.current.onShortcut(key);
      return true;
    };

    const fileHandler = (files: FileList | null | undefined) => {
      if (!files?.length) return false;
      if (!Array.from(files).some((file) => file.type.startsWith("image/"))) return false;
      callbacks.current.onFiles(files);
      return true;
    };

    const extensions: Extension[] = [
      history(),
      drawSelection(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      bracketMatching(),
      indentOnInput(),
      EditorView.lineWrapping,
      markdown({ base: markdownLanguage, codeLanguages: languages, addKeymap: true }),
      syntaxHighlighting(highlightStyle),
      placeholderExtension(placeholder),
      autocompletion({
        override: [slashSource(commandsRef.current)],
        icons: false,
        activateOnTyping: true,
      }),
      linter(lintMermaid, { delay: 600 }),
      lintGutter(),
      Prec.high(
        keymap.of([
          { key: "Mod-b", run: shortcut("bold") },
          { key: "Mod-i", run: shortcut("italic") },
          { key: "Mod-k", run: shortcut("link") },
          { key: "Mod-e", run: shortcut("code") },
          { key: "Tab", run: indentMore, shift: indentLess },
        ]),
      ),
      keymap.of([...completionKeymap, ...defaultKeymap, ...historyKeymap, ...searchKeymap]),
      editorTheme,
      EditorView.contentAttributes.of({ "aria-label": "Markdown content", spellcheck: "true" }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) callbacks.current.onChange(update.state.doc.toString());
      }),
      EditorView.domEventHandlers({
        paste: (event) => {
          if (fileHandler(event.clipboardData?.files)) {
            event.preventDefault();
            return true;
          }
          return false;
        },
        drop: (event) => {
          if (fileHandler(event.dataTransfer?.files)) {
            event.preventDefault();
            return true;
          }
          return false;
        },
        scroll: () => {
          callbacks.current.onScroll?.();
          return false;
        },
      }),
    ];

    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({ doc: value, extensions }),
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // The editor is built once; external value changes are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    // Only an external reset (loading another post) replaces the buffer; our own
    // edits already match, and replacing them would move the caret.
    if (value !== current) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  return <div ref={hostRef} className="editor-codemirror" style={{ minHeight }} />;
});

export default MarkdownCodeEditor;
