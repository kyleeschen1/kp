import { sha256 } from "../kernel/sha256.ts";
import { createKpStructuredExpression, listKpStructuredExpressionSubtrees,
  type KpStructuredExpression, type KpStructuredExpressionNode } from "./structured-expression.ts";
import { bindKpStructuredExpressionRoles } from "./structured-expression-role-binding.ts";
import { kpDistributionRewriteRoleIds as roles, kpDistributionRewriteRoleSpecs,
  verifyKpDistributionRewrite, type KpVerifiedStructuredExpressionRewrite } from "./structured-expression-rewrite.ts";

const brand = Symbol("verified-common-factor");
const issued = new WeakSet<object>();
type Atom = Extract<KpStructuredExpressionNode, { kind: "symbol" | "number" }>;

export interface KpVerifiedCommonFactorRewrite {
  readonly [brand]: true;
  readonly kind: "verified-common-factor";
  readonly domain: "real-scalars";
  readonly symbols: readonly string[];
  readonly revisionId: string;
  readonly source: KpStructuredExpression;
  readonly target: KpStructuredExpression;
  readonly inverseDistribution: KpVerifiedStructuredExpressionRewrite;
  readonly factor: Atom;
  readonly addends: readonly [Atom, Atom];
  readonly factorCopyIds: readonly [string, string];
  readonly sourceAddendIds: readonly [string, string];
}

export class KpCommonFactorVerificationError extends Error {
  readonly code: "unsupported-shape" | "invalid-factorization";
  constructor(code: "unsupported-shape" | "invalid-factorization", message: string) {
    super(message); this.name = "KpCommonFactorVerificationError"; this.code = code;
  }
}

/** Factoring authenticates the inverse distributive equality. No division,
 * numerical sampling, authored proof label or new algebra engine is involved. */
export function verifyKpCommonFactorRewrite(input: {
  readonly domain: "real-scalars";
  readonly symbols: readonly string[];
  readonly source: KpStructuredExpression;
  readonly target: KpStructuredExpression;
}): KpVerifiedCommonFactorRewrite {
  if (input.domain !== "real-scalars" || input.symbols.length > 12 ||
      new Set(input.symbols).size !== input.symbols.length || input.symbols.some(s => !/^[A-Za-z]$/.test(s)))
    fail("unsupported-shape", "Declare unique single-letter real scalars.");
  const symbols = Object.freeze([...input.symbols].sort());
  const source = createKpStructuredExpression({ root: input.source.root });
  const target = createKpStructuredExpression({ root: input.target.root });
  const ids = [...listKpStructuredExpressionSubtrees(source), ...listKpStructuredExpressionSubtrees(target)].map(n => n.id);
  if (new Set(ids).size !== ids.length) fail("unsupported-shape", "Source and target occurrences need disjoint IDs.");
  const expanded = source.root, factored = target.root;
  if (expanded.kind !== "sum" || expanded.terms.length !== 2 || factored.kind !== "product" || factored.factors.length !== 2)
    fail("unsupported-shape", "Use two ordered products and one common factor multiplying a two-term sum.");
  const left = expanded.terms[0]!, right = expanded.terms[1]!, sum = factored.factors[1]!;
  if (left.kind !== "product" || right.kind !== "product" || left.factors.length !== 2 || right.factors.length !== 2 || sum.kind !== "sum" || sum.terms.length !== 2)
    fail("unsupported-shape", "Each product must contain a factor and one addend; target grouping must retain two addends.");
  const factor = atom(factored.factors[0]!, symbols);
  const addends = Object.freeze([atom(sum.terms[0]!, symbols), atom(sum.terms[1]!, symbols)] as const);
  const factors = [atom(left.factors[0]!, symbols), atom(right.factors[0]!, symbols)] as const;
  const sourceAddends = [atom(left.factors[1]!, symbols), atom(right.factors[1]!, symbols)] as const;
  const bindings = bindKpStructuredExpressionRoles({ contractId: "common-factor.inverse-distribution",
    expressions: { source: target, target: source }, roles: kpDistributionRewriteRoleSpecs,
    bindings: {
      [roles.sourceRoot]: factored.id, [roles.commonFactor]: factor.id, [roles.sourceGroupedSum]: sum.id,
      [roles.sourceAddends]: addends.map(n => n.id), [roles.targetRoot]: expanded.id,
      [roles.distributedTerms]: [left.id, right.id], [roles.factorCopies]: factors.map(n => n.id),
      [roles.distributedAddends]: sourceAddends.map(n => n.id)
    } });
  const result = verifyKpDistributionRewrite(bindings);
  if (!result.ok) fail("invalid-factorization", result.diagnostics.map(d => `${d.path}: ${d.message}`).join(" "));
  const verified: KpVerifiedCommonFactorRewrite = Object.freeze({ [brand]: true as const, kind: "verified-common-factor",
    domain: "real-scalars", symbols, source, target, inverseDistribution: result.verification,
    revisionId: `sha256:${sha256(JSON.stringify({ domain: "real-scalars", symbols, source, target }))}`,
    factor, addends, factorCopyIds: Object.freeze([factors[0].id, factors[1].id] as const),
    sourceAddendIds: Object.freeze([sourceAddends[0].id, sourceAddends[1].id] as const) });
  issued.add(verified);
  return verified;
}

export function isKpVerifiedCommonFactorRewrite(value: unknown): value is KpVerifiedCommonFactorRewrite {
  return typeof value === "object" && value !== null && issued.has(value);
}

function atom(node: KpStructuredExpressionNode, symbols: readonly string[]): Atom {
  if (node.kind === "symbol" && symbols.includes(node.name)) return node;
  if (node.kind === "number" && Number.isSafeInteger(node.value) && node.value >= 0) return node;
  return fail("unsupported-shape", "This factoring task supports declared scalar atoms and nonnegative safe integer coefficients.");
}
function fail(code: KpCommonFactorVerificationError["code"], message: string): never {
  throw new KpCommonFactorVerificationError(code, message);
}
