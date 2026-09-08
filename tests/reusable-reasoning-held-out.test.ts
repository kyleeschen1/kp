import assert from "node:assert/strict";
import test from "node:test";
import { createKpReasoningSource } from "../src/experiments/reusable-reasoning/source.ts";
import { createCodeReasoningSource } from "../src/experiments/reusable-reasoning/code-evidence.ts";
import { createReasoningAuthoringSession } from "../src/experiments/reusable-reasoning/authoring.ts";
import { createKpAuthoredDistributionProjection } from "../src/experiments/authoring-structural/distribution-projection.ts";
import { assessReasoningTrial, injectReasoningTrialFaults } from "../scripts/run-reasoning-authoring-trial.ts";
import capture from "../docs/project/reviews/2026-09-08-reusable-reasoning-live-trial.json" with { type: "json" };

test("captured live outputs replay with exact revisions and reproducible injected diagnostics", () => {
  const result = assessReasoningTrial(capture.drafts);
  assert.equal(result.passed, true);
  if (result.equation.status === "compiled") assert.equal(result.equation.revisionId, "sha256:c061279d4041b1a698e34e3270a5d9ba809c8d20c7334a1ec218408dad2d015c");
  if (result.code.status === "compiled") assert.equal(result.code.revisionId, "sha256:a95faa5ce6455c5b6a07936036085500e49301202cf53dd2bf06b262aa916a0e");
  const rejected = assessReasoningTrial(injectReasoningTrialFaults(capture.drafts));
  assert.equal(rejected.passed, false);
  if (rejected.equation.status === "repair-gap") assert.equal(rejected.equation.diagnostic.code, "kp.reasoning.parent-conclusion");
  if (rejected.code.status === "repair-gap") assert.equal(rejected.code.diagnostic.path, "$.stageIds");
});

test("held-out early endpoints update every projection and preserve last valid truth on unsupported edits", () => {
  const session = createReasoningAuthoringSession(createKpAuthoredDistributionProjection().projection.animationCandidate);
  const base = createKpReasoningSource();
  for (const [count, endpoint] of [[1, "distributed"], [2, "normalized"]] as const) {
    const draft = { ...base, title: `Inspect ${endpoint}`, compact: `Read ${count} transformations.`,
      parent: { ...base.parent, targetStateId: `fraction-solve.state.${endpoint}` },
      reason: { ...base.reason, operationIds: base.reason.operationIds.slice(0, count) } };
    assert.equal(session.apply(JSON.stringify(draft)).status, "applied");
    const valid = session.getCurrent();
    for (const projection of [valid.full, valid.compact, valid.context, ...valid.prompts]) assert.equal(projection.revisionId, valid.evidence.revisionId);
    assert.equal(valid.context.states.length, count + 1);
    for (const prompt of valid.prompts) assert.equal(prompt.answerStateId, draft.parent.targetStateId);
    for (const broken of [{ ...draft, coefficient: 7 }, { ...draft, formula: { ...draft.formula, lawId: "kp.calculus.integrate" } },
      { ...draft, reason: { ...draft.reason, assumptionIds: [] } }]) {
      const rejected = session.apply(JSON.stringify(broken));
      assert.equal(rejected.status, "repair-gap"); assert.equal(session.getCurrent(), valid);
    }
  }
});

test("trial scoring rejects unchanged valid responses and labels injected faults separately", () => {
  const source = createKpReasoningSource(), code = createCodeReasoningSource();
  const unchanged = { equationJson: JSON.stringify(source), codeJson: JSON.stringify(code) };
  assert.equal(assessReasoningTrial(unchanged).passed, false);
  const valid = { equationJson: JSON.stringify({ ...source, title: "See both products",
    reason: { ...source.reason, operationIds: source.reason.operationIds.slice(0, 2) },
    parent: { ...source.parent, targetStateId: "fraction-solve.state.normalized" } }),
  codeJson: JSON.stringify({ ...code, title: "One threshold, preserved behavior" }) };
  assert.equal(assessReasoningTrial(valid).passed, true);
  const faults = injectReasoningTrialFaults(valid), assessment = assessReasoningTrial(faults);
  assert.equal(assessment.equation.status, "repair-gap"); assert.equal(assessment.code.status, "repair-gap");
  assert.equal(assessReasoningTrial(valid).passed, true, "injection cannot mutate the original response");
  assert.equal(assessReasoningTrial({ equationJson: "{", codeJson: "{}" }).passed, false);
});
