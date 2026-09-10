/* eslint-disable @next/next/no-img-element */
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkAlert from "remark-github-blockquote-alert";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkDirective from "remark-directive";
import remarkFrontmatter from "remark-frontmatter";
import remarkUnwrapImages from "remark-unwrap-images";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { visit } from "unist-util-visit";
import type { Root as MdastRoot } from "mdast";
import type { Components } from "react-markdown";
import type { Schema } from "hast-util-sanitize";
import ImageZoom from "@/components/site/markdown/ImageZoom";
import TableWrapper from "@/components/site/markdown/TableWrapper";
import CodeBlock from "@/components/site/markdown/CodeBlock";
import Mermaid from "@/components/site/markdown/Mermaid";
import Callout from "@/components/site/markdown/Callout";
import { isMermaidLanguage } from "@/lib/code-languages";
import { headingSlug } from "@/lib/markdown-outline";

type MarkdownRendererProps = {
  content: string;
  /** Narrower measure and no heading anchors, for previews and cards. */
  compact?: boolean;
};

/**
 * rehype-raw re-parses the tree from serialised HTML, which throws away the
 * mdast `meta` that carries a fence's title and highlighted-line ranges. Copying
 * it into a real attribute first is the only way it survives to the renderer.
 *
 * The same pass flags every block fence. Only mdast can tell a fence apart from
 * inline code, and without the flag a one-line fence carrying no language was
 * indistinguishable from backticked text and rendered inline.
 */
function remarkCodeMeta() {
  return (tree: MdastRoot) => {
    visit(tree, "code", (node) => {
      node.data = {
        ...node.data,
        hProperties: {
          ...(node.data?.hProperties ?? {}),
          "data-code-block": "true",
          ...(node.meta ? { "data-meta": node.meta } : {}),
        },
      };
    });
  };
}

