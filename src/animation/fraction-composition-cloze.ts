import {
  createKpFractionCompositionEquationAnimationAsset
} from "./fraction-composition-equation-adapter.ts";
import {
  createKpAnimationClozeProjection
} from "./flashcard-projection.ts";
import {
  createKpFlashcardSpec
} from "../semantic/asset-flashcard.ts";

export function createKpFractionCompositionSolutionClozeProjection() {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const hiddenSelectorId = "solved.right";
  const card = createKpFlashcardSpec({
    id: "card.fraction-composition.exact-solution",
    kind: "cloze",
    title: "Name the exact solution",
    assetId: animation.bundle.id,
    prompt:
      "After dividing both sides by two, what exact value completes x equals blank?",
    objectIds: ["fraction-solve.state.solved"],
    selectorIds: [hiddenSelectorId],
    transformationIds: ["fraction-solve.step.simplify-solution"],
    timeMs: animation.timeline?.durationMs,
    answer: { kind: "selector", value: hiddenSelectorId }
  });
  return Object.freeze(createKpAnimationClozeProjection({
    animation,
    card,
    progress: 1
  }));
}
