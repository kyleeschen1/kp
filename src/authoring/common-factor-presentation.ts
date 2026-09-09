import { sha256 } from "../kernel/public-api.ts";
import { createVerifiedCommonFactorAnimationAsset, KpCommonFactorPresentationGap } from "../animation/distribution-adapter.ts";
import { compileKpDistributionFactoringPresentationPlan } from "../animation/distribution-factoring-presentation-plan.ts";
import { registerKpOperationPresentationPlan, type KpVerifiedFactoringPresentationPlan } from "../animation/operation-presentation-plan-types.ts";
import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpStructuredExpressionNode } from "../semantic/structured-expression.ts";
import { isKpVerifiedCommonFactorRewrite, type KpVerifiedCommonFactorRewrite } from "../semantic/common-factor-rewrite.ts";
import { readKpCommonFactorSource, type KpCommonFactorSource } from "./common-factor-source.ts";
import { normalizeKpCommonFactorEndpoints } from "./common-factor-normalizer.ts";
import { KP_COMMON_FACTOR_OPERATION } from "./equation-series-common-factor-authoring.ts";
import type { KpCompiledEquationTransformSeriesCandidate } from "./compile-equation-transform-series.ts";

const authority = Symbol("canonical-factoring-presentation");
const issued = new WeakMap<object, string>();

/** An authored host receives content and its complete presentation together.
 * It cannot supply another renderer, choreography, or composition alongside it. */
export interface KpCommonFactorPresentation {
  readonly [authority]: true;
  readonly owner: "canonical-factoring-native-v1";
  readonly canonicalReference: "editor-animation.sample.animation.factoring.factor-common-a";
  readonly composition: "one-factor-transition-two-checkpoints";
  readonly revisionId: string;
  readonly animation: KpAnimationAsset;
  readonly plan: KpVerifiedFactoringPresentationPlan;
}

export function resolveKpCommonFactorPresentation(input: {
  readonly source: KpCommonFactorSource;
  readonly proof: KpVerifiedCommonFactorRewrite;
  readonly candidate: KpCompiledEquationTransformSeriesCandidate;
}): KpCommonFactorPresentation {
  if (!isKpVerifiedCommonFactorRewrite(input.proof)) throw new TypeError("Presentation requires authenticated algebra.");
  // The native fusion capability owns one glyph per contributor. A valid
  // multi-digit coefficient needs a composite-factor owner, not a late DOM error.
  if (input.proof.factor.kind === "number" && input.proof.factor.value > 9)
    throw new KpCommonFactorPresentationGap("This native factoring presentation supports single-glyph factors; multi-digit coefficients need composite-factor support.");
  const source = readKpCommonFactorSource(input.source);
  const endpoints = normalizeKpCommonFactorEndpoints(source);
  const expected = [explicitCommonFactorExpression(input.proof.source.root), explicitCommonFactorExpression(input.proof.target.root)];
  const request = input.candidate.request;
  if (request.states.length !== 2 || request.adjacencies.length !== 1 ||
      request.states.some((state, i) => state.id !== source.states[i]!.id || state.latex !== expected[i]) ||
      endpoints.some((endpoint, i) => explicitCommonFactorExpression(endpoint.structured.root) !== expected[i]) ||
      request.adjacencies[0]!.intent.mode !== "explicit" ||
      request.adjacencies[0]!.intent.operationId !== KP_COMMON_FACTOR_OPERATION ||
      request.adjacencies[0]!.fromStateId !== source.states[0].id || request.adjacencies[0]!.toStateId !== source.states[1].id)
    throw new KpCommonFactorPresentationGap("Canonical factoring requires the matching verified two-state composition.");
  const animation = createVerifiedCommonFactorAnimationAsset(input.proof);
  const transformation = animation.transformations[0]!;
  const before = animation.bundle.objects.find(object => object.id === transformation.sourceObjectIds[0])!;
  const after = animation.bundle.objects.find(object => object.id === transformation.targetObjectIds[0])!;
  const plan = compileKpDistributionFactoringPresentationPlan({ transformation,
    sourceSelectorIds: before.selectors.map(selector => selector.id), targetSelectorIds: after.selectors.map(selector => selector.id),
    sourceSelectorKinds: new Map(before.selectors.map(selector => [selector.id, selector.kind])) });
  if (plan?.planKind !== "factoring" || plan.choreography === undefined)
    throw new KpCommonFactorPresentationGap("The complete canonical factoring presentation is unavailable.");
  registerKpOperationPresentationPlan(transformation, plan);
  const result: KpCommonFactorPresentation = Object.freeze({ [authority]: true as const,
    owner: "canonical-factoring-native-v1", canonicalReference: "editor-animation.sample.animation.factoring.factor-common-a",
    composition: "one-factor-transition-two-checkpoints", animation, plan,
    revisionId: `sha256:${sha256(JSON.stringify({ source, proofRevision: input.proof.revisionId }))}` });
  issued.set(result, JSON.stringify({ animation, plan }));
  return result;
}

export function assertKpCommonFactorPresentation(value: unknown): asserts value is KpCommonFactorPresentation {
  if (typeof value !== "object" || value === null || !issued.has(value))
    throw new TypeError("Native factoring requires a resolver-issued presentation binding.");
  // Public asset structures remain compatible. Untyped mutation cannot detach
  // their revision or plan after the resolver has granted mounting authority.
  const binding = value as KpCommonFactorPresentation;
  if (issued.get(binding) !== JSON.stringify({ animation: binding.animation, plan: binding.plan }))
    throw new TypeError("Canonical factoring presentation changed after resolution.");
}

export function explicitCommonFactorExpression(node: KpStructuredExpressionNode): string {
  if (node.kind === "number") return String(node.value);
  if (node.kind === "symbol") return node.name;
  if (node.kind === "sum") return `(${node.terms.map(explicitCommonFactorExpression).join("+")})`;
  if (node.kind === "product") return `(${node.factors.map(explicitCommonFactorExpression).join("*")})`;
  throw new KpCommonFactorPresentationGap("Only verified scalar sums and products have this presentation.");
}
