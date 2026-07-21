import type { KpEquationDepthPresentationRecipe } from "./equation-presentation-policy.ts";

export interface KpEquationSemanticDepthPlan {
  readonly kind: "equation-semantic-depth-plan";
  readonly recipe: "semantic-depth-v1";
  readonly liftStart: number;
  readonly liftEnd: number;
  readonly settleStart: number;
  readonly settleEnd: number;
  readonly maximumScale: number;
  readonly maximumLiftPx: number;
  readonly maximumShadowBlurPx: number;
  readonly maximumShadowOpacity: number;
}

export interface KpEquationSemanticDepthPose {
  readonly elevation: number;
  readonly scale: number;
  readonly translateY: number;
  readonly shadowBlurPx: number;
  readonly shadowOpacity: number;
  readonly layer: 0 | 1;
}

const semanticDepthPlan: KpEquationSemanticDepthPlan = Object.freeze({
  kind: "equation-semantic-depth-plan",
  recipe: "semantic-depth-v1",
  liftStart: 0.12,
  liftEnd: 0.32,
  settleStart: 0.68,
  settleEnd: 0.9,
  maximumScale: 1.025,
  maximumLiftPx: 1.5,
  maximumShadowBlurPx: 5,
  maximumShadowOpacity: 0.14
});

export function createKpEquationSemanticDepthPlan(
  recipe: KpEquationDepthPresentationRecipe
): KpEquationSemanticDepthPlan | undefined {
  return recipe === "semantic-depth-v1" ? semanticDepthPlan : undefined;
}

export function sampleKpEquationSemanticDepth(
  plan: KpEquationSemanticDepthPlan,
  progress: number
): KpEquationSemanticDepthPose {
  const p = clamp01(progress);
  // Elevation is a secondary presentation channel: it never changes opacity,
  // ownership, measurement, or the exact native endpoint poses.
  const lift = smooth(windowProgress(p, plan.liftStart, plan.liftEnd));
  const settle = smooth(windowProgress(p, plan.settleStart, plan.settleEnd));
  const elevation = lift * (1 - settle);
  return Object.freeze({
    elevation,
    scale: 1 + (plan.maximumScale - 1) * elevation,
    translateY: elevation === 0 ? 0 : -plan.maximumLiftPx * elevation,
    shadowBlurPx: plan.maximumShadowBlurPx * elevation,
    shadowOpacity: plan.maximumShadowOpacity * elevation,
    layer: elevation > 0 ? 1 : 0
  });
}

function windowProgress(value: number, start: number, end: number): number {
  return clamp01((value - start) / (end - start));
}

function smooth(value: number): number {
  return value * value * (3 - 2 * value);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
