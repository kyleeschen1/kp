import { sha256 } from "../kernel/sha256.ts";
import { createKpStructuredExpression, listKpStructuredExpressionSubtrees, type KpStructuredExpression,
  type KpStructuredProductNode } from "./structured-expression.ts";
import { sameKpStructuredExpressionTree, verifyKpOrientedDistributionRewrite, kpDistributionRewriteRoleIds as roles,
  kpDistributionRewriteRoleSpecs, type KpVerifiedStructuredExpressionRewrite, type KpDistributionOrientation } from "./structured-expression-rewrite.ts";
import { bindKpStructuredExpressionRoles } from "./structured-expression-role-binding.ts";
import { isKpVerifiedComposedGroupPartition, type KpVerifiedComposedGroupPartition } from "./composed-algebra-group-partition.ts";

const brand = Symbol("verified-composed-distribution");
const issued = new WeakSet<object>();
export interface KpVerifiedComposedDistribution {
  readonly [brand]: true;
  readonly kind: "verified-composed-distribution";
  readonly partition: KpVerifiedComposedGroupPartition;
  readonly source: KpStructuredExpression;
  readonly target: KpStructuredExpression;
  readonly products: readonly [KpStructuredProductNode, KpStructuredProductNode];
  readonly orientation: KpDistributionOrientation;
  readonly rewrite: KpVerifiedStructuredExpressionRewrite;
  readonly revisionId: string;
}
export class KpComposedDistributionError extends Error {
  readonly code: "missing-authority" | "unsupported-shape" | "invalid-distribution";
  constructor(code: KpComposedDistributionError["code"], message: string) {
    super(message); this.name = "KpComposedDistributionError"; this.code = code;
  }
}

export function verifyKpComposedDistribution(input: { readonly partition: KpVerifiedComposedGroupPartition;
  readonly target: KpStructuredExpression }): KpVerifiedComposedDistribution {
  const partition = input.partition;
  if (!isKpVerifiedComposedGroupPartition(partition)) fail("missing-authority", "Use the issued whole/member partition.");
  const evaluation = partition.evaluation, source = evaluation.target;
  // The earlier common factor was the group; now the coefficient distributes.
  const orientation = evaluation.factoring.orientation === "right" ? "left" : "right";
  const fi = orientation === "left" ? 0 : 1, ai = 1 - fi;
  const raw = input.target?.root;
  if (raw?.kind !== "sum" || raw.terms.length !== 2) fail("unsupported-shape", "Retain two ordered distributed products.");
  for (const [index, term] of raw.terms.entries()) {
    if (term.kind !== "product" || term.factors.length !== 2) fail("unsupported-shape", "Each addend needs the full coefficient and original member.");
    // Compare to bounded authenticated trees before cloning an untrusted target.
    if (!sameKpStructuredExpressionTree(evaluation.result, term.factors[fi]!) ||
        !sameKpStructuredExpressionTree(partition.members[index]!, term.factors[ai]!))
      fail("invalid-distribution", "Every ordered member must receive one unchanged coefficient, without commuting or evaluating it.");
  }
  let target: KpStructuredExpression;
  try { target = createKpStructuredExpression({ root: raw }); }
  catch (error) { return fail("unsupported-shape", error instanceof Error ? error.message : "Invalid distributed endpoint."); }
  const root = target.root;
  if (root.kind !== "sum" || root.terms[0]?.kind !== "product" || root.terms[1]?.kind !== "product")
    fail("unsupported-shape", "Expected cloned binary products.");
  const products = Object.freeze([root.terms[0], root.terms[1]] as const);
  const ids = [...listKpStructuredExpressionSubtrees(source), ...listKpStructuredExpressionSubtrees(target)].map(node => node.id);
  if (new Set(ids).size !== ids.length) fail("unsupported-shape", "Distribution endpoints need disjoint occurrence identities.");
  const bindings = bindKpStructuredExpressionRoles({ contractId: "composed-algebra.distribution", expressions: { source, target },
    roles: kpDistributionRewriteRoleSpecs, bindings: {
      [roles.sourceRoot]: source.root.id, [roles.commonFactor]: evaluation.result.id, [roles.sourceGroupedSum]: partition.group.id,
      [roles.sourceAddends]: partition.members.map(node => node.id), [roles.targetRoot]: target.root.id,
      [roles.distributedTerms]: products.map(node => node.id), [roles.factorCopies]: products.map(node => node.factors[fi]!.id),
      [roles.distributedAddends]: products.map(node => node.factors[ai]!.id)
    } });
  const result = verifyKpOrientedDistributionRewrite({ bindings, orientation });
  if (!result.ok) fail("invalid-distribution", result.diagnostics.map(d => d.message).join("; "));
  const proof: KpVerifiedComposedDistribution = Object.freeze({ [brand]: true as const, kind: "verified-composed-distribution",
    partition, source, target, products, orientation, rewrite: result.verification,
    revisionId: `sha256:${sha256(JSON.stringify({ partition: partition.revisionId, target }))}` });
  issued.add(proof);
  return proof;
}
export function isKpVerifiedComposedDistribution(value: unknown): value is KpVerifiedComposedDistribution {
  return typeof value === "object" && value !== null && issued.has(value);
}
function fail(code: KpComposedDistributionError["code"], message: string): never { throw new KpComposedDistributionError(code, message); }
