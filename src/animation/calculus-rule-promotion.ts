import {
  checkKpAnimationAssetSeekRewindLaw,
  type KpAnimationAsset
} from "./asset.ts";
import { diagnoseKpAnimationDesign } from "./animation-design-diagnostics.ts";
import { createKpCalculusRuleChoreography } from "./calculus-rule-choreography.ts";
import { compileKpSemanticEquationTransitionResult } from "../rendering/semantic-equation-transition-compiler.ts";

export const kpPromotedCalculusRuleAnimationIds = [
  "animation.generated.calculus.derivative.power-rule-x-cubed",
  "animation.generated.calculus.derivative.sum-rule-polynomial",
  "animation.generated.calculus.integral.power-rule-quadratic"
] as const;

export interface KpCalculusRulePromotionReport {
  readonly kind: "calculus-rule-promotion-report";
  readonly status: "promoted" | "blocked";
  readonly animationIds: readonly string[];
  readonly transformationCount: number;
  readonly gaps: readonly string[];
}

export function auditKpCalculusRulePromotion(
  catalog: readonly KpAnimationAsset[]
): KpCalculusRulePromotionReport {
  const gaps: string[] = [];
  const animations = kpPromotedCalculusRuleAnimationIds.flatMap((id) => {
    const animation = catalog.find((candidate) => candidate.id === id);
    if (animation === undefined) {
      gaps.push(`Missing calculus animation ${id}.`);
      return [];
    }
    return [animation];
  });
  animations.forEach((animation) => {
    if (!checkKpAnimationAssetSeekRewindLaw(animation).passed) {
      gaps.push(`${animation.id} does not satisfy the seek/rewind law.`);
    }
    animation.transformations.forEach((transformation) => {
      const semantic = compileKpSemanticEquationTransitionResult({
        transformation,
        bundle: animation.bundle
      });
      if (semantic.status !== "semantic") {
        gaps.push(`${transformation.id} does not compile semantic token motion.`);
      }
      const diagnosis = diagnoseKpAnimationDesign({
        animation,
        transformationId: transformation.id
      });
      if (
        diagnosis?.visualStrategy !== "operation-specific" ||
        diagnosis.motifKind === "artifact-replace" ||
        diagnosis.issues.length > 0
      ) {
        gaps.push(`${transformation.id} has unresolved animation design diagnostics.`);
      }
      if (transformation.transformType !== "applyDerivativePowerRule") {
        try {
          createKpCalculusRuleChoreography({
            animation,
            transformationId: transformation.id
          });
        } catch (error) {
          gaps.push(
            error instanceof Error
              ? error.message
              : `${transformation.id} has no inspectable choreography.`
          );
        }
      }
    });
  });
  return {
    kind: "calculus-rule-promotion-report",
    status: gaps.length === 0 ? "promoted" : "blocked",
    animationIds: animations.map((animation) => animation.id),
    transformationCount: animations.reduce(
      (count, animation) => count + animation.transformations.length,
      0
    ),
    gaps
  };
}
