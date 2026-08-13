import assert from "node:assert/strict";
import test from "node:test";

import {
  mintKpCodeSettlementPlan,
  sampleKpCodeSettlement,
  type KpVerifiedCodeSettlementPlan
} from "../src/animation/code-motion-settlement.ts";

const plan = mintKpCodeSettlementPlan({
  id: "settlement.refactor.helper",
  sourceNativeOwnerId: "projection.before",
  targetNativeOwnerId: "projection.after",
  milestones: {
    travel: 0.1,
    arrival: 0.55,
    recognition: 0.68,
    ownershipHandoff: 0.82,
    withdrawal: 0.94
  }
});

test("settlement law makes every causal phase directly seekable", () => {
  assert.deepEqual(sampleKpCodeSettlement({ plan, progress: 0 }), {
    progress: 0,
    phase: "source",
    destination: "pending",
    recognition: "pending",
    transit: "absent",
    paintOwner: "source-native",
    accessibleNativeOwnerId: "projection.before"
  });
  assert.equal(sample(0.2).phase, "travel");
  assert.equal(sample(0.6).phase, "arrival");
  assert.equal(sample(0.7).phase, "recognition");
  assert.equal(sample(0.9).phase, "ownership-handoff");
  assert.deepEqual(sampleKpCodeSettlement({ plan, progress: 1 }), {
    progress: 1,
    phase: "withdrawal",
    destination: "reached",
    recognition: "complete",
    transit: "withdrawn",
    paintOwner: "target-native",
    accessibleNativeOwnerId: "projection.after"
  });
});

test("native ownership cannot precede arrival and recognition", () => {
  for (let step = 0; step <= 100; step += 1) {
    const frame = sample(step / 100);
    if (frame.paintOwner === "target-native") {
      assert.equal(frame.destination, "reached");
      assert.equal(frame.recognition, "complete");
      assert.equal(frame.accessibleNativeOwnerId, "projection.after");
    }
    if (frame.transit === "withdrawn") {
      assert.equal(frame.paintOwner, "target-native");
    }
  }
});

test("settlement law rejects invalid ownership and milestone order", () => {
  assert.throws(
    () => mintKpCodeSettlementPlan({
      id: "settlement.same-owner",
      sourceNativeOwnerId: "projection.same",
      targetNativeOwnerId: "projection.same",
      milestones: plan.milestones
    }),
    /distinct native owners/
  );
  assert.throws(
    () => mintKpCodeSettlementPlan({
      id: "settlement.early-handoff",
      sourceNativeOwnerId: "projection.before",
      targetNativeOwnerId: "projection.after",
      milestones: {
        travel: 0.1,
        arrival: 0.55,
        recognition: 0.8,
        ownershipHandoff: 0.7,
        withdrawal: 0.94
      }
    }),
    /recognition before ownershipHandoff/
  );
});

test("unminted structurally similar plans cannot sample", () => {
  const forged = {
    id: plan.id,
    sourceNativeOwnerId: plan.sourceNativeOwnerId,
    targetNativeOwnerId: plan.targetNativeOwnerId,
    milestones: plan.milestones
  } as KpVerifiedCodeSettlementPlan;
  assert.throws(
    () => sampleKpCodeSettlement({ plan: forged, progress: 0.5 }),
    /must be minted/
  );
});

function sample(progress: number) {
  return sampleKpCodeSettlement({ plan, progress });
}
