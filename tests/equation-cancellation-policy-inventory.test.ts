import assert from "node:assert/strict";
import test from "node:test";

import { createDivideBothSidesEquationAnimationAsset } from "../src/animation/divide-both-sides-equation-adapter.ts";
import { createFractionalLinearEquationAnimationAsset } from "../src/animation/fractional-linear-equation-adapter.ts";
import {
  createFractionalLinearTransferBalancedAnimationAsset,
  createFractionalLinearTransferFluentAnimationAsset
} from "../src/animation/fractional-linear-transfer-comparison-adapter.ts";
import {
  createLinearSolveAnimationAsset,
  createLinearSolveTeacherZeroAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import { kpEquationPresentationProfile } from "../src/rendering/equation-presentation-policy.ts";

const cancellationTransformTypes = new Set([
  "cancelAdditiveInverses",
  "cancelMultiplicativeInverses"
]);

test("approved equation assets expose the current cancellation-policy inventory", () => {
  const assets = [
    createLinearSolveAnimationAsset(),
    createLinearSolveTeacherZeroAnimationAsset(),
    createFractionalLinearEquationAnimationAsset(),
    createDivideBothSidesEquationAnimationAsset(),
    createFractionalLinearTransferBalancedAnimationAsset(),
    createFractionalLinearTransferFluentAnimationAsset()
  ];

  for (const asset of assets) {
    assert.equal(
      asset.metadata?.["equationCancellationPresentationRecipe"],
      undefined
    );
    if (asset.presentationProfile !== undefined) {
      assert.equal(asset.presentationProfile?.domain, "equation");
      assert.equal(asset.metadata?.["equationCancellationTeachingGoal"], undefined);
    } else {
      assert.equal(
        asset.metadata?.["equationCancellationTeachingGoal"],
        "preserve-flow"
      );
    }
  }

  assert.deepEqual(assets.map((asset) => ({
    id: asset.id,
    cancellationTransformTypes: asset.transformations
      .map((transformation) => transformation.transformType)
      .filter((transformType) => cancellationTransformTypes.has(transformType)),
    recipe: kpEquationPresentationProfile(asset).cancellation
  })), [
    {
      id: "animation.linear-solve.solve-x",
      cancellationTransformTypes: ["cancelAdditiveInverses"],
      recipe: "counter-orbit-v1"
    },
    {
      id: "animation.linear-solve.solve-x.teacher-zero",
      cancellationTransformTypes: ["cancelAdditiveInverses"],
      recipe: "counter-orbit-v1"
    },
    {
      id: "animation.fractional-linear.solve-x-over-2",
      cancellationTransformTypes: [
        "cancelAdditiveInverses",
        "cancelMultiplicativeInverses"
      ],
      recipe: "counter-orbit-v1"
    },
    {
      id: "animation.divide-both-sides.solve-3x-equals-12",
      cancellationTransformTypes: ["cancelMultiplicativeInverses"],
      recipe: "counter-orbit-v1"
    },
    {
      id: "animation.fractional-linear.x-over-2.balanced-proof",
      cancellationTransformTypes: ["cancelMultiplicativeInverses"],
      recipe: "counter-orbit-v1"
    },
    {
      id: "animation.fractional-linear.x-over-2.fluent-projection",
      cancellationTransformTypes: [],
      recipe: "counter-orbit-v1"
    }
  ]);
});
