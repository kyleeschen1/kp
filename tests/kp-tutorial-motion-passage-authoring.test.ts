import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpTutorialMotionBridge,
  defineKpTutorialOrdinaryBeat,
  kpTutorialMotionBridgeDistancePresets
} from "../src/tutorial/kp-tutorial-motion-bridge-authoring.ts";

test("ordinary prose beats settle at semantic checkpoints", () => {
  assert.deepEqual(defineKpTutorialOrdinaryBeat({
    id: "notice-equilibrium",
    passageId: "initial-equilibrium",
    settleAt: {
      motionBlockId: "demand-shift",
      checkpointId: "shift-ready"
    }
  }), {
    schemaVersion: "kp.tutorial.ordinary-beat.v1",
    kind: "ordinary-beat",
    id: "notice-equilibrium",
    passageId: "initial-equilibrium",
    paragraphIndex: 0,
    settleAt: {
      motionBlockId: "demand-shift",
      checkpointId: "shift-ready"
    }
  });
});

test("motion bridges pair prose around semantic animation endpoints", () => {
  assert.deepEqual(kpTutorialMotionBridgeDistancePresets, [
    "short",
    "standard",
    "extended"
  ]);
  assert.deepEqual(defineKpTutorialMotionBridge({
    id: "demand-increase",
    beforePassageId: "demand-increase-before",
    afterPassageId: "demand-increase-after",
    distance: "standard",
    motionBlockId: "demand-shift",
    fromCheckpointId: "shift-ready",
    toCheckpointId: "shift-settled"
  }), {
    schemaVersion: "kp.tutorial.motion-bridge.v1",
    kind: "motion-bridge",
    id: "demand-increase",
    beforePassageId: "demand-increase-before",
    afterPassageId: "demand-increase-after",
    distance: "standard",
    motionBlockId: "demand-shift",
    fromCheckpointId: "shift-ready",
    toCheckpointId: "shift-settled"
  });
});

test("motion authoring fails closed on layout and choreography coordinates", () => {
  assert.throws(() => defineKpTutorialMotionBridge({
    id: "demand-increase",
    beforePassageId: "same-passage",
    afterPassageId: "same-passage",
    distance: "standard",
    motionBlockId: "demand-shift",
    fromCheckpointId: "shift-ready",
    toCheckpointId: "shift-settled"
  }), /before and after passages must differ/);
  assert.throws(() => defineKpTutorialMotionBridge({
    id: "demand-increase",
    beforePassageId: "demand-increase-before",
    afterPassageId: "demand-increase-after",
    distance: "standard",
    motionBlockId: "demand-shift",
    fromCheckpointId: "shift-ready",
    toCheckpointId: "shift-ready"
  }), /semantic endpoints must differ/);
  assert.throws(() => defineKpTutorialOrdinaryBeat({
    id: "raw@0.72",
    passageId: "follow-shift",
    settleAt: {
      motionBlockId: "demand-shift",
      checkpointId: "shift-handoff"
    }
  }), /lowercase semantic slug/);
  assert.throws(() => defineKpTutorialOrdinaryBeat({
    id: "notice-equilibrium",
    passageId: "initial-equilibrium",
    paragraphIndex: 0.5,
    settleAt: {
      motionBlockId: "demand-shift",
      checkpointId: "shift-ready"
    }
  }), /non-negative integer/);
});
