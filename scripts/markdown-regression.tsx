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
      assert.match(html, /<h1[^>]*><a href="#heading-1"[^>]*>Heading 1<\/a><\/h1>/);
      assert.match(html, /<h2[^>]*><a href="#heading-2"[^>]*>Heading 2<\/a><\/h2>/);
      assert.match(html, /<h3[^>]*><a href="#heading-3"[^>]*>Heading 3<\/a><\/h3>/);
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
      assert.match(html, /Inline <code class="rounded [^"]*">code<\/code> sample\./);
      assert.equal(countMatches(html, /<pre\b/g), 1);
      assert.match(html, /language-ts/);
      assert.doesNotMatch(html, /```/);
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
      assert.match(html, /<details><summary>Show more<\/summary>Hidden content<\/details>/);
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
      assert.match(html, /<span class="mt-2 block text-sm text-\[--text-dim\]">Caption<\/span>/);
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
      assert.match(html, /<h1[^>]*><a href="#intro"[^>]*>Intro<\/a><\/h1>/);
      assert.match(html, /<code class="rounded [^"]*">inline<\/code>/);
      assert.match(html, /language-python/);
      assert.match(html, /<blockquote\b/);
      assert.match(html, /<table\b/);
      assert.match(html, /<img[^>]*src="https:\/\/example\.com\/diagram\.png"/);
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
