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
import "../fission-fusion-register.ts";
import "../distribution-choreography-register.ts";
import "../factoring-choreography-register.ts";
import "./algebra-reverse-runtime.ts";

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
