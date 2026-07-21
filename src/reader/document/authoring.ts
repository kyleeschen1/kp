import {
  createKpReaderArtifactRef,
  type KpReaderArtifactRef,
  type KpReaderSourceLocation
} from "./artifacts.ts";
import {
  validateKpLessonDocument,
  type KpLessonAnimationStoryBlock,
  type KpLessonAttentionPlan,
  type KpLessonBeat,
  type KpLessonDocument,
  type KpLessonDocumentIssue,
  type KpLessonHeadingBlock,
  type KpLessonInline,
  type KpLessonParagraphBlock,
  type KpLessonSemanticLink,
  type KpLessonText
} from "./lesson-document.ts";

export type KpLessonInlineInput = string | KpLessonInline;

type KpAuthoredInline<TInline extends KpLessonInlineInput> =
  TInline extends string
    ? KpLessonText & { readonly value: TInline }
    : TInline;

type KpAuthoredContent<TContent extends readonly KpLessonInlineInput[]> = {
  readonly [TIndex in keyof TContent]: KpAuthoredInline<TContent[TIndex]>;
};

export class KpLessonAuthoringError extends Error {
  readonly issues: readonly KpLessonDocumentIssue[];

  constructor(issues: readonly KpLessonDocumentIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
    this.name = "KpLessonAuthoringError";
    this.issues = issues;
  }
}

export function createKpLessonText<const TValue extends string>(
  value: TValue,
  source?: KpReaderSourceLocation
): KpLessonText & { readonly value: TValue } {
  return source === undefined
    ? { kind: "text", value }
    : { kind: "text", value, source: cloneSource(source) };
}

export function createKpLessonSemanticLink<
  const TText extends string,
  const TObjectRefs extends readonly string[]
>(input: {
  readonly text: TText;
  readonly objectRefs: TObjectRefs;
  readonly tooltip?: string | undefined;
  readonly source?: KpReaderSourceLocation | undefined;
}): KpLessonSemanticLink & {
  readonly text: TText;
  readonly objectRefs: TObjectRefs;
} {
  return {
    kind: "semantic-link",
    text: input.text,
    objectRefs: [...input.objectRefs] as unknown as TObjectRefs,
    ...(input.tooltip === undefined ? {} : { tooltip: input.tooltip }),
    ...(input.source === undefined ? {} : { source: cloneSource(input.source) })
  };
}

export function createKpLessonHeading<
  const TId extends string,
  const TContent extends readonly KpLessonInlineInput[]
>(input: {
  readonly id: TId;
  readonly level: 1 | 2 | 3 | 4 | 5 | 6;
  readonly content: TContent;
  readonly source?: KpReaderSourceLocation | undefined;
}): KpLessonHeadingBlock & {
  readonly id: TId;
  readonly content: KpAuthoredContent<TContent>;
} {
  return {
    kind: "heading",
    id: input.id,
    level: input.level,
    content: normalizeContent(input.content),
    ...(input.source === undefined ? {} : { source: cloneSource(input.source) })
  };
}

export function createKpLessonParagraph<
  const TId extends string,
  const TContent extends readonly KpLessonInlineInput[]
>(input: {
  readonly id: TId;
  readonly content: TContent;
  readonly source?: KpReaderSourceLocation | undefined;
}): KpLessonParagraphBlock & {
  readonly id: TId;
  readonly content: KpAuthoredContent<TContent>;
} {
  return {
    kind: "paragraph",
    id: input.id,
    content: normalizeContent(input.content),
    ...(input.source === undefined ? {} : { source: cloneSource(input.source) })
  };
}

export function createKpLessonBeat<
  const TId extends string,
  const TCheckpointId extends string,
  const TContent extends readonly KpLessonInlineInput[],
  const TFocusRefs extends readonly string[]
>(input: {
  readonly id: TId;
  readonly title: string;
  readonly content: TContent;
  readonly checkpoint: {
    readonly id: TCheckpointId;
    readonly progressPermille: number;
  };
  readonly focusRefs?: TFocusRefs | undefined;
  readonly source?: KpReaderSourceLocation | undefined;
}): KpLessonBeat & {
  readonly id: TId;
  readonly content: KpAuthoredContent<TContent>;
  readonly checkpoint: KpLessonBeat["checkpoint"] & { readonly id: TCheckpointId };
  readonly focusRefs: TFocusRefs extends readonly string[] ? TFocusRefs : readonly [];
} {
  return {
    id: input.id,
    title: input.title,
    content: normalizeContent(input.content),
    checkpoint: { ...input.checkpoint },
    focusRefs: [...(input.focusRefs ?? [])] as unknown as TFocusRefs extends readonly string[]
      ? TFocusRefs
      : readonly [],
    ...(input.source === undefined ? {} : { source: cloneSource(input.source) })
  };
}

