import assert from "node:assert/strict";
import test from "node:test";
import { createReasoningAuthoringSession } from "../src/experiments/reusable-reasoning/authoring.ts";
import { createKpAuthoredDistributionProjection } from "../src/experiments/authoring-structural/distribution-projection.ts";

test("authoring atomically changes ink target, prompt answers and every reading revision", () => {
  const session = createReasoningAuthoringSession(createKpAuthoredDistributionProjection().projection.animationCandidate);
  const before = session.getCurrent();
  const source = before.evidence.source;
  const result = session.apply(JSON.stringify({ ...source, compact: "Stop at the numerator.",
    parent: { ...source.parent, targetStateId: "fraction-solve.state.constant-product" },
    reason: { ...source.reason, operationIds: source.reason.operationIds.slice(0, 3) } }));
  assert.equal(result.status, "applied");
  const after = session.getCurrent();
  assert.notEqual(before.evidence.revisionId, after.evidence.revisionId);
  for (const view of [after.context, after.full, after.compact, ...after.prompts])
    assert.equal(view.revisionId, after.evidence.revisionId);
  assert.equal(after.full.claims.length, 7);
  assert.equal(after.compact.text, "Stop at the numerator.");
  assert.notEqual(after.prompts[0]!.answerLatex, before.prompts[0]!.answerLatex);
  assert.equal(after.prompts[0]!.answerStateId, after.evidence.source.parent.targetStateId);
});

test("invalid drafts retain exactly the last valid projections without partial publication", () => {
  const session = createReasoningAuthoringSession(createKpAuthoredDistributionProjection().projection.animationCandidate);
  const before = session.getCurrent();
  const source = before.evidence.source;
  for (const draft of ["{", " ".repeat(100_001), JSON.stringify({ ...source, coefficient: 9 }),
    JSON.stringify({ ...source, title: "Must not publish", reason: { ...source.reason, operationIds: source.reason.operationIds.slice(0, 3) } })]) {
    const result = session.apply(draft);
    assert.equal(result.status, "repair-gap");
    assert.equal(session.getCurrent(), before);
    if (result.status === "repair-gap") assert.ok(result.diagnostic.code.startsWith("kp.reasoning."));
  }
});
