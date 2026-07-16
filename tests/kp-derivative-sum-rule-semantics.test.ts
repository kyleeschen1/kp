import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpDerivativeSumRuleSemantics
} from "../src/semantic/derivative-sum-rule-semantics.ts";
import { validateCorrespondenceMap } from "../src/semantic/correspondence.ts";

const semantics = createKpDerivativeSumRuleSemantics({
  sourceObjectId: "expression.source",
  distributedObjectId: "expression.distributed",
  targetObjectId: "expression.target",
  distributionTransformationId: "transform.distribute",
  resolutionTransformationId: "transform.resolve",
  termCount: 2
});

test("derivative sum rule branches notation while terms and connectors persist", () => {
  assert.deepEqual(
    semantics.distribution.records.map((record) => record.relation),
    ["fan-out", "identity", "identity", "identity"]
  );
  assert.deepEqual(
    semantics.distribution.records[0]?.targetSelectorIds,
    ["expression.distributed.operator.0", "expression.distributed.operator.1"]
  );
  assert.deepEqual(
    semantics.resolution.records.map((record) => record.relation),
    ["fan-in", "fan-in", "identity"]
  );
});

test("derivative sum rule correspondence is total across both visible steps", () => {
  assert.deepEqual(validateCorrespondenceMap(semantics.distribution, {
    sourceSelectorIds: [
      "expression.source.operator",
      "expression.source.term.0",
      "expression.source.term.1",
      "expression.source.connector.0"
    ],
    targetSelectorIds: [
      "expression.distributed.operator.0",
      "expression.distributed.operator.1",
      "expression.distributed.term.0",
      "expression.distributed.term.1",
      "expression.distributed.connector.0"
    ]
  }), []);
  assert.deepEqual(validateCorrespondenceMap(semantics.resolution, {
    sourceSelectorIds: [
      "expression.distributed.operator.0",
      "expression.distributed.operator.1",
      "expression.distributed.term.0",
      "expression.distributed.term.1",
      "expression.distributed.connector.0"
    ],
    targetSelectorIds: [
      "expression.target.derived.term.0",
      "expression.target.derived.term.1",
      "expression.target.connector.0"
    ]
  }), []);
});

test("derivative sum fan-out rejects a non-sum", () => {
  assert.throws(() => createKpDerivativeSumRuleSemantics({
    sourceObjectId: "expression.source",
    distributedObjectId: "expression.distributed",
    targetObjectId: "expression.target",
    distributionTransformationId: "transform.distribute",
    resolutionTransformationId: "transform.resolve",
    termCount: 1
  }), /at least two terms/);
});
