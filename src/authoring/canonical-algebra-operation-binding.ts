import type { KpAnimationAsset } from "../animation/asset.ts";
import { createVerifiedIntegerMultipleFactoringAnimationAsset } from "../animation/distribution-adapter.ts";
import { createVerifiedContextualConstantSumAnimationAsset } from "../animation/operation-evaluation-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../animation/runtime-sampler.ts";
import { projectKpReaderEquationRenderPlan } from "../reader/renderers/equation-render-plan.ts";
import type { KpReaderEquationTransitionPresentationPlan } from "../reader/renderers/equation-transition-presentation-plan.ts";
import type { KpVerifiedComposedFactoring } from "../semantic/composed-algebra-factoring.ts";
import type { KpVerifiedComposedEvaluation } from "../semantic/composed-algebra-evaluation.ts";
import { KpComposedAlgebraRepair } from "./composed-algebra-source.ts";
import { compileKpEquationAssetMigrationV2 } from "../domain-ir/equation-asset-migration-v2.ts";
import { compileKpEquationEvaluationFamilyCertificateV2, type KpVerifiedEquationEvaluationFamilyCertificateV2 } from "../domain-ir/equation-evaluation-family-certificate-v2.ts";

export interface KpCanonicalFactoringOperationBinding {
  readonly kind: "factoring";
  readonly animation: KpAnimationAsset;
  readonly plan: Extract<KpReaderEquationTransitionPresentationPlan, { planKind: "factoring" }>;
  readonly canonicalReference: "editor-animation.sample.animation.factoring.factor-common-a";
  readonly evaluationCertificates: readonly [];
}
export interface KpCanonicalEvaluationOperationBinding {
  readonly kind: "evaluation";
  readonly animation: KpAnimationAsset;
  readonly plan: Extract<KpReaderEquationTransitionPresentationPlan, { planKind: "successor-synthesis" }>;
  readonly canonicalReference: "animation.operation-evaluation.one-plus-two";
  readonly evaluationCertificates: readonly [KpVerifiedEquationEvaluationFamilyCertificateV2];
}
export type KpCanonicalAlgebraOperationBinding = KpCanonicalFactoringOperationBinding | KpCanonicalEvaluationOperationBinding;

export function resolveKpFactoringOperationBinding(proof: KpVerifiedComposedFactoring): KpCanonicalFactoringOperationBinding {
  const animation = createVerifiedIntegerMultipleFactoringAnimationAsset(proof), plan = canonicalPlan(animation);
  if (plan.planKind !== "factoring" || !plan.factoringMotifBinding.operationPresentationPlan.choreography)
    throw gap("Factoring requires its complete canonical choreography, not fusion-only or fallback motion.");
  return Object.freeze({ kind: "factoring", animation, plan,
    canonicalReference: "editor-animation.sample.animation.factoring.factor-common-a", evaluationCertificates: Object.freeze([] as const) });
}
export function resolveKpEvaluationOperationBinding(proof: KpVerifiedComposedEvaluation): KpCanonicalEvaluationOperationBinding {
  const animation = createVerifiedContextualConstantSumAnimationAsset(proof), plan = canonicalPlan(animation);
  if (plan.planKind !== "successor-synthesis" || plan.successorSyntheses.length !== 1)
    throw gap("Evaluation requires the canonical executable successor program and complete continuity evidence.");
  const transformation = animation.transformations[0]!, record = transformation.correspondenceMap?.records.find(r => r.relation === "fan-in");
  if (!record) throw gap("Canonical sum evaluation requires contributor lineage.");
  const migration = compileKpEquationAssetMigrationV2({ animation,
    operations: [{ transformationId: transformation.id, operationId: "kp.arithmetic.add", semanticClass: "evaluation",
      roleBindings: { "operands-before": record.sourceSelectorIds, "result-after": record.targetSelectorIds }, projectionIntent: "replacement" }] });
  const authority = migration.presentationPlan.transitions[0]?.evaluationAuthority;
  if (!authority) throw gap("Canonical addition did not resolve its registered evaluation authority.");
  const result = compileKpEquationEvaluationFamilyCertificateV2({ bundle: animation.bundle, transformation, authority });
  if (result.status !== "certified") throw gap(result.diagnostics.map(d => d.message).join("; "));
  return Object.freeze({ kind: "evaluation", animation, plan, canonicalReference: "animation.operation-evaluation.one-plus-two",
    evaluationCertificates: Object.freeze([result.certificate] as const) });
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
