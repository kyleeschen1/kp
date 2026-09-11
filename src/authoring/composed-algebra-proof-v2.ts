import { sha256 } from "../kernel/sha256.ts";
import { checkKpComposedAlgebraPrefixV2 } from "./composed-algebra-prefix-v2.ts";
import { checkKpComposedAlgebraDistributionV2 } from "./composed-algebra-distribution-v2.ts";
import { normalizeKpComposedAlgebraEndpointsV2 } from "./composed-algebra-normalizer-v2.ts";
import { readKpComposedAlgebraSourceV2, type KpComposedAlgebraSourceV2 } from "./composed-algebra-source-v2.ts";
import { KpComposedAlgebraRepair } from "./composed-algebra-source.ts";
import { verifyKpComposedProductEvaluation } from "../semantic/composed-algebra-product-evaluation.ts";
import { KpComposedEvaluationError } from "../semantic/composed-algebra-evaluation.ts";
import { KpComposedChainError } from "../semantic/composed-algebra-chain.ts";
import { verifyKpComposedAlgebraChainV2, isKpVerifiedComposedAlgebraChainV2, type KpVerifiedComposedAlgebraChainV2 } from "../semantic/composed-algebra-chain-v2.ts";

const brand = Symbol("source-bound-composed-algebra-proof-v2");
const issued = new WeakSet<object>();
export interface KpSourceBoundComposedAlgebraProofV2 {
  readonly [brand]: true;
  readonly source: KpComposedAlgebraSourceV2;
  readonly chain: KpVerifiedComposedAlgebraChainV2;
  readonly revisionId: string;
}
export function checkKpComposedAlgebraProofV2(value: unknown): KpSourceBoundComposedAlgebraProofV2 {
  const checked = checkKpComposedAlgebraPrefixV2(value), distribution = checkKpComposedAlgebraDistributionV2(checked);
  const endpoints = normalizeKpComposedAlgebraEndpointsV2(checked.source);
  try {
    const product = endpoints.length === 5 ? verifyKpComposedProductEvaluation({ distribution, target: endpoints[4].structured }) : undefined;
    const chain = verifyKpComposedAlgebraChainV2({ prefix: checked.prefix.chain, distribution, ...(product ? { product } : {}) });
    return bindKpComposedAlgebraProofV2({ source: checked.source, chain });
  } catch (error) {
    if (error instanceof KpComposedEvaluationError || error instanceof KpComposedChainError)
      throw new KpComposedAlgebraRepair(error.code, "$.states[4].latex", error.message);
    throw error;
  }
}
export function bindKpComposedAlgebraProofV2(input: {
  readonly source: KpComposedAlgebraSourceV2; readonly chain: KpVerifiedComposedAlgebraChainV2;
}): KpSourceBoundComposedAlgebraProofV2 {
  if (!isKpVerifiedComposedAlgebraChainV2(input.chain)) throw new KpComposedAlgebraRepair("missing-authority", "$.states", "Bind a verifier-issued complete chain.");
  const source = readKpComposedAlgebraSourceV2(input.source), endpoints = normalizeKpComposedAlgebraEndpointsV2(source);
  const factoring = input.chain.steps[0];
  if (source.domain !== factoring.domain || JSON.stringify([...source.symbols].sort()) !== JSON.stringify(factoring.symbols) ||
      endpoints.length !== input.chain.endpoints.length || endpoints.some((e, i) => JSON.stringify(e.structured) !== JSON.stringify(input.chain.endpoints[i])))
    throw new KpComposedAlgebraRepair("disconnected-chain", "$.states", "Source identities, state count, order and endpoints must match the complete proof chain.");
  const bound: KpSourceBoundComposedAlgebraProofV2 = Object.freeze({ [brand]: true as const, source, chain: input.chain,
    revisionId: `sha256:${sha256(JSON.stringify({ source, proofRevision: input.chain.revisionId }))}` });
  issued.add(bound);
  return bound;
}
export function assertKpSourceBoundComposedAlgebraProofV2(value: unknown): asserts value is KpSourceBoundComposedAlgebraProofV2 {
  if (typeof value !== "object" || value === null || !issued.has(value)) throw new TypeError("Recheck source to obtain issued complete algebra evidence.");
}
