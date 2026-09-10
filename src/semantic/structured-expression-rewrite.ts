import {
  resolveKpStructuredExpressionRole,
  type KpStructuredExpressionRoleBindingSet,
  type KpStructuredExpressionRoleSpec
} from "./structured-expression-role-binding.ts";
import type { KpStructuredExpressionNode } from "./structured-expression.ts";

export interface KpStructuredExpressionRewriteDiagnostic {
  readonly code:
    | "source-pattern-mismatch"
    | "target-pattern-mismatch"
    | "cardinality-mismatch"
    | "factor-lineage-mismatch"
    | "addend-lineage-mismatch";
  readonly path: string;
  readonly message: string;
}

export interface KpStructuredExpressionRewriteLineage {
  readonly relation: "fan-out" | "preserve";
  readonly sourceSubtreeIds: readonly string[];
  readonly targetSubtreeIds: readonly string[];
}

export interface KpVerifiedStructuredExpressionRewrite {
  readonly schemaVersion: "kp.verified-structured-expression-rewrite.v1";
  readonly lawId: "kp.algebra.distribute.v1";
  readonly sourceRootId: string;
  readonly targetRootId: string;
  readonly lineage: readonly KpStructuredExpressionRewriteLineage[];
}

export type KpStructuredExpressionRewriteResult =
  | {
      readonly ok: true;
      readonly verification: KpVerifiedStructuredExpressionRewrite;
      readonly diagnostics: readonly [];
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly KpStructuredExpressionRewriteDiagnostic[];
    };

export const kpDistributionRewriteRoleIds = Object.freeze({
  sourceRoot: "source-root",
  commonFactor: "common-factor",
  sourceGroupedSum: "source-grouped-sum",
  sourceAddends: "source-addends",
  targetRoot: "target-root",
  distributedTerms: "distributed-terms",
  factorCopies: "factor-copies",
  distributedAddends: "distributed-addends"
} as const);

const opaqueAlgebraKinds = Object.freeze([
  "number",
  "symbol",
  "sum",
  "product",
  "quotient",
  "power",
  "negate"
] as const);

export const kpDistributionRewriteRoleSpecs: readonly KpStructuredExpressionRoleSpec[] = Object.freeze([
  roleSpec(kpDistributionRewriteRoleIds.sourceRoot, "source", "exactly-one", ["product"]),
  roleSpec(kpDistributionRewriteRoleIds.commonFactor, "source", "exactly-one", opaqueAlgebraKinds),
  roleSpec(kpDistributionRewriteRoleIds.sourceGroupedSum, "source", "exactly-one", ["sum"]),
  roleSpec(kpDistributionRewriteRoleIds.sourceAddends, "source", "one-or-more", opaqueAlgebraKinds),
  roleSpec(kpDistributionRewriteRoleIds.targetRoot, "target", "exactly-one", ["sum"]),
  roleSpec(kpDistributionRewriteRoleIds.distributedTerms, "target", "one-or-more", ["product"]),
  roleSpec(kpDistributionRewriteRoleIds.factorCopies, "target", "one-or-more", opaqueAlgebraKinds),
  roleSpec(kpDistributionRewriteRoleIds.distributedAddends, "target", "one-or-more", opaqueAlgebraKinds)
]);

export function verifyKpDistributionRewrite(
  bindings: KpStructuredExpressionRoleBindingSet
): KpStructuredExpressionRewriteResult {
  return verifyDistribution(bindings, "left");
}

export type KpDistributionOrientation = "left" | "right";

export type KpOrientedDistributionRewriteResult =
  | { readonly ok: true; readonly diagnostics: readonly [];
      readonly verification: KpVerifiedStructuredExpressionRewrite & { readonly orientation: KpDistributionOrientation } }
  | Extract<KpStructuredExpressionRewriteResult, { ok: false }>;

/** Orientation is a law input, not permission to commute the authored tree.
 * The legacy entrypoint keeps its left-only contract and result shape. */
export function verifyKpOrientedDistributionRewrite(input: {
  readonly bindings: KpStructuredExpressionRoleBindingSet;
  readonly orientation: KpDistributionOrientation;
}): KpOrientedDistributionRewriteResult {
  if (input.orientation !== "left" && input.orientation !== "right") {
    return Object.freeze({ ok: false as const, diagnostics: Object.freeze([Object.freeze({
      code: "source-pattern-mismatch" as const, path: "orientation", message: "Declare left or right distribution explicitly."
    })]) });
  }
  const result = verifyDistribution(input.bindings, input.orientation);
  return result.ok ? Object.freeze({ ...result,
    verification: Object.freeze({ ...result.verification, orientation: input.orientation }) }) : result;
}

