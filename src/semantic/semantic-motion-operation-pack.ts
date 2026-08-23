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

export const kpSemanticMotionOperationPackVersion = "0.1.0" as const;

export interface KpSemanticMotionOperationDefinition {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly transformType: string;
  readonly canonicalComposition: readonly KpCanonicalOperationId[];
  readonly authoringRoles: readonly KpCanonicalOperationRole[];
}

// This is the model-facing layer above the universal core. It names operations
// whose characteristic choreography is already implemented and reviewed in KP.
export const kpSemanticMotionOperationDefinitions:
  readonly KpSemanticMotionOperationDefinition[] = [
    operation({
      id: "kp.semantic-motion.substitute-value",
      title: "Substitute a value",
      summary: "Transmit a persistent value into a replaced semantic position.",
      transformType: "substituteValue",
      canonicalComposition: ["kp.core.substitute"],
      authoringRoles: [
        entity("value", "source"),
        entity("replaced", "source"),
        entity("replacement", "target")
      ]
    }),
    identityAbsorption("additive", "simplify-additive-identity"),
    identityAbsorption("multiplicative", "simplify-multiplicative-identity"),
    operation({
      id: "kp.semantic-motion.multiply-negative-inequality",
      title: "Multiply an inequality by a negative value",
      summary: "Preserve both sides while the relation reverses under negative scaling.",
      transformType: "multiplyNegativeBothSidesInequality",
      canonicalComposition: ["kp.core.persist", "kp.core.introduce", "kp.core.reorder"],
      authoringRoles: [
        entity("sides-before", "source", "one-or-more"),
        entity("relation-before", "source"),
        entity("negative-factor", "source", "zero-or-one"),
        entity("sides-after", "target", "one-or-more"),
        entity("relation-after", "target")
      ]
    }),
    operation({
      id: "kp.semantic-motion.log-product",
      title: "Expand a logarithm over a product",
      summary:
        "Preserve ordered factors while one logarithm application derives " +
        "one wrapped target per factor and additive connector structure.",
      transformType: "expandLogProductAsSum",
      canonicalComposition: ["kp.core.persist", "kp.core.fan-out"],
      authoringRoles: [
        entity("source-application", "source"),
        entity("target-applications", "target", "one-or-more"),
        entity("source-operator", "source"),
        entity("target-operators", "target", "one-or-more"),
        entity("source-arguments", "source", "one-or-more"),
        entity("target-arguments", "target", "one-or-more"),
        artifact("source-shells", "source", "one-or-more"),
        artifact("target-shells", "target", "one-or-more"),
        entity("source-product", "source"),
        entity("target-sum", "target"),
        artifact("connector", "target", "one-or-more")
      ]
    }),
    operation({
      id: "kp.semantic-motion.derivative-power-rule",
      title: "Apply the derivative power rule",
      summary: "Branch the exponent into coefficient and predecessor roles while the base persists.",
      transformType: "applyDerivativePowerRule",
      canonicalComposition: ["kp.core.persist", "kp.core.copy", "kp.core.reorder", "kp.core.eliminate"],
      authoringRoles: [
        entity("base-before", "source"),
        entity("exponent-before", "source"),
        artifact("derivative-artifacts", "source", "one-or-more"),
        entity("base-after", "target"),
        entity("coefficient-after", "target"),
        entity("exponent-after", "target")
      ]
    }),
    operation({
      id: "kp.semantic-motion.derivative-sum-rule",
      title: "Apply the derivative sum rule",
      summary: "Fan one derivative operator out across persistent addends.",
      transformType: "applyDerivativeSumRule",
      canonicalComposition: ["kp.core.persist", "kp.core.fan-out"],
      authoringRoles: [
        entity("operator-before", "source"),
        entity("addends-before", "source", "one-or-more"),
        entity("operators-after", "target", "one-or-more"),
        entity("addends-after", "target", "one-or-more")
      ]
    }),
    operation({
      id: "kp.semantic-motion.resolve-derivative-terms",
      title: "Resolve derivative terms",
      summary: "Resolve local derivative operators into their corresponding term results.",
      transformType: "applyDerivativePowerRulesToTerms",
      canonicalComposition: ["kp.core.persist", "kp.core.merge"],
      authoringRoles: [
        entity("terms-before", "source", "one-or-more"),
        entity("terms-after", "target", "one-or-more")
      ]
    }),
    operation({
      id: "kp.semantic-motion.antiderivative-power-rule",
      title: "Apply the antiderivative power rule",
      summary: "Branch the source exponent into successor exponent and quotient roles.",
      transformType: "applyAntiderivativePowerRule",
      canonicalComposition: ["kp.core.persist", "kp.core.copy", "kp.core.wrap"],
      authoringRoles: [
        entity("base-before", "source"),
        entity("exponent-before", "source"),
        entity("base-after", "target"),
        entity("successor-exponents", "target", "one-or-more"),
        artifact("quotient-structure", "target", "one-or-more")
      ]
    }),
    operation({
      id: "kp.semantic-motion.resolve-antiderivative",
      title: "Resolve an antiderivative",
      summary: "Merge the power-rule construction and introduce the integration constant.",
      transformType: "simplifyAntiderivativePowerRule",
      canonicalComposition: ["kp.core.merge", "kp.core.introduce"],
      authoringRoles: [
        entity("construction-before", "source", "one-or-more"),
        entity("result-after", "target"),
        entity("integration-constant", "target", "zero-or-one")
      ]
    }),
    operation({
      id: "kp.semantic-motion.dot-product",
      title: "Compute a dot product",
      summary: "Pair components by semantic index, preserve products, and accumulate partial sums.",
      transformType: "computeDotProduct",
      canonicalComposition: ["kp.core.copy", "kp.core.merge"],
      authoringRoles: [
        entity("left-components", "source", "one-or-more"),
        entity("right-components", "source", "one-or-more"),
        entity("products", "target", "one-or-more"),
        entity("partial-sums", "target", "one-or-more"),
        entity("result", "target")
      ]
    }),
    operation({
      id: "kp.semantic-motion.matrix-vector",
      title: "Multiply a matrix by a vector",
      summary: "Traverse matrix rows against a shared vector and persist each result entry.",
      transformType: "multiplyMatrixVector",
      canonicalComposition: ["kp.core.persist", "kp.core.copy", "kp.core.merge"],
      authoringRoles: [
        entity("matrix-rows", "source", "one-or-more"),
        entity("vector-components", "source", "one-or-more"),
        entity("row-products", "target", "one-or-more"),
        entity("result-entries", "target", "one-or-more")
      ]
    }),
    operation({
      id: "kp.semantic-motion.matrix-matrix",
      title: "Multiply two matrices",
      summary: "Traverse left rows against right columns and persist each result cell.",
      transformType: "multiplyMatrices",
      canonicalComposition: ["kp.core.persist", "kp.core.copy", "kp.core.merge"],
      authoringRoles: [
        entity("left-rows", "source", "one-or-more"),
        entity("right-columns", "source", "one-or-more"),
        entity("cell-products", "target", "one-or-more"),
        entity("result-cells", "target", "one-or-more")
      ]
    })
  ];

