import assert from "node:assert/strict";
import test from "node:test";
import { BinaryJointModel, ProbabilityRepairGap } from "../domains/probability/binary-joint-model.ts";
import { compileBinaryProbabilityTrace } from "../domains/probability/binary-probability-trace.ts";
import { bindBayesEditorial } from "../src/experiments/bayesian-reasoning/editorial-binding.ts";
import { projectBayesEditorialFacts } from "../src/experiments/bayesian-reasoning/editorial-binding.ts";
import { editorialFixture } from "./fixtures/bayes-editorial-source.ts";

test("editorial facts come from verified queries and update when the model changes", () => {
  const raw = editorialFixture(), trace = compileBinaryProbabilityTrace(BinaryJointModel.from(raw.model));
  const facts = projectBayesEditorialFacts(trace), bound = bindBayesEditorial(trace, raw.editorial);
  assert.equal(bound.passages[0]!.body, `The selected share is ${facts.posterior}`);
  assert.equal(Object.isFrozen(bound.readings.full), true);
  const changed = compileBinaryProbabilityTrace(BinaryJointModel.from({ kind: "prior-likelihoods", sourceId: raw.model.sourceId,
    events: raw.model.events, prior: "1/100", likelihoods: ["9/10", "1/20"] }));
  const next = projectBayesEditorialFacts(changed);
  assert.deepEqual([next.population, next["count.tt"], next["count.tf"], next["count.ft"], next["count.ff"], next["count.flagged"], next.posterior],
    ["2000", "18", "2", "99", "1881", "117", "2/13"]);
  assert.notEqual(bindBayesEditorial(changed, raw.editorial).passages[0]!.body, bound.passages[0]!.body);
  assert.throws(() => bindBayesEditorial({ ...trace }, raw.editorial), /Compile a trace/);
});

test("foreign, duplicate and reordered editorial stops are located repair gaps", () => {
  for (const stateId of ["other.state.population", "probability.flagged-ticket.v1.state.first-branches"]) {
    const raw = editorialFixture(), trace = compileBinaryProbabilityTrace(BinaryJointModel.from(raw.model));
    raw.editorial.passages[0]!.stateId = stateId;
    assert.throws(() => bindBayesEditorial(trace, raw.editorial), (error: unknown) => error instanceof ProbabilityRepairGap
      && error.diagnostic.path === "$.editorial.passages[0].stateId");
  }
  const raw = editorialFixture(), trace = compileBinaryProbabilityTrace(BinaryJointModel.from(raw.model));
  raw.editorial.passages.reverse();
  assert.throws(() => bindBayesEditorial(trace, raw.editorial), /semantic order/);
});