function verifyDistribution(
  bindings: KpStructuredExpressionRoleBindingSet,
  orientation: KpDistributionOrientation
): KpStructuredExpressionRewriteResult {
  const factorIndex = orientation === "left" ? 0 : 1;
  const addendIndex = orientation === "left" ? 1 : 0;
  const diagnostics: KpStructuredExpressionRewriteDiagnostic[] = [];
  const sourceRoot = one(bindings, kpDistributionRewriteRoleIds.sourceRoot);
  const commonFactor = one(bindings, kpDistributionRewriteRoleIds.commonFactor);
  const sourceGroupedSum = one(bindings, kpDistributionRewriteRoleIds.sourceGroupedSum);
  const sourceAddends = resolveKpStructuredExpressionRole(
    bindings,
    kpDistributionRewriteRoleIds.sourceAddends
  );
  const targetRoot = one(bindings, kpDistributionRewriteRoleIds.targetRoot);
  const distributedTerms = resolveKpStructuredExpressionRole(
    bindings,
    kpDistributionRewriteRoleIds.distributedTerms
  );
  const factorCopies = resolveKpStructuredExpressionRole(
    bindings,
    kpDistributionRewriteRoleIds.factorCopies
  );
  const distributedAddends = resolveKpStructuredExpressionRole(
    bindings,
    kpDistributionRewriteRoleIds.distributedAddends
  );

  if (
    sourceRoot?.kind !== "product" ||
    commonFactor === undefined ||
    sourceGroupedSum?.kind !== "sum" ||
    sourceRoot.factors.length !== 2 ||
    sourceRoot.factors[factorIndex]?.id !== commonFactor.id ||
    sourceRoot.factors[addendIndex]?.id !== sourceGroupedSum.id
  ) {
    diagnostics.push({
      code: "source-pattern-mismatch",
      path: "roles.source-root",
      message: orientation === "left"
        ? "Distribution source must be an ordered product of the common factor and grouped sum."
        : "Distribution source must retain the common factor on the right of the grouped sum."
    });
  }
  if (
    sourceGroupedSum?.kind !== "sum" ||
    !sameIds(sourceGroupedSum.terms, sourceAddends)
  ) {
    diagnostics.push({
      code: "source-pattern-mismatch",
      path: "roles.source-addends",
      message: "Source addend roles must match the grouped sum terms in authored order."
    });
  }
  if (
    targetRoot?.kind !== "sum" ||
    !sameIds(targetRoot.terms, distributedTerms)
  ) {
    diagnostics.push({
      code: "target-pattern-mismatch",
      path: "roles.distributed-terms",
      message: "Distributed term roles must match the target sum terms in authored order."
    });
  }

  const counts = [
    sourceAddends.length,
    distributedTerms.length,
    factorCopies.length,
    distributedAddends.length
  ];
  if (counts.some((count) => count !== counts[0])) {
    diagnostics.push({
      code: "cardinality-mismatch",
      path: "roles",
      message:
        "Distribution requires one target term, factor copy, and distributed addend per source addend; " +
        `received ${counts.join(":")}.`
    });
  }

  const pairCount = Math.min(...counts);
  for (let index = 0; index < pairCount; index += 1) {
    const sourceAddend = sourceAddends[index]!;
    const distributedTerm = distributedTerms[index]!;
    const factorCopy = factorCopies[index]!;
    const distributedAddend = distributedAddends[index]!;
    if (
      distributedTerm.kind !== "product" ||
      distributedTerm.factors.length !== 2 ||
      distributedTerm.factors[factorIndex]?.id !== factorCopy.id ||
      distributedTerm.factors[addendIndex]?.id !== distributedAddend.id
    ) {
      diagnostics.push({
        code: "target-pattern-mismatch",
        path: `roles.distributed-terms[${index}]`,
        message: orientation === "left"
          ? "Each distributed term must be an ordered product of its factor copy and addend."
          : "Each distributed term must retain its factor copy on the right of its addend."
      });
    }
    if (commonFactor === undefined || !sameSemanticTree(commonFactor, factorCopy)) {
      diagnostics.push({
        code: "factor-lineage-mismatch",
        path: `roles.factor-copies[${index}]`,
        message: "Every factor copy must preserve the common factor's complete semantic subtree."
      });
    }
    if (!sameSemanticTree(sourceAddend, distributedAddend)) {
      diagnostics.push({
        code: "addend-lineage-mismatch",
        path: `roles.distributed-addends[${index}]`,
        message: "Every distributed addend must preserve its corresponding source addend subtree."
      });
    }
  }

  if (diagnostics.length > 0 || sourceRoot === undefined || targetRoot === undefined || commonFactor === undefined) {
    return Object.freeze({ ok: false as const, diagnostics: Object.freeze(diagnostics) });
  }
  const lineage: KpStructuredExpressionRewriteLineage[] = [
    {
      relation: "fan-out",
      sourceSubtreeIds: [commonFactor.id],
      targetSubtreeIds: factorCopies.map((node) => node.id)
    },
    ...sourceAddends.map((sourceAddend, index) => ({
      relation: "preserve" as const,
      sourceSubtreeIds: [sourceAddend.id],
      targetSubtreeIds: [distributedAddends[index]!.id]
    }))
  ];
  return Object.freeze({
    ok: true as const,
    diagnostics: Object.freeze([]) as readonly [],
    verification: Object.freeze({
      schemaVersion: "kp.verified-structured-expression-rewrite.v1" as const,
      lawId: "kp.algebra.distribute.v1" as const,
      sourceRootId: sourceRoot.id,
      targetRootId: targetRoot.id,
      lineage: Object.freeze(lineage.map((entry) => Object.freeze({
        ...entry,
        sourceSubtreeIds: Object.freeze([...entry.sourceSubtreeIds]),
        targetSubtreeIds: Object.freeze([...entry.targetSubtreeIds])
      })))
    })
  });
}

