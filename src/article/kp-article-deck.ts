import { fromMarkdown } from "mdast-util-from-markdown";
import type { Heading, RootContent } from "mdast";

import type {
  KpArticleBlock,
  KpArticleDocument,
  KpArticleFocusBlock,
  KpArticleMotionBlock
} from "./kp-article-document.ts";

export const kpArticleDeckSchema = "kp.article-deck.v1-rc1" as const;

export type KpArticleDeckScene = KpArticleDeckReadingScene | KpArticleDeckMotionScene;

export interface KpArticleDeckReadingScene {
  readonly kind: "reading";
  readonly id: string;
  readonly sectionLabel?: string;
  readonly markdown: string;
  readonly sourceBlockKeys: readonly string[];
  readonly stageIds: readonly string[];
  readonly focusCues: readonly Readonly<{
    blockId: string;
    stageId: string;
    targets: readonly string[];
    context: readonly string[];
  }>[];
}

export interface KpArticleDeckMotionScene {
  readonly kind: "motion";
  readonly id: string;
  readonly stageId: string;
  readonly transition: KpArticleMotionBlock["transition"];
  readonly beforeMarkdown: string;
  readonly afterMarkdown?: string;
  readonly sourceBlockKeys: readonly [string];
}

export interface KpArticleDeck {
  readonly kind: "kp-article-deck";
  readonly schemaVersion: typeof kpArticleDeckSchema;
  readonly documentId: string;
  readonly scenes: readonly KpArticleDeckScene[];
}

interface ReadingAccumulator {
  id?: string;
  sectionLabel?: string;
  readonly markdown: string[];
  readonly sourceBlockKeys: string[];
  readonly stageIds: Set<string>;
  readonly focusCues: KpArticleDeckReadingScene["focusCues"][number][];
}

export function deriveKpArticleDeck(document: KpArticleDocument): KpArticleDeck {
  const scenes: KpArticleDeckScene[] = [];
  let activeStageId: string | undefined;
  let previousMotionId: string | undefined;
  let reading = createReading();
  let readingOrdinal = 0;

  const flushReading = (): void => {
    if (reading.markdown.every((value) => value.trim() === "")) {
      reading = createReading();
      return;
    }
    readingOrdinal += 1;
    const id = reading.id ?? (
      previousMotionId === undefined ? `reading-${readingOrdinal}` : `after-${previousMotionId}`
    );
    scenes.push(Object.freeze({
      kind: "reading" as const,
      id,
      ...(reading.sectionLabel === undefined ? {} : { sectionLabel: reading.sectionLabel }),
      markdown: `${reading.markdown.join("\n\n").trim()}\n`,
      sourceBlockKeys: Object.freeze([...reading.sourceBlockKeys]),
      stageIds: Object.freeze([...reading.stageIds]),
      focusCues: Object.freeze([...reading.focusCues])
    }));
    reading = createReading();
  };

  for (const block of document.blocks) {
    if (block.kind === "stage") {
      activeStageId = block.id;
      reading.stageIds.add(block.id);
      continue;
    }
    if (block.kind === "motion") {
      flushReading();
      scenes.push(compileMotionScene(block));
      previousMotionId = block.id;
      activeStageId = block.stageId;
      continue;
    }
    if (block.kind === "markdown") {
      const fragments = splitAtHeadings(block.markdown);
      for (const fragment of fragments) {
        if (fragment.heading !== undefined && reading.markdown.some((value) => value.trim() !== "")) {
          flushReading();
        }
        if (fragment.heading !== undefined) {
          reading.sectionLabel = fragment.heading;
          reading.id = uniqueSceneId(`section-${slug(fragment.heading)}`, scenes);
        }
        reading.markdown.push(fragment.markdown);
        reading.sourceBlockKeys.push(block.key);
        if (activeStageId !== undefined) reading.stageIds.add(activeStageId);
      }
      continue;
    }
    addSemanticReadingBlock(block, reading);
    if (activeStageId !== undefined) reading.stageIds.add(activeStageId);
  }
  flushReading();

  return Object.freeze({
    kind: "kp-article-deck" as const,
    schemaVersion: kpArticleDeckSchema,
    documentId: document.id,
    scenes: Object.freeze(scenes)
  });
}

function createReading(): ReadingAccumulator {
  return { markdown: [], sourceBlockKeys: [], stageIds: new Set(), focusCues: [] };
}

function addSemanticReadingBlock(
  block: Exclude<KpArticleBlock, { kind: "markdown" | "stage" | "motion" }>,
  reading: ReadingAccumulator
): void {
  reading.markdown.push(block.markdown);
  reading.sourceBlockKeys.push(block.id);
  if (block.kind === "focus") {
    reading.stageIds.add(block.stageId);
    reading.focusCues.push(freezeFocusCue(block));
  }
}

function freezeFocusCue(block: KpArticleFocusBlock): KpArticleDeckReadingScene["focusCues"][number] {
  return Object.freeze({
    blockId: block.id,
    stageId: block.stageId,
    targets: block.targets,
    context: block.context
  });
}

function compileMotionScene(block: KpArticleMotionBlock): KpArticleDeckMotionScene {
  return Object.freeze({
    kind: "motion" as const,
    id: block.id,
    stageId: block.stageId,
    transition: block.transition,
    beforeMarkdown: block.beforeMarkdown,
    ...(block.afterMarkdown === undefined ? {} : { afterMarkdown: block.afterMarkdown }),
    sourceBlockKeys: Object.freeze([block.id] as const)
  });
}

function splitAtHeadings(markdown: string): readonly Readonly<{
  markdown: string;
  heading?: string;
}>[] {
  const root = fromMarkdown(markdown);
  const headings = root.children.filter((node): node is Heading => node.type === "heading");
  if (headings.length === 0) return [Object.freeze({ markdown })];
  const starts = headings.map((heading) => heading.position!.start.offset!);
  const fragments: Array<Readonly<{ markdown: string; heading?: string }>> = [];
  if (starts[0]! > 0 && markdown.slice(0, starts[0]).trim() !== "") {
    fragments.push(Object.freeze({ markdown: markdown.slice(0, starts[0]) }));
  }
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index]!;
    const start = starts[index]!;
    const end = starts[index + 1] ?? markdown.length;
    fragments.push(Object.freeze({
      markdown: markdown.slice(start, end),
      heading: headingText(heading.children)
    }));
  }
  return Object.freeze(fragments);
}

function headingText(nodes: readonly RootContent[]): string {
  return nodes.map((node) => {
    if (node.type === "text" || node.type === "inlineCode") return node.value;
    if ("children" in node) return headingText(node.children as readonly RootContent[]);
    return "";
  }).join("");
}

function uniqueSceneId(base: string, scenes: readonly KpArticleDeckScene[]): string {
  const existing = new Set(scenes.map(({ id }) => id));
  if (!existing.has(base)) return base;
  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-+|-+$/gu, "") || "section";
}
