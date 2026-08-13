import assert from "node:assert/strict";
import test from "node:test";

import {
  createDistributionExpansionAnimationAsset,
  createDistributionFactoringAnimationAsset
} from "../src/animation/distribution-adapter.ts";
import {
  createDivideBothSidesEquationAnimationAsset
} from "../src/animation/divide-both-sides-equation-adapter.ts";
import {
  createExponentExpansionAnimationAsset,
  createExponentRadicalRewriteAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";
import {
  createFractionSimplificationAnimationAsset
} from "../src/animation/fraction-adapter.ts";
import {
  createFractionalLinearEquationAnimationAsset
} from "../src/animation/fractional-linear-equation-adapter.ts";
import {
  createFractionalLinearTransferBalancedAnimationAsset,
  createFractionalLinearTransferFluentAnimationAsset
} from "../src/animation/fractional-linear-transfer-comparison-adapter.ts";
import {
  createFunctionWrapAnimationAsset
} from "../src/animation/function-wrap-adapter.ts";
import {
  createLinearSolveTeacherZeroAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import {
  createNumeratorSplitEquationAnimationAsset,
  createNumeratorSplitMergeEquationAnimationAsset
} from "../src/animation/numerator-split-merge-equation-adapter.ts";
import {
  kpEquationPresentationProfile
} from "../src/animation/equation-presentation-policy.ts";

test("proven symbolic families author typed profiles without legacy authority", () => {
  const semanticMaterialAssets = [
    createDistributionExpansionAnimationAsset(),
    createDistributionFactoringAnimationAsset(),
    createFractionSimplificationAnimationAsset(),
    createExponentExpansionAnimationAsset(),
    createExponentRadicalRewriteAnimationAsset(),
    createFunctionWrapAnimationAsset()
  ];
  const continuityAssets = [
    createNumeratorSplitEquationAnimationAsset(),
    createNumeratorSplitMergeEquationAnimationAsset(),
    createFractionalLinearEquationAnimationAsset(),
    createDivideBothSidesEquationAnimationAsset(),
    createFractionalLinearTransferBalancedAnimationAsset(),
    createFractionalLinearTransferFluentAnimationAsset()
  ];

  for (const asset of [...semanticMaterialAssets, ...continuityAssets]) {
    assert.equal(asset.presentationProfile?.domain, "equation", asset.id);
    assert.equal(kpEquationPresentationProfile(asset).recipe.length > 0, true);
  }

  assert.ok(semanticMaterialAssets.every(
    (asset) =>
      kpEquationPresentationProfile(asset).recipe === "semantic-material-v2"
  ));
  assert.ok(continuityAssets.every(
    (asset) => kpEquationPresentationProfile(asset).recipe === "continuity-v1"
  ));
});

test("promoted profiles preserve exact prior recipe views", () => {
  assert.deepEqual(
    kpEquationPresentationProfile(
      createNumeratorSplitMergeEquationAnimationAsset()
    ),
    {
      recipe: "continuity-v1",
      handoff: "atomic-v1",
      cancellation: "native-handoff-v1",
      zeroWitness: "none",
      successor: "native-handoff-v1",
      depth: "semantic-depth-v1",
      continuants: "transit-then-reflow-v1"
    }
  );
  assert.deepEqual(
    kpEquationPresentationProfile(
      createFractionalLinearEquationAnimationAsset()
    ),
    {
      recipe: "continuity-v1",
      handoff: "atomic-v1",
      cancellation: "counter-orbit-v1",
      zeroWitness: "none",
      successor: "counter-convergence-v1",
      depth: "semantic-depth-v1",
      continuants: "transit-then-reflow-v1"
    }
  );
  assert.deepEqual(
    kpEquationPresentationProfile(
      createFractionalLinearTransferBalancedAnimationAsset()
    ).successor,
    "convergence-v1"
  );
});

test("fraction and teacher-detail assets retain lineage after typed promotion", () => {
  const fraction = createNumeratorSplitMergeEquationAnimationAsset();
  const teacherDetail = createLinearSolveTeacherZeroAnimationAsset();

  assert.deepEqual(fraction.metadata, {
    sourceTraceId: "trace.algebra-canonical-numerator-split-merge"
  });
  assert.equal(teacherDetail.presentationProfile?.payload.motion, "continuity-v1");
  assert.deepEqual(teacherDetail.metadata, {
    sourceAnimationId: "linear-equation-solve-x"
  });
});
