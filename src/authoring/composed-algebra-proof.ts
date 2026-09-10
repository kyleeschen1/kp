import { sha256 } from "../kernel/public-api.ts";
import { verifyKpComposedFactoring, KpComposedFactoringError, type KpVerifiedComposedFactoring } from "../semantic/composed-algebra-factoring.ts";
import { verifyKpComposedEvaluation, KpComposedEvaluationError } from "../semantic/composed-algebra-evaluation.ts";
import { verifyKpComposedAlgebraChain, isKpVerifiedComposedAlgebraChain, KpComposedChainError,
  type KpVerifiedComposedAlgebraChain } from "../semantic/composed-algebra-chain.ts";
import { readKpComposedAlgebraSource, KpComposedAlgebraRepair, type KpComposedAlgebraSource } from "./composed-algebra-source.ts";
import { normalizeKpComposedAlgebraEndpoints } from "./composed-algebra-normalizer.ts";

const brand = Symbol("source-bound-composed-algebra-proof");
const issued = new WeakSet<object>();
/** Mathematical authority only. A checked source is not a prepared animation. */
export interface KpSourceBoundComposedAlgebraProof {
  readonly [brand]: true;
  readonly source: KpComposedAlgebraSource;
  readonly chain: KpVerifiedComposedAlgebraChain;
  readonly revisionId: string;
}

export function checkKpComposedAlgebraProof(value: unknown): KpSourceBoundComposedAlgebraProof {
  const source = readKpComposedAlgebraSource(value), endpoints = normalizeKpComposedAlgebraEndpoints(source);
  const proofs: KpVerifiedComposedFactoring[] = [], errors: KpComposedFactoringError[] = [];
  // Orientation is derived only by a unique successful ordered law proof.
  // Neither traversal order nor a preferred visual motif resolves ambiguity.
  for (const orientation of ["left", "right"] as const) {
    try { proofs.push(verifyKpComposedFactoring({ domain: source.domain, symbols: source.symbols, orientation,
      source: endpoints[0].structured, target: endpoints[1].structured })); }
    catch (error) { if (error instanceof KpComposedFactoringError) errors.push(error); else throw error; }
  }
  const factoring = proofs[0];
  if (proofs.length !== 1 || factoring === undefined) {
    const invalid = errors.find(e => e.code === "invalid-factorization");
    throw new KpComposedAlgebraRepair(invalid?.code ?? "unsupported-shape", "$.states[1].latex",
      invalid?.message ?? "Use one unambiguous oriented factoring of two integer multiples of an unchanged scalar expression.");
  }
  try {
    const evaluation = verifyKpComposedEvaluation({ factoring, target: endpoints[2].structured });
    return bindKpComposedAlgebraProof({ source, chain: verifyKpComposedAlgebraChain({ factoring, evaluation }) });
  } catch (error) {
    if (error instanceof KpComposedEvaluationError || error instanceof KpComposedChainError)
      throw new KpComposedAlgebraRepair(error.code, "$.states[2].latex", error.message);
    throw error;
  }
}

export function bindKpComposedAlgebraProof(input: {
  readonly source: KpComposedAlgebraSource;
  readonly chain: KpVerifiedComposedAlgebraChain;
}): KpSourceBoundComposedAlgebraProof {
  if (!isKpVerifiedComposedAlgebraChain(input.chain))
    throw new KpComposedAlgebraRepair("missing-authority", "$.states", "Bind a verifier-issued chain.");
  const source = readKpComposedAlgebraSource(input.source), endpoints = normalizeKpComposedAlgebraEndpoints(source);
  const factoring = input.chain.steps[0];
  if (source.domain !== factoring.domain || JSON.stringify([...source.symbols].sort()) !== JSON.stringify(factoring.symbols) ||
      endpoints.some((e, i) => JSON.stringify(e.structured) !== JSON.stringify(input.chain.endpoints[i])))
    throw new KpComposedAlgebraRepair("disconnected-chain", "$.states", "Source state identities, order and complete endpoints must match this proof chain.");
  const bound: KpSourceBoundComposedAlgebraProof = Object.freeze({ [brand]: true as const, source, chain: input.chain,
    revisionId: `sha256:${sha256(JSON.stringify({ source, proofRevision: input.chain.revisionId }))}` });
  issued.add(bound);
  return bound;
}

export function assertKpSourceBoundComposedAlgebraProof(value: unknown): asserts value is KpSourceBoundComposedAlgebraProof {
  if (typeof value !== "object" || value === null || !issued.has(value))
    throw new TypeError("Recheck source to obtain issued source-bound algebra evidence.");
}
