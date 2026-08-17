import type { KpAnimationAsset } from "../asset.ts";
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
import {
  createKpLogExponentAnimationAsset
} from "../log-exponent-adapter.ts";
import {
  createKpLogQuotientAnimationAsset
} from "../log-quotient-adapter.ts";
import {
  createKpCanonicalCancellationPressureAnimationAsset
} from "../cancellation-pressure-animation.ts";
import {
  kpAlgebraChoreographyCapabilities
} from "../algebra-choreography-capabilities.ts";
import type {
  KpAnimationRuntimeCapabilities
} from "../runtime-capabilities.ts";

export interface KpAlgebraAnimationPack {
  readonly catalog: readonly KpAnimationAsset[];
  readonly runtimeCapabilities: KpAnimationRuntimeCapabilities;
}

export function createKpAlgebraAnimationPack(): KpAlgebraAnimationPack {
  return Object.freeze({
    catalog: Object.freeze([
      createKpCanonicalCancellationPressureAnimationAsset(),
      createFractionSimplificationAnimationAsset(),
      createExponentExpansionAnimationAsset(),
      createExponentRadicalRewriteAnimationAsset(),
      createFunctionWrapAnimationAsset(),
      createDistributionExpansionAnimationAsset(),
      createDistributionFactoringAnimationAsset(),
      createInequalitySignFlipAnimationAsset(),
      createKpLogExponentAnimationAsset(),
      createKpLogQuotientAnimationAsset()
    ]),
    runtimeCapabilities: kpAlgebraChoreographyCapabilities
  });
}
