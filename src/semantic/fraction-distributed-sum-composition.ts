import {
  createKpFractionNumeratorNormalizationPlan,
  type KpFractionNormalizationBranchId,
  type KpFractionNumeratorNormalizationPlan
} from "./fraction-numerator-normalization.ts";
import {
  createKpStructuredExpression,
  type KpStructuredExpression
} from "./structured-expression.ts";

const canonicalBranchOrder = ["term.x", "term.6"] as const;

export interface KpFractionDistributedSumComposition {
  readonly schemaVersion: "kp.fraction-distributed-sum-composition.v1";
  readonly id: "composition.fraction-fan-out.normalized-sum";
  readonly normalization: KpFractionNumeratorNormalizationPlan;
  readonly expression: KpStructuredExpression;
  readonly lineage: readonly {
    readonly relation: "preserve";
    readonly branchId: KpFractionNormalizationBranchId;
    readonly sourceRootId: string;
    readonly targetTermId: string;
  }[];
}

export function createKpFractionDistributedSumComposition(input: {
  readonly branchOrder?: readonly KpFractionNormalizationBranchId[] | undefined;
} = {}): KpFractionDistributedSumComposition {
  const normalization = createKpFractionNumeratorNormalizationPlan();
  const branchOrder = input.branchOrder ?? canonicalBranchOrder;
  if (
    branchOrder.length !== canonicalBranchOrder.length ||
    branchOrder.some((branchId, index) => branchId !== canonicalBranchOrder[index])
  ) {
    throw new Error(
      "Fraction distributed-sum composition must preserve normalized branch order term.x, term.6."
    );
  }
  const branchById = new Map(normalization.branches.map((branch) => [branch.id, branch]));
  const orderedBranches = branchOrder.map((branchId) => {
    const branch = branchById.get(branchId);
    if (branch === undefined) {
      throw new Error(`Fraction distributed-sum composition is missing branch ${branchId}.`);
    }
    return branch;
  });
  const expression = createKpStructuredExpression({
    root: {
      id: "fraction-composition.target.sum",
      kind: "sum",
      terms: orderedBranches.map(({ target }) => target.root)
    }
  });

  if (
    expression.root.kind !== "sum" ||
    expression.root.terms.some((term, index) => term.id !== orderedBranches[index]?.target.root.id)
  ) {
    throw new Error("Fraction distributed-sum composition lost normalized term identity.");
  }

  return Object.freeze({
    schemaVersion: "kp.fraction-distributed-sum-composition.v1" as const,
    id: "composition.fraction-fan-out.normalized-sum" as const,
    normalization,
    expression,
    lineage: Object.freeze(orderedBranches.map((branch) => Object.freeze({
      relation: "preserve" as const,
      branchId: branch.id,
      sourceRootId: branch.target.root.id,
      targetTermId: branch.target.root.id
    })))
  });
}
