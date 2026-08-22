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
import {
  createKpLogExponentAnimationAsset
} from "./log-exponent-adapter.ts";
import {
  createKpLogQuotientAnimationAsset
} from "./log-quotient-adapter.ts";
import {
  createKpLogarithmChangeOfBaseExemplarAsset
} from "./logarithm-change-of-base-exemplar.ts";
import {
  createKpFractionEquivalenceExemplarAssets
} from "./fraction-equivalence-exemplar.ts";
import {
  createKpCommonDenominatorPressureAnimationAsset
} from "./common-denominator-pressure-exemplar.ts";
import {
  createKpLogProductAnimationAssets
} from "./log-product-adapter.ts";
import {
  createKpExponentialHomomorphismAnimationAsset
} from "./exponential-homomorphism-adapter.ts";
import {
  createKpExponentialQuotientPressureAnimationAsset
} from "./exponential-quotient-pressure-adapter.ts";
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
import {
  createKpFivePlusTwoEvaluationAnimationAsset,
  createKpOnePlusTwoEvaluationAnimationAsset,
  createKpThreeSixthsEvaluationAnimationAsset,
  createKpTwoTimesOneCarrierAnimationAsset,
  createKpTwoTimesThreeEvaluationAnimationAsset
} from "./operation-evaluation-adapter.ts";
import {
  createKpPlaceValueAdditionAnimationAsset
} from "./place-value-addition-adapter.ts";
import {
  createEconomicsEquilibriumAnimationAsset
} from "./economics-equilibrium-adapter.ts";
import {
  createConstantForceWorkEnergyAnimationAsset
} from "./constant-force-work-energy-adapter.ts";
import {
  createKpVerifiedGeneratedLinearSolveRuntimeAsset
} from "./verified-generated-linear-solve-runtime-asset.ts";
import {
  createKpCanonicalCancellationPressureAnimationAsset
} from "./cancellation-pressure-animation.ts";
import {
  createKpEvenRootSolveAnimationAsset
} from "./even-root-solve-adapter.ts";
import {
  createKpCompoundRootCarrierAnimationAsset
} from "./compound-root-carrier-adapter.ts";
import {
  createKpFiniteSumExpansionExemplarAsset
} from "./finite-sum-expansion-exemplar.ts";
import {
  createKpFiniteProductExpansionExemplarAsset
} from "./finite-product-expansion-exemplar.ts";
import { enrichKpMatrixLinearMapAsset } from
  "./matrix-linear-map-asset-enrichment.ts";

export function createKpAnimationAssets(): readonly KpAnimationAsset[] {
  return [
    ...createGeneratedAlgebraAnimationAssets(),
    createKpOnePlusTwoEvaluationAnimationAsset(),
    createKpFivePlusTwoEvaluationAnimationAsset(),
    createKpThreeSixthsEvaluationAnimationAsset(),
    createKpTwoTimesOneCarrierAnimationAsset(),
    createKpTwoTimesThreeEvaluationAnimationAsset(),
    createKpExactFractionQuantityAnimationAsset(),
    createKpPlaceValueAdditionAnimationAsset(),
    createEconomicsEquilibriumAnimationAsset(),
    createConstantForceWorkEnergyAnimationAsset(),
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
    createKpVerifiedGeneratedLinearSolveRuntimeAsset(),
    createKpCanonicalCancellationPressureAnimationAsset(),
    createKpEvenRootSolveAnimationAsset(),
    createKpCompoundRootCarrierAnimationAsset(),
    createKpFiniteSumExpansionExemplarAsset(),
    createKpFiniteProductExpansionExemplarAsset(),
    createFractionSimplificationAnimationAsset(),
    createExponentExpansionAnimationAsset(),
    createExponentRadicalRewriteAnimationAsset(),
    createFunctionWrapAnimationAsset(),
    createDistributionExpansionAnimationAsset(),
    createDistributionFactoringAnimationAsset(),
    createInequalitySignFlipAnimationAsset(),
    createKpLogExponentAnimationAsset(),
    createKpLogQuotientAnimationAsset(),
    createKpLogarithmChangeOfBaseExemplarAsset(),
    ...createKpFractionEquivalenceExemplarAssets(),
    createKpCommonDenominatorPressureAnimationAsset(),
    ...createKpLogProductAnimationAssets(),
    createKpExponentialHomomorphismAnimationAsset(),
    createKpExponentialQuotientPressureAnimationAsset()
  ];
}

export function createGeneratedProblemAnimationAssets():
  readonly KpAnimationAsset[] {
  return [
    ...createGeneratedCalculusProblemFixtures(),
    ...createGeneratedLinearAlgebraProblemFixtures()
  // Keep the eager test catalogue and lazy product pack on one enriched asset
  // identity; capability loading must not change semantic object ownership.
  ].map((fixture) =>
    enrichKpMatrixLinearMapAsset(
      createGeneratedProblemAnimationAsset(fixture)
    )
  );
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
