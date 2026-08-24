import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createKpGraph3DSaddleParameterAnimationAsset } from
  "../src/animation/graph-3d-saddle-parameter-asset.ts";
import { sampleKpAnimationRuntimeFrame } from
  "../src/animation/runtime-sampler.ts";
import {
  projectKpEditorGraph3DSaddleHostFrame
} from "../src/editor/graph-3d-saddle-parameter-host-contract.ts";
import {
  KP_EDITOR_GRAPH_3D_SADDLE_ADAPTER_ID,
  kpEditorGraph3DSaddleSurfaceAdapter
} from "../src/editor/graph-3d-saddle-parameter-surface-adapter.ts";
import { createKpEditorAnimationDescriptor } from
  "../src/editor/animation-descriptor.ts";
import { createKpEditorAnimationPlayerState } from
  "../src/editor/animation-player-state.ts";
import {
  projectKpGraph3DSaddlePaintRuntimeFrame,
  renderKpGraph3DSaddlePaintShell,
  renderKpGraph3DSaddleSvgFallback
} from "../src/rendering/graph-3d-saddle-parameter-paint.ts";
import { createGraph3DWebGLSceneModel } from
  "../src/rendering/graph-webgl.ts";
import { createGraph3DWebGLThreeScene } from
  "../src/rendering/graph-webgl-three.ts";
import type { Graph3DObject, Surface3DObject } from
  "../src/semantic/graph.ts";

test("paint projection materializes current surface truth with fixed camera", () => {
  const source = paintFrame("forward", 0);
  const middle = paintFrame("forward", 0.5);
  const target = paintFrame("forward", 1);
  const rewindMiddle = paintFrame("rewind", 0.5);
  const sourceSurface = surface(source);
  const middleSurface = surface(middle);
  const targetSurface = surface(target);

  assert.equal(sourceSurface.parameterization?.denominator, 4);
  assert.equal(middleSurface.parameterization?.denominator, 6);
  assert.equal(targetSurface.parameterization?.denominator, 8);
  assert.equal(middleSurface.xSampleCount, 21);
  assert.equal(middleSurface.ySampleCount, 21);
  assert.deepEqual(source.camera, middle.camera);
  assert.deepEqual(middle.camera, target.camera);
  assert.deepEqual(middle.scene.target, rewindMiddle.scene.target);
  assert.equal(middle.clock.authority, "host");
  assert.equal(middle.theme.id, "kp.graph.saddle-paper.v1");
});

test("SVG and Three consume the same renderer-owned denominator samples", () => {
  const frame = paintFrame("forward", 0.5);
  const graph = frame.scene.target.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );
  assert.ok(graph);
  const model = createGraph3DWebGLSceneModel(frame.scene.target, graph);
  const sampled = model.surfaces[0]?.grid[10]?.[20];
  const three = createGraph3DWebGLThreeScene(model, frame.theme.roles);
  const svg = renderKpGraph3DSaddleSvgFallback(frame);

  assert.deepEqual(sampled, { x: 3, y: 0, z: 1.5 });
  assert.equal(three.surfaceMeshes[0]?.userData["kpObject"],
    "surface.graph-3d.saddle-parameter.primary");
  assert.equal(three.axisObjects.length, 3);
  assert.match(svg, /data-kp-surface-x-sample-count="21"/u);
  assert.match(svg,
    /data-kp-object="surface\.graph-3d\.saddle-parameter\.primary"/u);
});

test("the Graph3D shell enforces KaTeX ownership for every visible label", () => {
  const html = renderKpGraph3DSaddlePaintShell(
    paintFrame("forward", 0.5)
  );

  assert.doesNotMatch(html, /<text(?:\s|>)/u);
  assert.match(html, /data-kp-graph-3d-saddle-labels/u);
  assert.match(html, /data-kp-latex="z=\\frac\{x\^2-y\^2\}\{a\}"/u);
  assert.match(html, /data-kp-latex="a=6"/u);
  assert.equal((html.match(/data-kp-graph-label-role="axis"/gu) ?? []).length,
    3);
  assert.equal((html.match(/class="katex"/gu) ?? []).length >= 5, true);
  assert.match(html, /role="img"/u);
  assert.match(html, /aria-hidden="true"/u);
});

test("the exact saddle adapter outranks but does not broaden the legacy 3D adapter", () => {
  const asset = createKpGraph3DSaddleParameterAnimationAsset();
  const state = createKpEditorAnimationPlayerState({
    animation: asset.animation,
    descriptor: createKpEditorAnimationDescriptor({
      animationId: asset.id,
      title: asset.animation.title,
      summary: asset.animation.title,
      renderTargetKinds: ["graph"]
    })
  });

  assert.equal(kpEditorGraph3DSaddleSurfaceAdapter.id,
    KP_EDITOR_GRAPH_3D_SADDLE_ADAPTER_ID);
  assert.equal(kpEditorGraph3DSaddleSurfaceAdapter.priority, 110);
  assert.equal(kpEditorGraph3DSaddleSurfaceAdapter.supports(state), true);
  assert.equal(kpEditorGraph3DSaddleSurfaceAdapter.supports({
    ...state,
    animationId: "animation.graph.surface-mode.mesh-to-donut"
  }), false);
});

test("static paint stays Three-free and the adapter owns one literal lazy port", () => {
  const paint = readFileSync(new URL(
    "../src/rendering/graph-3d-saddle-parameter-paint.ts",
    import.meta.url
  ), "utf8");
  const adapter = readFileSync(new URL(
    "../src/editor/graph-3d-saddle-parameter-surface-adapter.ts",
    import.meta.url
  ), "utf8");

  assert.doesNotMatch(paint, /from "three"|graph-webgl-three/u);
  assert.match(adapter,
    /import\(\s*"\.\.\/rendering\/graph-3d-saddle-parameter-ports\.ts"\s*\)/u);
  assert.doesNotMatch(adapter, /from "three"/u);
  assert.match(adapter, /KP_EDITOR_ANIMATION_DISPOSE_EVENT/u);
});

function paintFrame(
  direction: "forward" | "rewind",
  progress: number
) {
  const asset = createKpGraph3DSaddleParameterAnimationAsset();
  return projectKpGraph3DSaddlePaintRuntimeFrame({
    hostFrame: projectKpEditorGraph3DSaddleHostFrame({
      animation: asset.animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({
        animation: asset.animation,
        direction,
        progress
      })
    })
  });
}

function surface(
  frame: ReturnType<typeof paintFrame>
): Surface3DObject {
  const value = frame.scene.target.find(
    (object): object is Surface3DObject => object.type === "surface-3d"
  );
  assert.ok(value);
  return value;
}
