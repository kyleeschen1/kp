import assert from "node:assert/strict";
import test from "node:test";

import { createFunctionWrapAnimationAsset } from "../src/animation/function-wrap-adapter.ts";
import {
  createKpFunctionWrapChoreography,
  sampleKpFunctionWrapChoreography
} from "../src/animation/function-wrap-choreography.ts";

const choreography = createKpFunctionWrapChoreography(
  createFunctionWrapAnimationAsset()
);

test("function wrap compiles the full phase-ordered envelope", () => {
  assert.deepEqual(
    choreography.plan.phases.map((phase) => phase.id),
    ["orient", "reflow", "act", "settle", "release"]
  );
  assert.deepEqual(
    choreography.plan.activities.map((activity) => activity.kind),
    [
      "focus",
      "move-continuant",
      "execute-operation",
      "recognition-hold",
      "release-attention"
    ]
  );
  assert.equal(choreography.plan.semantic.canonicalOperationId, "kp.core.wrap");
  assert.deepEqual(choreography.plan.semantic.motifIds, ["wrap"]);
});

test("argument reflow completes before wrapper execution begins", () => {
  const reflow = choreography.timeline.phases.find(
    (phase) => phase.phaseId === "reflow"
  )!;
  const act = choreography.timeline.phases.find(
    (phase) => phase.phaseId === "act"
  )!;
  assert.equal(reflow.end, act.start);
  assert.equal(reflow.end, 0.42);

  const beforeAct = sampleKpFunctionWrapChoreography({
    choreography,
    progress: 0.35,
    direction: "forward",
    accessibilityMode: "full"
  });
  assert.deepEqual(beforeAct.timeline.activePhaseIds, ["reflow"]);
  assert.equal(beforeAct.focus.attentionProgress, 1);

  const acting = sampleKpFunctionWrapChoreography({
    choreography,
    progress: 0.5,
    direction: "forward",
    accessibilityMode: "full"
  });
  assert.deepEqual(acting.timeline.activePhaseIds, ["act"]);
});

test("focus releases exactly and reduced motion retains causal phase meaning", () => {
  const released = sampleKpFunctionWrapChoreography({
    choreography,
    progress: 1,
    direction: "forward",
    accessibilityMode: "full"
  });
  assert.equal(released.focus.translateZ, 0);
  assert.equal(released.focus.scale, 1);
  assert.equal(released.focus.shadowOpacity, 0);
  assert.equal(released.focus.contextDimming, 0);

  const reduced = sampleKpFunctionWrapChoreography({
    choreography,
    progress: 0.5,
    direction: "forward",
    accessibilityMode: "reduced"
  });
  assert.deepEqual(reduced.timeline.activePhaseIds, ["act"]);
  assert.equal(reduced.focus.translateZ, 0);
  assert.equal(reduced.focus.scale, 1);
  assert.ok(reduced.focus.outlineStrength > 0);
});

test("rewind samples the same envelope in reverse", () => {
  const forward = sampleKpFunctionWrapChoreography({
    choreography,
    progress: 0.27,
    direction: "forward",
    accessibilityMode: "full"
  });
  const rewind = sampleKpFunctionWrapChoreography({
    choreography,
    progress: 0.73,
    direction: "rewind",
    accessibilityMode: "full"
  });
  assert.deepEqual(rewind.timeline.activePhaseIds, forward.timeline.activePhaseIds);
  assert.equal(rewind.timeline.semanticProgress, forward.timeline.semanticProgress);
  assert.deepEqual(rewind.focus, forward.focus);
});
