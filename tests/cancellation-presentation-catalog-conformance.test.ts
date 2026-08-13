import assert from "node:assert/strict";
import test from "node:test";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createDivideBothSidesEquationAnimationAsset } from "../src/animation/divide-both-sides-equation-adapter.ts";
import { createFractionalLinearEquationAnimationAsset } from "../src/animation/fractional-linear-equation-adapter.ts";
import {
  createFractionalLinearTransferBalancedAnimationAsset,
  createFractionalLinearTransferFluentAnimationAsset
} from "../src/animation/fractional-linear-transfer-comparison-adapter.ts";
import { createLinearSolveTeacherZeroAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { checkKpCancellationPresentationCatalog } from "../src/rendering/cancellation-presentation-conformance.ts";

test("every catalog cancellation asset conforms to inferred policy", () => {
  const assets = [
    ...createKpAnimationAssets(),
    createLinearSolveTeacherZeroAnimationAsset(),
    createFractionalLinearEquationAnimationAsset(),
    createDivideBothSidesEquationAnimationAsset(),
    createFractionalLinearTransferBalancedAnimationAsset(),
    createFractionalLinearTransferFluentAnimationAsset()
  ];
  assert.deepEqual(checkKpCancellationPresentationCatalog(assets), []);
});

test("catalog conformance reports missing typed presentation authority", () => {
  const base = createDivideBothSidesEquationAnimationAsset();
  assert.deepEqual(checkKpCancellationPresentationCatalog([
    { ...base, presentationProfile: undefined }
  ]).map(({ animationId, code }) => [animationId, code]), [
    [base.id, "missing-typed-profile"]
  ]);
});
