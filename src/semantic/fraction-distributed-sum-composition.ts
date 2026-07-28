import {
  createKpFractionNumeratorNormalizationPlan,
  type KpFractionNormalizationBranchId,
  type KpFractionNumeratorNormalizationPlan,
  type KpVerifiedFractionNumeratorNormalization
} from "./fraction-numerator-normalization.ts";
import {
  createKpStructuredExpression,
  type KpStructuredExpression
} from "./structured-expression.ts";

const canonicalBranchOrder = ["term.x", "term.6"] as const;

const verifiedFractionDistributedSumCompositionAuthority = Symbol(
  "kp.verified-fraction-distributed-sum-composition"
);

export interface KpVerifiedFractionDistributedSumComposition {
  readonly schemaVersion: "kp.verified-fraction-distributed-sum-composition.v1";
  readonly normalizationProof: KpVerifiedFractionNumeratorNormalization;
  readonly branchOrder: readonly ["term.x", "term.6"];
  readonly composedRootId: string;
  readonly targetTermIds: readonly [string, string];
  // Composition order is semantic evidence, not a renderer-controlled layout choice.
  readonly [verifiedFractionDistributedSumCompositionAuthority]: true;
}

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
  readonly verification: KpVerifiedFractionDistributedSumComposition;
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
  const verification = verifyDistributedSumComposition({
    normalization,
    expression,
    orderedBranches
  });

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
    }))),
    verification
  });
}

function verifyDistributedSumComposition(input: {
  readonly normalization: KpFractionNumeratorNormalizationPlan;
  readonly expression: KpStructuredExpression;
  readonly orderedBranches: readonly KpFractionNumeratorNormalizationPlan["branches"][number][];
}): KpVerifiedFractionDistributedSumComposition {
  if (
    input.expression.root.kind !== "sum" ||
    input.orderedBranches.length !== 2 ||
    input.orderedBranches[0]?.id !== "term.x" ||
    input.orderedBranches[1]?.id !== "term.6" ||
    input.expression.root.terms[0]?.id !== input.orderedBranches[0].target.root.id ||
    input.expression.root.terms[1]?.id !== input.orderedBranches[1].target.root.id
  ) {
    throw new Error(
      "Fraction distributed-sum proof requires canonical branch identity and order."
    );
  }
  return Object.freeze({
    schemaVersion: "kp.verified-fraction-distributed-sum-composition.v1" as const,
    normalizationProof: input.normalization.verification,
    branchOrder: canonicalBranchOrder,
    composedRootId: input.expression.root.id,
    targetTermIds: [
      input.expression.root.terms[0].id,
      input.expression.root.terms[1].id
    ] as const,
    [verifiedFractionDistributedSumCompositionAuthority]: true as const
  });
}
