import assert from "node:assert/strict";
import test from "node:test";

import { createKpPythonFreeShippingAnimationAsset } from
  "../src/semantic/python-free-shipping-animation-asset.ts";
import { createKpEditorAnimationDescriptor } from
  "../src/editor/animation-descriptor.ts";
import { createKpEditorAnimationPlayerState } from
  "../src/editor/animation-player-state.ts";
import { kpEditorPythonRefactorSurfaceAdapter } from
  "../src/editor/python-refactor-surface-adapter.ts";

test("Python renderer is one narrow programming adapter", () => {
  const exemplar = createKpPythonFreeShippingAnimationAsset();
  const descriptor = createKpEditorAnimationDescriptor({
    animationId: exemplar.animation.id,
    title: exemplar.animation.title,
    summary: exemplar.accessibility.description,
    renderTargetKinds: ["programming"]
  });
  const state = createKpEditorAnimationPlayerState({
    animation: exemplar.animation,
    descriptor,
    progress: 0.5
  });

  assert.equal(kpEditorPythonRefactorSurfaceAdapter.slotKind, "programming");
  assert.equal(kpEditorPythonRefactorSurfaceAdapter.supports(state), true);
  assert.equal(kpEditorPythonRefactorSurfaceAdapter.supports({
    ...state,
    animationId: "animation.programming.typescript-free-shipping-refactor"
  }), false);
});
