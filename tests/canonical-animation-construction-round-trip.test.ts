import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import {
  projectKpAnimationAsset,
  recomposeKpAnimationAsset
} from "../src/animation/asset-projections.ts";
import {
  createNumeratorSplitMergeEquationAnimationAsset
} from "../src/animation/numerator-split-merge-equation-adapter.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  compileKpCanonicalAnimationConstruction
} from "../src/authoring/canonical-animation-construction-compiler.ts";
import {
  createNumeratorSplitMergeEquationKpAsset
} from "../src/semantic/numerator-split-merge-equation-asset.ts";

const algebraPack = [{ packId: "kp.algebra", version: "0.1.0" }] as const;

test("recorded fraction semantics compile into one JSON-stable canonical trace", () => {
  const animation = createNumeratorSplitMergeEquationAnimationAsset();
  const semantic = createNumeratorSplitMergeEquationKpAsset();
  const compile = () => compileKpCanonicalAnimationConstruction({
    animation,
    sourceId: semantic.sourceTraceId,
    revisionId: "1",
    operationPacks: algebraPack
  });

  const first = compile();
  const second = compile();

  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.deepEqual(structuredClone(first), JSON.parse(JSON.stringify(first)));
  assert.deepEqual(
    first.operations.map(({ transformationId }) => transformationId),
    semantic.transformations.map(({ id }) => id)
  );
  assert.deepEqual(
    first.operations.flatMap(({ lineage }) => lineage.map(({ relation }) => relation)),
    semantic.transformations.flatMap(({ correspondenceMap }) =>
      correspondenceMap!.records.map(({ relation }) => relation)
    )
  );
});

test("seek, rewind, headless, static, and export views retain one semantic asset", () => {
  const animation = createNumeratorSplitMergeEquationAnimationAsset();
  const projections = projectKpAnimationAsset(animation);
  const recomposed = recomposeKpAnimationAsset(projections);

  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);
  assert.equal(JSON.stringify(recomposed), JSON.stringify(animation));
  assert.deepEqual(
    projections.productManifest.exportTargets.map(({ kind }) => kind),
    ["frame-sequence"]
  );

  for (const direction of ["forward", "rewind"] as const) {
    for (const progress of [0, 0.125, 0.5, 0.875, 1]) {
      const aggregateFrame = sampleKpAnimationRuntimeFrame({
        animation,
        direction,
        progress
      });
      const projectedFrame = sampleKpAnimationRuntimeFrame({
        animation: projections.semanticAnimation,
        direction,
        progress
      });
      const repeatedFrame = sampleKpAnimationRuntimeFrame({
        animation,
        direction,
        progress
      });

      assert.equal(
        JSON.stringify(projectedFrame),
        JSON.stringify(aggregateFrame)
      );
      assert.equal(
        JSON.stringify(repeatedFrame),
        JSON.stringify(aggregateFrame)
      );
      assert.deepEqual(aggregateFrame.diagnostics, []);
    }
  }
});
