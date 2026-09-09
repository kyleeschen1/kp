import { requireBinaryProbabilityTrace, type BinaryProbabilityTrace } from "../../../domains/probability/binary-probability-trace.ts";
import { ProbabilityRepairGap } from "../../../domains/probability/binary-joint-model.ts";
import { formatBayesMass as mass } from "./display-units.ts";

/** Domain facts are available before lesson revisioning or Article compilation.
 * Editorial binding and downstream context share this owner, not prose parsing. */
export function projectBayesTraceContext(trace: BinaryProbabilityTrace) {
  requireBinaryProbabilityTrace(trace);
  const model = trace.model, conditioned = trace.states[4];
  if (conditioned?.kind !== "conditioned") throw new ProbabilityRepairGap("probability.reference", "$.trace", "Use the existing seven-stop Bayesian trace.");
  const query = conditioned.query;
  const definitions = Object.freeze(model.events.map((event, index) => Object.freeze({ id: event.id,
    symbol: index === 0 ? "A" : "B", label: event.label, complementLabel: event.complementLabel })));
  const assumptions = Object.freeze([
    "Four disjoint, exhaustive joint outcomes describe one stipulated population; no independence assumption is made.",
    `Conditioning uses B as its reference population; P(B) = ${mass(query.denominator)} is positive.`,
    "Tree order changes factorization, not joint probabilities or causal direction."
  ]);
  const facts = Object.freeze({ jointMasses: Object.freeze(model.outcomes.map(outcome => Object.freeze({
    outcomeId: outcome.id, mass: mass(outcome.mass) }))), numerator: mass(query.numerator),
    denominator: mass(query.denominator), posterior: mass(query.value), referencePopulationId: query.referencePopulation.populationId });
  return Object.freeze({ definitions, assumptions, facts,
    references: Object.freeze([...trace.states.map(state => state.id), ...trace.operations.map(operation => operation.id)]) });
}
