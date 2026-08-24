import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw,
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import {
  checkKpGraph3DSaddleParameterRuntimeLaw,
  createKpGraph3DSaddleParameterAnimationAsset,
  sampleKpGraph3DSaddleParameterRuntimeFrame
} from "../src/animation/graph-3d-saddle-parameter-asset.ts";
import { sampleKpAnimationRuntimeFrame } from
  "../src/animation/runtime-sampler.ts";
import { compileExpression } from "../src/math/expression.ts";
import {
  checkCorrespondenceMapRewindLaw,
  validateCorrespondenceMap
} from "../src/semantic/correspondence.ts";
import { compileKpGraph3DSaddleParameterTrace } from
  "../src/semantic/graph-3d-saddle-parameter-trace.ts";
import { kpGraph3DSaddleParameterRequest } from
  "../src/domain-ir/graph-3d-scene-generation-request.ts";

test("the frontend derives exact saddle endpoint states and witnesses", () => {
  const result = compileKpGraph3DSaddleParameterTrace(
    kpGraph3DSaddleParameterRequest
  );
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  const trace = result.trace;

  assert.equal(trace.source.normalizedLatex,
    "z = \\frac{x^{2} - y^{2}}{4}");
  assert.equal(trace.target.normalizedLatex,
    "z = \\frac{x^{2} - y^{2}}{8}");
  assert.equal(compileExpression(trace.source.expression)({ x: 2, y: 0 }), 1);
  assert.equal(compileExpression(trace.target.expression)({ x: 2, y: 0 }),
    0.5);
  assert.deepEqual(trace.source.witnesses.map(({ id, x, y, z }) => ({
    id, x, y, z
  })), [{
    id: "witness.graph-3d.saddle-parameter.x-ridge",
    x: 2,
    y: 0,
    z: 1
  }, {
    id: "witness.graph-3d.saddle-parameter.saddle-origin",
    x: 0,
    y: 0,
    z: 0
  }, {
    id: "witness.graph-3d.saddle-parameter.y-valley",
    x: 0,
    y: 2,
    z: -1
  }]);
  assert.deepEqual(trace.target.witnesses.map(({ x, y, z }) => ({ x, y, z })),
    [{ x: 2, y: 0, z: 0.5 }, { x: 0, y: 0, z: 0 }, {
      x: 0, y: 2, z: -0.5
    }]);
});

test("the trace closes surface context and explanation authority", () => {
  const result = compileKpGraph3DSaddleParameterTrace(
    kpGraph3DSaddleParameterRequest
  );
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  const trace = result.trace;

  assert.deepEqual(validateCorrespondenceMap(trace.correspondenceMap), []);
  assert.deepEqual(checkCorrespondenceMapRewindLaw(trace.correspondenceMap), []);
  assert.equal(trace.transformation.preserves.includes("identity"), true);
  assert.equal(trace.correspondenceMap.records.find(({ id }) =>
    id === "surface-persists")?.relation, "identity");
  assert.equal(trace.correspondenceMap.records.find(({ id }) =>
    id === "camera-persists")?.relation, "identity");
  assert.equal(trace.context.camera.policy, "fixed");
  const authorities = new Set([
    trace.operationId,
    ...(trace.transformation.lawRefs ?? []).map(({ id }) => id)
  ]);
  assert.equal(trace.claims.every(({ authorityIds }) =>
    authorityIds.every((id) => authorities.has(id))
  ), true);
});

test("the animation asset closes standard graph lifecycle laws", () => {
  const asset = createKpGraph3DSaddleParameterAnimationAsset();

  assert.equal(asset.id,
    "animation.graph-3d.saddle-denominator-four-to-eight");
  assert.equal(asset.animation.renderTargets[0]?.kind, "graph");
  assert.equal(asset.animation.renderTargets[0]?.metadata?.["semanticTraceId"],
    asset.trace.id);
  assert.deepEqual(validateKpAnimationAsset(asset.animation), []);
  assert.equal(checkKpAnimationAssetReferenceClosure(asset.animation).passed,
    true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(asset.animation).passed, true);
  assert.equal(checkKpGraph3DSaddleParameterRuntimeLaw({ asset }).passed, true);
  const focus = asset.animation.transformationTree.annotations[0];
  assert.equal(focus?.selectorIds?.some((id) => id.includes("axis")), false);
  assert.equal(focus?.selectorIds?.some((id) => id.endsWith(".surface")), true);
  assert.equal(focus?.selectorIds?.some((id) => id.includes("x-ridge")), true);
});

test("direct seek and mirrored rewind derive the same semantic frames", () => {
  const asset = createKpGraph3DSaddleParameterAnimationAsset();
  const source = sample(asset, "forward", 0);
  const middle = sample(asset, "forward", 0.5);
  const target = sample(asset, "forward", 1);
  const rewindMiddle = sample(asset, "rewind", 0.5);

  assert.equal(source.denominator, 4);
  assert.equal(middle.denominator, 6);
  assert.equal(target.denominator, 8);
  assert.equal(source.witnesses[0]?.z, 1);
  assert.equal(middle.witnesses[0]?.z, 0.666667);
  assert.equal(target.witnesses[0]?.z, 0.5);
  assert.equal(source.cameraStateId, target.cameraStateId);
  assert.equal(source.topology, target.topology);
  assert.deepEqual(rewindMiddle, {
    ...middle,
    id: rewindMiddle.id,
    runtimeFrameId: rewindMiddle.runtimeFrameId
  });
  assert.equal(Object.isFrozen(target), true);
  assert.equal(Object.isFrozen(target.witnesses), true);
});

test("static and accessible endpoints remain independent of motion", () => {
  const asset = createKpGraph3DSaddleParameterAnimationAsset();

  assert.deepEqual(asset.staticEndpoints, {
    sourceLatex: "z = \\frac{x^{2} - y^{2}}{4}",
    targetLatex: "z = \\frac{x^{2} - y^{2}}{8}"
  });
  assert.match(asset.accessibility.description, /camera remain fixed/u);
  assert.match(asset.accessibility.settledDescription, /half/u);
  assert.match(sample(asset, "forward", 0.5).accessibilityDescription,
    /50 percent flattened/u);
});

test("semantic trace and asset contain no renderer DOM or Catalogue authority", () => {
  for (const path of [
    "../src/semantic/graph-3d-saddle-parameter-trace.ts",
    "../src/animation/graph-3d-saddle-parameter-asset.ts"
  ]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source,
      /from ["'][^"']*(?:rendering|editor)\//u);
    assert.doesNotMatch(source,
      /(?:SVGElement|WebGLRenderingContext|HTMLElement|document\.createElement|Catalogue)/u);
  }
});

function sample(
  asset: ReturnType<typeof createKpGraph3DSaddleParameterAnimationAsset>,
  direction: "forward" | "rewind",
  progress: number
) {
  return sampleKpGraph3DSaddleParameterRuntimeFrame({
    asset,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation: asset.animation,
      direction,
      progress
    })
  });
}
