import { ProbabilityRepairGap } from "../../../domains/probability/binary-joint-model.ts";
import { requirePreparedBayesDraft, type PreparedBayesDraft } from "./draft.ts";
import { projectBayesReading } from "./readings.ts";

export function pinBayesPosition(draft: PreparedBayesDraft, step: number) {
  requirePreparedBayesDraft(draft);
  if (!Number.isFinite(step) || step < 0 || step > draft.trace.states.length - 1)
    throw new ProbabilityRepairGap("probability.reference", "$.position", "Choose a finite position inside the seven-state probability trace.");
  const reference = Number.isInteger(step)
    ? { kind: "state" as const, id: draft.trace.states[step]!.id }
    : { kind: "operation" as const, id: draft.trace.operations[Math.floor(step)]!.id };
  return Object.freeze({ sourceId: draft.model.sourceId, revisionId: draft.revisionId, step,
    reference: Object.freeze({ ...reference, timelineAuthority: "none" as const }) });
}
export type BayesPosition = ReturnType<typeof pinBayesPosition>;

export function resolveBayesPosition(draft: PreparedBayesDraft, value: unknown): BayesPosition {
  if (!value || typeof value !== "object") throw new ProbabilityRepairGap("probability.reference", "$.position", "Restore an explicit revision-pinned position.");
  const candidate = value as Partial<BayesPosition>, expected = pinBayesPosition(draft, candidate.step!);
  if (candidate.sourceId !== expected.sourceId || candidate.revisionId !== expected.revisionId ||
    candidate.reference?.id !== expected.reference.id || candidate.reference?.kind !== expected.reference.kind ||
    candidate.reference?.timelineAuthority !== "none")
    throw new ProbabilityRepairGap("probability.reference", "$.position.reference", "Use the matching semantic reference and exact source revision, not a stale or forged position.");
  return expected;
}

export function extractBayesDenominator(draft: PreparedBayesDraft, returnStep: number) {
  const returnTo = pinBayesPosition(draft, returnStep), reading = projectBayesReading(draft, "compact");
  const query = draft.tree.query;
  return Object.freeze({ schemaVersion: "kp.bayes-denominator-extraction.v1" as const,
    sourceId: draft.model.sourceId, revisionId: draft.revisionId,
    parentId: `${draft.model.sourceId}.conditional-question`, reasonId: `${draft.model.sourceId}.denominator-reason`,
    returnTo, definitions: reading.definitions, assumptions: reading.assumptions,
    referencePopulationId: query.referencePopulation.populationId,
    outcomeIds: Object.freeze([...draft.tree.trace.model.outcomes.filter(outcome => outcome.values[1]).map(outcome => outcome.id)]),
    numerator: reading.facts.numerator, denominator: reading.facts.denominator, posterior: reading.facts.posterior,
    operations: Object.freeze(draft.trace.operations.slice(2, 4).map(op => op.id)),
    sourceText: draft.sourceText });
}
export type BayesDenominatorExtraction = ReturnType<typeof extractBayesDenominator>;

/** Transported explanatory fields are context, never verification authority.
 * Restore rebinds the semantic return reference against the current issuer. */
export function resolveBayesDenominatorReturn(draft: PreparedBayesDraft, value: unknown) {
  if (!value || typeof value !== "object") throw new ProbabilityRepairGap("probability.reference", "$.extraction", "Provide a denominator extraction.");
  const candidate = value as Partial<BayesDenominatorExtraction>;
  const position = resolveBayesPosition(draft, candidate.returnTo);
  if (candidate.schemaVersion !== "kp.bayes-denominator-extraction.v1" || candidate.sourceId !== draft.model.sourceId ||
    candidate.revisionId !== draft.revisionId || candidate.parentId !== `${draft.model.sourceId}.conditional-question` ||
    candidate.reasonId !== `${draft.model.sourceId}.denominator-reason`)
    throw new ProbabilityRepairGap("probability.reference", "$.extraction", "Return within the same source revision, parent question and denominator reason.");
  return position;
}

export type BayesDisclosure = { readonly view: "parent"; readonly extraction?: never }
  | { readonly view: "reason"; readonly extraction: BayesDenominatorExtraction };
