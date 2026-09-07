import type {
  KpArticleDocument,
  KpArticleFocusBlock,
  KpArticleMotionBlock,
  KpArticlePassageBlock
} from "../../article/kp-article-document.ts";
import type { KpTypeScriptRefactorScoreV1 } from
  "../../semantic/typescript-refactor-score.ts";

export const KP_TYPESCRIPT_FOCUS_CARD_SCHEMA =
  "kp.typescript-focus-card.v1" as const;

export interface KpTypeScriptFocusCardBeatV1 {
  readonly id: string;
  readonly slug: string;
  readonly stageId: string;
  readonly title: string;
  readonly label: string;
  readonly sourceBlockId: string;
  readonly timelineProgress: number;
  readonly focusSelectorIds: readonly string[];
  readonly ownsMotionFromPrevious: boolean;
}

export interface KpTypeScriptFocusCardScoreV1 {
  readonly schemaVersion: typeof KP_TYPESCRIPT_FOCUS_CARD_SCHEMA;
  readonly id: "score.focus-deck.typescript.free-shipping.v1";
  readonly articleId: string;
  readonly animationId:
    "animation.programming.typescript-free-shipping-refactor";
  readonly beats: readonly KpTypeScriptFocusCardBeatV1[];
}

export interface KpTypeScriptFocusCardPositionSample {
  readonly position: number;
  readonly lowerIndex: number;
  readonly upperIndex: number;
  readonly edgeProgress: number;
  readonly timelineProgress: number;
}

const expectedStageIds = [
  "stage.orient",
  "stage.compare-duplicates",
  "stage.introduce-helper",
  "stage.move-shared-rule",
  "stage.replace-cost-call",
  "stage.replace-message-call",
  "stage.verify-parity"
] as const;

const titles = [
  "See the repeated decision",
  "Compare the two rules",
  "Name the helper",
  "Move the threshold once",
  "Update the price",
  "Update the message",
  "Verify the behavior"
] as const;

const motionOwningStageIds = new Set<string>([
  "stage.introduce-helper",
  "stage.move-shared-rule",
  "stage.replace-cost-call",
  "stage.replace-message-call"
]);

/**
 * The deck rearranges existing Article passages around canonical score stops.
 * Block identity stays visible so this learner projection cannot quietly
 * become a second source for the refactor explanation.
 */
export function createKpTypeScriptFocusCardScore(input: {
  readonly article: KpArticleDocument;
  readonly score: KpTypeScriptRefactorScoreV1;
}): KpTypeScriptFocusCardScoreV1 {
  const stageIds = input.score.stages.map(({ id }) => id);
  if (!sameStrings(stageIds, expectedStageIds)) {
    throw new Error("TypeScript Focus Deck requires the canonical seven-stage score.");
  }
  const intro = input.article.blocks.find(
    (block) => block.kind === "markdown" && /^# One rule, one answer\s*$/mu.test(block.markdown)
  );
  if (intro?.kind !== "markdown") {
    throw new Error("TypeScript Focus Deck requires the canonical Article introduction.");
  }
  const duplication = requireBlock<KpArticleFocusBlock>(
    input.article,
    "find-duplication",
    "focus"
  );
  const extraction = requireBlock<KpArticleMotionBlock>(
    input.article,
    "extract-rule",
    "motion"
  );
  const price = requireBlock<KpArticleMotionBlock>(
    input.article,
    "update-price",
    "motion"
  );
  const message = requireBlock<KpArticleMotionBlock>(
    input.article,
    "update-message",
    "motion"
  );
  const verification = requireBlock<KpArticlePassageBlock>(
    input.article,
    "verify-behavior",
    "passage"
  );
  const labels = [
    firstSentenceAfterHeading(intro.markdown),
    duplication.markdown,
    extraction.beforeMarkdown,
    requireAfter(extraction),
    requireAfter(price),
    requireAfter(message),
    verification.markdown
  ] as const;
  const sourceBlockIds = [
    intro.key,
    duplication.id,
    extraction.id,
    extraction.id,
    price.id,
    message.id,
    verification.id
  ] as const;
  const beats = input.score.stages.map((stage, index) => Object.freeze({
    id: `beat.typescript.${stage.id.slice("stage.".length)}`,
    slug: stage.id.slice("stage.".length),
    stageId: stage.id,
    title: titles[index]!,
    label: labels[index]!.trim(),
    sourceBlockId: sourceBlockIds[index]!,
    timelineProgress: stage.checkpointMs / input.score.durationMs,
    focusSelectorIds: stage.focusSelectorIds,
    ownsMotionFromPrevious: motionOwningStageIds.has(stage.id)
  }));
  return Object.freeze({
    schemaVersion: KP_TYPESCRIPT_FOCUS_CARD_SCHEMA,
    id: "score.focus-deck.typescript.free-shipping.v1" as const,
    articleId: input.article.id,
    animationId:
      "animation.programming.typescript-free-shipping-refactor" as const,
    beats: Object.freeze(beats)
  });
}

