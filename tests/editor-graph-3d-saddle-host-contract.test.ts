import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createKpGraph3DSaddleParameterAnimationAsset } from
  "../src/animation/graph-3d-saddle-parameter-asset.ts";
import { sampleKpAnimationRuntimeFrame } from
  "../src/animation/runtime-sampler.ts";
import {
  createKpEditorGraph3DSaddleHostContract,
  projectKpEditorGraph3DSaddleHostFrame,
  supportsKpEditorGraph3DSaddleAnimation
} from "../src/editor/graph-3d-saddle-parameter-host-contract.ts";
import { deriveKpEditorSelectedSurfaceCapabilities } from
  "../src/editor/selected-surface-capability.ts";

test("the bounded saddle host retains lazy capability lease fallback and access policy", () => {
  const asset = createKpGraph3DSaddleParameterAnimationAsset();
  const contract = createKpEditorGraph3DSaddleHostContract(asset.animation);

  assert.deepEqual(contract, {
    schemaVersion: "kp.editor-animation.graph-3d-saddle-host.v1",
    animationId: "animation.graph-3d.saddle-denominator-four-to-eight",
    slotKind: "graph",
    graphId: "graph.graph-3d.saddle-parameter.primary",
    surfaceId: "surface.graph-3d.saddle-parameter.primary",
    cameraStateId: "camera.graph-3d.saddle-parameter.fixed",
    sourceDenominator: 4,
    targetDenominator: 8,
    capability: {
      modulePath: "../rendering/graph-3d-saddle-parameter-ports.ts",
      loadWhen: "selected-and-visible",
      backend: "three"
    },
    resource: {
      pool: "kp-webgl-context-lease-pool",
      contextLimit: 2,
      leasesPerMountedSurface: 1,
      releaseWhen: [
        "selection-replaced",
        "player-disposed",
        "context-lost"
      ]
    },
    fallback: {
      kind: "semantic-svg",
      ownsPaintUntilWebglReady: true,
      tracksContinuousSemanticFrame: true
    },
    accessibility: {
      role: "img",
      canvasHiddenFromAccessibilityTree: true,
      descriptionTracksRuntimeFrame: true
    }
  });
  assert.equal(Object.isFrozen(contract.resource.releaseWhen), true);
});

test("the saddle host projects one clock into exact source target and current truth", () => {
  const asset = createKpGraph3DSaddleParameterAnimationAsset();
  const forward = project(asset, "forward", 0.25);
  const rewind = project(asset, "rewind", 0.75);

  assert.equal(forward.visualProgress, 0.25);
  assert.equal(rewind.visualProgress, 0.25);
  assert.equal(forward.source.surface.denominator, 4);
  assert.equal(forward.target.surface.denominator, 8);
  assert.equal(forward.semanticFrame.denominator, 5);
  assert.equal(forward.source.surface.surfaceIdentityId,
    forward.target.surface.surfaceIdentityId);
  assert.equal(forward.source.context.camera.id,
    forward.target.context.camera.id);
  assert.equal(forward.source.context, forward.target.context);
  assert.equal(rewind.semanticFrame.denominator,
    forward.semanticFrame.denominator);
  assert.equal(rewind.description, forward.description);
});

test("Graph3D capability selection names only the two bounded 3D hosts", () => {
  const slotKinds = ["graph"] as const;
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.graph.surface-mode.mesh-to-donut",
    slotKinds
  }), ["graph-webgl-3d"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.graph-3d.saddle-denominator-four-to-eight",
    slotKinds
  }), ["graph-webgl-3d"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: "animation.graph.unregistered-3d",
    slotKinds
  }), []);
  assert.equal(supportsKpEditorGraph3DSaddleAnimation(
    "animation.graph-3d.saddle-denominator-four-to-eight"), true);
  assert.equal(supportsKpEditorGraph3DSaddleAnimation(
    "animation.graph.surface-mode.mesh-to-donut"), false);
});

test("the host fails closed when exact semantic target authority drifts", () => {
  const asset = createKpGraph3DSaddleParameterAnimationAsset();
  const malformed = {
    ...asset.animation,
    renderTargets: asset.animation.renderTargets.map((target) => ({
      ...target,
      metadata: { ...target.metadata, cameraStateId: "camera.changed" }
    }))
  };

  assert.throws(
    () => createKpEditorGraph3DSaddleHostContract(malformed),
    /must retain its exact Graph3D saddle target authority/
  );
  assert.throws(
    () => createKpEditorGraph3DSaddleHostContract({
      ...asset.animation,
      id: "animation.graph.unregistered-3d"
    }),
    /not the bounded saddle parameter exemplar/
  );
});

test("the host contract imports no DOM WebGL implementation or formula parser", () => {
  const source = readFileSync(new URL(
    "../src/editor/graph-3d-saddle-parameter-host-contract.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source,
    /from ["'][^"']*(?:graph-webgl-three|graph-svg|math\/expression)/u);
  assert.doesNotMatch(source,
    /(?:SVGElement|WebGLRenderingContext|document\.createElement|THREE\.)/u);
});

function project(
  asset: ReturnType<typeof createKpGraph3DSaddleParameterAnimationAsset>,
  direction: "forward" | "rewind",
  progress: number
) {
  return projectKpEditorGraph3DSaddleHostFrame({
    animation: asset.animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation: asset.animation,
      direction,
      progress
    })
  });
}
