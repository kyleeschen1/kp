import type { KpAnimationAsset } from "./asset.ts";
import {
  createComparisonLayoutAnimationAssets
} from "./comparison-layout-adapter.ts";
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
import { createGeneratedProblemAnimationAsset } from "./generated-problem-import.ts";
import { createGraphAnimationAssets } from "./graph-adapter.ts";
import { createLinearSolveAnimationAsset } from "./linear-solve-adapter.ts";
import { createProgrammingAnimationAssets } from "./programming-adapter.ts";
import {
  createGeneratedCalculusProblemFixtures
} from "../semantic/generated-calculus-problem-fixture.ts";
import {
  createGeneratedLinearAlgebraProblemFixtures
} from "../semantic/generated-linear-algebra-problem-fixture.ts";

export function createKpAnimationAssets(): readonly KpAnimationAsset[] {
  return [
    ...createGeneratedAlgebraAnimationAssets(),
    ...createGeneratedProblemAnimationAssets(),
    ...createGraphAnimationAssets(),
    ...createProgrammingAnimationAssets(),
    ...createComparisonLayoutAnimationAssets()
  ];
}

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

export function createGeneratedProblemAnimationAssets():
  readonly KpAnimationAsset[] {
  return [
    ...createGeneratedCalculusProblemFixtures(),
    ...createGeneratedLinearAlgebraProblemFixtures()
  ].map(createGeneratedProblemAnimationAsset);
}

export function animationIdsForTimelineIds(
  timelineIds: readonly string[]
): readonly string[] {
  const timelineIdSet = new Set(timelineIds);

  return createKpAnimationAssets()
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
  return [
    ...createGeneratedAlgebraAnimationAssets(),
    ...createGeneratedProblemAnimationAssets()
  ].find((animation) => {
    const sourceRefIds = animation.dashboard?.sourceRefIds ?? [];
    const sourceFixtureId = animation.metadata?.["sourceFixtureId"];

    return sourceRefIds.includes(fixtureId) || sourceFixtureId === fixtureId;
  });
}
