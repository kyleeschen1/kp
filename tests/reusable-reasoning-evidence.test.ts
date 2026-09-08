import assert from "node:assert/strict";
import test from "node:test";
import { createKpReasoningSource, KpReasoningRepairGap } from "../src/experiments/reusable-reasoning/source.ts";
import { bindKpReasoningEvidence, requireKpReasoningEvidence } from "../src/experiments/reusable-reasoning/evidence.ts";

test("reasoning evidence binds trusted operations while prose remains editorial", () => {
  const evidence = bindKpReasoningEvidence(createKpReasoningSource());
  requireKpReasoningEvidence(evidence);
  assert.equal(evidence.steps.length, 4);
  assert.equal(evidence.claimAuthority.claims.filter(claim => claim.kind === "equivalence-operation").length, 4);
  assert.ok(evidence.claimAuthority.claims.every(claim => claim.instanceId === evidence.revisionId));
  assert.equal(evidence.editorial.status, "editorial");
  assert.equal(evidence.definitions[0]!.evidenceId, "kp.algebra.distribute.v1");
  assert.equal(evidence.assumptions[1]!.statement, "The denominator 3 is nonzero.");
  assert.equal(evidence.assumptions[0]!.kind, "domain-assumption");
  assert.equal(Reflect.set(evidence.states[0]!.segments[0]!, "latex", "forged"), false);
  assert.equal(Reflect.set(evidence.steps[0]!.authorityIds, "0", "forged"), false);
});

test("reasoning evidence rejects unknown states and missing operation authority", () => {
  const source = createKpReasoningSource();
  assert.throws(() => bindKpReasoningEvidence({ ...source, parent: {
    ...source.parent, targetStateId: "invented" } }), error =>
      error instanceof KpReasoningRepairGap && error.code === "kp.reasoning.unknown-state");
  assert.throws(() => bindKpReasoningEvidence({ ...source, reason: {
    ...source.reason, operationIds: ["invented"] } }), error =>
      error instanceof KpReasoningRepairGap && error.code === "kp.reasoning.unknown-operation");
});

test("reasoning revision binds editorial bytes as well as trusted source and is not proof", () => {
  const source = createKpReasoningSource();
  const original = bindKpReasoningEvidence(source);
  assert.equal(bindKpReasoningEvidence(source).revisionId, original.revisionId);
  const edited = bindKpReasoningEvidence({ ...source, compact: "An editorial change." });
  assert.notEqual(edited.revisionId, original.revisionId);
  assert.deepEqual(edited.steps, original.steps);
  assert.throws(() => requireKpReasoningEvidence({ ...original }), error =>
    error instanceof KpReasoningRepairGap && error.code === "kp.reasoning.evidence-capability");
  assert.throws(() => requireKpReasoningEvidence(JSON.parse(JSON.stringify(original))), KpReasoningRepairGap);
});
