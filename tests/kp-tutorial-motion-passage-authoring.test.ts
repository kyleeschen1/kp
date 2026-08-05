import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpTutorialMotionBridge,
  defineKpTutorialOrdinaryBeat,
  kpTutorialMotionBridgeDistancePresets
} from "../src/tutorial/kp-tutorial-motion-bridge-authoring.ts";
import {
  renderKpTutorialMotionBridgeStatic
} from "../src/tutorial/kp-tutorial-motion-bridge-static.ts";

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

test("static bridge markup keeps complete prose in natural light-DOM order", () => {
  const bridge = defineKpTutorialMotionBridge({
    id: "demand-increase",
    beforePassageId: "follow-shift",
    afterPassageId: "new-equilibrium",
    distance: "standard",
    motionBlockId: "demand-shift",
    fromCheckpointId: "shift-ready",
    toCheckpointId: "shift-settled"
  });
  const html = renderKpTutorialMotionBridgeStatic({
    bridge,
    beforeHtml: "Demand begins to shift",
    afterHtml: "the new equilibrium is higher and farther right."
  });
  assert.match(html, /^<kp-motion-bridge/);
  assert.ok(html.indexOf("Demand begins") < html.indexOf("new equilibrium"));
  assert.match(html, /<p data-kp-motion-bridge-before="follow-shift">/);
  assert.match(html, /<p data-kp-motion-bridge-after="new-equilibrium">/);
  assert.equal((html.match(/aria-hidden="true"/g) ?? []).length, 3);
  assert.equal((html.match(/>…<\/span>/g) ?? []).length, 2);
  assert.match(html, /kp-tutorial-motion-bridge__rail-progress/);
  assert.doesNotMatch(html, /style=|\.\.\.|scroll|progress=/);
  assert.throws(() => renderKpTutorialMotionBridgeStatic({
    bridge,
    beforeHtml: "",
    afterHtml: "Complete thought."
  }), /requires prose on both sides/);
});