export function sampleKpTypeScriptFocusCardPosition(
  score: KpTypeScriptFocusCardScoreV1,
  requestedPosition: number
): KpTypeScriptFocusCardPositionSample {
  const position = Math.max(0, Math.min(
    score.beats.length - 1,
    Number.isFinite(requestedPosition) ? requestedPosition : 0
  ));
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const edgeProgress = position - lowerIndex;
  const lower = score.beats[lowerIndex]!.timelineProgress;
  const upper = score.beats[upperIndex]!.timelineProgress;
  return Object.freeze({
    position,
    lowerIndex,
    upperIndex,
    edgeProgress,
    timelineProgress: lower + (upper - lower) * edgeProgress
  });
}

export function kpTypeScriptFocusCardBeatHash(
  beat: KpTypeScriptFocusCardBeatV1
): string {
  return `#beat.typescript.${beat.slug}`;
}

export function readKpTypeScriptFocusCardBeatIndexFromHash(
  score: KpTypeScriptFocusCardScoreV1,
  hash: string
): number {
  const prefix = "#beat.typescript.";
  if (!hash.startsWith(prefix)) return 0;
  const slug = hash.slice(prefix.length);
  const index = score.beats.findIndex((beat) => beat.slug === slug);
  return index < 0 ? 0 : index;
}

export function findKpTypeScriptFocusCardBeatIndexFromHash(
  score: KpTypeScriptFocusCardScoreV1,
  hash: string
): number | undefined {
  const prefix = "#beat.typescript.";
  if (!hash.startsWith(prefix)) return undefined;
  const slug = hash.slice(prefix.length);
  const index = score.beats.findIndex((beat) => beat.slug === slug);
  return index < 0 ? undefined : index;
}

function requireBlock<T extends KpArticleFocusBlock | KpArticleMotionBlock |
KpArticlePassageBlock>(
  article: KpArticleDocument,
  id: string,
  kind: T["kind"]
): T {
  const block = article.blocks.find((candidate) =>
    candidate.kind === kind && "id" in candidate && candidate.id === id
  );
  if (block === undefined || block.kind !== kind) {
    throw new Error(`TypeScript Focus Deck requires Article ${kind} ${id}.`);
  }
  return block as T;
}

function requireAfter(block: KpArticleMotionBlock): string {
  if (block.afterMarkdown === undefined || block.afterMarkdown.trim() === "") {
    throw new Error(`TypeScript Focus Deck requires after prose for ${block.id}.`);
  }
  return block.afterMarkdown;
}

function firstSentenceAfterHeading(markdown: string): string {
  const body = markdown.replace(/^\s*# [^\n]+\n+/u, "").trim();
  const paragraph = body.split(/\n\s*\n/u)[0]?.trim();
  if (paragraph === undefined || paragraph === "") {
    throw new Error("TypeScript Focus Deck requires Article introduction prose.");
  }
  const sentence = paragraph.match(/^.*?\.(?:\s|$)/u)?.[0]?.trim();
  if (sentence === undefined || sentence === "") {
    throw new Error("TypeScript Focus Deck requires a complete Article introduction sentence.");
  }
  return sentence;
}

function sameStrings(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length && left.every(
    (value, index) => value === right[index]
  );
}
