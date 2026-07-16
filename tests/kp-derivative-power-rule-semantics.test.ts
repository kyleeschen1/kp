import assert from "node:assert/strict";
import test from "node:test";

import {
  checkCorrespondenceMapRewindLaw,
  validateCorrespondenceMap
} from "../src/semantic/correspondence.ts";
import {
  createKpDerivativePowerRuleCorrespondenceMap,
  createKpDerivativePowerRuleSemanticRoles
} from "../src/semantic/derivative-power-rule-semantics.ts";

test("derivative power semantics expose every source and target role", () => {
  const roles = createKpDerivativePowerRuleSemanticRoles({
    sourceObjectId: "expression.source",
    targetObjectId: "expression.target",
    differentiationVariable: "x",
    base: "x",
    exponent: 3
  });

  assert.deepEqual(roles.sourceRoles.map((role) => role.id), [
    "source.derivative-operator",
    "source.differentiation-variable",
    "source.base",
    "source.exponent"
  ]);
  assert.deepEqual(roles.targetRoles.map((role) => role.id), [
    "target.coefficient",
    "target.base",
    "target.exponent"
  ]);
  assert.deepEqual(roles.targetRoles.map((role) => role.value), [3, "x", 2]);
});

test("source exponent explicitly drives coefficient transmission and decrement", () => {
  const roles = createKpDerivativePowerRuleSemanticRoles({
    sourceObjectId: "expression.source",
    targetObjectId: "expression.target",
    differentiationVariable: "y",
    base: "y",
    exponent: 7
  });
  const coefficient = roles.targetRoles.find(
    (role) => role.id === "target.coefficient"
  )!;
  const exponent = roles.targetRoles.find(
    (role) => role.id === "target.exponent"
  )!;

  assert.equal(coefficient.operation, "transmit");
  assert.equal(exponent.operation, "decrement");
  assert.deepEqual(coefficient.derivedFromRoleIds, ["source.exponent"]);
  assert.deepEqual(exponent.derivedFromRoleIds, ["source.exponent"]);
  assert.equal(exponent.value, 6);
  assert.deepEqual(roles.constraints.map((constraint) => constraint.id), [
    "differentiation-variable-matches-base",
    "coefficient-equals-source-exponent",
    "target-exponent-is-predecessor"
  ]);
});

test("derivative power semantics reject unsupported exponents", () => {
  assert.throws(() => createKpDerivativePowerRuleSemanticRoles({
    sourceObjectId: "expression.source",
    targetObjectId: "expression.target",
    differentiationVariable: "x",
    base: "x",
    exponent: 1
  }), /greater than one/);
});

test("derivative power correspondence gives every role one total lifecycle", () => {
  const roles = createKpDerivativePowerRuleSemanticRoles({
    sourceObjectId: "expression.source",
    targetObjectId: "expression.target",
    differentiationVariable: "x",
    base: "x",
    exponent: 3
  });
  const correspondence = createKpDerivativePowerRuleCorrespondenceMap(
    roles,
    "transform.derivative"
  );

  assert.deepEqual(correspondence.records.map((record) => record.relation), [
    "removal",
    "removal",
    "identity",
    "fan-out"
  ]);
  assert.deepEqual(
    correspondence.records.at(-1)?.targetSelectorIds,
    ["expression.target.coefficient", "expression.target.exponent"]
  );
  assert.deepEqual(validateCorrespondenceMap(correspondence, {
    sourceSelectorIds: roles.sourceRoles.map((role) => role.selectorId),
    targetSelectorIds: roles.targetRoles.map((role) => role.selectorId)
  }), []);
  assert.deepEqual(checkCorrespondenceMapRewindLaw(correspondence), []);
});
