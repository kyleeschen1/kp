import type { KpAnimationAsset } from "../animation/asset.ts";
import { createVerifiedIntegerMultipleFactoringAnimationAsset } from "../animation/distribution-adapter.ts";
import { createVerifiedContextualConstantSumAnimationAsset } from "../animation/operation-evaluation-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../animation/runtime-sampler.ts";
import { projectKpReaderEquationRenderPlan } from "../reader/renderers/equation-render-plan.ts";
import type { KpReaderEquationTransitionPresentationPlan } from "../reader/renderers/equation-transition-presentation-plan.ts";
import type { KpVerifiedComposedFactoring } from "../semantic/composed-algebra-factoring.ts";
import type { KpVerifiedComposedEvaluation } from "../semantic/composed-algebra-evaluation.ts";
import { KpComposedAlgebraRepair } from "./composed-algebra-source.ts";

export interface KpCanonicalFactoringOperationBinding {
  readonly kind: "factoring";
  readonly animation: KpAnimationAsset;
  readonly plan: Extract<KpReaderEquationTransitionPresentationPlan, { planKind: "factoring" }>;
  readonly canonicalReference: "editor-animation.sample.animation.factoring.factor-common-a";
}
export interface KpCanonicalEvaluationOperationBinding {
  readonly kind: "evaluation";
  readonly animation: KpAnimationAsset;
  readonly plan: Extract<KpReaderEquationTransitionPresentationPlan, { planKind: "successor-synthesis" }>;
  readonly canonicalReference: "animation.operation-evaluation.one-plus-two";
}
export type KpCanonicalAlgebraOperationBinding = KpCanonicalFactoringOperationBinding | KpCanonicalEvaluationOperationBinding;

export function resolveKpFactoringOperationBinding(proof: KpVerifiedComposedFactoring): KpCanonicalFactoringOperationBinding {
  const animation = createVerifiedIntegerMultipleFactoringAnimationAsset(proof), plan = canonicalPlan(animation);
  if (plan.planKind !== "factoring" || !plan.factoringMotifBinding.operationPresentationPlan.choreography)
    throw gap("Factoring requires its complete canonical choreography, not fusion-only or fallback motion.");
  return Object.freeze({ kind: "factoring", animation, plan,
    canonicalReference: "editor-animation.sample.animation.factoring.factor-common-a" });
}
export function resolveKpEvaluationOperationBinding(proof: KpVerifiedComposedEvaluation): KpCanonicalEvaluationOperationBinding {
  const animation = createVerifiedContextualConstantSumAnimationAsset(proof), plan = canonicalPlan(animation);
  if (plan.planKind !== "successor-synthesis" || plan.successorSyntheses.length !== 1)
    throw gap("Evaluation requires the canonical executable successor program and complete continuity evidence.");
  return Object.freeze({ kind: "evaluation", animation, plan, canonicalReference: "animation.operation-evaluation.one-plus-two" });
}
function canonicalPlan(animation: KpAnimationAsset): KpReaderEquationTransitionPresentationPlan {
  // Invoke the same registered semantic-to-presentation route as the canonical
  // reader. An operation label or equal-looking plan is not a substitute.
  const runtimeFrame = sampleKpAnimationRuntimeFrame({ animation, direction: "forward", progress: .5 });
  const renderPlan = projectKpReaderEquationRenderPlan({ animation, runtimeFrame });
  const transition = renderPlan.transitions[0];
  if (renderPlan.diagnostics.length || renderPlan.transitions.length !== 1 || !transition || transition.semanticStatus !== "ready")
    throw gap("The canonical operation compiler did not produce one complete semantic transition.");
  return transition.presentationPlan;
}
function gap(message: string): KpComposedAlgebraRepair {
  return new KpComposedAlgebraRepair("unsupported-presentation", "$.states", message);
}
