import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MarkdownRenderer from "../components/site/markdown/MarkdownRenderer";

type TestCase = {
  name: string;
  markdown: string;
  check: (html: string) => void;
};

function render(markdown: string): string {
  return renderToStaticMarkup(<MarkdownRenderer content={markdown} />);
}

function countMatches(value: string, pattern: RegExp): number {
  return (value.match(pattern) ?? []).length;
}

function serializeContentForForm(content: string): string {
  const formData = new FormData();
  formData.set("content", content);
  return String(formData.get("content") ?? "");
}

const tests: TestCase[] = [
  {
    name: "headings",
    markdown: "# Heading 1\n\n## Heading 2\n\n### Heading 3",
    check(html) {
      assert.match(html, /<h1 id="heading-1"[^>]*>Heading 1<a href="#heading-1"[^>]*>#<\/a><\/h1>/);
      assert.match(html, /<h2 id="heading-2"[^>]*>Heading 2<a href="#heading-2"[^>]*>#<\/a><\/h2>/);
      assert.match(html, /<h3 id="heading-3"[^>]*>Heading 3<a href="#heading-3"[^>]*>#<\/a><\/h3>/);
    },
  },
  {
    name: "paragraph soft line breaks",
    markdown: "This is one paragraph\nthat uses a soft line break.",
    check(html) {
      assert.equal(countMatches(html, /<p\b/g), 1);
      assert.doesNotMatch(html, /<br\s*\/?/);
    },
  },
  {
    name: "inline code and fenced code",
    markdown: "Inline `code` sample.\n\n```ts\nconst value: number = 1;\n```",
    check(html) {
      assert.match(html, /Inline <code class="md-inline-code">code<\/code> sample\./);
      assert.equal(countMatches(html, /<pre\b/g), 1);
      assert.match(html, /<span class="code-block-language">TypeScript<\/span>/);
      assert.doesNotMatch(html, /```/);
    },
  },
  {
    name: "assembly code fence aliases",
    markdown: [
      "```asm",
      "mov eax, 1",
      "```",
      "",
      "```x86-64",
      "mov rax, 1",
      "```",
      "",
      "```arm",
      "MOV R0, #1",
      "```",
      "",
      "```6502",
      "LDA #$01",
      "```",
      "",
      "```avr",
      "LDI R16, 1",
      "```",
      "",
      "```webassembly",
      "(module)",
      "```",
    ].join("\n"),
    check(html) {
      assert.match(html, /<span class="code-block-language">x86 asm<\/span>/);
      assert.match(html, /<span class="code-block-language">ARM asm<\/span>/);
      assert.match(html, /<span class="code-block-language">6502 asm<\/span>/);
      assert.match(html, /<span class="code-block-language">AVR asm<\/span>/);
      assert.match(html, /<span class="code-block-language">WebAssembly<\/span>/);
      assert.doesNotMatch(html, /no highlighter/);
    },
  },
  {
    name: "lists and nested lists",
    markdown: "- Parent\n  - Child\n- Second\n\n1. First\n2. Second",
    check(html) {
      assert.ok(countMatches(html, /<ul\b/g) >= 2);
      assert.equal(countMatches(html, /<ol\b/g), 1);
      assert.equal(countMatches(html, /<li\b/g), 5);
    },
  },
  {
    name: "blockquote",
    markdown: "> Quoted line",
    check(html) {
      assert.equal(countMatches(html, /<blockquote\b/g), 1);
      assert.match(html, /Quoted line/);
    },
  },
  {
    name: "gfm table",
    markdown: "| Name | Value |\n| ---- | ----- |\n| A | 1 |",
    check(html) {
      assert.equal(countMatches(html, /<table\b/g), 1);
      assert.equal(countMatches(html, /<th\b/g), 2);
      assert.equal(countMatches(html, /<td\b/g), 2);
    },
  },
  {
    name: "GFM tasks, strikethrough, automatic links, and footnotes",
    markdown: "- [ ] Open task\n- [x] Done task\n\n~~Removed~~ https://example.com\n\nReference[^1]\n\n[^1]: Footnote text",
    check(html) {
      assert.equal(countMatches(html, /type="checkbox"/g), 2);
      assert.match(html, /<del>Removed<\/del>/);
      assert.match(html, /href="https:\/\/example\.com"/);
      assert.match(html, /Footnote text/);
    },
  },
  {
    name: "math, highlight, superscript, and subscript",
    markdown: "Inline $x^2$ and block:\n\n$$\\frac{a}{b}$$\n\n==Marked== x^2^ H~2~O",
    check(html) {
      assert.ok(countMatches(html, /katex/g) >= 2);
      assert.match(html, /<mark>Marked<\/mark>/);
      assert.match(html, /x<sup>2<\/sup>/);
      assert.match(html, /H<sub>2<\/sub>O/);
    },
  },
  {
    name: "details, TOC, and GitHub alerts",
    markdown: "[TOC]\n\n# Start\n\n## Next\n\n<details><summary>Show more</summary>Hidden content</details>\n\n> [!WARNING]\n> Proceed carefully.",
    check(html) {
      assert.match(html, /href="#start"/);
      assert.match(html, /href="#next"/);
      assert.match(html, /<details class="md-details"><summary class="md-summary">Show more<\/summary>Hidden content<\/details>/);
      assert.match(html, /<aside[^>]*border-\[--accent-amber\][^>]*>/);
      assert.match(html, /Proceed carefully/);
    },
  },
  {
    name: "all GitHub alert variants",
    markdown: "> [!NOTE]\n> Note\n\n> [!TIP]\n> Tip\n\n> [!IMPORTANT]\n> Important\n\n> [!WARNING]\n> Warning\n\n> [!CAUTION]\n> Caution",
    check(html) {
      assert.equal(countMatches(html, /<aside\b/g), 5);
      assert.match(html, /border-\[--accent-blue\]/);
      assert.match(html, /border-\[--accent-green\]/);
      assert.match(html, /border-violet-500/);
      assert.match(html, /border-\[--accent-amber\]/);
      assert.match(html, /border-red-500/);
    },
  },
  {
    name: "Mermaid fenced code block detection",
    markdown: [
      "```mermaid",
      "flowchart TD",
      "  A --> B",
      "```",
      "",
      "```mermaid",
      "classDiagram",
      "  class Animal",
      "```",
      "",
      "```mermaid",
      "stateDiagram-v2",
      "  [*] --> Active",
      "```",
      "",
      "```mermaid",
      "erDiagram",
      "  CUSTOMER ||--o{ ORDER : places",
      "```",
      "",
      "```mermaid",
      "gitGraph",
      "  commit id: \"ZERO\"",
      "```",
      "",
      "```mermaid",
      "gantt",
      "  title Roadmap",
      "  dateFormat YYYY-MM-DD",
      "  section Build",
      "  Feature : 2026-01-01, 1d",
      "```",
      "",
      "```mermaid",
      "mindmap",
      "  root((Portfolio))",
      "    Markdown",
      "```",
      "",
      "```mermaid",
      "timeline",
      "  title Timeline",
      "  2026 : Launch",
      "```",
      "",
      "```mermaid",
      "requirementDiagram",
      "  requirement test_req {",
      "    id: 1",
      "    text: Test requirement",
      "    risk: low",
      "    verifymethod: test",
      "  }",
      "```",
    ].join("\n"),
    check(html) {
      assert.equal(countMatches(html, /Rendering diagram\.\.\./g), 9);
      assert.doesNotMatch(html, /<pre\b/);
      assert.doesNotMatch(html, /language-mermaid/);
    },
  },
  {
    name: "Mermaid fenced code block form payload preservation",
    markdown: [
      "```mermaid",
      "flowchart TD",
      "A --> B",
      "```",
    ].join("\n"),
    check(_html) {
      assert.equal(serializeContentForForm(this.markdown), this.markdown);
    },
  },
  {
    name: "links",
    markdown: "Read [docs](https://example.com/docs).",
    check(html) {
      assert.match(html, /<a[^>]*href="https:\/\/example.com\/docs"[^>]*target="_blank"/);
      assert.match(html, /rel="noreferrer noopener"/);
    },
  },
  {
    name: "images",
    markdown: "![Alt text](<https://example.com/path/image test(1).png> \"Caption\")",
    check(html) {
      assert.equal(countMatches(html, /<img\b/g), 1);
      assert.match(html, /src="https:\/\/example.com\/path\/image%20test\(1\)\.png"/);
      assert.match(html, /<span class="md-figure-caption">Caption<\/span>/);
    },
  },
  {
    name: "horizontal rule",
    markdown: "Above\n\n---\n\nBelow",
    check(html) {
      assert.equal(countMatches(html, /<hr\b/g), 1);
    },
  },
  {
    name: "mixed markdown content",
    markdown: [
      "# Intro",
      "",
      "A paragraph with `inline` code and a [link](https://example.com).",
      "",
      "- item",
      "  - nested",
      "",
      "> quote",
      "",
      "```python",
      "print('ok')",
      "```",
      "",
      "| k | v |",
      "| - | - |",
      "| a | b |",
      "",
      "![diagram](https://example.com/diagram.png)",
    ].join("\n"),
    check(html) {
      assert.match(html, /<h1 id="intro"[^>]*>Intro<a href="#intro"[^>]*>#<\/a><\/h1>/);
      assert.match(html, /<code class="md-inline-code">inline<\/code>/);
      assert.match(html, /<span class="code-block-language">Python<\/span>/);
      assert.match(html, /<blockquote\b/);
      assert.match(html, /<table\b/);
      assert.match(html, /<img[^>]*src="https:\/\/example\.com\/diagram\.png"/);
    },
  },
  {
    name: "common language aliases resolve to a real highlighter",
    markdown: [
      "```js",
      "const a = 1;",
      "```",
      "",
      "```py",
      "a = 1",
      "```",
      "",
      "```sh",
      "ls -la",
      "```",
      "",
      "```html",
      "<p>hi</p>",
      "```",
      "",
      "```c++",
      "int main() {}",
      "```",
      "",
      "```yml",
      "key: value",
      "```",
      "",
      "```console",
      "$ whoami",
      "```",
    ].join("\n"),
    check(html) {
      assert.match(html, /<span class="code-block-language">JavaScript<\/span>/);
      assert.match(html, /<span class="code-block-language">Python<\/span>/);
      assert.match(html, /<span class="code-block-language">Bash<\/span>/);
      assert.match(html, /<span class="code-block-language">HTML<\/span>/);
      assert.match(html, /<span class="code-block-language">C\+\+<\/span>/);
      assert.match(html, /<span class="code-block-language">YAML<\/span>/);
      assert.match(html, /<span class="code-block-language">Console<\/span>/);
      // None of these may fall through to the "unsupported language" badge.
      assert.doesNotMatch(html, /no highlighter/);
    },
  },
  {
    name: "unknown languages still render, flagged as unhighlighted",
    markdown: "```wibble\nsome text\n```",
    check(html) {
      assert.match(html, /<span class="code-block-language">Wibble<\/span>/);
      assert.match(html, /no highlighter/);
      assert.match(html, /some text/);
    },
  },
  {
    // The highlighter runs in the browser only. Server output must therefore be
    // the plain stand-in for every fence, labelled or not, or hydration diverges.
    name: "fences render a plain server-side block, whatever the language",
    markdown: [
      "```",
      "unlabelled fence",
      "```",
      "",
      "```python",
      "print(1)",
      "```",
      "",
      "```wibble",
      "x",
      "```",
    ].join("\n"),
    check(html) {
      assert.equal(countMatches(html, /<pre class="code-block-plain">/g), 3);
      assert.match(html, /unlabelled fence/);
      assert.match(html, /<span class="code-block-language">Code<\/span>/);
    },
  },
  {
    name: "code fence metadata survives rehype-raw",
    markdown: '```ts title="src/app.ts" {2}\nconst a = 1;\nconst b = 2;\n```',
    check(html) {
      assert.match(html, /<span class="code-block-filename">src\/app\.ts<\/span>/);
      assert.match(html, /aria-label="TypeScript code, src\/app\.ts"/);
    },
  },
  {
    name: "heading ids match the generated table of contents",
    markdown: "[TOC]\n\n## First Section\n\n## Second: Section!\n\n## First Section",
    check(html) {
      assert.match(html, /href="#first-section"/);
      assert.match(html, /href="#second-section"/);
      assert.match(html, /href="#first-section-1"/);
      assert.match(html, /<h2 id="first-section"/);
      assert.match(html, /<h2 id="second-section"/);
      assert.match(html, /<h2 id="first-section-1"/);
    },
  },
  {
    name: "sanitization removes scripts and handlers",
    markdown: "<script>alert(1)</script>\n\n<img src=\"https://example.com/x.png\" onerror=\"alert(2)\" alt=\"x\" />",
    check(html) {
      assert.doesNotMatch(html, /<script/i);
      assert.doesNotMatch(html, /onerror=/i);
      assert.match(html, /<img[^>]*src="https:\/\/example.com\/x.png"/);
    },
  },
];

let passed = 0;

for (const test of tests) {
  const html = render(test.markdown);
  test.check(html);
  passed += 1;
}

const checks = [
  "app/(site)/blog/[slug]/page.tsx",
  "app/(site)/studies/[category]/[slug]/page.tsx",
  "components/admin/RichEditor.tsx",
];

for (const relativePath of checks) {
  const absolutePath = resolve(process.cwd(), relativePath);
  const source = readFileSync(absolutePath, "utf8");
  assert.match(source, /MarkdownRenderer/);
}

console.log(`Markdown regression tests passed: ${passed}/${tests.length}`);
