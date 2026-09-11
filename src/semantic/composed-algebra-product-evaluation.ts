import { sha256 } from "../kernel/sha256.ts";
import { createKpStructuredExpression, listKpStructuredExpressionSubtrees,
  type KpStructuredExpression, type KpStructuredExpressionNode, type KpStructuredNumberNode } from "./structured-expression.ts";
import { sameKpStructuredExpressionTree } from "./structured-expression-rewrite.ts";
import { isKpVerifiedComposedDistribution, type KpVerifiedComposedDistribution } from "./composed-algebra-distribution.ts";
import { KpComposedEvaluationError } from "./composed-algebra-evaluation.ts";
import { createKpConstantProductEvaluationAsset, type KpConstantProductEvaluationAsset } from "./constant-product-evaluation-asset.ts";

const brand = Symbol("verified-composed-product-evaluation");
const issued = new WeakSet<object>();
export interface KpVerifiedComposedProductEvaluation {
  readonly [brand]: true;
  readonly kind: "verified-composed-product-evaluation";
  readonly distribution: KpVerifiedComposedDistribution;
  readonly source: KpStructuredExpression;
  readonly target: KpStructuredExpression;
  readonly result: KpStructuredNumberNode;
  readonly preservedContext: KpStructuredExpressionNode;
  readonly localEvaluation: KpConstantProductEvaluationAsset;
  readonly revisionId: string;
}

/** Arithmetic assets describe ink roles; exact arithmetic and unchanged context
 * authorize evaluation. Never infer proof from a plausible rendered result. */
export function verifyKpComposedProductEvaluation(input: {
  readonly distribution: KpVerifiedComposedDistribution;
  readonly target: KpStructuredExpression;
}): KpVerifiedComposedProductEvaluation {
  const distribution = input.distribution;
  if (!isKpVerifiedComposedDistribution(distribution)) fail("missing-authority", "Use an issued distribution proof.");
  const [left, right] = distribution.products[1].factors;
  if (left?.kind !== "number" || right?.kind !== "number" ||
      !Number.isSafeInteger(left.value) || !Number.isSafeInteger(right.value) || left.value < 0 || right.value < 0)
    fail("unsupported-shape", "The final addend must be a product of two nonnegative safe integers.");
  const exact = BigInt(left.value) * BigInt(right.value);
  if (exact > BigInt(Number.MAX_SAFE_INTEGER)) fail("unsupported-shape", "The exact product must remain a safe integer.");
  const raw = input.target?.root;
  if (raw?.kind !== "sum" || raw.terms.length !== 2) fail("unsupported-shape", "Keep the unchanged first addend and evaluated second addend.");
  if (!sameKpStructuredExpressionTree(distribution.products[0], raw.terms[0]!) ||
      raw.terms[1]?.kind !== "number" || raw.terms[1].value !== Number(exact))
    fail("invalid-evaluation", "Preserve the first contribution and replace only the final product with its exact value.");
  let target: KpStructuredExpression;
  try { target = createKpStructuredExpression({ root: raw }); }
  catch (error) { return fail("unsupported-shape", error instanceof Error ? error.message : "Invalid evaluated endpoint."); }
  const source = distribution.target;
  const ids = [...listKpStructuredExpressionSubtrees(source), ...listKpStructuredExpressionSubtrees(target)].map(node => node.id);
  if (new Set(ids).size !== ids.length) fail("unsupported-shape", "Evaluation endpoints require disjoint occurrence identities.");
  const root = target.root;
  if (root.kind !== "sum" || root.terms[1]?.kind !== "number") fail("unsupported-shape", "Invalid cloned product endpoint.");
  const revisionId = `sha256:${sha256(JSON.stringify({ kind: "composed-product-evaluation.v1", distribution: distribution.revisionId, target }))}`;
  const localEvaluation = createKpConstantProductEvaluationAsset({ id: `composed-${revisionId.slice(7)}`, left: left.value, right: right.value });
  freezeAsset(localEvaluation);
  const proof: KpVerifiedComposedProductEvaluation = Object.freeze({ [brand]: true as const,
    kind: "verified-composed-product-evaluation", distribution, source, target, result: root.terms[1],
    preservedContext: root.terms[0]!, localEvaluation, revisionId });
  issued.add(proof);
  return proof;
}
export function isKpVerifiedComposedProductEvaluation(value: unknown): value is KpVerifiedComposedProductEvaluation {
  return typeof value === "object" && value !== null && issued.has(value);
}
function fail(code: KpComposedEvaluationError["code"], message: string): never { throw new KpComposedEvaluationError(code, message); }
function freezeAsset(value: unknown): void {
  if (value === null || typeof value !== "object") return;
  for (const child of Object.values(value)) freezeAsset(child);
  Object.freeze(value);
}
