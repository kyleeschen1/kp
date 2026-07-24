import {
  createKpAnimationClozeVisualMaskData,
  type KpAnimationClozeVisualMaskData
} from "./flashcard-cloze-visual-mask.ts";
import {
  createKpAnimationFlashcardPreviewRendererData,
  type KpAnimationFlashcardPreviewRendererData,
  type KpAnimationFlashcardPreviewRendererItem
} from "./flashcard-preview-renderer-data.ts";
import {
  createKpAnimationPredictNextAnswerState,
  type KpAnimationPredictNextAnswerDiagnostic,
  type KpAnimationPredictNextAnswerState
} from "./flashcard-predict-next-answer-state.ts";
import { createLinearSolveAnimationAsset } from "./linear-solve-adapter.ts";
import type {
  KpAnimationVisualFrameDiagnostic
} from "./visual-frame-adapter.ts";
import type {
  KpAnimationRuntimeVisualFrameSampleFactory
} from "./runtime-visual-frame-sample.ts";
import { createLinearSolveKpAssetBundle } from "../semantic/linear-solve-asset.ts";

export type KpAnimationFlashcardRendererSampleDiagnostic =
  | KpAnimationVisualFrameDiagnostic
  | KpAnimationPredictNextAnswerDiagnostic;

export interface LinearSolveFlashcardRendererSample {
  readonly id: string;
  readonly kind: "animation-flashcard-renderer-sample";
  readonly animationId: string;
  readonly previewDataId: string;
  readonly visualFrameId: string;
  readonly itemIds: readonly string[];
  readonly previewData: KpAnimationFlashcardPreviewRendererData;
  readonly clozeMask: KpAnimationClozeVisualMaskData;
  readonly predictNextPending: KpAnimationPredictNextAnswerState;
  readonly predictNextCorrect: KpAnimationPredictNextAnswerState;
  readonly diagnostics: readonly KpAnimationFlashcardRendererSampleDiagnostic[];
}

export function createLinearSolveFlashcardRendererSample(input: {
  readonly createVisualSample: KpAnimationRuntimeVisualFrameSampleFactory;
}): LinearSolveFlashcardRendererSample {
  const animation = createLinearSolveAnimationAsset();
  const semantic = createLinearSolveKpAssetBundle();
  const visualSample = input.createVisualSample({ progress: 0 });
  const previewData = createKpAnimationFlashcardPreviewRendererData({
    animation,
    cards: semantic.flashcards,
    progress: 0
  });
  const clozeItem = requirePreviewItem(
    previewData,
    "card.linear-solve.cloze-plus3"
  );
  const predictItem = requirePreviewItem(
    previewData,
    "card.linear-solve.predict-subtract"
  );
  const clozeMask = createKpAnimationClozeVisualMaskData({
    item: clozeItem,
    visualFrame: visualSample.visualFrame
  });
  const predictNextPending = createKpAnimationPredictNextAnswerState({
    item: predictItem
  });
  const predictNextCorrect = createKpAnimationPredictNextAnswerState({
    item: predictItem,
    selectedTransformationId: "transform.linear-solve.subtract-both-sides-3"
  });

  return {
    id: `flashcard-renderer-sample.${animation.id}`,
    kind: "animation-flashcard-renderer-sample",
    animationId: animation.id,
    previewDataId: previewData.id,
    visualFrameId: visualSample.visualFrame.id,
    itemIds: [clozeItem.id, predictItem.id],
    previewData,
    clozeMask,
    predictNextPending,
    predictNextCorrect,
    diagnostics: [
      ...clozeMask.diagnostics,
      ...predictNextPending.diagnostics,
      ...predictNextCorrect.diagnostics
    ]
  };
}

function requirePreviewItem(
  previewData: KpAnimationFlashcardPreviewRendererData,
  cardId: string
): KpAnimationFlashcardPreviewRendererItem {
  const item = previewData.items.find((candidate) => candidate.cardId === cardId);

  if (item === undefined) {
    throw new Error(`Flashcard preview data ${previewData.id} is missing ${cardId}.`);
  }

  return item;
}
