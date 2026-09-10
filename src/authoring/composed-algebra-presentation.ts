import { assertKpSourceBoundComposedAlgebraProof, type KpSourceBoundComposedAlgebraProof } from "./composed-algebra-proof.ts";
import { isKpVerifiedComposedFactoring } from "../semantic/composed-algebra-factoring.ts";
import { isKpVerifiedComposedEvaluation } from "../semantic/composed-algebra-evaluation.ts";
import type { KpVerifiedComposedAlgebraChain } from "../semantic/composed-algebra-chain.ts";
import { defineKpSemanticOperationProjector } from "../semantic/semantic-operation-projection.ts";
import { resolveKpFactoringOperationBinding, resolveKpEvaluationOperationBinding,
  type KpCanonicalAlgebraOperationBinding, type KpCanonicalFactoringOperationBinding,
  type KpCanonicalEvaluationOperationBinding } from "./canonical-algebra-operation-binding.ts";
import { normalizeKpScalarSumProductEndpoint } from "./common-factor-normalizer.ts";
import { sameKpStructuredExpressionTree } from "../semantic/structured-expression-rewrite.ts";
import { KpComposedAlgebraRepair } from "./composed-algebra-source.ts";
import { composeKpEquationOperationAssets } from "../animation/compose-equation-operation-assets.ts";
import type { KpAnimationAsset } from "../animation/asset.ts";

const brand = Symbol("canonical-composed-algebra-presentation");
const issued = new WeakMap<object, string>();
export interface KpComposedAlgebraPresentation {
  readonly [brand]: true;
  readonly owner: "canonical-composed-algebra-v1";
  readonly checked: KpSourceBoundComposedAlgebraProof;
  readonly revisionId: string;
  readonly steps: readonly [KpCanonicalFactoringOperationBinding, KpCanonicalEvaluationOperationBinding];
  readonly animation: KpAnimationAsset;
  readonly checkpointProgress: readonly [0, number, 1];
}
const resolve = defineKpSemanticOperationProjector<KpVerifiedComposedAlgebraChain["steps"][number], KpCanonicalAlgebraOperationBinding>({
  "verified-composed-factoring": { accepts: isKpVerifiedComposedFactoring, project: resolveKpFactoringOperationBinding },
  "verified-composed-evaluation": { accepts: isKpVerifiedComposedEvaluation, project: resolveKpEvaluationOperationBinding }
});

/** Only the issued source may select operations. Hosts cannot inject an asset,
 * renderer, score or partial plan beside it and still receive this capability. */
export function resolveKpComposedAlgebraPresentation(checked: KpSourceBoundComposedAlgebraProof): KpComposedAlgebraPresentation {
  assertKpSourceBoundComposedAlgebraProof(checked);
  try { return resolveCheckedPresentation(checked); }
  catch (error) {
    if (error instanceof KpComposedAlgebraRepair) throw error;
    throw gap(error instanceof Error ? error.message : "Canonical presentation compilation failed.");
  }
}
function resolveCheckedPresentation(checked: KpSourceBoundComposedAlgebraProof): KpComposedAlgebraPresentation {
  const first = resolve(checked.chain.steps[0]), second = resolve(checked.chain.steps[1]);
  if (first.kind !== "factoring" || second.kind !== "evaluation") throw gap("The bounded chain requires factoring followed by evaluation.");
  const before = first.animation.bundle.objects[0]!, middle = first.animation.bundle.objects[1]!, after = second.animation.bundle.objects[1]!;
  if (JSON.stringify(middle) !== JSON.stringify(second.animation.bundle.objects[0])) throw gap("Canonical operations disagree on their shared endpoint.");
  [before, middle, after].forEach((object, index) => {
    const value = object.value;
    if (!value || typeof value !== "object" || !("latex" in value) || typeof value.latex !== "string") throw gap("Missing canonical endpoint notation.");
    const parsed = normalizeKpScalarSumProductEndpoint({ id: object.id, latex: value.latex }, checked.source.symbols, `$.states[${index}].latex`);
    if (object.id !== checked.source.states[index]!.id || !sameKpStructuredExpressionTree(parsed.structured.root, checked.chain.endpoints[index]!.root))
      throw gap("Canonical endpoint notation does not represent this exact verified source.");
  });
  const composition = composeKpEquationOperationAssets(`animation.composed-algebra.${checked.revisionId.slice(7)}`, checked.source.editorial.title, [first.animation, second.animation]);
  if (composition.checkpointProgress.length !== 3) throw gap("The bounded chain must expose exactly three clock stops.");
  const binding: KpComposedAlgebraPresentation = Object.freeze({ [brand]: true as const, ...composition,
    checkpointProgress: Object.freeze([0, composition.checkpointProgress[1]!, 1] as const),
    owner: "canonical-composed-algebra-v1", checked, revisionId: checked.revisionId, steps: Object.freeze([first, second] as const) });
  issued.set(binding, JSON.stringify([binding.steps, binding.animation]));
  return binding;
}
export function assertKpComposedAlgebraPresentation(value: unknown): asserts value is KpComposedAlgebraPresentation {
  if (!value || typeof value !== "object" || !issued.has(value)) throw new TypeError("Canonical mounting requires an issued composed presentation binding.");
  const binding = value as KpComposedAlgebraPresentation;
  if (issued.get(binding) !== JSON.stringify([binding.steps, binding.animation])) throw new TypeError("Canonical presentation changed after resolution.");
  assertKpSourceBoundComposedAlgebraProof(binding.checked);
}
function gap(message: string): KpComposedAlgebraRepair {
  return new KpComposedAlgebraRepair("unsupported-presentation", "$.states", message);
}
