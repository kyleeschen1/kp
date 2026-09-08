import katex from "katex";
import { fromMarkdown } from "mdast-util-from-markdown";
import type {
  Blockquote,
  Code,
  Heading,
  Image,
  Link,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  RootContent
} from "mdast";

import type { KpArticleDocument } from "./kp-article-document.ts";
import {
  compileKpArticleStaticMarkdown,
  type KpArticleStaticAssetRequest
} from "./kp-article-static-markdown.ts";

export interface KpArticleStaticHtmlArtifact {
  readonly kind: "kp-article-static-html";
  readonly documentId: string;
  readonly articleHtml: string;
  readonly tocHtml: string;
  readonly assets: readonly KpArticleStaticAssetRequest[];
  readonly math: Readonly<{
    renderer: "katex-build-time";
    inlineCount: number;
    displayCount: number;
    clientRuntimeRequired: false;
  }>;
}

interface RenderContext {
  headingIdPrefix?: string;
  inlineMathCount: number;
  displayMathCount: number;
  readonly headingIds: Map<string, number>;
  readonly headings: Array<Readonly<{ depth: number; id: string; label: string }>>;
}

/**
 * This compiler is intentionally build-only. Interactive readers consume the
 * article IR; portable/searchable publication never needs a client KaTeX
 * runtime or a framework renderer.
 */
export function compileKpArticleStaticHtml(
  document: KpArticleDocument,
  options: { readonly headingIdPrefix?: string } = {}
): KpArticleStaticHtmlArtifact {
  if (options.headingIdPrefix !== undefined && !/^[A-Za-z][A-Za-z0-9._-]*$/.test(options.headingIdPrefix))
    throw new Error("Article heading namespace must be an explicit safe identity.");
  const staticMarkdown = compileKpArticleStaticMarkdown(document);
  const root = fromMarkdown(staticMarkdown.markdown);
  const context: RenderContext = {
    ...(options.headingIdPrefix === undefined ? {} : { headingIdPrefix: options.headingIdPrefix }),
    inlineMathCount: 0,
    displayMathCount: 0,
    headingIds: new Map(),
    headings: []
  };
  let content = renderRoot(root.children, context);
  if (options.headingIdPrefix !== undefined) {
    // Resolve links after all headings exist, including forward references.
    // Semantic anchors and other fragment namespaces are left untouched.
    for (const heading of context.headings) {
      const localId = heading.id.slice(options.headingIdPrefix.length + 1);
      content = content.replaceAll(`href="#${escapeAttribute(localId)}"`, `href="#${escapeAttribute(heading.id)}"`);
    }
  }
  const articleHtml = [
    `<article data-kp-article="${escapeAttribute(document.id)}">`,
    content,
    "</article>"
  ].join("\n");
  const tocHtml = renderToc(context.headings);
  return Object.freeze({
    kind: "kp-article-static-html" as const,
    documentId: document.id,
    articleHtml,
    tocHtml,
    assets: staticMarkdown.assets,
    math: Object.freeze({
      renderer: "katex-build-time" as const,
      inlineCount: context.inlineMathCount,
      displayCount: context.displayMathCount,
      clientRuntimeRequired: false as const
    })
  });
}

/**
 * Public projections sometimes interleave Article-owned prose with a native
 * interactive stage. Reuse the build-only Markdown boundary so those hosts do
 * not grow a second escaping or CommonMark implementation.
 */
export function compileKpArticleMarkdownFragmentHtml(markdown: string): string {
  const root = fromMarkdown(markdown);
  const context: RenderContext = {
    inlineMathCount: 0,
    displayMathCount: 0,
    headingIds: new Map(),
    headings: []
  };
  return renderRoot(root.children, context);
}

function renderRoot(nodes: readonly RootContent[], context: RenderContext): string {
  const output: string[] = [];
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]!;
    const next = nodes[index + 1];
    if (node.type === "paragraph" && isImageParagraph(node)) {
      const caption = next?.type === "paragraph" ? emphasizedCaption(next) : undefined;
      output.push(renderFigureParagraph(node, caption));
      if (caption !== undefined) index += 1;
      continue;
    }
    output.push(renderBlock(node, context));
  }
  return output.join("\n");
}

