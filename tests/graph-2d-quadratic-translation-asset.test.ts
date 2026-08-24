import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw,
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import {
  checkKpGraph2DQuadraticTranslationRuntimeLaw,
  createKpGraph2DQuadraticTranslationAnimationAsset,
  sampleKpGraph2DQuadraticTranslationRuntimeFrame
} from "../src/animation/graph-2d-quadratic-translation-asset.ts";
import { sampleKpAnimationRuntimeFrame } from
  "../src/animation/runtime-sampler.ts";
import { compileExpression } from "../src/math/expression.ts";
import {
  checkCorrespondenceMapRewindLaw,
  validateCorrespondenceMap
} from "../src/semantic/correspondence.ts";
import { compileKpGraph2DQuadraticTranslation } from
  "../src/semantic/graph-2d-quadratic-translation-trace.ts";
import { kpGraph2DQuadraticTranslationRequest } from
  "../src/domain-ir/graph-2d-function-generation-request.ts";

test("the frontend derives exact quadratic states and material points", () => {
  const result = compileKpGraph2DQuadraticTranslation(
    kpGraph2DQuadraticTranslationRequest
  );
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  const trace = result.trace;

  assert.equal(trace.source.normalizedLatex, "y = x^{2}");
  assert.equal(trace.target.normalizedLatex,
    "y = \\left(x - 2\\right)^{2}");
  assert.equal(compileExpression(trace.source.expression)({ x: 3 }), 9);
  assert.equal(compileExpression(trace.target.expression)({ x: 3 }), 1);
  assert.deepEqual(trace.source.points.map(({ id, x, y }) => ({ id, x, y })), [
    {
      id: "point.graph-2d.quadratic-translation.left",
      x: -1,
      y: 1
    }, {
      id: "point.graph-2d.quadratic-translation.vertex",
      x: 0,
      y: 0
    }, {
      id: "point.graph-2d.quadratic-translation.right",
      x: 1,
      y: 1
    }
  ]);
  assert.deepEqual(trace.target.points.map(({ id, x, y }) => ({ id, x, y })), [
    {
      id: "point.graph-2d.quadratic-translation.left",
      x: 1,
      y: 1
    }, {
      id: "point.graph-2d.quadratic-translation.vertex",
      x: 2,
      y: 0
    }, {
      id: "point.graph-2d.quadratic-translation.right",
      x: 3,
      y: 1
    }
  ]);
});

test("the trace closes identity correspondence and explanation authority", () => {
  const result = compileKpGraph2DQuadraticTranslation(
    kpGraph2DQuadraticTranslationRequest
  );
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  const trace = result.trace;

  assert.deepEqual(validateCorrespondenceMap(trace.correspondenceMap), []);
  assert.deepEqual(checkCorrespondenceMapRewindLaw(trace.correspondenceMap), []);
  assert.equal(trace.transformation.preserves.includes("identity"), true);
  assert.equal(trace.correspondenceMap.records.find(({ id }) =>
    id === "curve-persists")?.relation, "identity");
  assert.equal(trace.correspondenceMap.records.find(({ id }) =>
    id === "horizontal-shift-enters")?.relation, "introduction");
  const authorities = new Set([
    trace.operationId,
    ...(trace.transformation.lawRefs ?? []).map(({ id }) => id)
  ]);
  assert.equal(trace.claims.every(({ authorityIds }) =>
    authorityIds.every((id) => authorities.has(id))
  ), true);
});

test("the animation asset closes standard graph lifecycle laws", () => {
  const asset = createKpGraph2DQuadraticTranslationAnimationAsset();

  assert.equal(asset.id,
    "animation.graph-2d.quadratic-translate-right-two");
  assert.equal(asset.animation.renderTargets[0]?.kind, "graph");
  assert.equal(asset.animation.renderTargets[0]?.metadata?.["semanticTraceId"],
    asset.trace.id);
  assert.deepEqual(validateKpAnimationAsset(asset.animation), []);
  assert.equal(checkKpAnimationAssetReferenceClosure(asset.animation).passed,
    true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(asset.animation).passed, true);
  assert.equal(checkKpGraph2DQuadraticTranslationRuntimeLaw({ asset }).passed,
    true);
  const focus = asset.animation.transformationTree.annotations[0];
  assert.equal(focus?.selectorIds?.some((id) => id.includes("axis")), false);
  assert.equal(focus?.selectorIds?.some((id) => id.endsWith(".curve")), true);
  assert.equal(focus?.selectorIds?.some((id) => id.includes(".point.")), true);
});

test("direct seek and mirrored rewind derive the same semantic frames", () => {
  const asset = createKpGraph2DQuadraticTranslationAnimationAsset();
  const source = sample(asset, "forward", 0);
  const middle = sample(asset, "forward", 0.5);
  const target = sample(asset, "forward", 1);
  const rewindMiddle = sample(asset, "rewind", 0.5);

  assert.equal(source.horizontalShift, 0);
  assert.deepEqual(source.vertex, {
    id: "point.graph-2d.quadratic-translation.vertex",
    role: "vertex",
    parameter: 0,
    x: 0,
    y: 0
  });
  assert.equal(middle.horizontalShift, 1);
  assert.equal(middle.vertex.x, 1);
  assert.equal(target.horizontalShift, 2);
  assert.equal(target.vertex.x, 2);
  assert.deepEqual(rewindMiddle, {
    ...middle,
    id: rewindMiddle.id,
    runtimeFrameId: rewindMiddle.runtimeFrameId
  });
  assert.equal(Object.isFrozen(target), true);
  assert.equal(Object.isFrozen(target.selectedPoints), true);
});

test("static and accessible endpoints remain independent of motion", () => {
  const asset = createKpGraph2DQuadraticTranslationAnimationAsset();

  assert.deepEqual(asset.staticEndpoints, {
    sourceLatex: "y = x^{2}",
    targetLatex: "y = \\left(x - 2\\right)^{2}"
  });
  assert.match(asset.accessibility.description, /moves right/u);
  assert.match(asset.accessibility.settledDescription, /vertex is now/u);
});

test("semantic trace and asset contain no SVG DOM or Catalogue authority", () => {
  for (const path of [
    "../src/semantic/graph-2d-quadratic-translation-trace.ts",
    "../src/animation/graph-2d-quadratic-translation-asset.ts"
  ]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source,
      /from ["'][^"']*(?:rendering|editor)\//u);
    assert.doesNotMatch(source,
      /(?:SVGElement|HTMLElement|document\.createElement|Catalogue)/u);
  }
});

function sample(
  asset: ReturnType<typeof createKpGraph2DQuadraticTranslationAnimationAsset>,
  direction: "forward" | "rewind",
  progress: number
) {
  return sampleKpGraph2DQuadraticTranslationRuntimeFrame({
    asset,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation: asset.animation,
      direction,
      progress
    })
  });
}
