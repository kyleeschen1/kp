import { sha256 } from "../kernel/sha256.ts";
import { createKpStructuredExpression, listKpStructuredExpressionSubtrees,
  type KpStructuredExpression, type KpStructuredExpressionNode, type KpStructuredNumberNode } from "./structured-expression.ts";
import { bindKpStructuredExpressionRoles } from "./structured-expression-role-binding.ts";
import { kpDistributionRewriteRoleIds as roles, kpDistributionRewriteRoleSpecs,
  verifyKpOrientedDistributionRewrite, type KpDistributionOrientation,
  type KpVerifiedStructuredExpressionRewrite } from "./structured-expression-rewrite.ts";

const brand = Symbol("verified-composed-factoring");
const issued = new WeakSet<object>();

export interface KpVerifiedComposedFactoring {
  readonly [brand]: true;
  readonly kind: "verified-composed-factoring";
  readonly domain: "real-scalars";
  readonly symbols: readonly string[];
  readonly orientation: KpDistributionOrientation;
  readonly revisionId: string;
  readonly source: KpStructuredExpression;
  readonly target: KpStructuredExpression;
  readonly factor: KpStructuredExpressionNode;
  readonly coefficients: readonly [KpStructuredNumberNode, KpStructuredNumberNode];
  readonly factorCopyIds: readonly [string, string];
  readonly sourceCoefficientIds: readonly [string, string];
  readonly inverseDistribution: KpVerifiedStructuredExpressionRewrite & { readonly orientation: KpDistributionOrientation };
}

export class KpComposedFactoringError extends Error {
  readonly code: "unsupported-shape" | "invalid-factorization";
  constructor(code: KpComposedFactoringError["code"], message: string) {
    super(message); this.name = "KpComposedFactoringError"; this.code = code;
  }
}

/** This bounded task groups two integer multiples of one ordered scalar tree.
 * Inverse distribution proves equality even when that entire tree is zero. */
export function verifyKpComposedFactoring(input: {
  readonly domain: "real-scalars";
  readonly symbols: readonly string[];
  readonly orientation: KpDistributionOrientation;
  readonly source: KpStructuredExpression;
  readonly target: KpStructuredExpression;
}): KpVerifiedComposedFactoring {
  if (input.domain !== "real-scalars" || (input.orientation !== "left" && input.orientation !== "right") ||
      input.symbols.length > 12 || new Set(input.symbols).size !== input.symbols.length ||
      input.symbols.some(s => !/^[A-Za-z]$/.test(s))) fail("unsupported-shape", "Declare unique real scalar symbols and explicit left/right factoring.");
  const symbols = Object.freeze([...input.symbols].sort());
  const source = boundedExpression(input.source, symbols), target = boundedExpression(input.target, symbols);
  const nodes = [...listKpStructuredExpressionSubtrees(source), ...listKpStructuredExpressionSubtrees(target)];
  if (new Set(nodes.map(n => n.id)).size !== nodes.length) fail("unsupported-shape", "Endpoint occurrences must have disjoint identities.");
  const expanded = source.root, factored = target.root;
  if (expanded.kind !== "sum" || expanded.terms.length !== 2 || factored.kind !== "product" || factored.factors.length !== 2)
    fail("unsupported-shape", "Use two multiples and one common factor alongside a two-integer sum.");
  const fi = input.orientation === "left" ? 0 : 1, ci = 1 - fi;
  const factor = factored.factors[fi]!, sum = factored.factors[ci]!;
  if (sum.kind !== "sum" || sum.terms.length !== 2) fail("unsupported-shape", "Retain the two coefficient addends in order.");
  const coefficients = Object.freeze([integer(sum.terms[0]!), integer(sum.terms[1]!)] as const);
  const first = expanded.terms[0]!, second = expanded.terms[1]!;
  if (first.kind !== "product" || second.kind !== "product" || first.factors.length !== 2 || second.factors.length !== 2)
    fail("unsupported-shape", "Each source term must retain a coefficient and a complete common-factor subtree.");
  const sourceCoefficients = [integer(first.factors[ci]!), integer(second.factors[ci]!)] as const;
  const copies = [first.factors[fi]!, second.factors[fi]!] as const;
  const bindings = bindKpStructuredExpressionRoles({ contractId: "composed-algebra.inverse-distribution",
    expressions: { source: target, target: source }, roles: kpDistributionRewriteRoleSpecs,
    bindings: {
      [roles.sourceRoot]: factored.id, [roles.commonFactor]: factor.id, [roles.sourceGroupedSum]: sum.id,
      [roles.sourceAddends]: coefficients.map(n => n.id), [roles.targetRoot]: expanded.id,
      [roles.distributedTerms]: [first.id, second.id], [roles.factorCopies]: copies.map(n => n.id),
      [roles.distributedAddends]: sourceCoefficients.map(n => n.id)
    } });
  const result = verifyKpOrientedDistributionRewrite({ bindings, orientation: input.orientation });
  if (!result.ok) fail("invalid-factorization", result.diagnostics.map(d => `${d.path}: ${d.message}`).join(" "));
  const proof: KpVerifiedComposedFactoring = Object.freeze({ [brand]: true as const,
    kind: "verified-composed-factoring", domain: "real-scalars", symbols, orientation: input.orientation,
    source, target, factor, coefficients, inverseDistribution: result.verification,
    factorCopyIds: Object.freeze([copies[0].id, copies[1].id] as const),
    sourceCoefficientIds: Object.freeze([sourceCoefficients[0].id, sourceCoefficients[1].id] as const),
    revisionId: `sha256:${sha256(JSON.stringify({ kind: "composed-factoring.v1", symbols, orientation: input.orientation, source, target }))}` });
  issued.add(proof);
  return proof;
}

