import { fromMarkdown } from "mdast-util-from-markdown";
import type { Link, RootContent } from "mdast";

import {
  createKpArticleSourceSpan,
  type KpArticleSource,
  type KpArticleSourceSpan
} from "./kp-article-source.ts";

export interface KpArticleMarkdownLink {
  readonly label: string;
  readonly url: string;
  readonly span: KpArticleSourceSpan;
  readonly destinationSpan: KpArticleSourceSpan;
}

export function scanKpArticleMarkdownLinks(
  source: KpArticleSource
): readonly KpArticleMarkdownLink[] {
  const root = fromMarkdown(source.text);
  const links: KpArticleMarkdownLink[] = [];
  visit(root.children, (node) => {
    if (node.type !== "link") return;
    const position = node.position;
    if (position?.start.offset === undefined || position.end.offset === undefined) return;
    const raw = source.text.slice(position.start.offset, position.end.offset);
    const relativeDestination = raw.lastIndexOf(node.url);
    if (relativeDestination < 0) return;
    const destinationStart = position.start.offset + relativeDestination;
    links.push(Object.freeze({
      label: linkText(node),
      url: node.url,
      span: createKpArticleSourceSpan(source, position.start.offset, position.end.offset),
      destinationSpan: createKpArticleSourceSpan(
        source,
        destinationStart,
        destinationStart + node.url.length
      )
    }));
  });
  return Object.freeze(links);
}

function visit(nodes: readonly RootContent[], callback: (node: RootContent) => void): void {
  for (const node of nodes) {
    callback(node);
    if ("children" in node) visit(node.children as readonly RootContent[], callback);
  }
}

function linkText(link: Link): string {
  const text: string[] = [];
  const collect = (nodes: Readonly<Link["children"]>): void => {
    for (const node of nodes) {
      if (node.type === "text" || node.type === "inlineCode") text.push(node.value);
      else if (node.type === "image") text.push(node.alt ?? "");
      else if ("children" in node) collect(node.children as Link["children"]);
    }
  };
  collect(link.children);
  return text.join("");
}
