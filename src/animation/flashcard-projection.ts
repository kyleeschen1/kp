import type {
  KpAnimationAsset
} from "./asset.ts";
import {
  sampleKpAnimationRuntimeFrame,
  type KpAnimationRuntimeClock,
  type KpAnimationRuntimeFrame
} from "./runtime-sampler.ts";
import {
  validateKpFlashcardSpec,
  type KpFlashcardAnswer,
  type KpFlashcardKind,
  type KpFlashcardSpec,
  type KpFlashcardValidationIssue
} from "../semantic/asset-flashcard.ts";

export interface CreateKpAnimationFlashcardProjectionInput {
  readonly animation: KpAnimationAsset;
  readonly card: KpFlashcardSpec;
  readonly progress?: number | undefined;
}

export interface CreateKpAnimationFlashcardProjectionsInput {
  readonly animation: KpAnimationAsset;
  readonly cards: readonly KpFlashcardSpec[];
  readonly progress?: number | undefined;
}

export interface KpAnimationFlashcardProjection {
  readonly id: string;
  readonly kind: "animation-flashcard-projection";
  readonly animationId: string;
  readonly cardId: string;
  readonly cardKind: KpFlashcardKind;
  readonly title: string;
  readonly prompt: string;
  readonly answer?: KpFlashcardAnswer | undefined;
  readonly objectIds: readonly string[];
  readonly selectorIds: readonly string[];
  readonly transformationIds: readonly string[];
  readonly clock: KpAnimationRuntimeClock;
  readonly activeTransformationIds: readonly string[];
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly diagnostics: readonly KpFlashcardValidationIssue[];
}

export interface KpAnimationClozeProjection
  extends KpAnimationFlashcardProjection {
  readonly interactionKind: "cloze";
  readonly hiddenSelectorIds: readonly string[];
}

export interface KpAnimationPredictNextProjection
  extends KpAnimationFlashcardProjection {
  readonly interactionKind: "predict-next";
  readonly expectedTransformationId?: string | undefined;
  readonly candidateTransformationIds: readonly string[];
}

export function createKpAnimationFlashcardProjection(
  input: CreateKpAnimationFlashcardProjectionInput
): KpAnimationFlashcardProjection {
  const frame = sampleKpAnimationRuntimeFrame({
    animation: input.animation,
    ...(input.card.timeMs === undefined
      ? { progress: input.progress ?? 0.5 }
      : { elapsedMs: input.card.timeMs })
  });
  const diagnostics = validateKpFlashcardSpec(input.card, {
    bundle: input.animation.bundle,
    transformations: input.animation.transformations
  });

  return {
    id: `projection.${input.animation.id}.${input.card.id}`,
    kind: "animation-flashcard-projection",
    animationId: input.animation.id,
    cardId: input.card.id,
    cardKind: input.card.kind,
    title: input.card.title,
    prompt: input.card.prompt,
    ...(input.card.answer === undefined
      ? {}
      : { answer: { ...input.card.answer } }),
    objectIds: [...(input.card.objectIds ?? [])],
    selectorIds: [...(input.card.selectorIds ?? [])],
    transformationIds: [...(input.card.transformationIds ?? [])],
    clock: frame.clock,
    activeTransformationIds: [...frame.activeTransformationIds],
    runtimeFrame: frame,
    diagnostics: diagnostics.map((diagnostic) => ({ ...diagnostic }))
  };
}

export function createKpAnimationClozeProjection(
  input: CreateKpAnimationFlashcardProjectionInput
): KpAnimationClozeProjection {
  const projection = createKpAnimationFlashcardProjection(input);

  return {
    ...projection,
    interactionKind: "cloze",
    hiddenSelectorIds: [...projection.selectorIds]
  };
}

export function createKpAnimationPredictNextProjection(
  input: CreateKpAnimationFlashcardProjectionInput
): KpAnimationPredictNextProjection {
  const projection = createKpAnimationFlashcardProjection(input);

  return {
    ...projection,
    interactionKind: "predict-next",
    ...(input.card.answer?.kind === "transformation"
      ? { expectedTransformationId: input.card.answer.value }
      : projection.transformationIds[0] === undefined
        ? {}
        : { expectedTransformationId: projection.transformationIds[0] }),
    candidateTransformationIds: input.animation.transformations.map(
      (transformation) => transformation.id
    )
  };
}

export function createKpAnimationFlashcardProjections(
  input: CreateKpAnimationFlashcardProjectionsInput
): readonly KpAnimationFlashcardProjection[] {
  return input.cards.map((card) =>
    createKpAnimationFlashcardProjection({
      animation: input.animation,
      card,
      progress: input.progress
    })
  );
}
