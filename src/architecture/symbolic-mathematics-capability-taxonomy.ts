import { kpEquationAnimationCapabilityPlan } from
  "./equation-animation-capability-plan.ts";

export const KP_SYMBOLIC_MATHEMATICS_CAPABILITY_TAXONOMY_SCHEMA =
  "kp.symbolic-mathematics-capability-taxonomy.v1" as const;

export type KpSymbolicMathematicsGroupId =
  | "algebra-functions"
  | "trigonometric-syntax"
  | "inequalities-piecewise"
  | "sequences-series"
  | "limits"
  | "calculus-operators"
  | "polar-parametric"
  | "differential-equations"
  | "taylor-series";

export interface KpSymbolicMathematicsCapabilityGroup {
  readonly id: KpSymbolicMathematicsGroupId;
  readonly order: number;
  readonly title: string;
  readonly capabilityIds: readonly string[];
}

export interface KpSymbolicMathematicsCapabilityTaxonomy {
  readonly schemaVersion:
    typeof KP_SYMBOLIC_MATHEMATICS_CAPABILITY_TAXONOMY_SCHEMA;
  readonly kind: "symbolic-mathematics-capability-taxonomy";
  readonly id: string;
  readonly groups: readonly KpSymbolicMathematicsCapabilityGroup[];
}

/**
 * Curriculum groupings contain references only. Readiness continues to derive
 * from the capability ledger, so adding a curriculum heading cannot silently
 * turn planned notation into claimed animation support.
 */
export const kpCalculusBcSymbolicMathematicsTaxonomy = defineTaxonomy({
  schemaVersion: KP_SYMBOLIC_MATHEMATICS_CAPABILITY_TAXONOMY_SCHEMA,
  kind: "symbolic-mathematics-capability-taxonomy",
  id: "taxonomy.symbolic-mathematics.calculus-bc.v1",
  groups: [
    group("algebra-functions", 1, "Algebra and functions", [
      "capability.equation.function-wrapping",
      "capability.equation.distribution",
      "capability.equation.additive-cancellation",
      "capability.equation.log-homomorphic-decomposition",
      "capability.equation.balanced-operations",
      "capability.equation.alternative-logarithm-bases",
      "capability.equation.fraction-equivalence",
      "capability.equation.common-denominator-construction",
      "capability.equation.fraction-arithmetic",
      "capability.equation.fraction-factor-cancellation",
      "capability.equation.nested-fraction-normalization",
      "capability.equation.power-and-exponent-transformations",
      "capability.equation.radical-inversion",
      "capability.equation.substitution-collection-factoring",
      "capability.equation.branching-and-domain-conditions",
      "capability.equation.transform-series",
      "capability.equation.multiline-derivation-continuity"
    ]),
    group("trigonometric-syntax", 2, "Trigonometric syntax", [
      "capability.equation.trigonometric-transformations"
    ]),
    group("inequalities-piecewise", 3, "Inequalities and piecewise forms", [
      "capability.equation.inequality-transformations",
      "capability.equation.piecewise-transformations"
    ]),
    group("sequences-series", 4, "Sequences and series", [
      "capability.equation.sequence-series-transformations"
    ]),
    group("limits", 5, "Limits", [
      "capability.equation.limit-transformations"
    ]),
    group("calculus-operators", 6, "Calculus operators", [
      "capability.equation.binders-and-calculus-operators",
      "capability.equation.differentiation-transformations",
      "capability.equation.integration-transformations"
    ]),
    group("polar-parametric", 7, "Polar and parametric forms", [
      "capability.equation.polar-parametric-transformations"
    ]),
    group("differential-equations", 8, "Differential equations", [
      "capability.equation.differential-equation-transformations"
    ]),
    group("taylor-series", 9, "Taylor polynomials and series", [
      "capability.equation.taylor-series-transformations"
    ])
  ]
});

export function defineTaxonomy(
  value: KpSymbolicMathematicsCapabilityTaxonomy
): KpSymbolicMathematicsCapabilityTaxonomy {
  const capabilityIds = new Set(
    kpEquationAnimationCapabilityPlan.entries.map(({ id }) => id)
  );
  const groupIds = new Set<string>();
  const orders = new Set<number>();
  let previousOrder = 0;
  for (const group of value.groups) {
    if (groupIds.has(group.id)) throw new Error(`Duplicate taxonomy group ${group.id}.`);
    if (orders.has(group.order)) throw new Error(`Duplicate taxonomy order ${group.order}.`);
    if (group.order <= previousOrder) {
      throw new Error("Taxonomy groups must have a strictly increasing order.");
    }
    if (new Set(group.capabilityIds).size !== group.capabilityIds.length) {
      throw new Error(`Duplicate capability reference in taxonomy group ${group.id}.`);
    }
    for (const capabilityId of group.capabilityIds) {
      if (!capabilityIds.has(capabilityId)) {
        throw new Error(`Unknown capability ${capabilityId} in taxonomy group ${group.id}.`);
      }
    }
    groupIds.add(group.id);
    orders.add(group.order);
    previousOrder = group.order;
  }
  return Object.freeze({
    ...value,
    groups: Object.freeze(value.groups.map((group) => Object.freeze({
      ...group,
      capabilityIds: Object.freeze([...group.capabilityIds])
    })))
  });
}

function group(
  id: KpSymbolicMathematicsGroupId,
  order: number,
  title: string,
  capabilityIds: readonly string[]
): KpSymbolicMathematicsCapabilityGroup {
  return Object.freeze({
    id,
    order,
    title,
    capabilityIds: Object.freeze([...capabilityIds])
  });
}
