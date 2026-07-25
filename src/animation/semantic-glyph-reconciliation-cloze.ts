import { createKpAnimationClozeProjection } from "./flashcard-projection.ts";
import { createNumeratorSplitMergeEquationAnimationAsset } from "./numerator-split-merge-equation-adapter.ts";
import {
  numeratorSplitMergeEquationAssetIds
} from "../semantic/numerator-split-merge-equation-asset.ts";
import { createKpFlashcardSpec } from "../semantic/asset-flashcard.ts";

export function createKpFractionMergeClozeProjection() {
  const animation = createNumeratorSplitMergeEquationAnimationAsset();
  const hiddenSelectorId =
    `${numeratorSplitMergeEquationAssetIds.combined}.fraction.denominator.2`;
  const card = createKpFlashcardSpec({
    id: "card.numerator-split-merge.shared-denominator",
    kind: "cloze",
    title: "Name the merged denominator",
    assetId: animation.bundle.id,
    prompt: "After the compatible fractions merge, what shared denominator remains?",
    objectIds: [numeratorSplitMergeEquationAssetIds.combined],
    selectorIds: [hiddenSelectorId],
    transformationIds: [numeratorSplitMergeEquationAssetIds.mergeTransform],
    timeMs: animation.timeline?.durationMs,
    answer: { kind: "selector", value: hiddenSelectorId }
  });
  return Object.freeze(createKpAnimationClozeProjection({
    animation,
    card,
    progress: 1
  }));
}

export function createKpFractionSplitClozeProjection() {
  const animation = createNumeratorSplitMergeEquationAnimationAsset();
  const hiddenSelectorIds = [
    `${numeratorSplitMergeEquationAssetIds.split}.left.fraction.denominator.2`,
    `${numeratorSplitMergeEquationAssetIds.split}.right.fraction.denominator.2`
  ];
  const card = createKpFlashcardSpec({
    id: "card.numerator-split-merge.copied-denominator",
    kind: "cloze",
    title: "Name the copied denominator",
    assetId: animation.bundle.id,
    prompt: "After the numerator sum splits, what denominator sits beneath each term?",
    objectIds: [numeratorSplitMergeEquationAssetIds.split],
    selectorIds: hiddenSelectorIds,
    transformationIds: [numeratorSplitMergeEquationAssetIds.splitTransform],
    timeMs: animation.timeline?.durationMs,
    answer: { kind: "selector", value: hiddenSelectorIds[0]! }
  });
  return Object.freeze(createKpAnimationClozeProjection({
    animation,
    card,
    progress: 1
  }));
}
