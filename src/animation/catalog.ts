import type { KpAnimationAsset } from "./asset.ts";
import {
  createDistributionExpansionAnimationAsset,
  createDistributionFactoringAnimationAsset
} from "./distribution-adapter.ts";
import {
  createExponentExpansionAnimationAsset,
  createExponentRadicalRewriteAnimationAsset
} from "./exponent-radical-adapter.ts";
import { createFractionSimplificationAnimationAsset } from "./fraction-adapter.ts";
import { createFunctionWrapAnimationAsset } from "./function-wrap-adapter.ts";
import { createLinearSolveAnimationAsset } from "./linear-solve-adapter.ts";

export function createGeneratedAlgebraAnimationAssets():
  readonly KpAnimationAsset[] {
  return [
    createLinearSolveAnimationAsset(),
    createFractionSimplificationAnimationAsset(),
    createExponentExpansionAnimationAsset(),
    createExponentRadicalRewriteAnimationAsset(),
    createFunctionWrapAnimationAsset(),
    createDistributionExpansionAnimationAsset(),
    createDistributionFactoringAnimationAsset()
  ];
}
