import { requireBinaryProbabilityTrace, type BinaryProbabilityTrace } from "../../../domains/probability/binary-probability-trace.ts";
import { createKpSemanticScene } from "../../semantic/semantic-scene-protocol.ts";
import { createKpSemanticEntity, createKpSemanticEntityRegistry } from "../../semantic/semantic-entity-provenance.ts";
import { createKpAnimationSaliencePlan, type KpAnimationSalienceIntent } from "../../animation/salience-plan.ts";
import { createBayesDisplayUnits } from "./display-units.ts";

/** This is the provisional binary-tree presentation, not probability truth or
 * a shared diagram grammar. Stable leaves survive changes of factorization. */
export function createBayesTreePlan(trace: BinaryProbabilityTrace) {
  requireBinaryProbabilityTrace(trace);
  const initial = trace.states[2]!, reordered = trace.states[6]!, conditioned = trace.states[4]!;
  if (initial.kind !== "tree" || reordered.kind !== "tree" || conditioned.kind !== "conditioned") throw new Error("Bayes tree requires the bounded seven-state trace.");
  const rootId = `${trace.model.sourceId}.population`, marginalId = conditioned.population.evidence.populationId, ratioId = `${trace.model.sourceId}.conditional-ratio`;
  const outcomeIds = trace.model.outcomes.map(outcome => outcome.id);
  const branches = [initial.tree, reordered.tree].flatMap(tree => tree.branches.map(branch => branch.occurrenceId));
  const scene = createKpSemanticScene({ id: `${trace.model.sourceId}.scene`, surfaceKind: "mixed", title: "One joint distribution, two factorizations",
    registry: createKpSemanticEntityRegistry({ entities: [...outcomeIds, ...branches, rootId, marginalId, ratioId].map(id => createKpSemanticEntity({
      id, semanticKind: outcomeIds.includes(id) ? "joint-outcome" : branches.includes(id) ? "branch-occurrence" : "probability-quantity",
      label: id, provenance: { kind: "authored", sourceId: trace.model.sourceId }
    })) }), groups: [{ id: `${marginalId}.group`, memberEntityIds: conditioned.population.evidence.outcomeIds, label: "Outcomes in the reference event B" }] });
  const intents: KpAnimationSalienceIntent[] = [
    { id: "bayes.population", kind: "notice", targetEntityIds: [rootId], summary: "Inspect the original population." },
    { id: "bayes.first", kind: "notice", targetEntityIds: initial.tree.branches.map(branch => branch.occurrenceId), summary: "Notice the first partition." },
    { id: "bayes.joint", kind: "notice", targetEntityIds: outcomeIds, summary: "Follow each path to a distinct joint outcome." },
    { id: "bayes.gather", kind: "transmit", sourceEntityIds: conditioned.population.evidence.outcomeIds, targetEntityIds: [marginalId], summary: "Gather the evidence outcomes into their marginal." },
    { id: "bayes.condition", kind: "transmit", sourceEntityIds: [trace.model.outcomes[0].id, marginalId], targetEntityIds: [ratioId], summary: "Compare the joint numerator with its positive reference population." },
    { id: "bayes.restore", kind: "notice", targetEntityIds: [rootId, ...outcomeIds], summary: "Restore all outcomes before changing the question." },
    { id: "bayes.reorder", kind: "notice", targetEntityIds: [...outcomeIds, ...reordered.tree.branches.map(branch => branch.occurrenceId)], summary: "Track unchanged outcomes through a new factorization." }
  ];
  const salience = createKpAnimationSaliencePlan({ id: "bayes.salience", scenes: [scene], intents });
  return Object.freeze({ trace, initial: initial.tree, reordered: reordered.tree, query: conditioned.query, rootId, marginalId, ratioId, scene, salience,
    display: createBayesDisplayUnits(trace.model) });
}
export type BayesTreePlan = ReturnType<typeof createBayesTreePlan>;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const p = clamp(value); return p * p * (3 - 2 * p); };
const mix = (a: number, b: number, progress: number) => a + (b - a) * progress;

export function sampleBayesTree(plan: BayesTreePlan, position: number) {
  if (!Number.isFinite(position) || position < 0 || position > 6) throw new RangeError("Bayes presentation position must be within its seven semantic stops.");
  const gather = position <= 3 ? smooth(position - 2) : position <= 4 ? 1 : 1 - smooth(position - 4);
  const flip = smooth((position - 5 - .2) / .6);
  const branchPresence = position < 2 ? smooth(position) : position <= 3 ? 1 - smooth((position - 2) / .45)
    : position <= 4 ? 0 : position <= 5 ? smooth((position - 4 - .55) / .45) : 1 - smooth((position - 5) / .25);
  const targetPresence = smooth((position - 5 - .72) / .28);
  const conditioned = smooth(position - 3) * (1 - smooth(position - 4));
  // Intent resolves the scene as a collection. Adapters consume this hierarchy;
  // presence below is a separate construction/withdrawal decision.
  const index = Math.min(6, Math.floor(position));
  const intent = plan.salience.intents[index]!;
  const focus = intent.kind === "transmit" ? [...intent.sourceEntityIds, ...intent.targetEntityIds]
    : intent.kind === "notice" ? intent.targetEntityIds : [];
  const hierarchy = plan.scene.registry.entities.map(entity => ({ id: entity.id, salience: focus.includes(entity.id) ? "focus" as const : "context" as const }));
  const leaves = plan.trace.model.outcomes.map(outcome => {
    const row = (first: 0 | 1) => (outcome.values[first] ? 0 : 2) + (outcome.values[first === 0 ? 1 : 0] ? 0 : 1);
    const firstRow = row(plan.initial.first), reorderedRow = row(plan.reordered.first);
    const groupedRow = row(1);
    const y = mix(mix(75 + firstRow * 90, 75 + groupedRow * 90, gather), 75 + reorderedRow * 90, flip);
    // Opposite lateral lanes prevent the middle two semantic owners colliding
    // while their ordering changes. Curvature serves correspondence, not flourish.
    const lane = outcome.key === "tf" ? 1 : outcome.key === "ft" ? -1 : 0;
    const clearance = (progress: number) => smooth(Math.min(progress / .15, (1 - progress) / .15));
    const x = 540 + lane * 90 * ((firstRow === groupedRow ? 0 : clearance(gather)) + clearance(flip));
    return { id: outcome.id, key: outcome.key, x, y, presence: smooth(position - 1),
      inReferencePopulation: outcome.values[1], context: outcome.values[1] ? 0 : conditioned,
      mass: outcome.mass };
  });
  return { position, stateId: plan.trace.states[index]!.id, intentId: intent.id, hierarchy, leaves,
    rootX: mix(350, 60, smooth(position)), branchPresence, secondBranchPresence: branchPresence * smooth(position - 1),
    targetPresence, gather, conditioned, ratioFocus: conditioned,
    referencePopulationId: position >= 4 && position < 5 ? plan.marginalId : plan.rootId };
}
export type BayesTreeFrame = ReturnType<typeof sampleBayesTree>;
