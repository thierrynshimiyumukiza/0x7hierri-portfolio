import type { HighlighterCore, ShikiTransformer } from "shiki/core";

/**
 * One highlighter for the whole page. Grammars load on first use, so a post
 * with a single bash block only downloads the bash grammar, and the JavaScript
 * regex engine avoids shipping Oniguruma's WebAssembly to readers.
 */
let highlighterPromise: Promise<HighlighterCore> | null = null;
const loadingLanguages = new Map<string, Promise<boolean>>();

export const SHIKI_THEMES = { light: "github-light-default", dark: "github-dark-dimmed" } as const;

// The editor's language ids come from Prism; these are the ones Shiki names differently.
const PRISM_TO_SHIKI: Record<string, string> = {
  markup: "html",
  "shell-session": "shellsession",
  nasm: "asm",
  armasm: "asm",
  batch: "bat",
  "visual-basic": "vb",
  objectivec: "objective-c",
  docker: "docker",
};

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, { bundledThemes }] = await Promise.all([
        import("shiki/core"),
        import("shiki/engine/javascript"),
        import("shiki/themes"),
      ]);
      return createHighlighterCore({
        themes: [bundledThemes[SHIKI_THEMES.light](), bundledThemes[SHIKI_THEMES.dark]()],
        langs: [],
        engine: createJavaScriptRegexEngine({ forgiving: true }),
      });
    })();
  }
  return highlighterPromise;
}

async function ensureLanguage(highlighter: HighlighterCore, lang: string): Promise<boolean> {
  if (highlighter.getLoadedLanguages().includes(lang)) return true;

  let pending = loadingLanguages.get(lang);
  if (!pending) {
    pending = (async () => {
      const { bundledLanguages } = await import("shiki/langs");
      const loader = bundledLanguages[lang as keyof typeof bundledLanguages];
      if (!loader) return false;
      await highlighter.loadLanguage(loader);
      return true;
    })().catch(() => false);
    loadingLanguages.set(lang, pending);
  }
  return pending;
}

export type HighlightOptions = {
  highlightedLines: Set<number>;
  /** Diff fences mark added and removed lines by their first character. */
  diff: boolean;
};

/** Returns Shiki's HTML for the block; unknown languages come back as escaped plain text. */
export async function highlightCode(code: string, prismId: string, options: HighlightOptions) {
  const highlighter = await getHighlighter();
  const lang = PRISM_TO_SHIKI[prismId] ?? prismId;
  const known = lang ? await ensureLanguage(highlighter, lang) : false;

  const sourceLines = code.split("\n");
  const transformer: ShikiTransformer = {
    pre(node) {
      // The surrounding region is already the keyboard stop for scrolling.
      delete node.properties.tabindex;
    },
    code(node) {
      // Lines render as blocks, so the newline text between them would show
      // up as an extra blank row; block boundaries still copy as newlines.
      node.children = node.children.filter((child) => !(child.type === "text" && child.value === "\n"));
    },
    line(node, line) {
      node.properties["data-line"] = line;
      if (options.highlightedLines.has(line)) this.addClassToHast(node, "is-highlighted");
      if (options.diff) {
        const first = sourceLines[line - 1]?.[0];
        if (first === "+") this.addClassToHast(node, "is-added");
        if (first === "-") this.addClassToHast(node, "is-removed");
      }
    },
  };

  return highlighter.codeToHtml(code, {
    lang: known ? lang : "text",
    themes: SHIKI_THEMES,
    // Both palettes ship as CSS variables, so the site theme toggle recolours
    // code without highlighting it again.
    defaultColor: false,
    transformers: [transformer],
  });
}
