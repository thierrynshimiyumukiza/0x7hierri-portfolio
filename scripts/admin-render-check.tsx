import "./react-dom-canary-stub";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BlogEditor from "../components/admin/blog/BlogEditor";
import BlogPostsManager, { type AdminBlogRow } from "../components/admin/blog/BlogPostsManager";

const noop = async () => {};

const editorHtml = renderToStaticMarkup(
  <BlogEditor
    mode="edit"
    action={noop}
    knownTags={["kernel", "windows", "re"]}
    siteUrl="https://example.com"
    initial={{
      id: "abc",
      title: "Sample post",
      slug: "sample-post",
      excerpt: "A short summary of the post that is long enough to pass the check.",
      content: "# Hello\n\nSome body text.\n\n```js\nconst a = 1;\n```",
      thumbnail_url: "https://example.com/thumb.png",
      cover_image_url: "",
      og_image_url: "",
      meta_title: "Sample post",
      meta_description: "A meta description that is long enough to satisfy the pre-publish check list.",
      tags: ["kernel"],
      status: "published",
      featured: true,
      published_at: "2026-01-01T10:00",
    }}
  />,
);

const rows: AdminBlogRow[] = [
  {
    id: "1", title: "First post", slug: "first-post", excerpt: "Summary",
    thumbnail_url: null, tags: ["kernel"], status: "published", featured: true,
    reading_time: 5, published_at: "2026-01-01T10:00:00Z", updated_at: "2026-01-02T10:00:00Z",
  },
  {
    id: "2", title: "Draft post", slug: "draft-post", excerpt: null,
    thumbnail_url: "https://example.com/a.png", tags: [], status: "draft", featured: false,
    reading_time: null, published_at: null, updated_at: "2026-01-03T10:00:00Z",
  },
];

const listHtml = renderToStaticMarkup(
  <BlogPostsManager
    posts={rows}
    siteUrl="https://example.com"
    onDelete={noop}
    onDuplicate={noop}
    onToggleStatus={noop}
    onToggleFeatured={noop}
  />,
);

const checks: [string, boolean][] = [
  ["editor renders the title field", editorHtml.includes('name="title"')],
  ["editor renders hidden content input", editorHtml.includes('name="content"')],
  ["editor renders the tag hidden input", editorHtml.includes('name="tags"')],
  ["editor renders the SERP preview", editorHtml.includes("serp-preview")],
  ["editor renders the checklist", editorHtml.includes("cms-checklist")],
  ["editor renders the markdown toolbar", editorHtml.includes("editor-toolbar")],
  ["editor renders the media picker", editorHtml.includes("media-field")],
  ["editor shows the permalink", editorHtml.includes("sample-post")],
  ["list renders both posts", listHtml.includes("First post") && listHtml.includes("Draft post")],
  ["list renders status pills", listHtml.includes("status-pill-published") && listHtml.includes("status-pill-draft")],
  ["list renders row actions", listHtml.includes("cms-row-actions")],
  ["list renders the thumbnail fallback monogram", listHtml.includes("thumb-fallback")],
];

let failed = 0;
for (const [name, ok] of checks) {
  if (!ok) {
    failed += 1;
    console.error("FAIL:", name);
  }
}

console.log(failed === 0 ? `Admin render checks passed: ${checks.length}/${checks.length}` : `${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);
