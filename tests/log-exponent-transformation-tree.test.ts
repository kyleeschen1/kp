import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpCompiledLogExponentTransformationTree,
  kpCanonicalLogExponentTransformationTree
} from "../src/semantic/log-exponent-transformation-tree.ts";

test("canonical transformation tree composes every typed edge in order", () => {
  const tree = kpCanonicalLogExponentTransformationTree;
  assert.equal(isKpCompiledLogExponentTransformationTree(tree), true);
  assert.deepEqual(tree.stateIds, [
    "log-exponent.state.source",
    "log-exponent.state.logged-both-sides",
    "log-exponent.state.exponent-extracted",
    "log-exponent.state.solved"
  ]);
  assert.deepEqual(
    tree.operations.map(({ transformation }) => transformation.id),
    [
      "transformation.log-exponent.apply-log-both-sides",
      "transformation.log-exponent.extract-exponent",
      "transformation.log-exponent.divide-by-log-base"
    ]
  );
  tree.operations.forEach((edge, index) => {
    assert.equal(edge.operation.sourceStateId, tree.stateIds[index]);
    assert.equal(edge.operation.targetStateId, tree.stateIds[index + 1]);
  });
});

test("final division moves values into quotient roles without duplicating material", () => {
  const division = kpCanonicalLogExponentTransformationTree.operations[2]!;
  const records = division.transformation.correspondenceMap?.records ?? [];
  assert.deepEqual(records.map(({ relation }) => relation), [
    "identity",
    "role-change",
    "role-change",
    "role-change",
    "role-change",
    "role-change",
    "role-change",
    "role-change",
    "removal",
    "introduction"
  ]);
  assert.deepEqual(
    records.find(({ id }) => id.endsWith("log-base-value"))?.targetSelectorIds,
    ["solved.denominator.log"]
  );
  assert.deepEqual(
    records.find(({ id }) => id.endsWith("unknown-x"))?.targetSelectorIds,
    ["solved.left"]
  );
});

test("copied tree shapes do not retain compiler authority", () => {
  assert.equal(
    isKpCompiledLogExponentTransformationTree({
      ...kpCanonicalLogExponentTransformationTree
    }),
    false
  );
});
