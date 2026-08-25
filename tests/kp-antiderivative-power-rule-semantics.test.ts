import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAntiderivativePowerRuleSemantics,
  createKpAntiderivativePowerRuleSemanticRoles
} from "../src/semantic/antiderivative-power-rule-semantics.ts";
import { validateCorrespondenceMap } from "../src/semantic/correspondence.ts";

const semantics = createKpAntiderivativePowerRuleSemantics({
  sourceObjectId: "expression.source",
  expandedObjectId: "expression.expanded",
  targetObjectId: "expression.target",
  expansionTransformationId: "transform.expand",
  resolutionTransformationId: "transform.resolve"
});

test("antiderivative power roles name scope, binding, successors, quotient, and constant", () => {
  const roles = createKpAntiderivativePowerRuleSemanticRoles({
    sourceObjectId: "expression.source",
    expandedObjectId: "expression.expanded",
    targetObjectId: "expression.target",
    integrationVariable: "x",
    base: "x",
    exponent: 2
  });

  assert.deepEqual(roles.sourceRoles.map((role) => role.id), [
    "source.integral-operator",
    "source.integrand-base",
    "source.integrand-exponent",
    "source.differential-symbol",
    "source.integration-variable"
  ]);
  assert.deepEqual(roles.groups.map((group) => group.id), [
    "source.integrand-scope",
    "source.integration-binding",
    "expanded.power-successor",
    "expanded.divisor-successor",
    "expanded.exact-quotient",
    "target.exact-quotient"
  ]);
  assert.deepEqual(
    roles.expandedRoles
      .filter((role) => role.operation === "transmit")
      .map((role) => role.derivedFromRoleIds),
    [["source.integrand-exponent"], ["source.integrand-exponent"]]
  );
  assert.deepEqual(roles.constraints.map((constraint) => constraint.id), [
    "integration-variable-matches-integrand-base",
    "source-exponent-drives-both-successors",
    "successor-increments-are-one",
    "expanded-constant-is-required",
    "target-quotient-is-exact"
  ]);
});

test("antiderivative power roles reject an unbound integration variable", () => {
  assert.throws(() => createKpAntiderivativePowerRuleSemanticRoles({
    sourceObjectId: "expression.source",
    expandedObjectId: "expression.expanded",
    targetObjectId: "expression.target",
    integrationVariable: "x",
    base: "y",
    exponent: 2
  }), /must match the integrand base/);
});

test("antiderivative power rule exposes exponent branching and caused introductions", () => {
  assert.deepEqual(
    semantics.expansion.records.map((record) => record.relation),
    ["removal", "removal", "role-change", "identity", "fan-out", "introduction", "introduction"]
  );
  assert.deepEqual(
    semantics.resolution.records.map((record) => record.relation),
    ["fan-in", "identity", "fan-in", "introduction", "introduction"]
  );
  assert.deepEqual(
    semantics.expansion.records.find((record) => record.relation === "fan-out")
      ?.targetSelectorIds,
    ["expression.expanded.denominator-exponent", "expression.expanded.power-exponent"]
  );
});

test("antiderivative power rule has total lifecycle coverage in both steps", () => {
  assert.deepEqual(validateCorrespondenceMap(semantics.expansion, {
    sourceSelectorIds: [
      "expression.source.operator",
      "expression.source.coefficient",
      "expression.source.base",
      "expression.source.exponent",
      "expression.source.differential"
    ],
    targetSelectorIds: [
      "expression.expanded.numerator-coefficient",
      "expression.expanded.denominator-exponent",
      "expression.expanded.denominator-increment",
      "expression.expanded.base",
      "expression.expanded.power-exponent",
      "expression.expanded.power-increment"
    ]
  }), []);
  assert.deepEqual(validateCorrespondenceMap(semantics.resolution, {
    sourceSelectorIds: [
      "expression.expanded.numerator-coefficient",
      "expression.expanded.denominator-exponent",
      "expression.expanded.denominator-increment",
      "expression.expanded.base",
      "expression.expanded.power-exponent",
      "expression.expanded.power-increment"
    ],
    targetSelectorIds: [
      "expression.target.coefficient",
      "expression.target.base",
      "expression.target.exponent",
      "expression.target.connector",
      "expression.target.constant"
    ]
  }), []);
});