function prepareMarkdown(content: string): string {
  const seen = new Map<string, number>();
  const headings = Array.from(content.matchAll(/^(#{1,6})\s+(.+?)\s*#*\s*$/gm));
  const tableOfContents = headings
    .map(([, hashes, heading]) => {
      const slug = headingSlug(heading, seen);
      return `${"  ".repeat(hashes.length - 1)}- [${heading}](#${slug})`;
    })
    .join("\n");

  const withTableOfContents = content.replace(
    /^[ \t]*(?:\[TOC\]|\[\[toc\]\])[ \t]*$/gim,
    tableOfContents || "_No headings yet._",
  );

  // Split on fenced code and math so the inline shorthands below never rewrite source.
  return withTableOfContents
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~|\$\$[\s\S]*?\$\$|\$[^$\n]+\$|`[^`\n]+`)/g)
    .map((segment, index) => {
      if (index % 2 === 1) return segment;

      return segment
        .replace(/==([^=\n]+)==/g, "<mark>$1</mark>")
        .replace(/([\w)])\^([^\^\n]+)\^/g, "$1<sup>$2</sup>")
        .replace(/([\w)])~([^~\n]+)~(?!~)/g, "$1<sub>$2</sub>")
        .replace(/\[\[kbd:([^\]]+)\]\]/g, "<kbd>$1</kbd>");
    })
    .join("");
}

const sanitizeSchema: Schema = {
  ...defaultSchema,
  // Heading and footnote anchors must keep the ids the links point at.
  clobberPrefix: "",
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "id"],
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel", "data*"],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      "data*",
      ["className", /^language-[A-Za-z0-9_+#.-]+$/],
    ],
    pre: [...(defaultSchema.attributes?.pre ?? []), ["className", /^hljs$/]],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ["className", /^(hljs(-[a-z0-9_-]+)?|katex(-[a-z0-9_-]+)?|math( inline)?)$/i],
      "style",
      "aria-hidden",
    ],
    div: [
      ...(defaultSchema.attributes?.div ?? []),
      ["className", /^(math( display)?|markdown-alert(-(?:note|tip|important|warning|caution))?)$/],
      "math",
      "dir",
    ],
    section: ["data*", ["className", /^footnotes$/]],
    li: [...(defaultSchema.attributes?.li ?? []), "data*"],
    math: ["xmlns", "display"],
    mi: ["mathvariant"],
    mo: ["stretchy"],
    details: ["open"],
    summary: [],
    mark: [],
    sup: ["data*"],
    sub: [],
    kbd: [],
    abbr: ["title"],
    dl: [],
    dt: [],
    dd: [],
  },
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "math",
    "mi",
    "mo",
    "details",
    "summary",
    "mark",
    "sup",
    "sub",
    "kbd",
    "abbr",
    "section",
    "dl",
    "dt",
    "dd",
    "figure",
    "figcaption",
  ],
};

type HastNode = {
  type?: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

/** Reads a code fence's literal text from the hast node so entities stay intact. */
function nodeToText(node?: HastNode): string {
  if (!node) return "";
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(nodeToText).join("");
}

function reactChildrenToText(children: React.ReactNode): string {
  if (children === null || children === undefined || typeof children === "boolean") return "";
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(reactChildrenToText).join("");
  if (React.isValidElement(children)) {
    return reactChildrenToText((children.props as { children?: React.ReactNode }).children);
  }
  return "";
}

const components: Components = {
  // Fenced code is rendered by CodeBlock, which brings its own <pre>.
  pre(props) {
    return <>{props.children}</>;
  },
  code(props) {
    const node = props.node as HastNode | undefined;
    const className = props.className ?? "";
    const match = /language-([A-Za-z0-9_+#.-]+)/.exec(className);
    const rawLanguage = match ? match[1] : "";
    const meta = typeof node?.properties?.dataMeta === "string" ? (node.properties.dataMeta as string) : "";

    const fromNode = nodeToText(node);
    const rawText = (fromNode || reactChildrenToText(props.children)).replace(/\n$/, "");

    if (isMermaidLanguage(rawLanguage)) {
      return <Mermaid chart={rawText} />;
    }

    // A fence without a language still deserves the code-block chrome. The flag
    // set upstream is authoritative; the rest only catches raw HTML <pre> blocks
    // that never passed through mdast.
    const isBlockCode =
      node?.properties?.dataCodeBlock !== undefined || Boolean(rawLanguage) || rawText.includes("\n");

    if (isBlockCode) {
      return <CodeBlock language={rawLanguage} value={rawText} meta={meta} />;
    }

    return <code className="md-inline-code">{props.children}</code>;
  },
  // rehype-slug puts the anchor id on the heading, so it has to be forwarded or
  // every table-of-contents link and "#" anchor lands nowhere.
  h1: (props) => <h1 id={props.id} className="md-h1">{props.children}</h1>,
  h2: (props) => <h2 id={props.id} className="md-h2">{props.children}</h2>,
  h3: (props) => <h3 id={props.id} className="md-h3">{props.children}</h3>,
  h4: (props) => <h4 id={props.id} className="md-h4">{props.children}</h4>,
  h5: (props) => <h5 id={props.id} className="md-h5">{props.children}</h5>,
  h6: (props) => <h6 id={props.id} className="md-h6">{props.children}</h6>,
  p: (props) => <p className="md-p">{props.children}</p>,
  ul: (props) => <ul className="md-ul">{props.children}</ul>,
  ol: (props) => <ol className="md-ol">{props.children}</ol>,
  li: (props) => (
    <li id={props.id} className="md-li">
      {props.children}
    </li>
  ),
  hr: () => <hr className="md-hr" />,
  blockquote: (props) => <blockquote className="md-quote">{props.children}</blockquote>,
  details: (props) => <details className="md-details">{props.children}</details>,
  summary: (props) => <summary className="md-summary">{props.children}</summary>,
  kbd: (props) => <kbd className="md-kbd">{props.children}</kbd>,
  section(props) {
    const isFootnotes = (props.node as HastNode | undefined)?.properties?.dataFootnotes !== undefined;
    return (
      <section id={props.id} className={isFootnotes ? "md-footnotes" : undefined}>
        {props.children}
      </section>
    );
  },
  div(props) {
    const className = typeof props.className === "string" ? props.className : "";
    const match = /markdown-alert-(note|tip|important|warning|caution)/.exec(className);

    if (!match) {
      return <div className={className || undefined}>{props.children}</div>;
    }

    return (
      <Callout variant={match[1] as "note" | "tip" | "important" | "warning" | "caution"}>
        {props.children}
      </Callout>
    );
  },
  img: (props) => <ImageZoom src={props.src ?? ""} alt={props.alt ?? ""} title={props.title} />,
  table: (props) => <TableWrapper>{props.children}</TableWrapper>,
  th: (props) => <th className="md-th">{props.children}</th>,
  td: (props) => <td className="md-td">{props.children}</td>,
  a(props) {
    const href = props.href ?? "";
    const isExternal = /^https?:\/\//i.test(href);
    const isAnchorIcon = typeof props.className === "string" && props.className.includes("md-anchor");

    return (
      <a
        id={props.id}
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer noopener" : undefined}
        className={isAnchorIcon ? "md-anchor" : "md-link"}
        aria-label={isAnchorIcon ? "Link to this section" : undefined}
      >
        {props.children}
      </a>
    );
  },
};

export default function MarkdownRenderer({ content, compact = false }: MarkdownRendererProps) {
  const normalizedContent = prepareMarkdown(content.replace(/\r\n/g, "\n"));

  const rehypePlugins = [
    rehypeRaw,
    [rehypeSanitize, sanitizeSchema],
    rehypeKatex,
    rehypeSlug,
    ...(compact
      ? []
      : [
          [
            rehypeAutolinkHeadings,
            {
              behavior: "append",
              properties: { className: ["md-anchor"], tabIndex: -1 },
              content: { type: "text", value: "#" },
            },
          ],
        ]),
  ];

  return (
    <div className={`markdown-body${compact ? " markdown-body-compact" : ""}`}>
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          remarkAlert,
          remarkMath,
          remarkDirective,
          remarkFrontmatter,
          remarkUnwrapImages,
          remarkCodeMeta,
        ]}
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        rehypePlugins={rehypePlugins as any}
        components={components}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
