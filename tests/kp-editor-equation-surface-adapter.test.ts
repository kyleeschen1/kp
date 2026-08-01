import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";
import {
  createKpEditorEquationStageFrame
} from "../src/editor/equation-surface-adapter.ts";

function stageFrame(progress: number, direction: "forward" | "rewind" = "forward") {
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => candidate.animationId === "animation.linear-solve.solve-x"
  );
  const animation = catalog.find(
    (candidate) => candidate.id === descriptor?.animationId
  );

  assert.ok(descriptor);
  assert.ok(animation);

  return createKpEditorEquationStageFrame({
    animation,
    state: createKpEditorAnimationPlayerState({
      descriptor,
      animation,
      catalog,
      direction,
      progress
    })
  });
}

test("equation stage derives smooth local phase progress from the runtime clock", () => {
  const start = stageFrame(0);
  const middle = stageFrame(0.5);
  const end = stageFrame(1);

  assert.equal(start.localProgress, 0);
  assert.equal(start.globalProgress, 0);
  assert.equal(start.semanticProgress, 0);
  assert.equal(start.easedProgress, 0);
  assert.equal(middle.localProgress, 0.5);
  assert.equal(middle.globalProgress, 0.5);
  assert.equal(middle.semanticProgress, 0.5);
  assert.equal(middle.easedProgress, 0.5);
  assert.equal(end.localProgress, 1);
  assert.equal(end.globalProgress, 1);
  assert.equal(end.semanticProgress, 1);
  assert.equal(end.easedProgress, 1);
  assert.equal(
    middle.projection.transitions[0]?.id,
    "transform.linear-solve.cancel-left-additive-inverse"
  );
  assert.equal(start.stageIdentityKey, middle.stageIdentityKey);
  assert.equal(middle.stageIdentityKey, end.stageIdentityKey);
  assert.notEqual(start.contentKey, middle.contentKey);
});

test("equation stage identity persists when playback direction changes", () => {
  const forward = stageFrame(0.35, "forward");
  const rewind = stageFrame(0.65, "rewind");

  assert.equal(forward.stageIdentityKey, rewind.stageIdentityKey);
  assert.equal(forward.stageIdentityKey, "animation.linear-solve.solve-x");
  assert.equal(forward.semanticProgress, rewind.semanticProgress);
  assert.equal(forward.semanticProgress, 0.35);
  assert.equal(forward.globalProgress, 0.35);
  assert.equal(rewind.globalProgress, 0.65);
});

test("equation stage math layout changes content without changing identity", () => {
  const display = stageFrame(0.25);
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => candidate.animationId === "animation.linear-solve.solve-x"
  );
  const animation = catalog.find(
    (candidate) => candidate.id === descriptor?.animationId
  );
  assert.ok(descriptor);
  assert.ok(animation);
  const inline = createKpEditorEquationStageFrame({
    animation,
    state: createKpEditorAnimationPlayerState({
      descriptor,
      animation,
      catalog,
      progress: 0.25
    }),
    mathLayout: "inline"
  });

  assert.equal(display.mathLayout, "display");
  assert.equal(inline.mathLayout, "inline");
  assert.equal(display.stageIdentityKey, inline.stageIdentityKey);
  assert.notEqual(display.contentKey, inline.contentKey);
});
