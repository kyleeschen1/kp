import { createKpRational, equalKpRationals, multiplyKpRationals, type KpNormalizedRational } from "../math/exact-rational.ts";
import { BinaryJointModel, ProbabilityRepairGap, type BinaryAxis, type BinaryOutcome } from "./binary-joint-model.ts";
import { conditionalProbability, marginalProbability, PositiveProbabilityPopulation, type ProbabilityEventQuery } from "./binary-probability-queries.ts";

export interface BinaryTreeLeaf {
  readonly occurrenceId: string;
  readonly outcome: BinaryOutcome;
  readonly conditional: KpNormalizedRational;
}
export type BinaryTreeBranch = {
  readonly occurrenceId: string;
  readonly event: ProbabilityEventQuery;
  readonly mass: KpNormalizedRational;
} & ({ readonly status: "reachable"; readonly leaves: readonly BinaryTreeLeaf[] }
  | { readonly status: "unreachable"; readonly outcomeIds: readonly string[] });

export function factorBinaryTree(model: BinaryJointModel, first: BinaryAxis) {
  BinaryJointModel.require(model);
  if (first !== 0 && first !== 1) throw new ProbabilityRepairGap("probability.reference", "$.first", "Choose one of the two event axes.");
  const second = first === 0 ? 1 : 0;
  const id = `${model.sourceId}.tree.${model.events[first].id}-first`;
  const branches: readonly BinaryTreeBranch[] = Object.freeze([true, false].map(occurs => {
    const event = Object.freeze({ eventId: model.events[first].id, occurs });
    const marginal = marginalProbability(model, event), population = PositiveProbabilityPopulation.from(model, event);
    const base = { occurrenceId: `${id}.${occurs ? "yes" : "no"}`, event, mass: marginal.mass };
    if (population.status === "repair-gap") return Object.freeze({ ...base, status: "unreachable" as const, outcomeIds: marginal.outcomeIds });
    const leaves = Object.freeze([true, false].map(secondOccurs => {
      const outcome = model.outcomes.find(candidate => candidate.values[first] === occurs && candidate.values[second] === secondOccurs)!;
      const conditional = conditionalProbability(model, { eventId: model.events[second].id, occurs: secondOccurs }, population.population).value;
      if (!equalKpRationals(multiplyKpRationals(marginal.mass, conditional), outcome.mass))
        throw new ProbabilityRepairGap("probability.reference", "$.tree", "Branch factorization must reproduce the original joint mass.");
      return Object.freeze({ occurrenceId: `${base.occurrenceId}.${outcome.key}`, outcome, conditional });
    }));
    return Object.freeze({ ...base, status: "reachable" as const, leaves });
  }));
  return Object.freeze({ id, first, second, model, branches });
}

export type BinaryTree = ReturnType<typeof factorBinaryTree>;
export type BinaryProbabilityState =
  | { readonly id: string; readonly kind: "population" }
  | { readonly id: string; readonly kind: "tree"; readonly tree: BinaryTree; readonly depth: 1 | 2 }
  | { readonly id: string; readonly kind: "marginal"; readonly tree: BinaryTree; readonly population: PositiveProbabilityPopulation }
  | { readonly id: string; readonly kind: "conditioned"; readonly tree: BinaryTree; readonly population: PositiveProbabilityPopulation;
      readonly query: ReturnType<typeof conditionalProbability> };
export type BinaryProbabilityOperationKind = "construct" | "collapse" | "condition" | "restore-population" | "reorder";
export interface BinaryProbabilityOperation {
  readonly id: string;
  readonly kind: BinaryProbabilityOperationKind;
  readonly source: BinaryProbabilityState;
  readonly target: BinaryProbabilityState;
  readonly lawId: string;
  readonly jointOutcomeIds: readonly string[];
  readonly preservesJointDistribution: true;
  readonly changesReferencePopulation: boolean;
}
const traceBrand = Symbol("verified binary probability trace");
export interface BinaryProbabilityTrace {
  readonly [traceBrand]: true;
  readonly model: BinaryJointModel;
  readonly states: readonly BinaryProbabilityState[];
  readonly operations: readonly BinaryProbabilityOperation[];
}
const traces = new WeakSet<BinaryProbabilityTrace>();
export function requireBinaryProbabilityTrace(trace: BinaryProbabilityTrace): void {
  if (!traces.has(trace)) throw new ProbabilityRepairGap("probability.reference", "$.trace", "Compile a trace from the validated domain model.");
  BinaryJointModel.require(trace.model);
}

/** This score returns to the retained full population before refactoring it.
 * The joint model is never overwritten with a conditional projection. */
export function compileBinaryProbabilityTrace(model: BinaryJointModel, first: BinaryAxis = 0): BinaryProbabilityTrace {
  BinaryJointModel.require(model);
  const tree = factorBinaryTree(model, first), flipped = factorBinaryTree(model, first === 0 ? 1 : 0);
  const condition = PositiveProbabilityPopulation.from(model, { eventId: model.events[1].id, occurs: true });
  if (condition.status === "repair-gap") throw new ProbabilityRepairGap(condition.diagnostic.code, condition.diagnostic.path, condition.diagnostic.expected);
  const population = condition.population;
  const query = conditionalProbability(model, { eventId: model.events[0].id, occurs: true }, population);
  const prefix = `${model.sourceId}.state`;
  const states: readonly BinaryProbabilityState[] = Object.freeze([
    Object.freeze({ id: `${prefix}.population`, kind: "population" as const }),
    Object.freeze({ id: `${prefix}.first-branches`, kind: "tree" as const, tree, depth: 1 as const }),
    Object.freeze({ id: `${prefix}.joint-tree`, kind: "tree" as const, tree, depth: 2 as const }),
    Object.freeze({ id: `${prefix}.marginal`, kind: "marginal" as const, tree, population }),
    Object.freeze({ id: `${prefix}.conditioned`, kind: "conditioned" as const, tree, population, query }),
    Object.freeze({ id: `${prefix}.full-population`, kind: "tree" as const, tree, depth: 2 as const }),
    Object.freeze({ id: `${prefix}.reordered`, kind: "tree" as const, tree: flipped, depth: 2 as const })
  ]);
  const kinds: readonly BinaryProbabilityOperationKind[] = ["construct", "construct", "collapse", "condition", "restore-population", "reorder"];
  const outcomeIds = Object.freeze(model.outcomes.map(outcome => outcome.id));
  const operations = Object.freeze(kinds.map((kind, index): BinaryProbabilityOperation => Object.freeze({
    id: `${model.sourceId}.operation.${index}.${kind}`, kind, source: states[index]!, target: states[index + 1]!,
    lawId: `probability.${kind}.v1`, jointOutcomeIds: outcomeIds, preservesJointDistribution: true,
    changesReferencePopulation: kind === "condition" || kind === "restore-population"
  })));
  const trace: BinaryProbabilityTrace = Object.freeze({ [traceBrand]: true as const, model, states, operations });
  traces.add(trace);
  return trace;
}

export function treeJointMass(tree: BinaryTree, outcomeId: string): KpNormalizedRational {
  for (const branch of tree.branches) {
    if (branch.status === "unreachable") {
      if (branch.outcomeIds.includes(outcomeId)) return createKpRational(0n);
    } else {
      const leaf = branch.leaves.find(candidate => candidate.outcome.id === outcomeId);
      if (leaf) return multiplyKpRationals(branch.mass, leaf.conditional);
    }
  }
  throw new ProbabilityRepairGap("probability.reference", "$.outcomeId", "Choose a joint outcome in this tree.");
}
