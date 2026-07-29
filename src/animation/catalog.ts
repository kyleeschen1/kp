import type { KpAnimationAsset } from "./asset.ts";
import {
  createComplexKatexSampleAnimationAssets
} from "./complex-katex-sample-adapter.ts";
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
import {
  createInequalitySignFlipAnimationAsset
} from "./inequality-sign-flip-adapter.ts";
import { createLinearSolveAnimationAsset } from "./linear-solve-adapter.ts";
import { createProgrammingAnimationAssets } from "./programming-adapter.ts";
import {
  createAcceptedGeneratedAddZeroAnimationAsset,
  createAcceptedGeneratedSubstitutionAnimationAsset,
  createProvisionalIncorrectSubstitutionAnimationAsset
} from "./llm-animation-draft-examples.ts";
import {
  createAcceptedGeneratedPipelineDiagramAnimationAsset
} from "./llm-diagram-draft-example.ts";
import {
  createGeneratedCalculusProblemFixtures
} from "../semantic/generated-calculus-problem-fixture.ts";
import {
  createGeneratedLinearAlgebraProblemFixtures
} from "../semantic/generated-linear-algebra-problem-fixture.ts";
import {
  createKpExactFractionQuantityAnimationAsset
} from "./exact-fraction-quantity-adapter.ts";

export function createKpAnimationAssets(): readonly KpAnimationAsset[] {
  return [
    ...createGeneratedAlgebraAnimationAssets(),
    createKpExactFractionQuantityAnimationAsset(),
    createAcceptedGeneratedAddZeroAnimationAsset(),
    createAcceptedGeneratedSubstitutionAnimationAsset(),
    createProvisionalIncorrectSubstitutionAnimationAsset(),
    createAcceptedGeneratedPipelineDiagramAnimationAsset(),
    ...createGeneratedProblemAnimationAssets(),
    ...createGraphAnimationAssets(),
    ...createProgrammingAnimationAssets(),
    ...createComparisonLayoutAnimationAssets(),
    ...createComplexKatexSampleAnimationAssets()
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
    createDistributionFactoringAnimationAsset(),
    createInequalitySignFlipAnimationAsset()
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
