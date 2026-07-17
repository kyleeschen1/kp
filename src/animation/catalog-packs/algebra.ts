import type { KpAnimationAsset } from "../asset.ts";
import { createLinearSolveAnimationAsset } from "../linear-solve-adapter.ts";
import { createFractionSimplificationAnimationAsset } from "../fraction-adapter.ts";
import {
  createExponentExpansionAnimationAsset,
  createExponentRadicalRewriteAnimationAsset
} from "../exponent-radical-adapter.ts";
import { createFunctionWrapAnimationAsset } from "../function-wrap-adapter.ts";
import {
  createDistributionExpansionAnimationAsset,
  createDistributionFactoringAnimationAsset
} from "../distribution-adapter.ts";
import {
  createInequalitySignFlipAnimationAsset
} from "../inequality-sign-flip-adapter.ts";
// Register material-motion semantics with the lazy algebra pack so the generic
// editor shell does not pay for operation-specific choreography at startup.
import "../../rendering/equation-witnessed-annihilation-register.ts";
import "../fission-fusion-register.ts";
import "../distribution-choreography-register.ts";
import "../factoring-choreography-register.ts";

export function createKpAlgebraAnimationPack(): readonly KpAnimationAsset[] {
  return [
    createLinearSolveAnimationAsset(),
    createFractionSimplificationAnimationAsset(),
    createExponentExpansionAnimationAsset(),
    createExponentRadicalRewriteAnimationAsset(),
    createFunctionWrapAnimationAsset(),
    createDistributionExpansionAnimationAsset(),
    createDistributionFactoringAnimationAsset(),
    createInequalitySignFlipAnimationAsset()
  ];
}
