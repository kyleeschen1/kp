import { sha256 } from "../kernel/sha256.ts";
import { createKpStructuredExpression, listKpStructuredExpressionSubtrees,
  type KpStructuredExpression, type KpStructuredExpressionNode, type KpStructuredNumberNode } from "./structured-expression.ts";
import { sameKpStructuredExpressionTree } from "./structured-expression-rewrite.ts";
import { isKpVerifiedComposedFactoring, type KpVerifiedComposedFactoring } from "./composed-algebra-factoring.ts";
import { createKpConstantSumEvaluationAsset, type KpConstantSumEvaluationAsset } from "./constant-sum-evaluation-asset.ts";

const brand = Symbol("verified-composed-evaluation");
const issued = new WeakSet<object>();

export interface KpVerifiedComposedEvaluation {
  readonly [brand]: true;
  readonly kind: "verified-composed-evaluation";
  readonly factoring: KpVerifiedComposedFactoring;
  readonly revisionId: string;
  readonly source: KpStructuredExpression;
  readonly target: KpStructuredExpression;
  readonly result: KpStructuredNumberNode;
  readonly preservedContext: KpStructuredExpressionNode;
  readonly localEvaluation: KpConstantSumEvaluationAsset;
}

export class KpComposedEvaluationError extends Error {
  readonly code: "missing-authority" | "unsupported-shape" | "invalid-evaluation";
  constructor(code: KpComposedEvaluationError["code"], message: string) {
    super(message); this.name = "KpComposedEvaluationError"; this.code = code;
  }
}

/** The local arithmetic asset supplies canonical successor roles, not proof.
 * Exact integer arithmetic and unchanged ordered context authorize its use. */
export function verifyKpComposedEvaluation(input: {
  readonly factoring: KpVerifiedComposedFactoring;
  readonly target: KpStructuredExpression;
}): KpVerifiedComposedEvaluation {
  const factoring = input.factoring;
  if (!isKpVerifiedComposedFactoring(factoring)) fail("missing-authority", "Use an issued compound factoring proof.");
  const [left, right] = factoring.coefficients;
  const exact = BigInt(left.value) + BigInt(right.value);
  if (exact > BigInt(Number.MAX_SAFE_INTEGER)) fail("unsupported-shape", "The exact coefficient sum must remain a safe integer.");
  const value = Number(exact), fi = factoring.orientation === "left" ? 0 : 1, ci = 1 - fi;
  let target: KpStructuredExpression;
  try {
    const raw = input.target.root;
    if (raw.kind !== "product" || raw.factors.length !== 2) fail("unsupported-shape", "Retain the coefficient and common factor as an ordered product.");
    const result = raw.factors[ci]!, context = raw.factors[fi]!;
    if (result?.kind !== "number" || !Number.isSafeInteger(result.value) || result.value !== value)
      fail("invalid-evaluation", "The result must equal the exact sum of the two coefficient integers.");
    // Matching against the authenticated bounded tree limits traversal before cloning
    // an untrusted endpoint; a new nested or cyclic shape cannot gain authority.
    if (!context || !sameKpStructuredExpressionTree(factoring.factor, context))
      fail("invalid-evaluation", "Evaluation must preserve the complete common factor and its orientation.");
    target = createKpStructuredExpression({ root: raw });
  } catch (error) {
    if (error instanceof KpComposedEvaluationError) throw error;
    return fail("unsupported-shape", error instanceof Error ? error.message : "Invalid evaluation endpoint.");
  }
  const source = factoring.target;
  const nodes = [...listKpStructuredExpressionSubtrees(source), ...listKpStructuredExpressionSubtrees(target)];
  if (new Set(nodes.map(n => n.id)).size !== nodes.length) fail("unsupported-shape", "Evaluation endpoints require disjoint occurrence identities.");
  const root = target.root;
  if (root.kind !== "product" || root.factors[ci]?.kind !== "number") fail("unsupported-shape", "Invalid cloned evaluation endpoint.");
  const revisionId = `sha256:${sha256(JSON.stringify({ kind: "composed-evaluation.v1", factoring: factoring.revisionId, target }))}`;
  const localEvaluation = createKpConstantSumEvaluationAsset({ id: `composed-${revisionId.slice(7)}`, left: left.value, right: right.value });
  freezeAsset(localEvaluation);
  const proof: KpVerifiedComposedEvaluation = Object.freeze({ [brand]: true as const,
    kind: "verified-composed-evaluation", factoring, revisionId, source, target,
    result: root.factors[ci], preservedContext: root.factors[fi]!,
    localEvaluation });
  issued.add(proof);
  return proof;
}

export function isKpVerifiedComposedEvaluation(value: unknown): value is KpVerifiedComposedEvaluation {
  return typeof value === "object" && value !== null && issued.has(value);
}
function fail(code: KpComposedEvaluationError["code"], message: string): never {
  throw new KpComposedEvaluationError(code, message);
}
function freezeAsset(value: unknown): void {
  // The existing asset API is mutable; proof-owned generated data must not be.
  if (value === null || typeof value !== "object") return;
  for (const child of Object.values(value)) freezeAsset(child);
  Object.freeze(value);
}
