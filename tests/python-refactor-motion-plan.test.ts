import assert from "node:assert/strict";
import test from "node:test";

import {
  assertKpVerifiedPythonRefactorMotionPlan,
  createKpPythonRefactorMotionPlan,
  validateAndMintKpPythonRefactorMotionPlan,
  type KpPythonRefactorMotionPlanDraft,
  type KpVerifiedPythonRefactorMotionPlan
} from "../src/animation/python-refactor-motion-plan.ts";
import { readKpPythonRefactorSemanticArtifact } from
  "../src/semantic/python-refactor-semantic-artifact.ts";
import { createKpPythonRefactorOperationSet } from
  "../src/semantic/python-refactor-operations.ts";
import { createKpPythonRefactorScore } from
  "../src/semantic/python-refactor-score.ts";

function inputs() {
  const semantics = readKpPythonRefactorSemanticArtifact();
  return {
    semantics,
    operations: createKpPythonRefactorOperationSet(semantics),
    score: createKpPythonRefactorScore()
  };
}

test("Python motion plan is validator-minted from exact semantic bindings", () => {
  const plan = createKpPythonRefactorMotionPlan(inputs());

  assert.doesNotThrow(() => assertKpVerifiedPythonRefactorMotionPlan(plan));
  assert.deepEqual(plan.tracks.map(({ kind }) => kind), [
    "structural-introduction",
    "rule-fusion",
    "binding-propagation",
    "binding-propagation"
  ]);
});

test("Python motion plan rejects a misbound caller trajectory", () => {
  const context = inputs();
  const plan = createKpPythonRefactorMotionPlan(context);
  const draft = structuredClone(plan) as unknown as KpPythonRefactorMotionPlanDraft;
  const invalid = {
    ...draft.tracks[2],
    targetEntityId: "call.shipping-message.after"
  } as KpPythonRefactorMotionPlanDraft["tracks"][2];
  const result = validateAndMintKpPythonRefactorMotionPlan({
    ...context,
    draft: { ...draft, tracks: [draft.tracks[0], draft.tracks[1], invalid, draft.tracks[3]] }
  });

  assert.equal(result.status, "invalid");
  if (result.status === "invalid") {
    assert.match(result.issues[0]?.message ?? "", /rule-to-call correspondence/);
  }
});

test("forged Python plans cannot acquire playback authority", () => {
  const forged = structuredClone(
    createKpPythonRefactorMotionPlan(inputs())
  ) as unknown as KpVerifiedPythonRefactorMotionPlan;

  assert.throws(
    () => assertKpVerifiedPythonRefactorMotionPlan(forged),
    /validator-minted motion plan/
  );
});
