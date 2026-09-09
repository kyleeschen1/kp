import { assertKpPreparedCommonFactorDraft, type KpPreparedCommonFactorDraft } from "../../authoring/common-factor-draft.ts";
import { createKpFlashcardSpec } from "../../semantic/asset-flashcard.ts";
import { createKpAnimationClozeProjection, createKpAnimationPredictNextProjection } from "../../animation/flashcard-projection.ts";
import { commonFactorEndpoints } from "./endpoints.ts";

export function projectCommonFactorPrompts(draft: KpPreparedCommonFactorDraft) {
  assertKpPreparedCommonFactorDraft(draft);
  const endpoints = commonFactorEndpoints(draft), operation = draft.animation.transformations[0]!;
  return Object.freeze((["prediction", "reconstruction"] as const).map(kind => {
    const prediction = kind === "prediction";
    const card = createKpFlashcardSpec({ id: `${draft.source.id}.${kind}`, kind: prediction ? "predict-next" : "cloze",
      title: prediction ? "Predict the factored form" : "Reconstruct the reasoning", assetId: draft.animation.bundle.id,
      prompt: prediction ? "What equivalent expression writes the repeated factor only once?"
        : "Reconstruct the factoring step. Identify the shared factor and explain why the step still holds when that factor is zero.",
      objectIds: [endpoints[0]!.stateId, endpoints[1]!.stateId], transformationIds: [operation.id],
      ...(prediction ? {} : { selectorIds: endpoints[1]!.annotated.annotations.map(a => a.selectorId) }),
      answer: prediction ? { kind: "transformation", value: operation.id } : { kind: "text", value: endpoints[1]!.annotated.rawLatex } });
    const projection = (prediction ? createKpAnimationPredictNextProjection : createKpAnimationClozeProjection)({ animation: draft.animation, card, progress: 0 });
    if (projection.diagnostics.length) throw new Error("Factoring practice must bind the complete verified operation.");
    return Object.freeze({ kind, revisionId: draft.revisionId, card, projection, answerLatex: endpoints[1]!.annotated.rawLatex,
      answerExplanation: "Distributing the common factor recovers both ordered products. This uses no division, so the factor may be zero." });
  }));
}

export function captureCommonFactorPosition(draft: KpPreparedCommonFactorDraft, progress: number) {
  assertKpPreparedCommonFactorDraft(draft);
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new Error("Select a factoring position between its two endpoints.");
  return Object.freeze({ schemaVersion: "kp.common-factor-position.v1", sourceId: draft.source.id, revisionId: draft.revisionId,
    referenceId: progress === 0 ? draft.source.states[0].id : progress === 1 ? draft.source.states[1].id : `${draft.source.id}.factor`, progress });
}
export function resolveCommonFactorPosition(draft: KpPreparedCommonFactorDraft, value: unknown): number {
  assertKpPreparedCommonFactorDraft(draft);
  if (typeof value !== "object" || value === null || !("progress" in value) || typeof value.progress !== "number") throw new Error("Restore a revision-pinned factoring position.");
  const expected = captureCommonFactorPosition(draft, value.progress);
  if (Object.keys(value).length !== Object.keys(expected).length || Object.entries(expected).some(([key, selected]) => Reflect.get(value, key) !== selected))
    throw new Error("Return position belongs to another source, revision or semantic reference.");
  return expected.progress;
}
