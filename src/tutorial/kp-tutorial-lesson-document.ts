import {
  validateKpLessonDocument,
  type KpLessonAnimationStoryBlock,
  type KpLessonDocument,
  type KpLessonInline,
  type KpLessonParagraphBlock
} from "../reader/document/lesson-document.ts";
import type { KpReaderArtifactRef } from "../reader/document/artifacts.ts";

export interface KpTutorialLessonMetadata {
  readonly kicker: string;
  readonly assumption: string;
}

/**
 * Tutorial metadata wraps the established document artifact; all ordered
 * lesson content remains governed by KpLessonDocument rather than a peer
 * tutorial ontology.
 */
export interface KpTutorialLessonPublicationDocument {
  readonly kind: "tutorial-lesson-publication-document";
  readonly document: KpLessonDocument;
  readonly metadata: KpTutorialLessonMetadata;
}

export interface KpTutorialDocumentCheckpointInput {
  readonly id: string;
  readonly label: string;
  readonly progress: number;
  readonly focusRefs?: readonly string[] | undefined;
}

export function createKpTutorialLessonPublicationDocument(input: {
  readonly document: KpLessonDocument;
  readonly metadata: KpTutorialLessonMetadata;
}): KpTutorialLessonPublicationDocument {
  const issues = validateKpLessonDocument(input.document);
  if (issues.length > 0) {
    const summary = issues.map(({ path, message }) => `${path}: ${message}`).join("; ");
    throw new Error(`Invalid tutorial KpLessonDocument: ${summary}`);
  }
  requireText(input.metadata.kicker, "tutorial kicker");
  requireText(input.metadata.assumption, "tutorial assumption");
  return Object.freeze({
    kind: "tutorial-lesson-publication-document",
    document: input.document,
    metadata: Object.freeze({ ...input.metadata })
  });
}

export function createKpTutorialParagraphBlock(input: {
  readonly id: string;
  readonly sourceText: string;
}): KpLessonParagraphBlock {
  requireText(input.id, "paragraph id");
  requireText(input.sourceText, "paragraph source text");
  return Object.freeze({
    kind: "paragraph",
    id: input.id,
    content: Object.freeze<KpLessonInline[]>([
      Object.freeze({ kind: "text", value: input.sourceText })
    ])
  });
}

export function createKpTutorialAnimationStoryBlock(input: {
  readonly id: string;
  readonly asset: KpReaderArtifactRef<"animation-asset">;
  readonly checkpoints: readonly KpTutorialDocumentCheckpointInput[];
}): KpLessonAnimationStoryBlock {
  if (input.checkpoints.length === 0) {
    throw new Error(`Tutorial motion block ${input.id} needs checkpoints.`);
  }
  return Object.freeze({
    kind: "animation-story",
    id: input.id,
    asset: Object.freeze({ ...input.asset }),
    presentation: "scroll-scrub",
    beats: Object.freeze(input.checkpoints.map((checkpoint) => Object.freeze({
      id: `beat-${checkpoint.id}`,
      title: checkpoint.label,
      content: Object.freeze<KpLessonInline[]>([
        Object.freeze({ kind: "text", value: checkpoint.label })
      ]),
      checkpoint: Object.freeze({
        id: checkpoint.id,
        progressPermille: unitProgressToPermille(checkpoint.progress)
      }),
      focusRefs: Object.freeze([...(checkpoint.focusRefs ?? [])])
    })))
  });
}

export function unitProgressToPermille(progress: number): number {
  const finite = Number.isFinite(progress) ? progress : 0;
  return Math.round(Math.max(0, Math.min(1, finite)) * 1_000);
}

function requireText(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`${label} must not be empty.`);
}
