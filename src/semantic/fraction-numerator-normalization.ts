import {
  createKpIndexedProgressSchedule,
  kpParallel,
  kpSequence,
  type KpIndexedProgressSchedule
} from "../animation/indexed-progress-schedule.ts";
import {
  createKpOpaqueFractionFanOutFixture,
  type KpOpaqueFractionFanOutFixture
} from "./fraction-fan-out-fixture.ts";
import {
  createKpStructuredExpression,
  type KpStructuredExpression,
  type KpStructuredExpressionNode
} from "./structured-expression.ts";

export type KpFractionNormalizationBranchId = "term.x" | "term.6";

export interface KpFractionNumeratorNormalizationBranch {
  readonly id: KpFractionNormalizationBranchId;
  readonly source: KpStructuredExpression;
  readonly target: KpStructuredExpression;
  readonly lineage: readonly {
    readonly sourceSubtreeId: string;
    readonly targetSubtreeId: string;
    readonly relation: "move-into-numerator" | "preserve";
  }[];
}

export interface KpFractionNumeratorNormalizationPlan {
  readonly schemaVersion: "kp.fraction-numerator-normalization-plan.v1";
  readonly id: "plan.fraction-fan-out.normalize-numerators";
  readonly fanOut: KpOpaqueFractionFanOutFixture;
  readonly branches: readonly KpFractionNumeratorNormalizationBranch[];
  readonly schedules: {
    readonly parallel: KpIndexedProgressSchedule<KpFractionNormalizationBranchId>;
    readonly sequential: KpIndexedProgressSchedule<KpFractionNormalizationBranchId>;
  };
}

export function createKpFractionNumeratorNormalizationPlan(input: {
  readonly secondTargetDenominator?: number | undefined;
} = {}): KpFractionNumeratorNormalizationPlan {
  const fanOut = createKpOpaqueFractionFanOutFixture();
  const sourceTerms = fanOut.target.root.kind === "sum" ? fanOut.target.root.terms : [];
  const branches = Object.freeze([
    normalizeBranch("term.x", sourceTerms[0], "x", 3),
    normalizeBranch(
      "term.6",
      sourceTerms[1],
      "6",
      input.secondTargetDenominator ?? 3
    )
  ]);
  const ids = ["term.x", "term.6"] as const;

  return Object.freeze({
    schemaVersion: "kp.fraction-numerator-normalization-plan.v1" as const,
    id: "plan.fraction-fan-out.normalize-numerators" as const,
    fanOut,
    branches,
    // Scheduling controls reveal order only. Both policies point at the same
    // verified branch outputs, so timing cannot mutate the algebraic result.
    schedules: Object.freeze({
      parallel: createKpIndexedProgressSchedule({
        id: "schedule.fraction-numerator-normalization.parallel",
        ids,
        strategy: kpParallel()
      }),
      sequential: createKpIndexedProgressSchedule({
        id: "schedule.fraction-numerator-normalization.sequential",
        ids,
        strategy: kpSequence()
      })
    })
  });
}

function normalizeBranch(
  id: KpFractionNormalizationBranchId,
  sourceRoot: KpStructuredExpressionNode | undefined,
  suffix: "x" | "6",
  targetDenominator: number
): KpFractionNumeratorNormalizationBranch {
  if (sourceRoot === undefined) {
    throw new Error(`Fraction numerator normalization ${id} is missing its source term.`);
  }
  const source = createKpStructuredExpression({ root: sourceRoot });
  if (
    source.root.kind !== "product" ||
    source.root.factors.length !== 2 ||
    source.root.factors[0]?.kind !== "quotient"
  ) {
    throw new Error(`Fraction numerator normalization ${id} requires quotient-times-addend input.`);
  }
  const sourceQuotient = source.root.factors[0];
  const sourceAddend = source.root.factors[1]!;
  const target = createKpStructuredExpression({
    root: {
      id: `fraction-normalization.target.${suffix}`,
      kind: "quotient",
      numerator: {
        id: `fraction-normalization.target.${suffix}.numerator`,
        kind: "product",
        factors: [
          cloneWithIds(sourceQuotient.numerator, `fraction-normalization.target.${suffix}.factor`),
          cloneWithIds(sourceAddend, `fraction-normalization.target.${suffix}.addend`)
        ]
      },
      denominator: {
        id: `fraction-normalization.target.${suffix}.denominator`,
        kind: "number",
        value: targetDenominator
      }
    }
  });
  verifyNormalization(id, source, target);

  return Object.freeze({
    id,
    source,
    target,
    lineage: Object.freeze([
      Object.freeze({
        relation: "move-into-numerator" as const,
        sourceSubtreeId: sourceAddend.id,
        targetSubtreeId: `fraction-normalization.target.${suffix}.addend`
      }),
      Object.freeze({
        relation: "preserve" as const,
        sourceSubtreeId: sourceQuotient.denominator.id,
        targetSubtreeId: `fraction-normalization.target.${suffix}.denominator`
      })
    ])
  });
}

