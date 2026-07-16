import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAntiderivativePowerRuleSemantics
} from "../src/semantic/antiderivative-power-rule-semantics.ts";
import { validateCorrespondenceMap } from "../src/semantic/correspondence.ts";

const semantics = createKpAntiderivativePowerRuleSemantics({
  sourceObjectId: "expression.source",
  expandedObjectId: "expression.expanded",
  targetObjectId: "expression.target",
  expansionTransformationId: "transform.expand",
  resolutionTransformationId: "transform.resolve"
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
