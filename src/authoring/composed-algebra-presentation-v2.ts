import { assertKpSourceBoundComposedAlgebraProofV2, type KpSourceBoundComposedAlgebraProofV2 } from "./composed-algebra-proof-v2.ts";
import { isKpVerifiedComposedFactoring } from "../semantic/composed-algebra-factoring.ts";
import { isKpVerifiedComposedEvaluation } from "../semantic/composed-algebra-evaluation.ts";
import { isKpVerifiedComposedDistribution } from "../semantic/composed-algebra-distribution.ts";
import { isKpVerifiedComposedProductEvaluation } from "../semantic/composed-algebra-product-evaluation.ts";
import type { KpVerifiedComposedAlgebraChainV2 } from "../semantic/composed-algebra-chain-v2.ts";
import { defineKpSemanticOperationProjector } from "../semantic/semantic-operation-projection.ts";
import { bindKpComposedGroupEndpointHandoff, type KpVerifiedEquationEndpointHandoff } from "../semantic/equation-endpoint-handoff.ts";
import { resolveKpFactoringOperationBinding, resolveKpEvaluationOperationBinding, resolveKpDistributionOperationBinding,
  resolveKpProductOperationBinding, type KpCanonicalAlgebraOperationBindingV2 } from "./canonical-algebra-operation-binding.ts";
import { normalizeKpScalarSumProductEndpoint } from "./common-factor-normalizer.ts";
import { sameKpStructuredExpressionTree } from "../semantic/structured-expression-rewrite.ts";
import { KpComposedAlgebraRepair } from "./composed-algebra-source.ts";
import { composeKpEquationOperationAssets } from "../animation/compose-equation-operation-assets.ts";
import type { KpAnimationAsset } from "../animation/asset.ts";

const brand = Symbol("canonical-composed-algebra-presentation-v2");
const issued = new WeakMap<object, string>();
export interface KpComposedAlgebraPresentationV2 {
  readonly [brand]: true;
  readonly owner: "canonical-composed-algebra-v2";
  readonly checked: KpSourceBoundComposedAlgebraProofV2;
  readonly revisionId: string;
  readonly steps: readonly [KpCanonicalAlgebraOperationBindingV2, KpCanonicalAlgebraOperationBindingV2, KpCanonicalAlgebraOperationBindingV2, ...KpCanonicalAlgebraOperationBindingV2[]];
  readonly handoffs: readonly [KpVerifiedEquationEndpointHandoff];
  readonly animation: KpAnimationAsset;
  readonly checkpointProgress: readonly number[];
}
const resolve = defineKpSemanticOperationProjector<KpVerifiedComposedAlgebraChainV2["steps"][number], KpCanonicalAlgebraOperationBindingV2>({
  "verified-composed-factoring": { accepts: isKpVerifiedComposedFactoring, project: resolveKpFactoringOperationBinding },
  "verified-composed-evaluation": { accepts: isKpVerifiedComposedEvaluation, project: resolveKpEvaluationOperationBinding },
  "verified-composed-distribution": { accepts: isKpVerifiedComposedDistribution, project: resolveKpDistributionOperationBinding },
  "verified-composed-product-evaluation": { accepts: isKpVerifiedComposedProductEvaluation, project: resolveKpProductOperationBinding }
});

/** The complete checked source alone selects operations, timing and handoff.
 * A host cannot swap in a plausible animation or add an unproved bridge. */
export function resolveKpComposedAlgebraPresentationV2(checked: KpSourceBoundComposedAlgebraProofV2): KpComposedAlgebraPresentationV2 {
  assertKpSourceBoundComposedAlgebraProofV2(checked);
  try {
    const proofs = checked.chain.steps;
    const steps = Object.freeze([resolve(proofs[0]), resolve(proofs[1]), resolve(proofs[2]), ...proofs.slice(3).map(resolve)] as const);
    const handoffs = Object.freeze([bindKpComposedGroupEndpointHandoff(proofs[2].partition)] as const);
    // Every operation endpoint, including the alternate presentation view, must
    // still depict its authenticated mathematical state before composition.
    steps.forEach((step, index) => step.animation.bundle.objects.forEach((object, side) => {
      const value = object.value;
      if (!value || typeof value !== "object" || !("latex" in value) || typeof value.latex !== "string") throw gap("Missing canonical endpoint notation.");
      const parsed = normalizeKpScalarSumProductEndpoint({ id: object.id, latex: value.latex }, checked.source.symbols, `$.states[${index + side}].latex`);
      const semantic = checked.chain.endpoints[index + side];
      if (!semantic || !sameKpStructuredExpressionTree(parsed.structured.root, semantic.root)) throw gap("Canonical endpoint notation differs from its checked source.");
    }));
    const composition = composeKpEquationOperationAssets(`animation.composed-algebra-v2.${checked.revisionId.slice(7)}`, checked.source.editorial.title,
      [steps[0].animation, steps[1].animation, ...steps.slice(2).map(step => step.animation)], handoffs);
    if (composition.checkpointProgress.length !== checked.chain.endpoints.length) throw gap("Every mathematical state requires exactly one clock stop.");
    const binding: KpComposedAlgebraPresentationV2 = Object.freeze({ [brand]: true as const, owner: "canonical-composed-algebra-v2",
      checked, revisionId: checked.revisionId, steps, handoffs, ...composition });
    issued.set(binding, JSON.stringify([binding.steps, binding.animation]));
    return binding;
  } catch (error) {
    if (error instanceof KpComposedAlgebraRepair) throw error;
    throw gap(error instanceof Error ? error.message : "Canonical complete presentation failed.");
  }
}
export function assertKpComposedAlgebraPresentationV2(value: unknown): asserts value is KpComposedAlgebraPresentationV2 {
  if (!value || typeof value !== "object" || !issued.has(value)) throw new TypeError("Canonical mounting requires an issued complete presentation.");
  const binding = value as KpComposedAlgebraPresentationV2;
  if (issued.get(binding) !== JSON.stringify([binding.steps, binding.animation])) throw new TypeError("Canonical presentation changed after resolution.");
  assertKpSourceBoundComposedAlgebraProofV2(binding.checked);
}
function gap(message: string): KpComposedAlgebraRepair { return new KpComposedAlgebraRepair("unsupported-presentation", "$.states", message); }
