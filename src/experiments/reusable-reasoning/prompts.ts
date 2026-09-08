import type { KpAnimationAsset } from "../../animation/asset.ts";
import { createKpFlashcardSpec } from "../../semantic/asset-flashcard.ts";
import { createKpAnimationClozeProjection, createKpAnimationPredictNextProjection } from "../../animation/flashcard-projection.ts";
import { freezeKpReasoningOwnedProjection, type KpReasoningEvidence } from "./evidence.ts";
import { extractKpReasoningContext } from "./extraction.ts";
import { KpReasoningRepairGap } from "./source.ts";

export type ReasoningPromptKind = "prediction" | "reconstruction";

export function projectReasoningPrompts(evidence: KpReasoningEvidence, animation: KpAnimationAsset) {
  const context = extractKpReasoningContext(evidence);
  const count = context.operations.length;
  const target = context.states[count]!;
  const answerLatex = target.segments.map(segment => segment.latex).join("");
  for (const state of context.states) {
    const value = animation.bundle.objects.find(item => item.id === state.stateId)?.value;
    if (typeof value !== "object" || value === null || !("latex" in value)
      || value.latex !== state.segments.map(segment => segment.latex).join(""))
      throw new KpReasoningRepairGap("kp.reasoning.prompt-endpoint", "$.animation", "Use native endpoints matching the verified source.");
  }
  return Object.freeze((["prediction", "reconstruction"] as const).map(kind => {
    const prediction = kind === "prediction";
    const operations = prediction ? context.operations.slice(-1) : context.operations;
    const startIndex = prediction ? count - 1 : 0;
    const prompt = prediction ? "What is the next equivalent equation? Name the operation that produces it."
      : `Reconstruct the ${count}-step reason from this equation. Include every intermediate handoff before comparing your answer.`;
    const card = createKpFlashcardSpec({ id: `${evidence.source.id}.${kind}`, kind: prediction ? "predict-next" : "cloze",
      title: prediction ? "Predict the next step" : "Reconstruct the reason", assetId: animation.bundle.id, prompt,
      objectIds: [context.states[startIndex]!.stateId, target.stateId],
      transformationIds: operations.map(item => item.reference.id),
      ...(prediction ? {} : { selectorIds: target.selectorIds }),
      answer: prediction ? { kind: "transformation", value: operations[0]!.reference.id }
        : { kind: "text", value: answerLatex } });
    const projection = (prediction ? createKpAnimationPredictNextProjection : createKpAnimationClozeProjection)({
      animation, card, progress: startIndex / (evidence.states.length - 1) });
    if (projection.diagnostics.length) throw new KpReasoningRepairGap(
      "kp.reasoning.prompt-bindings", "$.prompt", JSON.stringify(projection.diagnostics));
    const result = { kind, revisionId: evidence.revisionId, card, projection,
      startProgress: startIndex / (evidence.states.length - 1), answerProgress: count / (evidence.states.length - 1),
      answerLatex, answerStateId: target.stateId, answerOperations: operations.map(item => item.reference),
      assumptions: context.assumptions, context };
    freezeKpReasoningOwnedProjection(result);
    return result;
  }));
}
