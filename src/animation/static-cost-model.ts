import {
  resolveKpRenderQualityProfile,
  type KpRenderQualityProfile,
  type KpRenderQualityTier
} from "./render-quality.ts";

export interface KpAnimationStaticCostInput {
  readonly tokenCount: number;
  readonly simultaneousMovingGroupCount: number;
  readonly fragmentCount: number;
  readonly shadowLayerCount: number;
  readonly threeDLayerCount: number;
}

export interface KpAnimationStaticCostBreakdown {
  readonly tokens: number;
  readonly simultaneousGroups: number;
  readonly fragments: number;
  readonly shadows: number;
  readonly threeD: number;
  readonly total: number;
}

export interface KpAnimationStaticCostTierEstimate {
  readonly tier: KpRenderQualityTier;
  readonly budget: number;
  readonly breakdown: KpAnimationStaticCostBreakdown;
  readonly withinBudget: boolean;
}

export type KpAnimationStaticCostDiagnosticCode =
  | "cost.invalid-count"
  | "cost.hard-limit"
  | "cost.quality-downgrade"
  | "cost.compression-required";

export interface KpAnimationStaticCostDiagnostic {
  readonly code: KpAnimationStaticCostDiagnosticCode;
  readonly severity: "info" | "warning" | "error";
  readonly metric: keyof KpAnimationStaticCostInput | "total";
  readonly actual: number;
  readonly limit?: number | undefined;
  readonly message: string;
  readonly action:
    | "fix-invalid-count"
    | "reduce-authored-complexity"
    | "use-recommended-tier"
    | "request-pedagogical-compression";
}

export type KpAnimationStaticCostResult =
  | {
      readonly status: "accepted";
      readonly recommendedTier: KpRenderQualityTier;
      readonly estimates: readonly KpAnimationStaticCostTierEstimate[];
      readonly diagnostics: readonly KpAnimationStaticCostDiagnostic[];
    }
  | {
      readonly status: "compression-required" | "rejected";
      readonly estimates: readonly KpAnimationStaticCostTierEstimate[];
      readonly diagnostics: readonly KpAnimationStaticCostDiagnostic[];
    };

// These are compiler-side complexity units, not milliseconds. Runtime
// baselines may tune them later without coupling authoring to browser timing.
export const KP_ANIMATION_STATIC_COST_BUDGETS: Readonly<
  Record<KpRenderQualityTier, number>
> = Object.freeze({
  full: 220,
  balanced: 260,
  efficient: 320
});

export const KP_ANIMATION_STATIC_COST_HARD_LIMITS: Readonly<
  Record<keyof KpAnimationStaticCostInput, number>
> = Object.freeze({
  tokenCount: 256,
  simultaneousMovingGroupCount: 32,
  fragmentCount: 512,
  shadowLayerCount: 24,
  threeDLayerCount: 12
});

const tiers = ["full", "balanced", "efficient"] as const;

export function evaluateKpAnimationStaticCost(
  input: KpAnimationStaticCostInput
): KpAnimationStaticCostResult {
  const invalid = invalidCountDiagnostics(input);
  const estimates = invalid.length === 0
    ? tiers.map((tier) => estimateTier(input, tier))
    : [];
  if (invalid.length > 0) {
    return { status: "rejected", estimates, diagnostics: invalid };
  }

  const hardLimits = hardLimitDiagnostics(input);
  if (hardLimits.length > 0) {
    return { status: "rejected", estimates, diagnostics: hardLimits };
  }

  const recommended = estimates.find((estimate) => estimate.withinBudget);
  if (recommended === undefined) {
    const efficient = estimates.at(-1)!;
    return {
      status: "compression-required",
      estimates,
      diagnostics: [{
        code: "cost.compression-required",
        severity: "error",
        metric: "total",
        actual: efficient.breakdown.total,
        limit: efficient.budget,
        message:
          `The least expensive faithful rendering costs ${efficient.breakdown.total} units against a ${efficient.budget}-unit budget. Request explicit pedagogical compression; do not remove semantic steps automatically.`,
        action: "request-pedagogical-compression"
      }]
    };
  }

  return {
    status: "accepted",
    recommendedTier: recommended.tier,
    estimates,
    diagnostics: recommended.tier === "full" ? [] : [{
      code: "cost.quality-downgrade",
      severity: "warning",
      metric: "total",
      actual: recommended.breakdown.total,
      limit: recommended.budget,
      message:
        `Render at ${recommended.tier} quality to preserve all semantic work within the ${recommended.budget}-unit static budget.`,
      action: "use-recommended-tier"
    }]
  };
}

