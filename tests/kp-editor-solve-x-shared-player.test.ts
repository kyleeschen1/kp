import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";
import {
  createKpEditorSolveXSharedPlayerFrame,
  KP_SOLVE_X_ANIMATION_ID
} from "../src/editor/solve-x-shared-player.ts";

function solveFrame(progress: number, direction: "forward" | "rewind" = "forward") {
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => candidate.animationId === KP_SOLVE_X_ANIMATION_ID
  );
  const animation = catalog.find((candidate) => candidate.id === KP_SOLVE_X_ANIMATION_ID);
  assert.ok(descriptor);
  assert.ok(animation);

  return createKpEditorSolveXSharedPlayerFrame({
    animation,
    state: createKpEditorAnimationPlayerState({
      descriptor,
      animation,
      catalog,
      progress,
      direction
    })
  });
}

test("solve x shared player exposes all four semantic equation states", () => {
  const frame = solveFrame(0.5);
  assert.ok(frame);

  assert.deepEqual(frame.steps.map((step) => step.latex), [
    "x + 3 = 7",
    "x + 3 - 3 = 7 - 3",
    "x = 7 - 3",
    "x = 4"
  ]);
  assert.equal(frame.activeStepIndex, 2);
  assert.deepEqual(frame.steps.map((step) => step.status), [
    "complete",
    "complete",
    "active",
    "upcoming"
  ]);
});

test("solve x shared player mirrors the visible sequence position on rewind", () => {
  const forward = solveFrame(0.25, "forward");
  const rewind = solveFrame(0.75, "rewind");
  assert.ok(forward);
  assert.ok(rewind);

  assert.equal(rewind.visualProgress, forward.visualProgress);
  assert.equal(rewind.activeStepIndex, forward.activeStepIndex);
  assert.deepEqual(rewind.steps, forward.steps);
});