export function isKpVerifiedComposedFactoring(value: unknown): value is KpVerifiedComposedFactoring {
  return typeof value === "object" && value !== null && issued.has(value);
}

function boundedExpression(expression: KpStructuredExpression, symbols: readonly string[]): KpStructuredExpression {
  let count = 0;
  const active = new WeakSet<object>();
  const inspect = (node: KpStructuredExpressionNode, depth: number): void => {
    // Bound work before recursive cloning; source-size limits do not protect direct domain callers.
    if (!node || typeof node !== "object" || active.has(node) || ++count > 128 || depth > 12)
      fail("unsupported-shape", "Use an acyclic scalar tree of at most 128 nodes and depth 12 per endpoint.");
    active.add(node);
    if (node.kind === "number") integer(node);
    else if (node.kind === "symbol") { if (!symbols.includes(node.name)) fail("unsupported-shape", "Declare every scalar symbol."); }
    else if (node.kind === "sum" || node.kind === "product") {
      const children = node.kind === "sum" ? node.terms : node.factors;
      if (!Array.isArray(children) || children.length < 2 || children.length > 128) fail("unsupported-shape", "Use bounded sums and products.");
      for (const child of children) inspect(child, depth + 1);
    } else fail("unsupported-shape", "Only nonnegative integer, declared symbol, sum and product nodes are supported.");
    active.delete(node);
  };
  inspect(expression.root, 1);
  try { return createKpStructuredExpression({ root: expression.root }); }
  catch (error) { return fail("unsupported-shape", error instanceof Error ? error.message : "Invalid structured endpoint."); }
}

function integer(node: KpStructuredExpressionNode): KpStructuredNumberNode {
  if (node.kind !== "number" || !Number.isSafeInteger(node.value) || node.value < 0)
    fail("unsupported-shape", "Coefficients must be nonnegative safe integers.");
  return node;
}
function fail(code: KpComposedFactoringError["code"], message: string): never {
  throw new KpComposedFactoringError(code, message);
}