function one(
  bindings: KpStructuredExpressionRoleBindingSet,
  roleId: string
): KpStructuredExpressionNode | undefined {
  const nodes = resolveKpStructuredExpressionRole(bindings, roleId);
  return nodes.length === 1 ? nodes[0] : undefined;
}

function sameIds(
  actual: readonly KpStructuredExpressionNode[],
  expected: readonly KpStructuredExpressionNode[]
): boolean {
  return actual.length === expected.length && actual.every((node, index) => node.id === expected[index]?.id);
}

// Shared structural equality ignores occurrence IDs, never operand order.
export { sameSemanticTree as sameKpStructuredExpressionTree };
function sameSemanticTree(
  left: KpStructuredExpressionNode,
  right: KpStructuredExpressionNode
): boolean {
  if (left.kind !== right.kind) return false;
  switch (left.kind) {
    case "number":
      return right.kind === "number" && left.value === right.value;
    case "symbol":
      return right.kind === "symbol" && left.name === right.name;
    case "sum":
      return right.kind === "sum" && sameSemanticTrees(left.terms, right.terms);
    case "product":
      return right.kind === "product" && sameSemanticTrees(left.factors, right.factors);
    case "quotient":
      return right.kind === "quotient" &&
        sameSemanticTree(left.numerator, right.numerator) &&
        sameSemanticTree(left.denominator, right.denominator);
    case "power":
      return right.kind === "power" &&
        sameSemanticTree(left.base, right.base) &&
        sameSemanticTree(left.exponent, right.exponent);
    case "negate":
      return right.kind === "negate" && sameSemanticTree(left.value, right.value);
  }
}

function sameSemanticTrees(
  left: readonly KpStructuredExpressionNode[],
  right: readonly KpStructuredExpressionNode[]
): boolean {
  return left.length === right.length && left.every((node, index) =>
    right[index] !== undefined && sameSemanticTree(node, right[index])
  );
}

function roleSpec(
  id: string,
  endpoint: "source" | "target",
  cardinality: "exactly-one" | "one-or-more",
  allowedKinds: KpStructuredExpressionRoleSpec["allowedKinds"]
): KpStructuredExpressionRoleSpec {
  return Object.freeze({
    id,
    endpoint,
    cardinality,
    allowedKinds: Object.freeze([...allowedKinds]),
    summary: `Required ${id} role for the verified distribution law.`
  });
}
