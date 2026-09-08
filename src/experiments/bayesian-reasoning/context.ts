import { requirePreparedBayesDraft, type PreparedBayesDraft } from "./draft.ts";
import { formatBayesMass as mass } from "./tree-svg.ts";

/** Shared probability context is data. Extraction and practice must not compile
 * an Article just to retrieve definitions or the denominator's population. */
export function projectBayesContext(draft: PreparedBayesDraft) {
  requirePreparedBayesDraft(draft);
  const { model, tree, trace } = draft, query = tree.query;
  const definitions = Object.freeze(model.events.map((event, index) => Object.freeze({ id: event.id,
    symbol: index === 0 ? "A" : "B", label: event.label, complementLabel: event.complementLabel })));
  const assumptions = Object.freeze([
    "Four disjoint, exhaustive joint outcomes describe one stipulated population; no independence assumption is made.",
    `Conditioning uses B as its reference population; P(B) = ${mass(query.denominator)} is positive.`,
    "Tree order changes factorization, not joint probabilities or causal direction."
  ]);
  const facts = Object.freeze({ jointMasses: Object.freeze(model.outcomes.map(outcome => Object.freeze({
    outcomeId: outcome.id, mass: mass(outcome.mass) }))), numerator: mass(query.numerator),
    denominator: mass(query.denominator), posterior: mass(query.value), referencePopulationId: tree.marginalId });
  return Object.freeze({ revisionId: draft.revisionId, definitions, assumptions, facts,
    references: Object.freeze([...trace.states.map(state => state.id), ...trace.operations.map(operation => operation.id)]) });
}
