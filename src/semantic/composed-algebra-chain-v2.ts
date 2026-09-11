import { sha256 } from "../kernel/sha256.ts";
import { listKpStructuredExpressionSubtrees, type KpStructuredExpression } from "./structured-expression.ts";
import { isKpVerifiedComposedAlgebraChain, KpComposedChainError, type KpVerifiedComposedAlgebraChain } from "./composed-algebra-chain.ts";
import { isKpVerifiedComposedDistribution, type KpVerifiedComposedDistribution } from "./composed-algebra-distribution.ts";
import { isKpVerifiedComposedProductEvaluation, type KpVerifiedComposedProductEvaluation } from "./composed-algebra-product-evaluation.ts";

const brand = Symbol("verified-composed-algebra-chain-v2");
const issued = new WeakSet<object>();
type Prefix = KpVerifiedComposedAlgebraChain["steps"];
type Endpoints = readonly [KpStructuredExpression, KpStructuredExpression, KpStructuredExpression, KpStructuredExpression];
interface Authority { readonly [brand]: true; readonly kind: "verified-composed-algebra-chain-v2"; readonly revisionId: string }
export type KpVerifiedComposedAlgebraChainV2 = Authority & (
  { readonly extent: "distributed"; readonly steps: readonly [...Prefix, KpVerifiedComposedDistribution]; readonly endpoints: Endpoints } |
  { readonly extent: "evaluated"; readonly steps: readonly [...Prefix, KpVerifiedComposedDistribution, KpVerifiedComposedProductEvaluation];
    readonly endpoints: readonly [...Endpoints, KpStructuredExpression] }
);

export function verifyKpComposedAlgebraChainV2(input: {
  readonly prefix: KpVerifiedComposedAlgebraChain;
  readonly distribution: KpVerifiedComposedDistribution;
  readonly product?: KpVerifiedComposedProductEvaluation;
}): KpVerifiedComposedAlgebraChainV2 {
  const { prefix, distribution, product } = input;
  if (!isKpVerifiedComposedAlgebraChain(prefix) || !isKpVerifiedComposedDistribution(distribution) ||
      (product !== undefined && !isKpVerifiedComposedProductEvaluation(product)))
    throw new KpComposedChainError("missing-authority", "Compose only issued operation proofs.");
  // Reference equality preserves issuance lineage; equal JSON from another
  // checked draft is not permission to reconnect a previously issued step.
  if (distribution.partition.evaluation !== prefix.steps[1] || distribution.source !== prefix.endpoints[2] ||
      (product && (product.distribution !== distribution || product.source !== distribution.target)))
    throw new KpComposedChainError("disconnected-chain", "Every step must continue this exact preceding proof and endpoint.");
  const steps = [...prefix.steps, distribution] as const;
  const endpoints = [...prefix.endpoints, distribution.target] as const;
  const complete = product ? { extent: "evaluated" as const, steps: Object.freeze([...steps, product] as const),
    endpoints: Object.freeze([...endpoints, product.target] as const) } : {
    extent: "distributed" as const, steps: Object.freeze(steps), endpoints: Object.freeze(endpoints) };
  const ids = complete.endpoints.flatMap(endpoint => listKpStructuredExpressionSubtrees(endpoint).map(node => node.id));
  if (new Set(ids).size !== ids.length) throw new KpComposedChainError("disconnected-chain", "Every state requires disjoint occurrence identities.");
  const proof: KpVerifiedComposedAlgebraChainV2 = Object.freeze({ [brand]: true as const, kind: "verified-composed-algebra-chain-v2",
    ...complete, revisionId: `sha256:${sha256(JSON.stringify({ kind: "composed-chain.v2", steps: complete.steps.map(step => step.revisionId) }))}` });
  issued.add(proof);
  return proof;
}
export function isKpVerifiedComposedAlgebraChainV2(value: unknown): value is KpVerifiedComposedAlgebraChainV2 {
  return typeof value === "object" && value !== null && issued.has(value);
}
