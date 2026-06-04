/* eslint-disable @next/next/no-img-element */
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { Schema } from "hast-util-sanitize";
import ImageZoom from "@/components/site/markdown/ImageZoom";
import TableWrapper from "@/components/site/markdown/TableWrapper";

type MarkdownRendererProps = {
  content: string;
};

const sanitizeSchema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-[A-Za-z0-9_+.-]+$/]],
    pre: [...(defaultSchema.attributes?.pre ?? []), ["className", /^hljs$/]],
    span: [...(defaultSchema.attributes?.span ?? []), ["className", /^hljs(-[a-z0-9_-]+)?$/i]],
  },
};

const components: Components = {
  pre(props) {
    return <pre className="my-6 overflow-x-auto rounded-lg border border-[--border] bg-[--bg-surface] p-4 text-sm">{props.children}</pre>;
  },
  code(props) {
    const className = props.className ?? "";
    const rawText = String(props.children ?? "");
    const isBlockCode = className.includes("language-") || rawText.includes("\n");

    if (isBlockCode) {
      return <code className={className || undefined}>{props.children}</code>;
    }

    return <code className="rounded bg-[--bg-elevated] px-1.5 py-0.5 font-mono text-xs text-[--text-primary]">{props.children}</code>;
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
  const normalizedContent = content.replace(/\r\n/g, "\n");

  return (
    <article className="max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeHighlight]}
        components={components}
      >
        {normalizedContent}
      </ReactMarkdown>
    </article>
  );
}
