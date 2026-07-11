import {
  findKpAssetSelector,
  type KpAssetBundle
} from "./asset.ts";
import type { KpSemanticTransformation } from "./asset-transformation.ts";

export type KpFlashcardKind =
  | "cloze"
  | "explain-transform"
  | "focus-relationship"
  | "predict-next";

export interface KpFlashcardAnswer {
  readonly kind: "selector" | "text" | "transformation";
  readonly value: string;
}

export interface KpFlashcardSpec {
  readonly id: string;
  readonly kind: KpFlashcardKind;
  readonly title: string;
  readonly assetId: string;
  readonly prompt: string;
  readonly objectIds?: readonly string[] | undefined;
  readonly selectorIds?: readonly string[] | undefined;
  readonly transformationIds?: readonly string[] | undefined;
  readonly timeMs?: number | undefined;
  readonly answer?: KpFlashcardAnswer | undefined;
}

export interface CreateKpFlashcardSpecInput {
  readonly id: string;
  readonly kind: KpFlashcardKind;
  readonly title: string;
  readonly assetId: string;
  readonly prompt: string;
  readonly objectIds?: readonly string[] | undefined;
  readonly selectorIds?: readonly string[] | undefined;
  readonly transformationIds?: readonly string[] | undefined;
  readonly timeMs?: number | undefined;
  readonly answer?: KpFlashcardAnswer | undefined;
}

export interface KpFlashcardValidationContext {
  readonly bundle: KpAssetBundle;
  readonly transformations?: readonly KpSemanticTransformation[] | undefined;
}

export interface KpFlashcardValidationIssue {
  readonly path: string;
  readonly message: string;
}

export function createKpFlashcardSpec(
  input: CreateKpFlashcardSpecInput
): KpFlashcardSpec {
  assertNonEmpty(input.id, "Flashcard id");
  assertNonEmpty(input.title, `Flashcard ${input.id} title`);
  assertNonEmpty(input.assetId, `Flashcard ${input.id} assetId`);
  assertNonEmpty(input.prompt, `Flashcard ${input.id} prompt`);

  return {
    id: input.id,
    kind: input.kind,
    title: input.title,
    assetId: input.assetId,
    prompt: input.prompt,
    ...(input.objectIds === undefined ? {} : { objectIds: [...input.objectIds] }),
    ...(input.selectorIds === undefined
      ? {}
      : { selectorIds: [...input.selectorIds] }),
    ...(input.transformationIds === undefined
      ? {}
      : { transformationIds: [...input.transformationIds] }),
    ...(input.timeMs === undefined ? {} : { timeMs: input.timeMs }),
    ...(input.answer === undefined ? {} : { answer: { ...input.answer } })
  };
}

export function validateKpFlashcardSpec(
  card: KpFlashcardSpec,
  context: KpFlashcardValidationContext
): readonly KpFlashcardValidationIssue[] {
  const issues: KpFlashcardValidationIssue[] = [];
  const objectIds = new Set(context.bundle.objects.map((object) => object.id));
  const transformationIds = new Set(
    (context.transformations ?? []).map((transformation) => transformation.id)
  );

  if (card.assetId !== context.bundle.id) {
    issues.push({
      path: "assetId",
      message: `Flashcard ${card.id} references asset ${card.assetId} but validation context is ${context.bundle.id}.`
    });
  }

  card.objectIds?.forEach((objectId, index) => {
    if (!objectIds.has(objectId)) {
      issues.push({
        path: `objectIds[${index}]`,
        message: `Flashcard ${card.id} references missing object ${objectId}.`
      });
    }
  });

  card.selectorIds?.forEach((selectorId, index) => {
    if (findKpAssetSelector(context.bundle, selectorId) === undefined) {
      issues.push({
        path: `selectorIds[${index}]`,
        message: `Flashcard ${card.id} references missing selector ${selectorId}.`
      });
    }
  });

  card.transformationIds?.forEach((transformationId, index) => {
    if (!transformationIds.has(transformationId)) {
      issues.push({
        path: `transformationIds[${index}]`,
        message: `Flashcard ${card.id} references missing transformation ${transformationId}.`
      });
    }
  });

  if (card.timeMs !== undefined && (!Number.isFinite(card.timeMs) || card.timeMs < 0)) {
    issues.push({
      path: "timeMs",
      message: `Flashcard ${card.id} timeMs must be non-negative.`
    });
  }

  return issues;
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