function renderBlock(node: RootContent, context: RenderContext): string {
  switch (node.type) {
    case "heading":
      return renderHeading(node, context);
    case "paragraph": {
      const displayMath = displayMathSource(node);
      if (displayMath !== undefined) {
        context.displayMathCount += 1;
        return `<div class="kp-article-math kp-article-math--display">${renderMath(displayMath, true)}</div>`;
      }
      return `<p>${renderPhrasing(node.children, context)}</p>`;
    }
    case "list":
      return renderList(node, context);
    case "blockquote":
      return renderBlockquote(node, context);
    case "code":
      return renderCode(node);
    case "thematicBreak":
      return "<hr>";
    case "html":
      return renderGeneratedAnchor(node.value);
    case "definition":
      return "";
    default:
      throw new Error(`Static HTML does not support Markdown node ${node.type}.`);
  }
}

function renderHeading(node: Heading, context: RenderContext): string {
  const label = phrasingText(node.children);
  // An embedded Article may share a host with another reading. Namespace
  // generated headings and their TOC together; standalone legacy IDs stay stable.
  const baseId = `${context.headingIdPrefix === undefined ? "" : `${context.headingIdPrefix}.`}${slug(label) || "section"}`;
  const occurrence = context.headingIds.get(baseId) ?? 0;
  context.headingIds.set(baseId, occurrence + 1);
  const id = occurrence === 0 ? baseId : `${baseId}-${occurrence + 1}`;
  context.headings.push(Object.freeze({ depth: node.depth, id, label }));
  return `<h${node.depth} id="${escapeAttribute(id)}">${renderPhrasing(node.children, context)}</h${node.depth}>`;
}

function renderList(node: List, context: RenderContext): string {
  const tag = node.ordered ? "ol" : "ul";
  const start = node.ordered && node.start !== null && node.start !== 1
    ? ` start="${node.start}"`
    : "";
  return `<${tag}${start}>${node.children.map((item) => renderListItem(item, context)).join("")}</${tag}>`;
}

function renderListItem(node: ListItem, context: RenderContext): string {
  return `<li>${node.children.map((child) => renderBlock(child, context)).join("\n")}</li>`;
}

function renderBlockquote(node: Blockquote, context: RenderContext): string {
  return `<blockquote>${node.children.map((child) => renderBlock(child, context)).join("\n")}</blockquote>`;
}

function renderCode(node: Code): string {
  const language = node.lang == null ? "" : ` class="language-${escapeAttribute(node.lang)}"`;
  return `<pre><code${language}>${escapeHtml(node.value)}</code></pre>`;
}

function renderPhrasing(nodes: readonly PhrasingContent[], context: RenderContext): string {
  return nodes.map((node) => {
    switch (node.type) {
      case "text":
        return renderInlineMath(node.value, context);
      case "emphasis":
        return `<em>${renderPhrasing(node.children, context)}</em>`;
      case "strong":
        return `<strong>${renderPhrasing(node.children, context)}</strong>`;
      case "inlineCode":
        return `<code>${escapeHtml(node.value)}</code>`;
      case "break":
        return "<br>\n";
      case "link":
        return renderLink(node, context);
      case "image":
        return renderImage(node);
      case "html":
        return renderGeneratedAnchor(node.value);
      default:
        throw new Error(`Static HTML does not support inline Markdown node ${node.type}.`);
    }
  }).join("");
}

function renderLink(node: Link, context: RenderContext): string {
  assertSafeUrl(node.url, "link");
  const title = node.title == null ? "" : ` title="${escapeAttribute(node.title)}"`;
  return `<a href="${escapeAttribute(node.url)}"${title}>${renderPhrasing(node.children, context)}</a>`;
}

function renderImage(node: Image): string {
  assertSafeUrl(node.url, "image");
  const title = node.title == null ? "" : ` title="${escapeAttribute(node.title)}"`;
  return `<img src="${escapeAttribute(node.url)}" alt="${escapeAttribute(node.alt ?? "")}"${title}>`;
}

