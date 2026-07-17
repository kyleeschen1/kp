import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";
import { createKpEditorSemanticEquationTokenFrame } from "../src/editor/semantic-equation-player-adapter.ts";
import { createKpEditorPrecomputedEquationMotionPlan } from "../src/editor/precomputed-equation-motion.ts";
import type { KpMeasuredEquationTransitionGeometry } from "../src/rendering/equation-motion-dom.ts";

const element = { style: {} } as unknown as HTMLElement;
const geometry: KpMeasuredEquationTransitionGeometry = {
  transitionId: "transition.shared-player",
  sourceTokens: [{
    motionId: "before.x",
    text: "x",
    rect: { left: 0, top: 0, width: 10, height: 10 },
    localRect: { left: 0, top: 0, width: 10, height: 10 },
    element
  }],
  targetTokens: [{
    motionId: "after.x",
    text: "x",
    rect: { left: 20, top: 0, width: 10, height: 10 },
    localRect: { left: 20, top: 0, width: 10, height: 10 },
    element
  }],
  relations: [{
    recordId: "x-persists",
    lifecycle: "persist",
    source: {
      selectorIds: ["before.x"],
      motionIds: ["before.x"],
      bounds: { left: 0, top: 0, width: 10, height: 10 }
    },
    target: {
      selectorIds: ["after.x"],
      motionIds: ["after.x"],
      bounds: { left: 20, top: 0, width: 10, height: 10 }
    },
    delta: { x: 20, y: 0, scaleX: 1, scaleY: 1 }
  }]
};

function player(direction: "forward" | "rewind", progress: number) {
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => candidate.animationId === "animation.linear-solve.solve-x"
  );
  const animation = catalog.find((candidate) => candidate.id === descriptor?.animationId);
  assert.ok(descriptor);
  assert.ok(animation);
  return createKpEditorAnimationPlayerState({
    descriptor,
    animation,
    catalog,
    direction,
    progress
  });
}

test("semantic token frames retain the shared player runtime identity and progress", () => {
  const state = player("forward", 0.4);
  const frame = createKpEditorSemanticEquationTokenFrame({
    geometry,
    playerState: state,
    phaseLocalProgress: 0.5
  });

  assert.equal(frame.animationId, state.animationId);
  assert.equal(frame.runtimeFrameId, state.runtimeFrame.id);
  assert.equal(frame.phaseId, state.runtimeFrame.phase.phaseId);
  assert.equal(frame.globalProgress, state.progress);
  assert.equal(frame.semanticProgress, 0.5);
  assert.equal(frame.motion.tokens[0]?.pose.x, 10);
});

test("rewind samples the same semantic token motion in reverse", () => {
  const forward = createKpEditorSemanticEquationTokenFrame({
    geometry,
    playerState: player("forward", 0.25),
    phaseLocalProgress: 0.25
  });
  const rewind = createKpEditorSemanticEquationTokenFrame({
    geometry,
    playerState: player("rewind", 0.75),
    phaseLocalProgress: 0.75
  });

  assert.equal(forward.semanticProgress, rewind.semanticProgress);
  assert.deepEqual(forward.motion, rewind.motion);
});

test("semantic token frames consume one precomputed layout path and timeline plan", () => {
  const precomputedPlan = createKpEditorPrecomputedEquationMotionPlan({
    id: "editor-plan.shared-player",
    geometry,
    motifKind: "artifact-replace"
  });
  const frame = createKpEditorSemanticEquationTokenFrame({
    geometry: precomputedPlan.geometry,
    playerState: player("forward", 0.4),
    phaseLocalProgress: 0.5,
    precomputedPlan
  });

  assert.equal(precomputedPlan.layoutPlan.geometryPolicy, "measure-once-per-step");
  assert.equal(precomputedPlan.relationPathPlans.size, 1);
  assert.equal(frame.semanticTimeline.progress, 0.5);
  assert.match(frame.semanticTimeline.previousCheckpointId, /semantic-checkpoint/);
  assert.match(frame.semanticTimeline.nextCheckpointId, /semantic-checkpoint/);
});

test("specialized choreography motifs reuse the base token timeline envelope", () => {
  const fraction = createKpEditorPrecomputedEquationMotionPlan({
    id: "editor-plan.fraction-factor-split",
    geometry,
    motifKind: "fraction-factor-split"
  });
  const exponent = createKpEditorPrecomputedEquationMotionPlan({
    id: "editor-plan.exponent-factor-peel",
    geometry,
    motifKind: "exponent-factor-peel"
  });

  assert.equal(fraction.semanticTimeline.visualTimeline.motifs[0]?.kind, "copy-fan-out");
  assert.equal(exponent.semanticTimeline.visualTimeline.motifs[0]?.kind, "append-after-shift");
});
