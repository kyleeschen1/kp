import assert from "node:assert/strict";
import test from "node:test";

import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../src/semantic/typescript-free-shipping-animation-asset.ts";
import { createKpEditorAnimationDescriptor } from
  "../src/editor/animation-descriptor.ts";
import { createKpEditorAnimationPlayerState } from
  "../src/editor/animation-player-state.ts";
import { kpEditorTypeScriptRefactorSurfaceAdapter } from
  "../src/editor/typescript-refactor-surface-adapter.ts";

test("TypeScript renderer is a narrow programming adapter", () => {
  const exemplar = createKpTypeScriptFreeShippingAnimationAsset();
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

  assert.equal(kpEditorTypeScriptRefactorSurfaceAdapter.slotKind, "programming");
  assert.equal(kpEditorTypeScriptRefactorSurfaceAdapter.supports(state), true);
  assert.equal(
    kpEditorTypeScriptRefactorSurfaceAdapter.supports({
      ...state,
      animationId: "animation.programming.add.execution-trace"
    }),
    false
  );
});
