import type {
  KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import {
  compileKpExistingEquationCancellationPresentationPlan
} from "./existing-equation-cancellation-presentation.ts";
import {
  compileKpFractionCompositionCancellationPresentationPlan
} from "./fraction-composition-cancellation-presentation.ts";
import {
  compileKpGeneratedAlgebraCancellationPresentationPlan
} from "./generated-algebra-cancellation-presentation.ts";
import type {
  KpVerifiedInverseCancellationPresentationPlan
} from "./operation-presentation-plan-types.ts";

/**
 * One canonical resolver prevents reader callers from selecting a family
 * implementation. Every compiler is exact-id and fail-closed; multiple
 * matches indicate registry drift rather than an ordering preference.
 */
export function compileKpEquationCancellationPresentationPlan(
  transformation: KpSemanticTransformation
): KpVerifiedInverseCancellationPresentationPlan | undefined {
  const plans = [
    compileKpFractionCompositionCancellationPresentationPlan(transformation),
    compileKpExistingEquationCancellationPresentationPlan(transformation),
    compileKpGeneratedAlgebraCancellationPresentationPlan(transformation)
  ].filter(
    (plan): plan is KpVerifiedInverseCancellationPresentationPlan =>
      plan !== undefined
  );
  if (plans.length > 1) {
    throw new Error(
      `Cancellation ${transformation.id} has multiple presentation plans.`
    );
  }
  return plans[0];
}
