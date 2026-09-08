import assert from "node:assert/strict";
import test from "node:test";
import { BinaryJointModel, createFlaggedTicketSource, ProbabilityRepairGap } from "../domains/probability/binary-joint-model.ts";
import { conditionalProbability, marginalProbability, PositiveProbabilityPopulation, type ConditioningResult } from "../domains/probability/binary-probability-queries.ts";
import { addKpRationals, createKpRational, equalKpRationals } from "../domains/math/exact-rational.ts";

const urgent = { eventId: "urgent", occurs: true }, flagged = { eventId: "flagged", occurs: true };
test("marginals and conditionals preserve exact outcome and population evidence", () => {
  const model = BinaryJointModel.from(createFlaggedTicketSource());
  const result = PositiveProbabilityPopulation.from(model, flagged);
  assert.equal(result.status, "defined");
  if (result.status !== "defined") throw Error("expected positive flagged population");
  const query = conditionalProbability(model, urgent, result.population);
  assert.ok(equalKpRationals(query.value, createKpRational(2n, 3n)));
  assert.ok(equalKpRationals(query.denominator, createKpRational(6n, 25n)));
  assert.equal(query.referencePopulation.populationId, `${model.sourceId}.population.flagged.yes`);
  assert.deepEqual(query.outcomeIds, [model.outcomes[0].id]);
  const complement = conditionalProbability(model, { ...urgent, occurs: false }, result.population);
  assert.ok(equalKpRationals(addKpRationals(query.value, complement.value), createKpRational(1n)));
  assert.ok(Object.isFrozen(query.referencePopulation.event));
});

test("positive populations are model-bound capabilities, not serialized positive numbers", () => {
  const model = BinaryJointModel.from(createFlaggedTicketSource()), other = BinaryJointModel.from(createFlaggedTicketSource());
  const result = PositiveProbabilityPopulation.from(model, flagged);
  if (result.status !== "defined") throw Error("expected positive population");
  assert.throws(() => conditionalProbability(other, urgent, result.population), ProbabilityRepairGap);
  assert.throws(() => conditionalProbability(model, urgent, { ...result.population } as PositiveProbabilityPopulation), ProbabilityRepairGap);
  assert.throws(() => marginalProbability(model, { eventId: "other", occurs: true }), ProbabilityRepairGap);
});

test("zero-mass conditioning is a typed gap, including when another marginal is positive", () => {
  const model = BinaryJointModel.from({ ...createFlaggedTicketSource(), masses: ["0/1", "1/5", "0/1", "4/5"] });
  const result = PositiveProbabilityPopulation.from(model, flagged);
  assert.equal(result.status, "repair-gap");
  if (result.status === "repair-gap") assert.equal(result.diagnostic.code, "probability.undefined-condition");
  assert.equal("value" in result, false);
  const valid = PositiveProbabilityPopulation.from(model, { ...flagged, occurs: false });
  if (valid.status !== "defined") throw Error("complement population is positive");
  assert.ok(equalKpRationals(conditionalProbability(model, flagged, valid.population).value, createKpRational(0n)));
});

function staticBoundary(model: BinaryJointModel, result: ConditioningResult) {
  // @ts-expect-error a conditional cannot consume an unchecked result union
  conditionalProbability(model, urgent, result.population);
  // @ts-expect-error a denominator number is not population evidence
  conditionalProbability(model, urgent, { evidence: { mass: createKpRational(1n) } });
}
void staticBoundary;
