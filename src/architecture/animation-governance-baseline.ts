import {
  kpAnimationPerformanceTargets
} from "../animation/performance-budget.ts";
import {
  typescriptInferenceBudget
} from "./typescript-inference-budget.ts";

export interface KpAnimationGovernanceBaselineIssue {
  readonly metric: string;
  readonly actual: number;
  readonly maximum: number;
}

export const kpAnimationGovernanceEpochV2Baseline = Object.freeze({
  schemaVersion: "kp.animation-governance-epoch-v2-baseline.v1",
  capturedAt: "2026-08-23T05:07:37.356Z",
  sourceCommit: "49ae387c",
  inference: Object.freeze({
    measuredProject: "tsconfig.inference.json",
    observed: Object.freeze({
      types: 93_651,
      instantiations: 150_979
    }),
    admissionCeilings: typescriptInferenceBudget.ceilings,
    status: "pre-existing-red-at-loop-entry",
    evidence: Object.freeze([
      "npm run check:inference",
      "The inference file list does not reach the slice-1 governance inventory or capability-selection repair."
    ])
  }),
  bundle: Object.freeze({
    command: "npm run check:animation-library-bundle-boundary",
    observedGzipBytes: Object.freeze({
      outer: 3_504,
      mainHost: 201_935,
      measuredCatalogueRouteScript: 134_962,
      placeValueIncremental: 51_100
    }),
    ceilingsGzipBytes: Object.freeze({
      outer: 50_000,
      mainHost: 490_000,
      measuredCatalogueRouteScript: 190_000,
      placeValueIncremental: 75_000
    }),
    forbiddenOuterFiles: Object.freeze([] as string[])
  }),
  lazyLoading: Object.freeze({
    catalogPackDeclarationCount: 14,
    selectedCapabilityDeclarationCount: 17,
    initialThreeRequested: false,
    contract: "Literal pack and capability declarations remain the build-visible lazy authorities."
  }),
  focusedVerification: Object.freeze({
    inventoryTests: 3,
    selectedCapabilityTests: 5,
    discoveryCommand: "npm run verify:equation:inner",
    discoveryPrimaryCheck: "equation-surface-preservation"
  }),
  runtime: Object.freeze({
    command: "npm run perf:animation",
    animationId: "animation.economics.supply-demand-equilibrium-shift",
    normal: Object.freeze({
      hydrationMs: 384,
      initialScriptTransferBytes: 269_195,
      lcpMs: 480,
      cls: 0.00021850943668848938,
      interactionPaintMs: 25.90000009536743,
      longestTaskMs: 99,
      frameP95Ms: 17.5,
      frameMaxMs: 17.700000000000273
    }),
    constrained: Object.freeze({
      hydrationMs: 2_780,
      initialScriptTransferBytes: 240_483,
      lcpMs: 3_132,
      cls: 0.00010445199989610247,
      interactionPaintMs: 37,
      longestTaskMs: 345,
      frameP95Ms: 17.600000000000364,
      frameMaxMs: 34.19999999999982
    }),
    regressionCount: 0,
    unmetProductTargets: Object.freeze([
      "normal.initialScriptTransferBytes.target",
      "constrained.coreWebVitals.lcpMs",
      "constrained.coreWebVitals.longestTaskMs"
    ]),
    productTargets: kpAnimationPerformanceTargets
  })
} as const);

/**
 * The red inference observation is a quarantine line, not a new budget. It
 * prevents this migration from worsening existing debt while the older,
 * stricter admission ceiling remains the only definition of healthy.
 */
export function inspectKpAnimationGovernanceInferenceRegression(input: {
  readonly types: number;
  readonly instantiations: number;
}): readonly KpAnimationGovernanceBaselineIssue[] {
  const observed = kpAnimationGovernanceEpochV2Baseline.inference.observed;
  return Object.freeze([
    ...(input.types > observed.types
      ? [{ metric: "inference.types", actual: input.types,
          maximum: observed.types }]
      : []),
    ...(input.instantiations > observed.instantiations
      ? [{ metric: "inference.instantiations",
          actual: input.instantiations, maximum: observed.instantiations }]
      : [])
  ]);
}
