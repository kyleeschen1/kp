import {
  createKpCanonicalOperationPack,
  kpCanonicalOperationCorePack
} from "./canonical-operation-pack.ts";
import type {
  KpCanonicalOperationId,
  KpCanonicalOperationRole,
  KpCanonicalOperationRoleCardinality,
  KpCanonicalOperationRoleKind
} from "./canonical-operation.ts";

export interface KpEquationLawOperationDefinition {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly transformType: string;
  readonly canonicalComposition: readonly KpCanonicalOperationId[];
  readonly authoringRoles: readonly KpCanonicalOperationRole[];
}

export const kpEquationLawOperationDefinitions = Object.freeze([
  operation({
    id: "kp.algebra.apply-natural-log-both-sides",
    title: "Apply natural logarithm to both sides",
    summary:
      "Preserve both equation branches and their relation while introducing " +
      "one natural-log application around each side.",
    transformType: "applyNaturalLogBothSides",
    canonicalComposition: ["kp.core.persist", "kp.core.wrap"],
    authoringRoles: [
      entity("equation-before", "source", "one-or-more"),
      entity("equation-after", "target", "one-or-more"),
      artifact("log-wrappers-after", "target", "one-or-more")
    ]
  }),
  operation({
    id: "kp.algebra.extract-log-power-exponent",
    title: "Extract a logarithm's power exponent",
    summary:
      "Preserve the equation while a logged power becomes an extracted product.",
    transformType: "extractLogPowerExponent",
    canonicalComposition: [
      "kp.core.persist", "kp.core.reorder", "kp.core.eliminate",
      "kp.core.introduce"
    ],
    authoringRoles: [
      entity("logged-power-before", "source", "one-or-more"),
      entity("extracted-product-after", "target", "one-or-more")
    ]
  }),
  operation({
    id: "kp.algebra.divide-both-sides-by-log-base",
    title: "Divide both sides by the logarithm of the base",
    summary:
      "Preserve logarithm material while product roles become an isolated quotient.",
    transformType: "divideBothSidesByLogBase",
    canonicalComposition: [
      "kp.core.persist", "kp.core.reorder", "kp.core.eliminate",
      "kp.core.introduce"
    ],
    authoringRoles: [
      entity("product-equation-before", "source", "one-or-more"),
      entity("quotient-equation-after", "target", "one-or-more")
    ]
  }),
  operation({
    id: "kp.algebra.change-logarithm-base",
    title: "Change a logarithm's base",
    summary:
      "Preserve argument and base while one application derives a logarithm quotient.",
    transformType: "changeLogarithmBase",
    canonicalComposition: [
      "kp.core.persist", "kp.core.fan-out", "kp.core.introduce"
    ],
    authoringRoles: [
      entity("source-application", "source", "one-or-more"),
      entity("target-quotient", "target", "one-or-more")
    ]
  }),
  operation({
    id: "kp.semantic-motion.quotient",
    title: "Combine a logarithm difference as a quotient",
    summary:
      "Preserve ordered arguments while two logarithm applications fuse around one quotient.",
    transformType: "combineLogDifferenceAsQuotient",
    canonicalComposition: [
      "kp.core.persist", "kp.core.merge", "kp.core.eliminate",
      "kp.core.introduce"
    ],
    authoringRoles: [
      entity("source-difference", "source", "one-or-more"),
      entity("target-quotient", "target", "one-or-more")
    ]
  }),
  exponentialHomomorphism(
    "operation.equation.exponential-sum-to-product.v1",
    "sum",
    "product"
  ),
  exponentialHomomorphism(
    "operation.equation.exponential-difference-to-quotient.v1",
    "difference",
    "quotient"
  ),
  operation({
    id: "kp.algebra.scale-fraction-equivalently",
    title: "Scale a fraction equivalently",
    summary: "Copy one nonzero factor into numerator and denominator roles.",
    transformType: "scaleFractionEquivalently",
    canonicalComposition: ["kp.core.persist", "kp.core.fan-out"],
    authoringRoles: [
      entity("fraction-before", "source"),
      entity("scale-factor", "source"),
      entity("fraction-after", "target"),
      entity("scale-factor-copies", "target", "one-or-more")
    ]
  }),
  operation({
    id: "kp.algebra.introduce-unit-factor",
    title: "Introduce a unit fraction factor",
    summary: "Preserve an expression while introducing one verified unit factor.",
    transformType: "introduceUnitFactor",
    canonicalComposition: ["kp.core.persist", "kp.core.introduce"],
    authoringRoles: [
      entity("expression-before", "source"),
      entity("expression-after", "target"),
      entity("unit-factor-after", "target")
    ]
  }),
  operation({
    id: "kp.algebra.align-common-denominator",
    title: "Align a common denominator",
    summary: "Preserve both addends while joining the unit factor into one fraction.",
    transformType: "alignCommonDenominator",
    canonicalComposition: ["kp.core.persist", "kp.core.reorder"],
    authoringRoles: [
      entity("staged-expression", "source"),
      entity("aligned-expression", "target")
    ]
  }),
  operation({
    id: "operation.equation.apply-inverse-power.v1",
    title: "Apply an inverse power",
    summary: "Move a power into root-index structure and expose every valid branch.",
    transformType: "operation.equation.apply-inverse-power.v1",
    canonicalComposition: [
      "kp.core.persist", "kp.core.reorder", "kp.core.introduce"
    ],
    authoringRoles: [
      entity("equation-before", "source"),
      entity("exponent-before", "source"),
      entity("equation-after", "target"),
      entity("root-index-after", "target"),
      entity("branches-after", "target", "one-or-more")
    ]
  }),
  operation({
    id: "operation.arithmetic.evaluate-real-root.v1",
    title: "Evaluate a real root",
    summary: "Evaluate one real radical expression while preserving its branch operator.",
    transformType: "operation.arithmetic.evaluate-real-root.v1",
    canonicalComposition: ["kp.core.persist", "kp.core.merge"],
    authoringRoles: [
      entity("operands-before", "source", "one-or-more"),
      entity("result-after", "target")
    ]
  }),
  operation({
    id: "operation.root.compound-carrier-normalization",
    title: "Normalize a compound even-root carrier",
    summary: "Preserve one compound carrier while radical syntax becomes absolute-value syntax.",
    transformType: "compound-carrier-normalization",
    canonicalComposition: [
      "kp.core.persist", "kp.core.eliminate", "kp.core.introduce"
    ],
    authoringRoles: [
      entity("carrier-before", "source"),
      artifact("root-shell-before", "source", "one-or-more"),
      entity("carrier-after", "target"),
      artifact("absolute-shell-after", "target", "one-or-more")
    ]
  })
]);

