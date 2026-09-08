import assert from "node:assert/strict";
import test from "node:test";
import { createFlaggedTicketSource, ProbabilityRepairGap } from "../domains/probability/binary-joint-model.ts";
import { bindBayesEvidence, compileBayesConstruction, createBayesConstructionRequest } from "../src/experiments/bayesian-reasoning/evidence.ts";
import { validateKpAnimationAsset } from "../src/animation/asset.ts";

test("probability evidence traverses existing governed construction with exact role closure", () => {
  const evidence = bindBayesEvidence(createFlaggedTicketSource());
  assert.deepEqual(validateKpAnimationAsset(evidence.authority.animation), []);
  assert.equal(evidence.construction.mathematicalVerification.operations.length, 6);
  evidence.construction.mathematicalVerification.operations.forEach(operation => {
    assert.ok(operation.definitionId.startsWith("definition.probability."));
    assert.equal(operation.strictLawIds.length, 1);
    assert.equal(operation.lineageIds.length, 4);
  });
  assert.ok(Object.isFrozen(evidence.authority.animation.bundle.objects[0]!.selectors));
});

test("author requests cannot forge probability authority, operation, revision or geometry", () => {
  const evidence = bindBayesEvidence(createFlaggedTicketSource()), authority = evidence.authority;
  assert.throws(() => compileBayesConstruction({ ...authority }), ProbabilityRepairGap);
  const request = createBayesConstructionRequest(authority);
  for (const invalid of [
    { ...request, source: { ...request.source, revisionId: "wrong" } },
    { ...request, approvedOperationIds: ["probability.infer-independence"], compositionIntent: { kind: "sequence", operationIds: ["probability.infer-independence"] } },
    { ...request, approvedObjectIds: [] }, { ...request, keyframes: [0, 1] }
  ]) assert.throws(() => compileBayesConstruction(authority, invalid));
});

test("changed probability or editorial labels pin a new coherent source revision", () => {
  const source = createFlaggedTicketSource(), initial = bindBayesEvidence(source);
  source.masses = ["8/100", "12/100", "8/100", "72/100"];
  const edited = bindBayesEvidence(source);
  assert.notEqual(edited.revisionId, initial.revisionId);
  assert.deepEqual(edited.model.outcomes.map(o => o.id), initial.model.outcomes.map(o => o.id));
  source.events[0]!.label = "Urgent case";
  assert.notEqual(bindBayesEvidence(source).revisionId, edited.revisionId);
});