export const kpSemanticMotionOperationPack = createKpCanonicalOperationPack({
  id: "kp.semantic-motion",
  scope: "shared-domain",
  version: kpSemanticMotionOperationPackVersion,
  title: "KP promoted semantic motion operations",
  operationIds: kpSemanticMotionOperationDefinitions.map((definition) => definition.id),
  dependencies: [{
    packId: kpCanonicalOperationCorePack.id,
    version: kpCanonicalOperationCorePack.version
  }]
});

function identityAbsorption(
  identityKind: "additive" | "multiplicative",
  transformType: string
): KpSemanticMotionOperationDefinition {
  return operation({
    id: `kp.semantic-motion.absorb-${identityKind}-identity`,
    title: `Absorb a ${identityKind} identity`,
    summary: `Fold the ${identityKind} operator into its identity while the operand persists.`,
    transformType,
    canonicalComposition: ["kp.core.persist", "kp.core.eliminate"],
    authoringRoles: [
      entity("operand-before", "source"),
      artifact("operator", "source", "exactly-one"),
      entity("identity", "source"),
      entity("operand-after", "target")
    ]
  });
}

function operation(
  input: KpSemanticMotionOperationDefinition
): KpSemanticMotionOperationDefinition {
  return {
    ...input,
    canonicalComposition: [...input.canonicalComposition],
    authoringRoles: input.authoringRoles.map((role) => ({ ...role }))
  };
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
  return {
    id,
    endpoint,
    kind,
    cardinality,
    summary: `${endpoint} ${kind} role ${id}`
  };
}