export function createKpLessonAnimationStory<
  const TId extends string,
  const TAssetId extends string,
  const TAssetVersion extends string,
  const TBeats extends readonly KpLessonBeat[]
>(input: {
  readonly id: TId;
  readonly asset: { readonly id: TAssetId; readonly version: TAssetVersion };
  readonly presentation?: "scroll-scrub" | "step" | undefined;
  readonly beats: TBeats;
  readonly attention?: KpLessonAttentionPlan | undefined;
  readonly source?: KpReaderSourceLocation | undefined;
}): KpLessonAnimationStoryBlock & {
  readonly id: TId;
  readonly asset: KpReaderArtifactRef<"animation-asset", TAssetId, TAssetVersion>;
  readonly beats: TBeats;
} {
  return {
    kind: "animation-story",
    id: input.id,
    asset: createKpReaderArtifactRef({ kind: "animation-asset", ...input.asset }),
    presentation: input.presentation ?? "scroll-scrub",
    beats: [...input.beats] as unknown as TBeats,
    ...(input.attention === undefined ? {} : { attention: cloneAttention(input.attention) }),
    ...(input.source === undefined ? {} : { source: cloneSource(input.source) })
  };
}

function cloneAttention(attention: KpLessonAttentionPlan): KpLessonAttentionPlan {
  return {
    kind: attention.kind,
    phases: attention.phases.map((phase) => ({
      ...phase,
      focusRefs: [...phase.focusRefs]
    }))
  };
}

export function defineKpLessonDocument<
  const TId extends string,
  const TVersion extends string,
  const TBlocks extends readonly KpLessonDocument["blocks"][number][]
>(input: {
  readonly id: TId;
  readonly version: TVersion;
  readonly title: string;
  readonly language?: string | undefined;
  readonly blocks: TBlocks;
  readonly source?: { readonly id: string; readonly version: string } | undefined;
}): KpLessonDocument & {
  readonly id: TId;
  readonly version: TVersion;
  readonly blocks: TBlocks;
} {
  const document = {
    kind: "lesson-document" as const,
    id: input.id,
    version: input.version,
    title: input.title,
    blocks: [...input.blocks] as unknown as TBlocks,
    ...(input.language === undefined ? {} : { language: input.language }),
    ...(input.source === undefined
      ? {}
      : { source: createKpReaderArtifactRef({ kind: "lesson-source", ...input.source }) })
  };
  const issues = validateKpLessonDocument(document);
  if (issues.length > 0) throw new KpLessonAuthoringError(issues);
  return document;
}

// The namespace-style surface keeps common authoring terse while named exports remain tree-shakeable.
export const kpLesson = {
  text: createKpLessonText,
  link: createKpLessonSemanticLink,
  heading: createKpLessonHeading,
  paragraph: createKpLessonParagraph,
  beat: createKpLessonBeat,
  animationStory: createKpLessonAnimationStory
} as const;

function normalizeContent<const TContent extends readonly KpLessonInlineInput[]>(
  content: TContent
): KpAuthoredContent<TContent> {
  return content.map((inline) => typeof inline === "string"
    ? createKpLessonText(inline)
    : cloneInline(inline)) as KpAuthoredContent<TContent>;
}

function cloneInline(inline: KpLessonInline): KpLessonInline {
  if (inline.kind === "text") {
    return {
      ...inline,
      ...(inline.source === undefined ? {} : { source: cloneSource(inline.source) })
    };
  }
  return {
    ...inline,
    objectRefs: [...inline.objectRefs],
    ...(inline.source === undefined ? {} : { source: cloneSource(inline.source) })
  };
}

function cloneSource(source: KpReaderSourceLocation): KpReaderSourceLocation {
  return {
    sourceId: source.sourceId,
    start: { ...source.start },
    end: { ...source.end }
  };
}