function verifyNormalization(
  id: KpFractionNormalizationBranchId,
  source: KpStructuredExpression,
  target: KpStructuredExpression
): void {
  if (
    source.root.kind !== "product" ||
    source.root.factors[0]?.kind !== "quotient" ||
    target.root.kind !== "quotient" ||
    target.root.numerator.kind !== "product"
  ) {
    throw new Error(`Fraction numerator normalization ${id} has invalid topology.`);
  }
  const sourceQuotient = source.root.factors[0];
  const sourceAddend = source.root.factors[1]!;
  const [targetFactor, targetAddend] = target.root.numerator.factors;
  if (
    targetFactor === undefined ||
    targetAddend === undefined ||
    !sameTree(sourceQuotient.numerator, targetFactor) ||
    !sameTree(sourceAddend, targetAddend)
  ) {
    throw new Error(
      `Fraction numerator normalization ${id} must preserve the factor and addend inside the numerator.`
    );
  }
  if (!sameTree(sourceQuotient.denominator, target.root.denominator)) {
    throw new Error(`Fraction numerator normalization ${id} must preserve its denominator.`);
  }
}

function cloneWithIds(
  node: KpStructuredExpressionNode,
  id: string
): KpStructuredExpressionNode {
  switch (node.kind) {
    case "number":
      return { id, kind: node.kind, value: node.value };
    case "symbol":
      return { id, kind: node.kind, name: node.name };
    case "sum":
      return {
        id,
        kind: node.kind,
        terms: node.terms.map((child, index) => cloneWithIds(child, `${id}.${index}`))
      };
    case "product":
      return {
        id,
        kind: node.kind,
        factors: node.factors.map((child, index) => cloneWithIds(child, `${id}.${index}`))
      };
    case "quotient":
      return {
        id,
        kind: node.kind,
        numerator: cloneWithIds(node.numerator, `${id}.numerator`),
        denominator: cloneWithIds(node.denominator, `${id}.denominator`)
      };
    case "power":
      return {
        id,
        kind: node.kind,
        base: cloneWithIds(node.base, `${id}.base`),
        exponent: cloneWithIds(node.exponent, `${id}.exponent`)
      };
    case "negate":
      return { id, kind: node.kind, value: cloneWithIds(node.value, `${id}.value`) };
  }
}

function sameTree(
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
      return right.kind === "sum" && sameTrees(left.terms, right.terms);
    case "product":
      return right.kind === "product" && sameTrees(left.factors, right.factors);
    case "quotient":
      return right.kind === "quotient" && sameTree(left.numerator, right.numerator) &&
        sameTree(left.denominator, right.denominator);
    case "power":
      return right.kind === "power" && sameTree(left.base, right.base) &&
        sameTree(left.exponent, right.exponent);
    case "negate":
      return right.kind === "negate" && sameTree(left.value, right.value);
  }
}

function sameTrees(
  left: readonly KpStructuredExpressionNode[],
  right: readonly KpStructuredExpressionNode[]
): boolean {
  return left.length === right.length && left.every((node, index) =>
    right[index] !== undefined && sameTree(node, right[index])
  );
}
