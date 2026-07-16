import assert from "node:assert/strict";
import test from "node:test";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpGeneratedSemanticProofCohort
} from "../src/animation/generated-semantic-proof-cohort.ts";
import { sampleKpEpistemicDisclosure } from "../src/semantic/epistemic-status.ts";

test("generated proof cohort resolves canonical operations and editor assets", () => {
  const cohort = createKpGeneratedSemanticProofCohort();
  const animationIds = new Set(createKpAnimationAssets().map((animation) => animation.id));

  assert.deepEqual(
    cohort.examples.map((example) => [example.canonicalOperationId, example.visualMotif]),
    [
      ["kp.core.wrap", "wrap"],
      ["kp.core.fan-out", "copy-fan-out"],
      ["kp.core.substitute", "substitute"]
    ]
  );
  assert.ok(cohort.examples.every((example) => animationIds.has(example.editorAnimationId)));
  assert.ok(cohort.diagnostics.every((diagnostic) => diagnostic.length > 24));
});

test("intentional invalid state remains undisclosed until requested", () => {
  const draft = createKpGeneratedSemanticProofCohort().intentionalInvalidDraft;
  const annotation = draft.states[1]!.epistemic;
  assert.equal(annotation.status, "invalid");
  assert.equal(sampleKpEpistemicDisclosure({
    annotation,
    progress: 1,
    requested: false
  }).disclosed, false);
  assert.deepEqual(sampleKpEpistemicDisclosure({
    annotation,
    progress: 1,
    requested: true
  }), {
    subject: annotation.subject,
    disclosed: true,
    status: "invalid",
    rationale: annotation.rationale,
    announce: true
  });
});

test("unknown generated operation becomes a deterministic typed repair gap", () => {
  const first = createKpGeneratedSemanticProofCohort();
  const second = createKpGeneratedSemanticProofCohort();
  assert.equal(first.substitutionFingerprint, second.substitutionFingerprint);
  assert.equal(first.intentionalInvalidFingerprint, second.intentionalInvalidFingerprint);
  assert.equal(first.rejectedTypedGap.gaps[0]?.reason, "unsupported-operation");
  assert.match(first.rejectedTypedGap.diagnostics[0]?.message ?? "", /Unknown canonical operation/);
  assert.match(first.diagnostics.at(-1) ?? "", /replace-operation-id/);
});
