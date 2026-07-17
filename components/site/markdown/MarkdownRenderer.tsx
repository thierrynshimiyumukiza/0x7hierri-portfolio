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
import type { Components } from "react-markdown";
import type { Schema } from "hast-util-sanitize";
import ImageZoom from "@/components/site/markdown/ImageZoom";
import TableWrapper from "@/components/site/markdown/TableWrapper";
import CodeBlock from "@/components/site/markdown/CodeBlock";
import Mermaid from "@/components/site/markdown/Mermaid";
import Callout from "@/components/site/markdown/Callout";

type MarkdownRendererProps = {
  content: string;
};

function createHeadingSlug(value: string): string {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function prepareMarkdown(content: string): string {
  const headings = Array.from(content.matchAll(/^(#{1,6})\s+(.+?)\s*#*\s*$/gm));
  const tableOfContents = headings
    .map(([, hashes, heading]) => `${"  ".repeat(hashes.length - 1)}- [${heading}](#${createHeadingSlug(heading)})`)
    .join("\n");
  const withTableOfContents = content.replace(/^[ \t]*(?:\[TOC\]|\[\[toc\]\])[ \t]*$/gim, tableOfContents);

  return withTableOfContents
    .split(/(```[\s\S]*?```|\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g)
    .map((segment, index) => {
      if (index % 2 === 1) return segment;

      return segment
        .replace(/==([^=\n]+)==/g, "<mark>$1</mark>")
        .replace(/([\w)])\^([^\^\n]+)\^/g, "$1<sup>$2</sup>")
        .replace(/([\w)])~([^~\n]+)~(?!~)/g, "$1<sub>$2</sub>");
    })
    .join("");
}

const sanitizeSchema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-[A-Za-z0-9_+.-]+$/]],
    pre: [...(defaultSchema.attributes?.pre ?? []), ["className", /^hljs$/]],
    span: [...(defaultSchema.attributes?.span ?? []), ["className", /^(hljs(-[a-z0-9_-]+)?|katex(-[a-z0-9_-]+)?|math( inline)?)$/i], "style", "aria-hidden"],
    div: [...(defaultSchema.attributes?.div ?? []), ["className", /^(math( display)?|markdown-alert(-(?:note|tip|important|warning|caution))?)$/], "math", "dir"],
    math: ["xmlns", "display"],
    mi: ["mathvariant"],
    mo: ["stretchy"],
    details: ["open"],
    summary: [],
    mark: [],
    sup: [],
    sub: [],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), "math", "mi", "mo", "details", "summary", "mark", "sup", "sub"],
};

const components: Components = {
  pre(props) {
    return <>{props.children}</>;
  },
  code(props) {
    const className = props.className ?? "";
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";
    const rawText = String(props.children ?? "").replace(/\n$/, "");
    
    if (language === "mermaid") {
      return <Mermaid chart={rawText} />;
    }

    if (language) {
      return <CodeBlock language={language} value={rawText} />;
    }

    const isBlockCode = rawText.includes("\n");

    if (isBlockCode) {
      return <code className={className || undefined}>{props.children}</code>;
    }

    return <code className="rounded bg-[--bg-elevated] px-1.5 py-0.5 font-mono text-xs text-[--text-primary] dark:bg-gray-800 dark:text-gray-200">{props.children}</code>;
  },
  h1(props) {
    return <h1 className="mb-4 mt-8 text-3xl font-medium tracking-[-0.5px] text-[--text-primary]">{props.children}</h1>;
  },
  h2(props) {
    return <h2 className="mb-3 mt-7 text-2xl font-medium text-[--text-primary]">{props.children}</h2>;
  },
  h3(props) {
    return <h3 className="mb-2 mt-6 text-xl font-medium text-[--text-primary]">{props.children}</h3>;
  },
  p(props) {
    return <p className="my-4 leading-7 text-[--text-body]">{props.children}</p>;
  },
  ul(props) {
    return <ul className="my-4 list-disc space-y-2 pl-6 text-[--text-body] marker:text-[--text-dim]">{props.children}</ul>;
  },
  ol(props) {
    return <ol className="my-4 list-decimal space-y-2 pl-6 text-[--text-body] marker:text-[--text-dim]">{props.children}</ol>;
  },
  li(props) {
    return <li className="leading-7 [&>input]:mr-2 [&>input]:translate-y-[1px]">{props.children}</li>;
  },
  hr() {
    return <hr className="my-8 border-[--border]" />;
  },
  blockquote(props) {
    return <blockquote className="my-6 border-l-2 border-[--border] pl-4 text-[--text-body]">{props.children}</blockquote>;
  },
  div(props) {
    const className = typeof props.className === "string" ? props.className : "";
    const match = /markdown-alert-(note|tip|important|warning|caution)/.exec(className);

    if (!match) {
      return <div {...props} />;
    }

    return <Callout variant={match[1] as "note" | "tip" | "important" | "warning" | "caution"}>{props.children}</Callout>;
  },
  img(props) {
    return <ImageZoom src={props.src ?? ""} alt={props.alt ?? ""} title={props.title} />;
  },
  table(props) {
    return <TableWrapper>{props.children}</TableWrapper>;
  },
  th(props) {
    return <th className="border-b border-[--border] px-3 py-2 text-left text-[--text-primary]">{props.children}</th>;
  },
  td(props) {
    return <td className="border-b border-[--border] px-3 py-2 text-[--text-muted]">{props.children}</td>;
  },
  a(props) {
    const href = props.href ?? "";
    const isExternal = /^https?:\/\//i.test(href);

    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer noopener" : undefined}
        className="text-[--accent-blue] underline-offset-4 hover:underline"
      >
        {props.children}
      </a>
    );
  },
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const normalizedContent = prepareMarkdown(content.replace(/\r\n/g, "\n"));

  return (
    <article className="max-w-none">
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          remarkAlert,
          remarkMath,
          remarkDirective,
          remarkFrontmatter,
          remarkUnwrapImages,
        ]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, sanitizeSchema],
          rehypeKatex,
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ]}
        components={components}
      >
        {normalizedContent}
      </ReactMarkdown>
    </article>
  );
}
