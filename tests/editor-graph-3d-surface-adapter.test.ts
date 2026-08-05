import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createGraphSurfaceModeAnimationAsset,
  createLinearMapVectorAnimationAsset
} from "../src/animation/graph-adapter.ts";
import {
  createKpEditorAnimationDescriptor
} from "../src/editor/animation-descriptor.ts";
import {
  createKpEditorAnimationPlayerState
} from "../src/editor/animation-player-state.ts";
import {
  kpEditorGraph3DSurfaceAdapter
} from "../src/editor/graph-3d-surface-adapter.ts";

test("Graph3D adapter supports only its exact semantic asset", () => {
  const graph3d = createGraphSurfaceModeAnimationAsset();
  const graph2d = createLinearMapVectorAnimationAsset();

  assert.equal(
    kpEditorGraph3DSurfaceAdapter.supports(stateFor(graph3d)),
    true
  );
  assert.equal(
    kpEditorGraph3DSurfaceAdapter.supports(stateFor(graph2d)),
    false
  );
  assert.equal(kpEditorGraph3DSurfaceAdapter.priority, 100);
});

test("Graph3D adapter owns one literal lazy Three capability boundary", () => {
  const source = readFileSync(
    new URL("../src/editor/graph-3d-surface-adapter.ts", import.meta.url),
    "utf8"
  );

  assert.match(
    source,
    /import\("\.\.\/rendering\/graph-webgl-three\.ts"\)/
  );
  assert.doesNotMatch(source, /from "three"/);
  assert.match(source, /KP_EDITOR_ANIMATION_DISPOSE_EVENT/);
  assert.match(source, /projectKpEditorGraph3DRuntimeFrame/);
  assert.match(source, /renderKpGraph3DWebGLRuntimeFrame/);
  assert.match(source, /hydrateKpGraph3DWebGLRuntimeFrame/);
});

function stateFor(animation: ReturnType<typeof createGraphSurfaceModeAnimationAsset>) {
  return createKpEditorAnimationPlayerState({
    animation,
    descriptor: createKpEditorAnimationDescriptor({
      animationId: animation.id,
      title: animation.title,
      summary: animation.title,
      renderTargetKinds: animation.renderTargets.map(({ kind }) => kind)
    })
  });
}
