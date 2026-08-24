import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createKpGraph2DQuadraticTranslationAnimationAsset,
  sampleKpGraph2DQuadraticTranslationRuntimeFrame
} from "../src/animation/graph-2d-quadratic-translation-asset.ts";
import { sampleKpAnimationRuntimeFrame } from
  "../src/animation/runtime-sampler.ts";
import { createKpEditorAnimationDescriptor } from
  "../src/editor/animation-descriptor.ts";
import { createKpEditorAnimationPlayerState } from
  "../src/editor/animation-player-state.ts";
import { kpEditorGraph2DQuadraticTranslationSurfaceAdapter } from
  "../src/editor/graph-2d-quadratic-translation-surface-adapter.ts";
import { createKpEditorGraphSvgViewportModel } from
  "../src/editor/graph-svg-viewport-lifecycle.ts";
import {
  projectKpGraph2DQuadraticTranslationSvgFrame,
  renderKpGraph2DQuadraticTranslationSvgContent
} from "../src/rendering/graph-2d-quadratic-translation-svg.ts";

test("SVG projection moves one curve and stable points through renderer geometry", () => {
  const asset = createKpGraph2DQuadraticTranslationAnimationAsset();
  const viewport = createKpEditorGraphSvgViewportModel(asset.animation);
  const source = project(asset, viewport, 0);
  const middle = project(asset, viewport, 0.5);
  const target = project(asset, viewport, 1);

  assert.deepEqual(viewport.xDomain, [-3, 5]);
  assert.deepEqual(viewport.yDomain, [-1, 5]);
  assert.equal(source.curveIdentityId, target.curveIdentityId);
  assert.equal(source.vertex.x, 0);
  assert.equal(middle.vertex.x, 1);
  assert.equal(target.vertex.x, 2);
  assert.ok(source.vertex.cx < middle.vertex.cx);
  assert.ok(middle.vertex.cx < target.vertex.cx);
  assert.equal(source.vertex.cy, target.vertex.cy);
  assert.equal(source.points.every((point, index) =>
    point.id === target.points[index]?.id && point.y === target.points[index]?.y
  ), true);
  assert.notEqual(source.curvePath, target.curvePath);
});

test("equation salience changes without hiding either exact endpoint", () => {
  const asset = createKpGraph2DQuadraticTranslationAnimationAsset();
  const viewport = createKpEditorGraphSvgViewportModel(asset.animation);
  const source = project(asset, viewport, 0);
  const target = project(asset, viewport, 1);

  assert.deepEqual([
    source.sourceEquationSalience,
    source.targetEquationSalience
  ], [1, 0.35]);
  assert.deepEqual([
    target.sourceEquationSalience,
    target.targetEquationSalience
  ], [0.35, 1]);
  assert.match(source.accessibilityDescription, /0 of 2 units/u);
  assert.match(target.accessibilityDescription, /2 of 2 units/u);
});

test("responsive geometry changes paint coordinates, not semantic state", () => {
  const asset = createKpGraph2DQuadraticTranslationAnimationAsset();
  const frame = runtimeFrame(asset, 0.5);
  const compact = projectKpGraph2DQuadraticTranslationSvgFrame({
    frame,
    viewport: {
      ...createKpEditorGraphSvgViewportModel(asset.animation),
      width: 480,
      height: 320
    }
  });
  const wide = projectKpGraph2DQuadraticTranslationSvgFrame({
    frame,
    viewport: {
      ...createKpEditorGraphSvgViewportModel(asset.animation),
      width: 720,
      height: 420
    }
  });

  assert.equal(compact.horizontalShift, wide.horizontalShift);
  assert.equal(compact.vertex.id, wide.vertex.id);
  assert.equal(compact.vertex.x, wide.vertex.x);
  assert.notEqual(compact.vertex.cx, wide.vertex.cx);
  assert.notEqual(compact.vertex.cy, wide.vertex.cy);
});

test("the source-native shell keeps axes contextual and endpoint math legible", () => {
  const asset = createKpGraph2DQuadraticTranslationAnimationAsset();
  const viewport = createKpEditorGraphSvgViewportModel(asset.animation);
  const frame = runtimeFrame(asset, 0.5);
  const html = renderKpGraph2DQuadraticTranslationSvgContent({
    frame,
    viewport
  });

  assert.match(html, /data-kp-graph2d-quadratic-context/u);
  assert.match(html, /aria-hidden="true"/u);
  assert.match(html, /data-kp-graph2d-quadratic-curve/u);
  assert.match(html, /data-kp-graph2d-quadratic-point-role="vertex"/u);
  assert.match(html, /data-kp-graph2d-quadratic-equation="source"/u);
  assert.match(html, /data-kp-graph2d-quadratic-equation="target"/u);
  assert.match(html, /style="opacity:0\.675"/u);
  assert.match(html, /data-kp-graph2d-quadratic-description/u);
  assert.doesNotMatch(html, /<canvas|webgl/iu);
});

test("the editor adapter is exact and outranks the generic graph adapter", () => {
  const asset = createKpGraph2DQuadraticTranslationAnimationAsset();
  const descriptor = createKpEditorAnimationDescriptor({
    animationId: asset.id,
    title: asset.animation.title,
    summary: asset.accessibility.description,
    renderTargetKinds: ["graph"]
  });
  const state = createKpEditorAnimationPlayerState({
    animation: asset.animation,
    descriptor,
    progress: 0.5
  });

  assert.equal(kpEditorGraph2DQuadraticTranslationSurfaceAdapter.slotKind,
    "graph");
  assert.equal(kpEditorGraph2DQuadraticTranslationSurfaceAdapter.priority, 120);
  assert.equal(kpEditorGraph2DQuadraticTranslationSurfaceAdapter.supports(state),
    true);
  assert.equal(kpEditorGraph2DQuadraticTranslationSurfaceAdapter.supports({
    ...state,
    animationId: "animation.derivative-rules.tangent-graph"
  }), false);
});

test("runtime paint patches retained SVG and owns no clock or formula parser", () => {
  const source = readFileSync(new URL(
    "../src/rendering/graph-2d-quadratic-translation-svg.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source,
    /(?:requestAnimationFrame|setInterval|setTimeout|performance\.now)/u);
  assert.doesNotMatch(source,
    /(?:parseLatex|compileExpression|MathExpression)/u);
  assert.match(source, /curve\.setAttribute\("d"/u);
  assert.match(source, /element\.setAttribute\("cx"/u);
  assert.match(source, /input\.content\.replaceChildren\(\)/u);
});

function project(
  asset: ReturnType<typeof createKpGraph2DQuadraticTranslationAnimationAsset>,
  viewport: ReturnType<typeof createKpEditorGraphSvgViewportModel>,
  progress: number
) {
  return projectKpGraph2DQuadraticTranslationSvgFrame({
    frame: runtimeFrame(asset, progress),
    viewport
  });
}

function runtimeFrame(
  asset: ReturnType<typeof createKpGraph2DQuadraticTranslationAnimationAsset>,
  progress: number
) {
  return sampleKpGraph2DQuadraticTranslationRuntimeFrame({
    asset,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation: asset.animation,
      progress
    })
  });
}
