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
  readonly attention?: KpLessonAttentionPlan | undefined;
}

export type KpLessonAttentionPhaseKind = "orient" | "act" | "settle" | "inspect";
export const kpLessonAttentionPhaseOrder = ["orient", "act", "settle", "inspect"] as const;

export interface KpLessonAttentionPlan {
  readonly kind: "phased-attention-v1";
  readonly phases: readonly KpLessonAttentionPhase[];
}

export interface KpLessonAttentionPhase {
  readonly id: string;
  readonly kind: KpLessonAttentionPhaseKind;
  readonly beatId: string;
  readonly checkpointId: string;
  readonly startProgressPermille: number;
  readonly endProgressPermille: number;
  readonly cue: string;
  readonly focusRefs: readonly string[];
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
    validateAttentionPlan(block, path, ids, issues);
  });

  return issues;
}

function validateAttentionPlan(
  block: KpLessonAnimationStoryBlock,
  path: string,
  ids: Map<string, string>,
  issues: KpLessonDocumentIssue[]
): void {
  const plan = block.attention;
  if (plan === undefined) return;
  const attentionPath = `${path}.attention`;
  if (plan.kind !== "phased-attention-v1") {
    issues.push({ path: `${attentionPath}.kind`, message: "unknown attention plan kind" });
  }
  if (plan.phases.length === 0) {
    issues.push({ path: `${attentionPath}.phases`, message: "attention plan needs phases" });
    return;
  }
  if (plan.phases.length % kpLessonAttentionPhaseOrder.length !== 0) {
    issues.push({
      path: `${attentionPath}.phases`,
      message: "attention phases must form complete orient, act, settle, inspect cycles"
    });
  }
  const beatsById = new Map(block.beats.map((beat) => [beat.id, beat]));
  let previousEnd = 0;
  plan.phases.forEach((phase, index) => {
    const phasePath = `${attentionPath}.phases[${index}]`;
    registerId(ids, phase.id, `${phasePath}.id`, issues);
    const expectedKind = kpLessonAttentionPhaseOrder[index % kpLessonAttentionPhaseOrder.length];
    if (phase.kind !== expectedKind) {
      issues.push({
        path: `${phasePath}.kind`,
        message: `attention phase ${index} must be ${expectedKind}`
      });
    }
    const beat = beatsById.get(phase.beatId);
    if (beat === undefined) {
      issues.push({ path: `${phasePath}.beatId`, message: `unknown beat ${phase.beatId}` });
    } else if (beat.checkpoint.id !== phase.checkpointId) {
      issues.push({
        path: `${phasePath}.checkpointId`,
        message: `checkpoint ${phase.checkpointId} does not belong to beat ${phase.beatId}`
      });
    }
    requireText(phase.cue, `${phasePath}.cue`, issues);
    validateUniqueText(phase.focusRefs, `${phasePath}.focusRefs`, issues);
    if (phase.focusRefs.length === 0) {
      issues.push({ path: `${phasePath}.focusRefs`, message: "attention phase needs a focus ref" });
    }
    for (const [label, progress] of [
      ["startProgressPermille", phase.startProgressPermille],
      ["endProgressPermille", phase.endProgressPermille]
    ] as const) {
      if (!Number.isInteger(progress) || progress < 0 || progress > 1_000) {
        issues.push({
          path: `${phasePath}.${label}`,
          message: "attention progress must be an integer from 0 through 1000"
        });
      }
    }
    if (phase.startProgressPermille !== previousEnd) {
      issues.push({
        path: `${phasePath}.startProgressPermille`,
        message: `attention phases must be contiguous from ${previousEnd}`
      });
    }
    if (phase.endProgressPermille <= phase.startProgressPermille) {
      issues.push({
        path: `${phasePath}.endProgressPermille`,
        message: "attention phase must have positive duration"
      });
    }
    previousEnd = phase.endProgressPermille;
  });
  if (previousEnd !== 1_000) {
    issues.push({
      path: `${attentionPath}.phases`,
      message: "attention phases must cover progress 0 through 1000"
    });
  }
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
