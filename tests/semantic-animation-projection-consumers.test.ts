import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  compileKpAnimationAssetSemanticRefs
} from "../src/animation/asset.ts";
import {
  projectKpAnimationAsset
} from "../src/animation/asset-projections.ts";
import {
  createLinearSolveProgrammingComparisonAnimationAsset
} from "../src/animation/comparison-layout-adapter.ts";
import {
  sampleKpAnimationFrameDescriptor
} from "../src/animation/frame-descriptor.ts";
import {
  createLinearSolveAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  compileKpSemanticAnimationAssetProjectionRefs,
  validateKpSemanticAnimationAssetProjection
} from "../src/animation/semantic-animation-projection-compiler.ts";

test("runtime sampling consumes the semantic projection with exact parity", () => {
  const asset = createLinearSolveAnimationAsset();
  const semantic = projectKpAnimationAsset(asset).semanticAnimation;
  const aggregateFrame = sampleKpAnimationRuntimeFrame({
    animation: asset,
    direction: "rewind",
    progress: 0.375
  });
  const projectedFrame = sampleKpAnimationRuntimeFrame({
    animation: semantic,
    direction: "rewind",
    progress: 0.375
  });

  assert.deepEqual(projectedFrame, aggregateFrame);
});

test("frame descriptors consume the semantic projection with exact parity", () => {
  const asset = createLinearSolveAnimationAsset();
  const semantic = projectKpAnimationAsset(asset).semanticAnimation;

  assert.deepEqual(
    sampleKpAnimationFrameDescriptor({
      animation: semantic,
      direction: "forward",
      progress: 0.625
    }),
    sampleKpAnimationFrameDescriptor({
      animation: asset,
      direction: "forward",
      progress: 0.625
    })
  );
});

test("semantic validation and compilation retain exact references and diagnostics", () => {
  const asset = createLinearSolveAnimationAsset();
  const semantic = projectKpAnimationAsset(asset).semanticAnimation;

  assert.deepEqual(validateKpSemanticAnimationAssetProjection(semantic), []);
  assert.deepEqual(
    compileKpSemanticAnimationAssetProjectionRefs(semantic),
    {
      ...compileKpAnimationAssetSemanticRefs(asset),
      layoutRefs: []
    }
  );
});

test("composed child sampling needs no product-manifest projection", () => {
  const parent = createLinearSolveProgrammingComparisonAnimationAsset();
  const child = createLinearSolveAnimationAsset();
  const aggregate = sampleKpAnimationRuntimeFrame({
    animation: parent,
    childAnimations: [child],
    progress: 0.5
  });
  const projected = sampleKpAnimationRuntimeFrame({
    animation: projectKpAnimationAsset(parent).semanticAnimation,
    childAnimations: [projectKpAnimationAsset(child).semanticAnimation],
    progress: 0.5
  });

  assert.deepEqual(projected, aggregate);
  assert.ok(projected.childFrames.length > 0);
});

test("runtime source does not consume product, review, dashboard, or export state", () => {
  const source = readFileSync(fileURLToPath(new URL(
    "../src/animation/runtime-sampler.ts",
    import.meta.url
  )), "utf8");

  assert.doesNotMatch(
    source,
    /(?:\.dashboard|\.exportTargets|\.review|(?:input\.)?animation\.metadata)\b/
  );
});
