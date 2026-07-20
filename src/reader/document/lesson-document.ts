import type {
  KpLessonDocumentArtifact,
  KpReaderArtifactRef,
  KpReaderSourceLocation
} from "./artifacts.ts";

export type KpLessonInline = KpLessonText | KpLessonSemanticLink;

export interface KpLessonText {
  readonly kind: "text";
  readonly value: string;
  readonly source?: KpReaderSourceLocation | undefined;
}

export interface KpLessonSemanticLink {
  readonly kind: "semantic-link";
  readonly text: string;
  readonly objectRefs: readonly string[];
  readonly tooltip?: string | undefined;
  readonly source?: KpReaderSourceLocation | undefined;
}

export type KpLessonBlock =
  | KpLessonHeadingBlock
  | KpLessonParagraphBlock
  | KpLessonAnimationStoryBlock;

export interface KpLessonBlockBase {
  readonly id: string;
  readonly source?: KpReaderSourceLocation | undefined;
}

export interface KpLessonHeadingBlock extends KpLessonBlockBase {
  readonly kind: "heading";
  readonly level: 1 | 2 | 3 | 4 | 5 | 6;
  readonly content: readonly KpLessonInline[];
}

export interface KpLessonParagraphBlock extends KpLessonBlockBase {
  readonly kind: "paragraph";
  readonly content: readonly KpLessonInline[];
}

export interface KpLessonAnimationStoryBlock extends KpLessonBlockBase {
  readonly kind: "animation-story";
  readonly asset: KpReaderArtifactRef<"animation-asset">;
  readonly presentation: "scroll-scrub" | "step";
  readonly beats: readonly KpLessonBeat[];
}

export interface KpLessonBeat {
  readonly id: string;
  readonly title: string;
  readonly content: readonly KpLessonInline[];
  readonly checkpoint: KpLessonCheckpoint;
  readonly focusRefs: readonly string[];
  readonly source?: KpReaderSourceLocation | undefined;
}

export interface KpLessonCheckpoint {
  readonly id: string;
  readonly progressPermille: number;
}

export interface KpLessonDocument
  extends KpLessonDocumentArtifact<KpLessonBlock> {
  readonly language?: string | undefined;
}

export interface KpLessonDocumentIssue {
  readonly path: string;
  readonly message: string;
}

export function validateKpLessonDocument(
  document: KpLessonDocument
): readonly KpLessonDocumentIssue[] {
  const issues: KpLessonDocumentIssue[] = [];
  const ids = new Map<string, string>();
  requireText(document.id, "id", issues);
  requireText(document.version, "version", issues);
  requireText(document.title, "title", issues);
  registerId(ids, document.id, "id", issues);

  document.blocks.forEach((block, blockIndex) => {
    const path = `blocks[${blockIndex}]`;
    registerId(ids, block.id, `${path}.id`, issues);
    validateSource(block.source, `${path}.source`, issues);
    if (block.kind === "heading" || block.kind === "paragraph") {
      validateInlineContent(block.content, `${path}.content`, issues);
      return;
    }
    requireText(block.asset.id, `${path}.asset.id`, issues);
    requireText(block.asset.version, `${path}.asset.version`, issues);
    if (block.beats.length === 0) {
      issues.push({ path: `${path}.beats`, message: "animation story needs at least one beat" });
    }
    let previousProgress = -1;
    block.beats.forEach((beat, beatIndex) => {
      const beatPath = `${path}.beats[${beatIndex}]`;
      registerId(ids, beat.id, `${beatPath}.id`, issues);
      registerId(ids, beat.checkpoint.id, `${beatPath}.checkpoint.id`, issues);
      requireText(beat.title, `${beatPath}.title`, issues);
      validateInlineContent(beat.content, `${beatPath}.content`, issues);
      validateUniqueText(beat.focusRefs, `${beatPath}.focusRefs`, issues);
      validateSource(beat.source, `${beatPath}.source`, issues);
      const progress = beat.checkpoint.progressPermille;
      if (!Number.isInteger(progress) || progress < 0 || progress > 1_000) {
        issues.push({
          path: `${beatPath}.checkpoint.progressPermille`,
          message: "checkpoint progress must be an integer from 0 through 1000"
        });
      } else if (progress < previousProgress) {
        issues.push({
          path: `${beatPath}.checkpoint.progressPermille`,
          message: "animation story checkpoints must be ordered by progress"
        });
      }
      previousProgress = progress;
    });
  });

  return issues;
}

function validateInlineContent(
  content: readonly KpLessonInline[],
  path: string,
  issues: KpLessonDocumentIssue[]
): void {
  if (content.length === 0) {
    issues.push({ path, message: "content must not be empty" });
  }
  content.forEach((inline, index) => {
    const inlinePath = `${path}[${index}]`;
    if (inline.kind === "text") requireText(inline.value, `${inlinePath}.value`, issues);
    else {
      requireText(inline.text, `${inlinePath}.text`, issues);
      validateUniqueText(inline.objectRefs, `${inlinePath}.objectRefs`, issues);
      if (inline.objectRefs.length === 0) {
        issues.push({ path: `${inlinePath}.objectRefs`, message: "semantic link needs an object ref" });
      }
    }
    validateSource(inline.source, `${inlinePath}.source`, issues);
  });
}

function validateUniqueText(
  values: readonly string[],
  path: string,
  issues: KpLessonDocumentIssue[]
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    const normalized = value.trim();
    if (normalized === "") {
      issues.push({ path: `${path}[${index}]`, message: "value must not be empty" });
    } else if (seen.has(normalized)) {
      issues.push({ path: `${path}[${index}]`, message: `duplicate value ${normalized}` });
    }
    seen.add(normalized);
  });
}

function registerId(
  ids: Map<string, string>,
  id: string,
  path: string,
  issues: KpLessonDocumentIssue[]
): void {
  const normalized = id.trim();
  if (normalized === "") {
    issues.push({ path, message: "id must not be empty" });
    return;
  }
  const previous = ids.get(normalized);
  if (previous === undefined) ids.set(normalized, path);
  else issues.push({ path, message: `duplicate id ${normalized}; first declared at ${previous}` });
}

function requireText(
  value: string,
  path: string,
  issues: KpLessonDocumentIssue[]
): void {
  if (value.trim() === "") issues.push({ path, message: "text must not be empty" });
}

function validateSource(
  source: KpReaderSourceLocation | undefined,
  path: string,
  issues: KpLessonDocumentIssue[]
): void {
  if (source === undefined) return;
  requireText(source.sourceId, `${path}.sourceId`, issues);
  for (const [label, position] of [["start", source.start], ["end", source.end]] as const) {
    if (!Number.isInteger(position.line) || position.line < 1) {
      issues.push({ path: `${path}.${label}.line`, message: "source line must be positive" });
    }
    if (!Number.isInteger(position.column) || position.column < 1) {
      issues.push({ path: `${path}.${label}.column`, message: "source column must be positive" });
    }
    if (!Number.isInteger(position.offset) || position.offset < 0) {
      issues.push({ path: `${path}.${label}.offset`, message: "source offset must be non-negative" });
    }
  }
  if (source.end.offset < source.start.offset) {
    issues.push({ path, message: "source end must not precede source start" });
  }
}
