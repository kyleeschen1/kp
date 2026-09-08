import { addKpRationals, createKpRational, divideKpRationals, type KpNormalizedRational } from "../math/exact-rational.ts";
import { BinaryJointModel, ProbabilityRepairGap, type BinaryOutcome, type ProbabilityRepairDiagnostic } from "./binary-joint-model.ts";

export interface ProbabilityEventQuery { readonly eventId: string; readonly occurs: boolean }
export interface ProbabilityMassEvidence {
  readonly populationId: string;
  readonly event: ProbabilityEventQuery;
  readonly outcomeIds: readonly string[];
  readonly mass: KpNormalizedRational;
}
export type ConditioningResult =
  | { readonly status: "defined"; readonly population: PositiveProbabilityPopulation }
  | { readonly status: "repair-gap"; readonly diagnostic: ProbabilityRepairDiagnostic };

const issued = new WeakSet<PositiveProbabilityPopulation>();
const authority = Symbol("positive population");

/** A denominator is a validated population, not an arbitrary positive number. */
export class PositiveProbabilityPopulation {
  readonly evidence: ProbabilityMassEvidence;
  readonly #model: BinaryJointModel;
  private constructor(token: symbol, model: BinaryJointModel, evidence: ProbabilityMassEvidence) {
    if (token !== authority) throw new ProbabilityRepairGap("probability.reference", "$", "Obtain a population through conditionOnEvent.");
    this.#model = model;
    this.evidence = evidence;
    issued.add(this);
    Object.freeze(this);
  }
  static from(model: BinaryJointModel, event: ProbabilityEventQuery): ConditioningResult {
    const evidence = marginalProbability(model, event);
    if (evidence.mass.numerator === 0n) return Object.freeze({ status: "repair-gap", diagnostic: Object.freeze({
      code: "probability.undefined-condition", path: "$.condition", expected: `The event ${event.eventId}=${event.occurs} has zero mass; its conditional probabilities are undefined.` }) });
    return Object.freeze({ status: "defined", population: new PositiveProbabilityPopulation(authority, model, evidence) });
  }
  static require(population: PositiveProbabilityPopulation, model: BinaryJointModel): void {
    BinaryJointModel.require(model);
    if (!issued.has(population) || population.#model !== model)
      throw new ProbabilityRepairGap("probability.reference", "$.population", "Use positive population evidence from this exact model instance.");
  }
}

export function marginalProbability(model: BinaryJointModel, event: ProbabilityEventQuery): ProbabilityMassEvidence {
  const selected = selectEventOutcomes(model, event);
  return Object.freeze({ populationId: `${model.sourceId}.population.${event.eventId}.${event.occurs ? "yes" : "no"}`,
    event: Object.freeze({ eventId: event.eventId, occurs: event.occurs }),
    outcomeIds: Object.freeze(selected.map(outcome => outcome.id)), mass: sumMasses(selected) });
}

export function conditionalProbability(model: BinaryJointModel, event: ProbabilityEventQuery, population: PositiveProbabilityPopulation) {
  PositiveProbabilityPopulation.require(population, model);
  const included = new Set(population.evidence.outcomeIds);
  const joint = selectEventOutcomes(model, event).filter(outcome => included.has(outcome.id));
  const numerator = sumMasses(joint), denominator = population.evidence.mass;
  return Object.freeze({ kind: "conditional-probability" as const,
    event: Object.freeze({ eventId: event.eventId, occurs: event.occurs }),
    referencePopulation: population.evidence, outcomeIds: Object.freeze(joint.map(outcome => outcome.id)),
    numerator, denominator, value: divideKpRationals(numerator, denominator), lawId: "probability.conditional-ratio.v1" });
}

export function selectEventOutcomes(model: BinaryJointModel, event: ProbabilityEventQuery): readonly BinaryOutcome[] {
  BinaryJointModel.require(model);
  if (!event || typeof event !== "object" || typeof event.occurs !== "boolean")
    throw new ProbabilityRepairGap("probability.reference", "$.event", "Select a known event with an explicit boolean outcome.");
  const axis = model.events.findIndex(candidate => candidate.id === event.eventId);
  if (axis !== 0 && axis !== 1) throw new ProbabilityRepairGap("probability.reference", "$.event.eventId", "Select one of this model's stable event IDs.");
  return Object.freeze(model.outcomes.filter(outcome => outcome.values[axis] === event.occurs));
}

export function sumMasses(outcomes: readonly BinaryOutcome[]): KpNormalizedRational {
  return outcomes.reduce((sum, outcome) => addKpRationals(sum, outcome.mass), createKpRational(0n));
}
