import { marginalProbability } from "../../../domains/probability/binary-probability-queries.ts";
import { createKpFlashcardSpec } from "../../semantic/asset-flashcard.ts";
import { createKpAnimationClozeProjection, createKpAnimationPredictNextProjection } from "../../animation/flashcard-projection.ts";
import { requirePreparedBayesDraft, type PreparedBayesDraft } from "./draft.ts";
import { extractBayesDenominator } from "./extraction.ts";
import { formatBayesMass as mass } from "./tree-svg.ts";

export function projectBayesPrompts(draft: PreparedBayesDraft) {
  requirePreparedBayesDraft(draft);
  const extraction = extractBayesDenominator(draft, 2), query = draft.tree.query;
  const prior = marginalProbability(draft.model, { eventId: draft.model.events[0].id, occurs: true }).mass;
  const comparison = query.value.numerator * prior.denominator - prior.numerator * query.value.denominator;
  const direction = comparison > 0n ? "higher" : comparison < 0n ? "lower" : "unchanged";
  const animation = draft.authority.animation, target = draft.trace.states[4]!;
  return Object.freeze((["prediction", "reconstruction"] as const).map(kind => {
    const prediction = kind === "prediction";
    const authored = draft.editorial?.prompts[kind];
    const prompt = authored?.body ?? (prediction ? `Before evaluating: is P(A | B) higher, lower or unchanged from P(A) = ${mass(prior)}? Explain which evidence supports your prediction.`
      : "Reconstruct P(A | B). Which disjoint outcomes make up the denominator, and why is B—not the whole population—the reference?");
    // Wording is editorial. Neither authored prose nor fact interpolation may
    // issue an answer, selector, operation or grading authority.
    const answer = prediction ? `${direction}. P(A | B) = ${mass(query.value)}, compared with P(A) = ${mass(prior)}.`
      : `B consists of A ∩ B and not A ∩ B. Sum their joint masses to obtain P(B) = ${mass(query.denominator)}. Restrict to B, then divide P(A ∩ B) = ${mass(query.numerator)} by that positive denominator: ${mass(query.value)}.`;
    const card = createKpFlashcardSpec({ id: `${draft.model.sourceId}.${kind}`, kind: prediction ? "predict-next" : "cloze",
      title: authored?.title ?? (prediction ? "Predict the evidence's effect" : "Reconstruct the denominator"), assetId: animation.bundle.id, prompt,
      objectIds: [draft.trace.states[2]!.id, target.id], transformationIds: extraction.operations,
      ...(prediction ? {} : { selectorIds: draft.model.outcomes.map(outcome => `${target.id}.${outcome.key}`) }),
      answer: { kind: "text", value: answer } });
    const projection = (prediction ? createKpAnimationPredictNextProjection : createKpAnimationClozeProjection)({ animation, card, progress: 2 / 6 });
    if (projection.diagnostics.length) throw new Error(`Bayes prompt references do not close: ${JSON.stringify(projection.diagnostics)}`);
    return Object.freeze({ kind, revisionId: draft.revisionId, direction, card, projection, extraction,
      context: Object.freeze({ definitions: extraction.definitions, jointMasses: Object.freeze(draft.model.outcomes.map(outcome => `${outcome.key}: ${mass(outcome.mass)}`)),
        assumptions: Object.freeze(["Four disjoint exhaustive outcomes in one stipulated population.", "Conditioning requires a positive B population; no independence is assumed."]) }) });
  }));
}