function renderFigureParagraph(node: Paragraph, caption: string | undefined): string {
  const image = node.children.find((child): child is Image => child.type === "image")!;
  const anchors = node.children.flatMap((child) => (
    child.type === "html" ? [renderGeneratedAnchor(child.value)] : []
  ));
  return [
    ...anchors,
    "<figure>",
    renderImage(image),
    ...(caption === undefined ? [] : [`<figcaption>${escapeHtml(caption)}</figcaption>`]),
    "</figure>"
  ].join("\n");
}

function renderInlineMath(value: string, context: RenderContext): string {
  let output = "";
  let textStart = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== "$" || isEscaped(value, index) || value[index + 1] === "$") continue;
    const close = findClosingDollar(value, index + 1);
    if (close < 0) continue;
    const latex = value.slice(index + 1, close);
    if (latex.trim() === "" || latex.includes("\n")) continue;
    output += escapeHtml(value.slice(textStart, index));
    output += `<span class="kp-article-math kp-article-math--inline">${renderMath(latex, false)}</span>`;
    context.inlineMathCount += 1;
    index = close;
    textStart = close + 1;
  }
  return output + escapeHtml(value.slice(textStart));
}

function renderMath(latex: string, displayMode: boolean): string {
  return katex.renderToString(latex, {
    displayMode,
    output: "htmlAndMathml",
    throwOnError: true,
    strict: "error",
    trust: false
  });
}

function displayMathSource(node: Paragraph): string | undefined {
  if (node.children.length !== 1 || node.children[0]?.type !== "text") return undefined;
  const value = node.children[0].value.trim();
  if (!value.startsWith("$$") || !value.endsWith("$$") || value.length < 4) return undefined;
  return value.slice(2, -2).trim();
}

function isImageParagraph(node: Paragraph): boolean {
  return node.children.filter((child) => child.type === "image").length === 1 &&
    node.children.every((child) => (
      child.type === "image" ||
      (child.type === "text" && child.value.trim() === "") ||
      (child.type === "html" && isGeneratedAnchorFragment(child.value))
    ));
}

function emphasizedCaption(node: Paragraph): string | undefined {
  if (node.children.length !== 1 || node.children[0]?.type !== "emphasis") return undefined;
  return phrasingText(node.children[0].children);
}

function phrasingText(nodes: readonly PhrasingContent[]): string {
  return nodes.map((node) => {
    if (node.type === "text" || node.type === "inlineCode") return node.value;
    if (node.type === "image") return node.alt ?? "";
    if ("children" in node) return phrasingText(node.children as readonly PhrasingContent[]);
    return "";
  }).join("");
}

function renderGeneratedAnchor(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "</a>") return trimmed;
  const match = /^<a id="([A-Za-z0-9:./_-]+)">$/.exec(trimmed);
  if (match === null) throw new Error("Static HTML rejected non-generated raw HTML.");
  return `<a id="${escapeAttribute(match[1]!)}">`;
}

function isGeneratedAnchorFragment(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "</a>" || /^<a id="[A-Za-z0-9:./_-]+">$/.test(trimmed);
}

function renderToc(headings: readonly Readonly<{ depth: number; id: string; label: string }>[]): string {
  if (headings.length === 0) return "";
  return [
    '<nav aria-label="Table of contents" data-kp-article-toc>',
    "<ol>",
    ...headings.map(({ depth, id, label }) => (
      `<li data-kp-heading-depth="${depth}"><a href="#${escapeAttribute(id)}">${escapeHtml(label)}</a></li>`
    )),
    "</ol>",
    "</nav>"
  ].join("\n");
}

function findClosingDollar(value: string, start: number): number {
  for (let index = start; index < value.length; index += 1) {
    if (value[index] === "$" && value[index + 1] !== "$" && !isEscaped(value, index)) return index;
  }
  return -1;
}

function isEscaped(value: string, index: number): boolean {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1) slashCount += 1;
  return slashCount % 2 === 1;
}

function assertSafeUrl(value: string, kind: "image" | "link"): void {
  if (/^[\u0000-\u001f\u007f]/u.test(value) || /^(?:javascript|data|vbscript):/iu.test(value)) {
    throw new Error(`Static HTML rejected unsafe ${kind} URL.`);
  }
}

function slug(value: string): string {
  return value.toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
