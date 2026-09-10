import { sha256 } from "../kernel/sha256.ts";
import { listKpStructuredExpressionSubtrees, type KpStructuredExpression } from "./structured-expression.ts";
import { isKpVerifiedComposedFactoring, type KpVerifiedComposedFactoring } from "./composed-algebra-factoring.ts";
import { isKpVerifiedComposedEvaluation, type KpVerifiedComposedEvaluation } from "./composed-algebra-evaluation.ts";

const brand = Symbol("verified-composed-algebra-chain");
const issued = new WeakSet<object>();
export interface KpVerifiedComposedAlgebraChain {
  readonly [brand]: true;
  readonly kind: "verified-composed-algebra-chain";
  readonly revisionId: string;
  readonly steps: readonly [KpVerifiedComposedFactoring, KpVerifiedComposedEvaluation];
  readonly endpoints: readonly [KpStructuredExpression, KpStructuredExpression, KpStructuredExpression];
}

export class KpComposedChainError extends Error {
  readonly code: "missing-authority" | "disconnected-chain";
  constructor(code: KpComposedChainError["code"], message: string) {
    super(message); this.name = "KpComposedChainError"; this.code = code;
  }
}

export function verifyKpComposedAlgebraChain(input: {
  readonly factoring: KpVerifiedComposedFactoring;
  readonly evaluation: KpVerifiedComposedEvaluation;
}): KpVerifiedComposedAlgebraChain {
  const { factoring, evaluation } = input;
  if (!isKpVerifiedComposedFactoring(factoring) || !isKpVerifiedComposedEvaluation(evaluation))
    throw new KpComposedChainError("missing-authority", "Compose issued proofs, not descriptions or serialized proof copies.");
  // Even an equivalent independently issued proof cannot replace the first step
  // after the second step has authenticated its exact intermediate endpoint.
  if (evaluation.factoring !== factoring || evaluation.source !== factoring.target)
    throw new KpComposedChainError("disconnected-chain", "Evaluation must continue this exact factoring proof and intermediate endpoint.");
  const endpoints = Object.freeze([factoring.source, factoring.target, evaluation.target] as const);
  const nodes = endpoints.flatMap(e => listKpStructuredExpressionSubtrees(e));
  if (new Set(nodes.map(n => n.id)).size !== nodes.length)
    throw new KpComposedChainError("disconnected-chain", "All three states need disjoint occurrence identities.");
  const proof: KpVerifiedComposedAlgebraChain = Object.freeze({ [brand]: true as const,
    kind: "verified-composed-algebra-chain", endpoints, steps: Object.freeze([factoring, evaluation] as const),
    revisionId: `sha256:${sha256(JSON.stringify({ kind: "composed-chain.v1", steps: [factoring.revisionId, evaluation.revisionId] }))}` });
  issued.add(proof);
  return proof;
}
export function isKpVerifiedComposedAlgebraChain(value: unknown): value is KpVerifiedComposedAlgebraChain {
  return typeof value === "object" && value !== null && issued.has(value);
}
