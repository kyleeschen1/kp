import assert from "node:assert/strict";
import test from "node:test";

import {
  assertKpVerifiedTypeScriptRefactorMotionPlan,
  validateAndMintKpTypeScriptRefactorMotionPlan,
  type KpTypeScriptRefactorMotionPlanDraft,
  type KpVerifiedTypeScriptRefactorMotionPlan
} from "../src/animation/typescript-refactor-motion-plan.ts";
import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../src/semantic/typescript-free-shipping-animation-asset.ts";

test("motion plan is minted only after semantic fusion and binding validation", () => {
  const exemplar = createKpTypeScriptFreeShippingAnimationAsset();

  assert.doesNotThrow(() =>
    assertKpVerifiedTypeScriptRefactorMotionPlan(exemplar.motionPlan)
  );
  assert.deepEqual(exemplar.motionPlan.tracks.map(({ kind }) => kind), [
    "structural-introduction",
    "rule-fusion",
    "binding-propagation",
    "binding-propagation"
  ]);
});

test("motion plan rejects a call trajectory that is not bound to its destination", () => {
  const exemplar = createKpTypeScriptFreeShippingAnimationAsset();
  const draft = structuredClone(exemplar.motionPlan) as unknown as
    KpTypeScriptRefactorMotionPlanDraft;
  const invalidTrack = {
    ...draft.tracks[2],
    targetEntityId: "call.shipping-message.after"
  } as KpTypeScriptRefactorMotionPlanDraft["tracks"][2];
  const result = validateAndMintKpTypeScriptRefactorMotionPlan({
    draft: {
      ...draft,
      tracks: [draft.tracks[0], draft.tracks[1], invalidTrack, draft.tracks[3]]
    },
    semantics: exemplar.semantics,
    operations: exemplar.operations,
    score: exemplar.score
  });

  assert.equal(result.status, "invalid");
  if (result.status === "invalid") {
    assert.match(result.issues[0]?.message ?? "", /declared rule-to-call correspondence/);
  }
});

test("a structurally forged motion plan cannot acquire playback authority", () => {
  const exemplar = createKpTypeScriptFreeShippingAnimationAsset();
  const forged = structuredClone(exemplar.motionPlan) as unknown as
    KpVerifiedTypeScriptRefactorMotionPlan;

  assert.throws(
    () => assertKpVerifiedTypeScriptRefactorMotionPlan(forged),
    /validator-minted motion plan/
  );
});
