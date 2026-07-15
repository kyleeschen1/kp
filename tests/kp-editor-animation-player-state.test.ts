import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import {
  createKpEditorAnimationPlayerState
} from "../src/editor/animation-player-state.ts";

test("editor animation player state projects selection onto the shared runtime clock", () => {
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => candidate.animationId === "animation.linear-solve.solve-x"
  );
  const animation = catalog.find(
    (candidate) => candidate.id === descriptor?.animationId
  );

  assert.ok(descriptor);
  assert.ok(animation);

  const state = createKpEditorAnimationPlayerState({
    descriptor,
    animation,
    catalog,
    direction: "rewind",
    progress: 1.25,
    playbackStatus: "paused"
  });

  assert.equal(state.kind, "editor-animation-player-state");
  assert.equal(state.descriptorId, descriptor.id);
  assert.equal(state.animationId, animation.id);
  assert.equal(state.playbackStatus, "paused");
  assert.equal(state.direction, "rewind");
  assert.equal(state.progress, 1);
  assert.equal(state.runtimeFrame.clock.progress, state.progress);
  assert.equal(state.runtimeFrame.clock.direction, state.direction);
  assert.equal(state.runtimeFrame.rendererNeutral, true);
  assert.equal(state.surface.kind, "equation");
  assert.deepEqual(state.surface.slotKinds, ["equation"]);
  assert.equal(state.durationMs, descriptor.durationMs ?? animation.timeline?.durationMs);
  assert.equal(state.beatCount, descriptor.beatCount ?? animation.timeline?.beatCount);
});

test("editor animation player state rejects a descriptor and asset mismatch", () => {
  const catalog = createKpAnimationAssets();
  const [descriptor] = createKpEditorAnimationLibrary();
  const mismatchedAnimation = catalog.find(
    (animation) => animation.id !== descriptor?.animationId
  );

  assert.ok(descriptor);
  assert.ok(mismatchedAnimation);

  assert.throws(
    () => createKpEditorAnimationPlayerState({
      descriptor,
      animation: mismatchedAnimation
    }),
    /selects .* not/
  );
});
