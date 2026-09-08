import assert from "node:assert/strict";
import test from "node:test";
import { createKpReasoningSource, KpReasoningRepairGap } from "../src/experiments/reusable-reasoning/source.ts";
import { bindKpReasoningEvidence } from "../src/experiments/reusable-reasoning/evidence.ts";
import { pinKpReasoningReference } from "../src/experiments/reusable-reasoning/references.ts";
import { extractKpReasoningContext, resolveKpReasoningReturnCheckpoint } from "../src/experiments/reusable-reasoning/extraction.ts";

test("extraction retains required context but excludes unrelated later solving", () => {
  const evidence = bindKpReasoningEvidence(createKpReasoningSource());
  const extracted = extractKpReasoningContext(evidence);
  assert.equal(extracted.states.length, 5);
  assert.equal(extracted.operations.length, 4);
  assert.equal(extracted.assumptions.length, 2);
  assert.equal(extracted.definitions.length, 2);
  assert.equal(extracted.formula.bindings.length, 3);
  assert.equal(extracted.claimReferences.length, 9);
  assert.ok(extracted.states.every(state => state.stateId !== "fraction-solve.state.solved"));
  assert.equal(extracted.source, evidence.source);
  assert.equal(Reflect.set(extracted.returnTo, "parentId", "foreign"), false);
});

test("extraction preserves each parent checkpoint and reconstructs return after JSON transport", () => {
  const evidence = bindKpReasoningEvidence(createKpReasoningSource());
  for (const state of evidence.states.slice(0, 5)) {
    const ref = pinKpReasoningReference(evidence, "state", state.stateId);
    const extracted = extractKpReasoningContext(evidence, ref);
    const transported = JSON.parse(JSON.stringify(extracted));
    assert.deepEqual(resolveKpReasoningReturnCheckpoint(evidence, transported), ref);
    assert.deepEqual(transported.assumptions, evidence.assumptions);
    assert.equal(transported.revisionId, evidence.revisionId);
  }
});

test("extraction rejects foreign revisions, unrelated return states and operation-as-checkpoint", () => {
  const source = createKpReasoningSource();
  const evidence = bindKpReasoningEvidence(source);
  const extracted = extractKpReasoningContext(evidence);
  const changed = bindKpReasoningEvidence({ ...source, title: "Changed source" });
  assert.throws(() => resolveKpReasoningReturnCheckpoint(changed, extracted), KpReasoningRepairGap);
  assert.throws(() => extractKpReasoningContext(evidence,
    pinKpReasoningReference(evidence, "state", "fraction-solve.state.solved")), KpReasoningRepairGap);
  assert.throws(() => extractKpReasoningContext(evidence,
    pinKpReasoningReference(evidence, "operation", evidence.steps[0]!.id)), KpReasoningRepairGap);
  assert.throws(() => resolveKpReasoningReturnCheckpoint(evidence, {
    ...extracted, returnTo: { ...extracted.returnTo, parentId: "unrelated" }
  }), KpReasoningRepairGap);
});

test("return validation does not claim serialized editorial content is verified", () => {
  const evidence = bindKpReasoningEvidence(createKpReasoningSource());
  const extracted = extractKpReasoningContext(evidence);
  const changed = { ...extracted, reason: { ...extracted.reason, editorialExplanation: "Untrusted replacement" } };
  assert.deepEqual(resolveKpReasoningReturnCheckpoint(evidence, changed), extracted.returnTo.checkpoint);
  assert.notEqual(extractKpReasoningContext(evidence).reason.editorialExplanation, changed.reason.editorialExplanation);
});