export const kpEquationLawOperationPack = createKpCanonicalOperationPack({
  id: "kp.equation-laws",
  scope: "shared-domain",
  version: "1.0.0",
  title: "KP equation law operations",
  operationIds: kpEquationLawOperationDefinitions.map(({ id }) => id),
  dependencies: [{
    packId: kpCanonicalOperationCorePack.id,
    version: kpCanonicalOperationCorePack.version
  }]
});

function exponentialHomomorphism(
  id: string,
  sourceKind: "sum" | "difference",
  targetKind: "product" | "quotient"
): KpEquationLawOperationDefinition {
  return operation({
    id,
    title: `Turn an exponential ${sourceKind} into a ${targetKind}`,
    summary:
      `Preserve exponent payloads while one power derives the successor ${targetKind}.`,
    transformType: id,
    canonicalComposition: [
      "kp.core.persist", "kp.core.fan-out", "kp.core.eliminate",
      "kp.core.introduce"
    ],
    authoringRoles: [
      entity("source-power", "source", "one-or-more"),
      entity("target-powers", "target", "one-or-more"),
      artifact("target-combination", "target", "one-or-more")
    ]
  });
}

function operation(
  input: KpEquationLawOperationDefinition
): KpEquationLawOperationDefinition {
  return Object.freeze({
    ...input,
    canonicalComposition: Object.freeze([...input.canonicalComposition]),
    authoringRoles: Object.freeze(input.authoringRoles.map((role) =>
      Object.freeze({ ...role })))
  });
}

function entity(
  id: string,
  endpoint: "source" | "target",
  cardinality: KpCanonicalOperationRoleCardinality = "exactly-one"
): KpCanonicalOperationRole {
  return role(id, endpoint, "semantic-entity", cardinality);
}

function artifact(
  id: string,
  endpoint: "source" | "target",
  cardinality: KpCanonicalOperationRoleCardinality
): KpCanonicalOperationRole {
  return role(id, endpoint, "structural-artifact", cardinality);
}

function role(
  id: string,
  endpoint: "source" | "target",
  kind: KpCanonicalOperationRoleKind,
  cardinality: KpCanonicalOperationRoleCardinality
): KpCanonicalOperationRole {
  return { id, endpoint, kind, cardinality, summary: `${endpoint} ${kind} ${id}` };
}
