import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFoldableDistributionEvaluationTree
} from "../src/semantic/foldable-distribution-evaluation-tree.ts";
import {
  semanticTransformationForwardPhases,
  semanticTransformationLeafRefs,
  semanticTransformationRewindPhases
} from "../src/semantic/transformation-composition.ts";

test("foldable distribution evaluation tree preserves causal phase structure", () => {
  const tree = createKpFoldableDistributionEvaluationTree();

  assert.deepEqual(semanticTransformationForwardPhases(tree.root), [
    [
      "transform.foldable-distribution.left.fan-out",
      "transform.foldable-distribution.right.fan-out"
    ],
    [
      "transform.foldable-distribution.product.three-times-two",
      "transform.foldable-distribution.product.two-times-negative-one"
    ],
    ["transform.foldable-distribution.group-like-terms"],
    ["transform.foldable-distribution.factor-common-x"],
    ["transform.foldable-distribution.collect-results"]
  ]);
  assert.deepEqual(tree.root.sourceObjectIds, [
    "expression.foldable-distribution.factored"
  ]);
  assert.deepEqual(tree.root.targetObjectIds, [
    "expression.foldable-distribution.collected"
  ]);
});

test("evaluation rewind mirrors sequence while preserving parallel cohorts", () => {
  const tree = createKpFoldableDistributionEvaluationTree();

  assert.deepEqual(semanticTransformationRewindPhases(tree.root), [
    ["transform.foldable-distribution.collect-results"],
    ["transform.foldable-distribution.factor-common-x"],
    ["transform.foldable-distribution.group-like-terms"],
    [
      "transform.foldable-distribution.product.three-times-two",
      "transform.foldable-distribution.product.two-times-negative-one"
    ],
    [
      "transform.foldable-distribution.left.fan-out",
      "transform.foldable-distribution.right.fan-out"
    ]
  ]);
  assert.equal(semanticTransformationLeafRefs(tree.root).length, 7);
});

test("one deeply immutable tree owns operations and inspection points", () => {
  const tree = createKpFoldableDistributionEvaluationTree();

  assert.ok(Object.isFrozen(tree));
  assert.ok(Object.isFrozen(tree.root));
  assert.ok(
    tree.root.kind === "sequence" &&
      tree.root.children.every((child) => Object.isFrozen(child))
  );
  assert.deepEqual(
    tree.annotations.map(({ targetNodeId, placement }) => [
      targetNodeId,
      placement
    ]),
    [
      ["evaluation.foldable-distribution.distribute", "after"],
      ["transform.foldable-distribution.group-like-terms", "after"]
    ]
  );
});
