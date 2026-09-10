import { assertKpComposedAlgebraPresentation, type KpComposedAlgebraPresentation } from "../../authoring/composed-algebra-presentation.ts";
import { createKpFlashcardSpec } from "../../semantic/asset-flashcard.ts";
import { createKpAnimationClozeProjection, createKpAnimationPredictNextProjection } from "../../animation/flashcard-projection.ts";
import { createKpFocusDeckCheckpointMap } from "../../tutorial/focus-deck-beat-navigation.ts";

export function projectComposedAlgebraPrompts(draft: KpComposedAlgebraPresentation) {
  assertKpComposedAlgebraPresentation(draft);
  const source = draft.checked.source;
  return Object.freeze((["prediction", "reconstruction"] as const).map(kind => {
    const prediction = kind === "prediction", answerStep = prediction ? 1 : 2;
    const operationIds = draft.animation.transformations.map(t => t.id);
    const card = createKpFlashcardSpec({ id: `${source.id}.${kind}`, kind: prediction ? "predict-next" : "cloze",
      title: prediction ? "Predict the shared structure" : "Reconstruct both deductions", assetId: draft.animation.bundle.id,
      prompt: prediction ? "Write the common expression only once, keeping the two counts as an unevaluated sum."
        : "Reconstruct both steps: factor the shared expression, then evaluate only its coefficient. Why is the chain still valid when the shared expression is zero?",
      objectIds: source.states.slice(0, answerStep + 1).map(s => s.id), transformationIds: operationIds.slice(0, answerStep),
      ...(prediction ? {} : { selectorIds: draft.animation.bundle.objects.find(object => object.id === source.states[2].id)!.selectors.map(selector => selector.id) }),
      answer: prediction ? { kind: "transformation", value: operationIds[0]! } : { kind: "text", value: source.states[2].latex } });
    const projection = (prediction ? createKpAnimationPredictNextProjection : createKpAnimationClozeProjection)({ animation: draft.animation, card, progress: 0 });
    if (projection.diagnostics.length) throw new Error("Composed practice must bind the verified chain operations.");
    return Object.freeze({ kind, revisionId: draft.revisionId, card, projection, answerStep,
      answerLatex: source.states[answerStep].latex,
      answerExplanation: prediction ? "Distributing the common expression recovers the two ordered products, with no division."
        : "Reverse distribution preserves the shared expression; exact addition simplifies only its count. No division is used, so the shared expression may be zero." });
  }));
}
export function captureComposedAlgebraPosition(draft: KpComposedAlgebraPresentation, progress: number) {
  assertKpComposedAlgebraPresentation(draft);
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new Error("Select a composed position between zero and one.");
  const position = createKpFocusDeckCheckpointMap(draft.checkpointProgress).positionAt(progress);
  const referenceId = Number.isInteger(position) ? draft.checked.source.states[position]!.id : draft.animation.transformations[Math.floor(position)]!.id;
  return Object.freeze({ schemaVersion: "kp.composed-algebra-position.v1", sourceId: draft.checked.source.id,
    revisionId: draft.revisionId, referenceId, progress });
}
export function resolveComposedAlgebraPosition(draft: KpComposedAlgebraPresentation, value: unknown): number {
  assertKpComposedAlgebraPresentation(draft);
  if (typeof value !== "object" || value === null || !("progress" in value) || typeof value.progress !== "number") throw new Error("Restore a revision-pinned composed position.");
  const expected = captureComposedAlgebraPosition(draft, value.progress);
  if (Object.keys(value).length !== Object.keys(expected).length || Object.entries(expected).some(([key, selected]) => Reflect.get(value, key) !== selected))
    throw new Error("Return position belongs to another source, revision or semantic reference.");
  return expected.progress;
}
