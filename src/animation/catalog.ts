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

export function animationIdsForTimelineIds(
  timelineIds: readonly string[]
): readonly string[] {
  const timelineIdSet = new Set(timelineIds);

  return createGeneratedAlgebraAnimationAssets()
    .filter((animation) =>
      animation.timeline === undefined
        ? false
        : timelineIdSet.has(animation.timeline.id)
    )
    .map((animation) => animation.id);
}

export function animationAssetForSourceFixtureId(
  fixtureId: string
): KpAnimationAsset | undefined {
  return createGeneratedAlgebraAnimationAssets().find((animation) => {
    const sourceRefIds = animation.dashboard?.sourceRefIds ?? [];
    const sourceFixtureId = animation.metadata?.["sourceFixtureId"];

    return sourceRefIds.includes(fixtureId) || sourceFixtureId === fixtureId;
  });
}
