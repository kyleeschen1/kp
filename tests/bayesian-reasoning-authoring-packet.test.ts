import assert from "node:assert/strict";
import test from "node:test";
import { assessBayesTrial, injectBayesTrialFault } from "../scripts/bayesian-authoring-trial-check.ts";
import { createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
const source = { schemaVersion: "kp.bayes-source.v1", model: {
  kind: "prior-likelihoods", sourceId: "probability.inspection-trial.v1",
  events: [{ id: "damaged", label: "Damaged parcel", complementLabel: "Undamaged parcel" },
    { id: "flagged", label: "Flagged inspection", complementLabel: "Unflagged inspection" }],
  prior: "1/10", likelihoods: ["4/5", "1/5"]
}, teaching: { firstEventId: "flagged", detailLevel: "key-steps" } };
test("Bayes trial separates compilation from exact requested fulfillment", () => {
  assert.equal(assessBayesTrial(JSON.stringify(createBayesDraft())).compiled, true);
  assert.equal(assessBayesTrial(JSON.stringify(createBayesDraft())).fulfilled, false);
  const valid = assessBayesTrial(JSON.stringify(source));
  assert.equal(valid.fulfilled, true); assert.equal(valid.posterior, "4/13"); assert.equal(valid.checkpoints, 7);
  const changed = structuredClone(source); changed.teaching.firstEventId = "damaged";
  assert.equal(assessBayesTrial(JSON.stringify(changed)).compiled, true);
  assert.equal(assessBayesTrial(JSON.stringify(changed)).fulfilled, false);
});
test("Bayes repair identifies unsupported field and rejects zero evidence and malformed input", () => {
  const broken = assessBayesTrial(injectBayesTrialFault(JSON.stringify(source)));
  assert.equal(broken.compiled, false); assert.equal(broken.diagnostic?.path, "$.teaching.durationMs");
  const zero = structuredClone(source); zero.model.likelihoods = ["0/1", "0/1"];
  assert.equal(assessBayesTrial(JSON.stringify(zero)).diagnostic?.code, "probability.undefined-condition");
  assert.equal(assessBayesTrial("{").fulfilled, false);
  assert.throws(() => injectBayesTrialFault("null"));
  assert.equal(assessBayesTrial(JSON.stringify(source)).fulfilled, true);
});
