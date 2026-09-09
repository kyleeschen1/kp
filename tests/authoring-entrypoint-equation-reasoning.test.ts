import assert from "node:assert/strict";
import test from "node:test";
import { checkEquationReasoningSource } from "../src/experiments/reusable-reasoning/equation-author-check.ts";
import { createKpReasoningSource } from "../src/experiments/reusable-reasoning/source.ts";
import { createReasoningAuthoringSession } from "../src/experiments/reusable-reasoning/authoring.ts";
import { extractKpReasoningContext, resolveKpReasoningReturnCheckpoint } from "../src/experiments/reusable-reasoning/extraction.ts";
import { createKpAuthoredDistributionProjection } from "../src/experiments/authoring-structural/distribution-projection.ts";
import { checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";

test("equation checking retains editor evidence, assumptions, extraction and exact return", async () => {
  const source = createKpReasoningSource();
  const variants = [source, { ...source, title: "Stop at the product", parent: { ...source.parent, targetStateId: "fraction-solve.state.constant-product" },
    reason: { ...source.reason, operationIds: source.reason.operationIds.slice(0, 3) } }];
  for (const variant of variants) {
    const json = JSON.stringify(variant), checked = checkEquationReasoningSource(json);
    assert.equal(checked.status, "compiled");
    if (checked.status !== "compiled") return;
    const editor = createReasoningAuthoringSession(createKpAuthoredDistributionProjection().projection.animationCandidate).apply(json);
    assert.equal(editor.status, "applied");
    if (editor.status !== "applied") return;
    assert.equal(checked.revisionId, editor.current.evidence.revisionId);
    assert.equal(checked.promptCount, editor.current.prompts.length);
    assert.deepEqual(checked.source, editor.current.evidence.source);
    const extraction = extractKpReasoningContext(editor.current.evidence);
    assert.deepEqual(extraction.assumptions, editor.current.evidence.assumptions);
    assert.equal(resolveKpReasoningReturnCheckpoint(editor.current.evidence, extraction).id, variant.parent.targetStateId);
    assert.deepEqual((await checkAuthorTask("reasoning.equation", json)).result, checked);
  }
});

test("reasoning errors retain the editor diagnostic instead of inventing semantic support", () => {
  const source = createKpReasoningSource();
  for (const json of ["{", JSON.stringify({ ...source, reason: { ...source.reason, assumptionIds: [] } }),
    JSON.stringify({ ...source, reason: { ...source.reason, operationIds: ["invent-operation"] } })]) {
    const checked = checkEquationReasoningSource(json);
    const editor = createReasoningAuthoringSession(createKpAuthoredDistributionProjection().projection.animationCandidate).apply(json);
    assert.equal(checked.status, "repair-gap");
    assert.equal(editor.status, "repair-gap");
    if (checked.status === "repair-gap" && editor.status === "repair-gap") assert.deepEqual(checked.diagnostic, editor.diagnostic);
  }
});
