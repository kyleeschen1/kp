import assert from "node:assert/strict";
import test from "node:test";

import type { KpAnimationAsset } from "../src/animation/asset.ts";
import { createNumeratorSplitMergeEquationAnimationAsset } from "../src/animation/numerator-split-merge-equation-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  compileKpReaderEquationMaterialPlan,
  projectKpReaderEquationRenderPlan,
  validateKpReaderEquationMaterialPlanTotality
} from "../src/reader/renderers/public-api.ts";

function plans(
  animation: KpAnimationAsset,
  direction: "forward" | "rewind",
  progress: number
) {
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    animation,
    direction,
    progress
  });
  const renderPlan = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame
  });
  return {
    renderPlan,
    materialPlan: compileKpReaderEquationMaterialPlan(renderPlan)
  };
}

test("fraction glyphs and structural artifacts have exactly one lineage owner", () => {
  const animation = createNumeratorSplitMergeEquationAnimationAsset();
  for (const direction of ["forward", "rewind"] as const) {
    for (const progress of [0.25, 0.75]) {
      const { renderPlan, materialPlan } = plans(
        animation,
        direction,
        progress
      );
      assert.deepEqual(renderPlan.diagnostics, []);
      assert.deepEqual(materialPlan.diagnostics, []);
      assert.deepEqual(
        validateKpReaderEquationMaterialPlanTotality(
          renderPlan,
          materialPlan
        ),
        []
      );
      const transition = materialPlan.transitions[0]!;
      assert.equal(transition.anchors.length, 14);
      assert.equal(transition.owners.length, 6);
      for (const owner of transition.owners.filter(({ relation }) =>
        relation === "fan-out" || relation === "fan-in"
      )) {
        assert.deepEqual(
          [owner.sourceAnchorIds.length, owner.targetAnchorIds.length],
          owner.lifecycle === "split" ? [1, 2] : [2, 1]
        );
      }
    }
  }
});

test("lineage ownership is independent of correspondence record order", () => {
  const animation = createNumeratorSplitMergeEquationAnimationAsset();
  const permuted: KpAnimationAsset = {
    ...animation,
    transformations: animation.transformations.map((transformation) => ({
      ...transformation,
      correspondenceMap: transformation.correspondenceMap === undefined
        ? undefined
        : {
            ...transformation.correspondenceMap,
            records: [...transformation.correspondenceMap.records].reverse()
          }
    }))
  };

  for (const progress of [0.25, 0.75]) {
    const original = plans(animation, "forward", progress);
    const reordered = plans(permuted, "forward", progress);
    assert.deepEqual(
      validateKpReaderEquationMaterialPlanTotality(
        reordered.renderPlan,
        reordered.materialPlan
      ),
      []
    );
    assert.deepEqual(
      reordered.materialPlan.transitions[0]!.owners
        .map(({ id }) => id)
        .sort(),
      original.materialPlan.transitions[0]!.owners
        .map(({ id }) => id)
        .sort()
    );
  }
});
