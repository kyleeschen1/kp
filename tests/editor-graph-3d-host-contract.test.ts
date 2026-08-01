import assert from "node:assert/strict";
import test from "node:test";

import {
  createGraphSurfaceModeAnimationAsset
} from "../src/animation/graph-adapter.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  createKpEditorGraph3DHostContract,
  KP_EDITOR_GRAPH_3D_ANIMATION_ID,
  projectKpEditorGraph3DHostFrame,
  supportsKpEditorGraph3DAnimation
} from "../src/editor/graph-3d-surface-contract.ts";
import {
  renderGraph3DWebGLShell
} from "../src/rendering/graph-webgl.ts";
import type { Graph3DObject } from "../src/semantic/graph.ts";

test("bounded Graph3D catalogue contract owns lazy capability, lease, fallback, and accessibility policy", () => {
  const animation = createGraphSurfaceModeAnimationAsset();
  const contract = createKpEditorGraph3DHostContract(animation);

  assert.equal(contract.animationId, KP_EDITOR_GRAPH_3D_ANIMATION_ID);
  assert.equal(contract.graphId, "saddle-orbit-graph");
  assert.deepEqual(contract.surfaceIds, ["saddle-surface"]);
  assert.equal(contract.sourceMode, "mesh");
  assert.equal(contract.targetMode, "donut");
  assert.deepEqual(contract.capability, {
    modulePath: "../rendering/graph-webgl-three.ts",
    loadWhen: "selected-and-visible",
    backend: "three"
  });
  assert.equal(contract.resource.contextLimit, 2);
  assert.equal(contract.resource.leasesPerMountedSurface, 1);
  assert.deepEqual(contract.resource.releaseWhen, [
    "selection-replaced",
    "player-disposed",
    "context-lost"
  ]);
  assert.equal(contract.fallback.kind, "semantic-svg");
  assert.equal(contract.fallback.ownsPaintUntilWebglReady, true);
  assert.equal(contract.accessibility.canvasHiddenFromAccessibilityTree, true);
});

test("Graph3D host support is exact instead of claiming every graph row", () => {
  assert.equal(supportsKpEditorGraph3DAnimation(KP_EDITOR_GRAPH_3D_ANIMATION_ID), true);
  assert.equal(supportsKpEditorGraph3DAnimation("animation.dot-projection.basic"), false);
});

test("Graph3D host projection preserves direct seek and exact rewind", () => {
  const animation = createGraphSurfaceModeAnimationAsset();
  const forward = projectKpEditorGraph3DHostFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction: "forward",
      progress: 0.37
    })
  });
  const rewind = projectKpEditorGraph3DHostFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction: "rewind",
      progress: 0.63
    })
  });
  const forwardSource = forward.sourceObjects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );
  const forwardTarget = forward.targetObjects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );

  assert.equal(forward.transitionProgress, 0.37);
  assert.ok(Math.abs(rewind.transitionProgress - 0.37) < 1e-12);
  assert.equal(forwardSource?.surfaceMode, "mesh");
  assert.equal(forwardTarget?.surfaceMode, "donut");
  assert.equal(forward.description, "Saddle surface: mesh to donut, 37 percent complete.");
  assert.equal(rewind.description, forward.description);
});

test("Graph3D semantic shell exposes one accessible image and keeps canvas hidden", () => {
  const animation = createGraphSurfaceModeAnimationAsset();
  const contract = createKpEditorGraph3DHostContract(animation);
  const objects = animation.bundle.objects.map((object) => object.value);
  const graph = objects.find(
    (object): object is Graph3DObject =>
      typeof object === "object" && object !== null &&
      (object as { type?: unknown }).type === "graph-3d"
  );

  assert.ok(graph);
  const html = renderGraph3DWebGLShell(objects, graph);
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="Saddle surface"/);
  assert.match(html, /aria-describedby="rn-saddle-orbit-graph-webgl-status"/);
  assert.match(html, /class="graph-webgl__canvas"[^>]+aria-hidden="true"/);
  assert.match(html, /data-kp-renderer-fallback="svg" aria-hidden="true"/);
  assert.match(html, /Static graph available while the 3D view loads\./);
});

test("Graph3D host contract fails closed when semantic target metadata drifts", () => {
  const animation = createGraphSurfaceModeAnimationAsset();
  const malformed = {
    ...animation,
    renderTargets: animation.renderTargets.map((target) => ({
      ...target,
      metadata: {
        ...target.metadata,
        targetMode: "wireframe"
      }
    }))
  };

  assert.throws(
    () => createKpEditorGraph3DHostContract(malformed),
    /must name a supported Graph3D surface mode/
  );
});
