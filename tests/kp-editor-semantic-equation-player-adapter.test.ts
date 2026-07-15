import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";
import { createKpEditorSemanticEquationTokenFrame } from "../src/editor/semantic-equation-player-adapter.ts";
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
