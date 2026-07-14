import type { KpAnimationAsset } from "./asset.ts";
import {
  createKpAnimationClozeProjection,
  createKpAnimationFlashcardProjection,
  createKpAnimationPredictNextProjection
} from "./flashcard-projection.ts";
import type {
  KpAnimationRuntimeClock
} from "./runtime-sampler.ts";
import type {
  KpFlashcardAnswer,
  KpFlashcardKind,
  KpFlashcardSpec,
  KpFlashcardValidationIssue
} from "../semantic/asset-flashcard.ts";

export type KpAnimationFlashcardPreviewInteractionKind =
  | "cloze"
  | "predict-next"
  | "review";

export interface CreateKpAnimationFlashcardPreviewRendererDataInput {
  readonly animation: KpAnimationAsset;
  readonly cards: readonly KpFlashcardSpec[];
  readonly progress?: number | undefined;
}

export interface KpAnimationFlashcardPreviewRendererData {
  readonly id: string;
  readonly kind: "animation-flashcard-preview-renderer-data";
  readonly animationId: string;
  readonly itemCount: number;
  readonly items: readonly KpAnimationFlashcardPreviewRendererItem[];
  readonly diagnostics: readonly KpFlashcardValidationIssue[];
}

export interface KpAnimationFlashcardPreviewRendererItem {
  readonly id: string;
  readonly projectionId: string;
  readonly cardId: string;
  readonly cardKind: KpFlashcardKind;
  readonly interactionKind: KpAnimationFlashcardPreviewInteractionKind;
  readonly title: string;
  readonly prompt: string;
  readonly answer?: KpFlashcardAnswer | undefined;
  readonly answerSummary: string;
  readonly objectIds: readonly string[];
  readonly selectorIds: readonly string[];
  readonly transformationIds: readonly string[];
  readonly hiddenSelectorIds: readonly string[];
  readonly expectedTransformationId?: string | undefined;
  readonly candidateTransformationIds: readonly string[];
  readonly clock: KpAnimationRuntimeClock;
  readonly activeTransformationIds: readonly string[];
  readonly phaseId: string;
  readonly diagnostics: readonly KpFlashcardValidationIssue[];
}

export function createKpAnimationFlashcardPreviewRendererData(
  input: CreateKpAnimationFlashcardPreviewRendererDataInput
): KpAnimationFlashcardPreviewRendererData {
  const items = input.cards.map((card) =>
    createKpAnimationFlashcardPreviewRendererItem(input.animation, card, input.progress)
  );

  return {
    id: `flashcard-preview.${input.animation.id}`,
    kind: "animation-flashcard-preview-renderer-data",
    animationId: input.animation.id,
    itemCount: items.length,
    items,
    diagnostics: items.flatMap((item) => item.diagnostics)
  };
}

function createKpAnimationFlashcardPreviewRendererItem(
  animation: KpAnimationAsset,
  card: KpFlashcardSpec,
  progress: number | undefined
): KpAnimationFlashcardPreviewRendererItem {
  if (card.kind === "cloze") {
    const projection = createKpAnimationClozeProjection({
      animation,
      card,
      progress
    });

    return {
      ...baseItemFields(projection, "cloze"),
      hiddenSelectorIds: [...projection.hiddenSelectorIds],
      candidateTransformationIds: []
    };
  }

  if (card.kind === "predict-next") {
    const projection = createKpAnimationPredictNextProjection({
      animation,
      card,
      progress
    });

    return {
      ...baseItemFields(projection, "predict-next"),
      hiddenSelectorIds: [],
      ...(projection.expectedTransformationId === undefined
        ? {}
        : { expectedTransformationId: projection.expectedTransformationId }),
      candidateTransformationIds: [...projection.candidateTransformationIds]
    };
  }

  const projection = createKpAnimationFlashcardProjection({
    animation,
    card,
    progress
  });

  return {
    ...baseItemFields(projection, "review"),
    hiddenSelectorIds: [],
    candidateTransformationIds: []
  };
}

function baseItemFields(
  projection: ReturnType<typeof createKpAnimationFlashcardProjection>,
  interactionKind: KpAnimationFlashcardPreviewInteractionKind
) {
  return {
    id: `flashcard-preview-item.${projection.animationId}.${projection.cardId}`,
    projectionId: projection.id,
    cardId: projection.cardId,
    cardKind: projection.cardKind,
    interactionKind,
    title: projection.title,
    prompt: projection.prompt,
    ...(projection.answer === undefined ? {} : { answer: projection.answer }),
    answerSummary: answerSummary(projection.answer),
    objectIds: [...projection.objectIds],
    selectorIds: [...projection.selectorIds],
    transformationIds: [...projection.transformationIds],
    clock: projection.clock,
    activeTransformationIds: [...projection.activeTransformationIds],
    phaseId: projection.runtimeFrame.phase.phaseId,
    diagnostics: projection.diagnostics.map((diagnostic) => ({ ...diagnostic }))
  };
}

function answerSummary(answer: KpFlashcardAnswer | undefined): string {
  if (answer === undefined) {
    return "None";
  }

  return `${answer.kind}:${answer.value}`;
}
