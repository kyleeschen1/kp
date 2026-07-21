import type { Code, Heading, Link, Paragraph, PhrasingContent, RootContent } from "mdast";

import {
  defineKpLessonDocument,
  kpLesson,
  type KpLessonAttentionPlan,
  type KpLessonBlock,
  type KpLessonInline,
  type KpReaderSourceLocation
} from "../document/public-api.ts";
import { parseKpMarkdownAst } from "./markdown-ast-parser.ts";

export interface KpLessonMarkdownInput {
  readonly sourceId: string;
  readonly id: string;
  readonly version: string;
  readonly title: string;
  readonly language?: string | undefined;
  readonly markdown: string;
}

export class KpLessonMarkdownError extends Error {
  readonly sourceId: string;
  readonly line: number;
  readonly column: number;

  constructor(sourceId: string, line: number, column: number, message: string) {
    super(`${sourceId}:${line}:${column}: ${message}`);
    this.name = "KpLessonMarkdownError";
    this.sourceId = sourceId;
    this.line = line;
    this.column = column;
  }
}

interface KpStorySource {
  readonly id: string;
  readonly asset: { readonly id: string; readonly version: string };
  readonly presentation?: "scroll-scrub" | "step" | undefined;
  readonly attention?: KpLessonAttentionPlan | undefined;
  readonly beats: readonly {
    readonly id: string;
    readonly title: string;
    readonly content: string;
    readonly progressPermille: number;
    readonly checkpointId?: string | undefined;
    readonly focusRefs?: readonly string[] | undefined;
  }[];
}

export function parseKpLessonMarkdown(input: KpLessonMarkdownInput) {
  const { root } = parseKpMarkdownAst(input);
  let paragraphIndex = 0;
  const usedHeadingIds = new Map<string, number>();
  const blocks = root.children.map((node): KpLessonBlock => {
    if (node.type === "heading") {
      return parseHeading(node, input.sourceId, usedHeadingIds);
    }
    if (node.type === "paragraph") {
      paragraphIndex += 1;
      return parseParagraph(node, input.sourceId, paragraphIndex);
    }
    if (node.type === "code" && node.lang === "kp-animation-story") {
      return parseAnimationStory(node, input.sourceId);
    }
    throw markdownError(
      input.sourceId,
      node,
      node.type === "html"
        ? "raw HTML is not accepted; use the explicit KP lesson vocabulary"
        : `unsupported top-level Markdown node ${node.type}`
    );
  });

  return defineKpLessonDocument({
    id: input.id,
    version: input.version,
    title: input.title,
    ...(input.language === undefined ? {} : { language: input.language }),
    blocks,
    source: { id: input.sourceId, version: input.version }
  });
}

function parseHeading(
  node: Heading,
  sourceId: string,
  usedIds: Map<string, number>
) {
  const content = parseInlineContent(node.children, sourceId);
  const baseId = `heading.${slug(inlineText(content))}`;
  const occurrence = (usedIds.get(baseId) ?? 0) + 1;
  usedIds.set(baseId, occurrence);
  return kpLesson.heading({
    id: occurrence === 1 ? baseId : `${baseId}.${occurrence}`,
    level: node.depth,
    content,
    source: sourceLocation(sourceId, node)
  });
}

function parseParagraph(node: Paragraph, sourceId: string, index: number) {
  return kpLesson.paragraph({
    id: `paragraph.${index}`,
    content: parseInlineContent(node.children, sourceId),
    source: sourceLocation(sourceId, node)
  });
}

function parseInlineContent(
  nodes: readonly PhrasingContent[],
  sourceId: string
): readonly KpLessonInline[] {
  return nodes.map((node): KpLessonInline => {
    if (node.type === "text") {
      return kpLesson.text(node.value, sourceLocation(sourceId, node));
    }
    if (node.type === "link") return parseSemanticLink(node, sourceId);
    throw markdownError(
      sourceId,
      node,
      `unsupported inline Markdown node ${node.type}; use plain text or a kp:focus link`
    );
  });
}

function parseSemanticLink(node: Link, sourceId: string) {
  const prefix = "kp:focus/";
  if (!node.url.startsWith(prefix)) {
    throw markdownError(sourceId, node, "only kp:focus semantic links are supported here");
  }
  const refs = node.url.slice(prefix.length).split(",").map((value) =>
    decodeURIComponent(value).trim()
  );
  const text = node.children.map((child) => {
    if (child.type !== "text") {
      throw markdownError(sourceId, child, "semantic link labels must be plain text");
    }
    return child.value;
  }).join("");
  return kpLesson.link({
    text,
    objectRefs: refs,
    ...(node.title === null ? {} : { tooltip: node.title }),
    source: sourceLocation(sourceId, node)
  });
}