export function estimateKpAnimationStaticCostForTier(input: {
  readonly cost: KpAnimationStaticCostInput;
  readonly tier: KpRenderQualityTier;
}): KpAnimationStaticCostTierEstimate {
  return estimateTier(input.cost, input.tier);
}

function estimateTier(
  input: KpAnimationStaticCostInput,
  tier: KpRenderQualityTier
): KpAnimationStaticCostTierEstimate {
  const profile = resolveKpRenderQualityProfile({ preference: tier });
  const breakdown = costBreakdown(input, profile);
  const budget = KP_ANIMATION_STATIC_COST_BUDGETS[tier];
  return {
    tier,
    budget,
    breakdown,
    withinBudget: breakdown.total <= budget
  };
}

function costBreakdown(
  input: KpAnimationStaticCostInput,
  profile: KpRenderQualityProfile
): KpAnimationStaticCostBreakdown {
  // Semantic structure remains equally expensive at every tier. Only the
  // surface channels represented by a quality profile receive a reduction.
  const tokens = input.tokenCount;
  const simultaneousGroups = input.simultaneousMovingGroupCount * 16;
  const fragments = round(
    input.fragmentCount * 0.9 * profile.textureSubdivisionScale
  );
  const shadows = round(input.shadowLayerCount * 14 * profile.shadowScale);
  const threeD = round(input.threeDLayerCount * 24 * profile.depthScale);
  return {
    tokens,
    simultaneousGroups,
    fragments,
    shadows,
    threeD,
    total: round(tokens + simultaneousGroups + fragments + shadows + threeD)
  };
}

function invalidCountDiagnostics(
  input: KpAnimationStaticCostInput
): readonly KpAnimationStaticCostDiagnostic[] {
  return metricEntries(input).flatMap(([metric, actual]) =>
    Number.isInteger(actual) && actual >= 0 ? [] : [{
      code: "cost.invalid-count" as const,
      severity: "error" as const,
      metric,
      actual,
      message: `${metric} must be a non-negative integer before cost evaluation.`,
      action: "fix-invalid-count" as const
    }]
  );
}

function hardLimitDiagnostics(
  input: KpAnimationStaticCostInput
): readonly KpAnimationStaticCostDiagnostic[] {
  return metricEntries(input).flatMap(([metric, actual]) => {
    const limit = KP_ANIMATION_STATIC_COST_HARD_LIMITS[metric];
    return actual <= limit ? [] : [{
      code: "cost.hard-limit" as const,
      severity: "error" as const,
      metric,
      actual,
      limit,
      message:
        `${metric} is ${actual}; the compiler hard limit is ${limit}. Reduce authored complexity before rendering.`,
      action: "reduce-authored-complexity" as const
    }];
  });
}

function metricEntries(
  input: KpAnimationStaticCostInput
): readonly (readonly [keyof KpAnimationStaticCostInput, number])[] {
  return [
    ["tokenCount", input.tokenCount],
    ["simultaneousMovingGroupCount", input.simultaneousMovingGroupCount],
    ["fragmentCount", input.fragmentCount],
    ["shadowLayerCount", input.shadowLayerCount],
    ["threeDLayerCount", input.threeDLayerCount]
  ];
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