function parseAnimationStory(node: Code, sourceId: string) {
  let story: KpStorySource;
  try {
    story = JSON.parse(node.value) as KpStorySource;
  } catch (error) {
    throw markdownError(
      sourceId,
      node,
      `kp-animation-story must contain valid JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  if (!isStorySource(story)) {
    throw markdownError(sourceId, node, "kp-animation-story does not match the exemplar schema");
  }
  const source = sourceLocation(sourceId, node);
  return kpLesson.animationStory({
    id: story.id,
    asset: story.asset,
    presentation: story.presentation ?? "scroll-scrub",
    ...(story.attention === undefined ? {} : { attention: story.attention }),
    beats: story.beats.map((beat) => kpLesson.beat({
      id: beat.id,
      title: beat.title,
      content: [beat.content],
      checkpoint: {
        id: beat.checkpointId ?? `checkpoint.${beat.id}`,
        progressPermille: beat.progressPermille
      },
      focusRefs: beat.focusRefs ?? [],
      source
    })),
    source
  });
}

function isStorySource(value: unknown): value is KpStorySource {
  if (!isRecord(value) || typeof value["id"] !== "string" || !isRecord(value["asset"])) {
    return false;
  }
  if (typeof value["asset"]["id"] !== "string"
    || typeof value["asset"]["version"] !== "string") return false;
  if (value["presentation"] !== undefined
    && value["presentation"] !== "scroll-scrub"
    && value["presentation"] !== "step") return false;
  if (value["attention"] !== undefined && !isAttentionPlan(value["attention"])) return false;
  if (!Array.isArray(value["beats"]) || value["beats"].length === 0) return false;
  return value["beats"].every((beat) => isRecord(beat)
    && typeof beat["id"] === "string"
    && typeof beat["title"] === "string"
    && typeof beat["content"] === "string"
    && typeof beat["progressPermille"] === "number"
    && (beat["checkpointId"] === undefined || typeof beat["checkpointId"] === "string")
    && (beat["focusRefs"] === undefined
      || (Array.isArray(beat["focusRefs"])
        && beat["focusRefs"].every((ref) => typeof ref === "string"))));
}

function isAttentionPlan(value: unknown): value is KpLessonAttentionPlan {
  if (!isRecord(value) || value["kind"] !== "phased-attention-v1"
    || !Array.isArray(value["phases"])) return false;
  return value["phases"].every((phase) => isRecord(phase)
    && typeof phase["id"] === "string"
    && ["orient", "act", "settle", "inspect"].includes(String(phase["kind"]))
    && typeof phase["beatId"] === "string"
    && typeof phase["checkpointId"] === "string"
    && typeof phase["startProgressPermille"] === "number"
    && typeof phase["endProgressPermille"] === "number"
    && typeof phase["cue"] === "string"
    && Array.isArray(phase["focusRefs"])
    && phase["focusRefs"].every((ref) => typeof ref === "string"));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sourceLocation(
  sourceId: string,
  node: Pick<RootContent | PhrasingContent, "position">
): KpReaderSourceLocation {
  const position = node.position;
  if (position === undefined) {
    throw new KpLessonMarkdownError(sourceId, 1, 1, "parser omitted a required source position");
  }
  if (position.start.offset === undefined || position.end.offset === undefined) {
    throw new KpLessonMarkdownError(
      sourceId,
      position.start.line,
      position.start.column,
      "parser omitted a required source offset"
    );
  }
  return {
    sourceId,
    start: {
      line: position.start.line,
      column: position.start.column,
      offset: position.start.offset
    },
    end: {
      line: position.end.line,
      column: position.end.column,
      offset: position.end.offset
    }
  };
}

function markdownError(
  sourceId: string,
  node: Pick<RootContent | PhrasingContent, "position">,
  message: string
): KpLessonMarkdownError {
  return new KpLessonMarkdownError(
    sourceId,
    node.position?.start.line ?? 1,
    node.position?.start.column ?? 1,
    message
  );
}

function inlineText(content: readonly KpLessonInline[]): string {
  return content.map((inline) => inline.kind === "text" ? inline.value : inline.text).join("");
}

function slug(value: string): string {
  const result = value.toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return result === "" ? "section" : result;
}
