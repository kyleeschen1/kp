import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFoldableDistributionFoldIntent
} from "../src/semantic/foldable-distribution-fold-intent.ts";
import {
  compileKpFoldableDistributionStaticProjection
} from "../src/semantic/foldable-distribution-fold-projection.ts";

test("expanded projection exposes every operation leaf", () => {
  const projection = compileKpFoldableDistributionStaticProjection(
    createKpFoldableDistributionFoldIntent({ mode: "expanded" })
  );

  assert.equal(projection.operationIds.length, 6);
  assert.equal(projection.visibleNodeIds.length, 8);
  assert.deepEqual(projection.collapsedNodeIds, []);
  assert.deepEqual(projection.disclosures, []);
});

test("collapsed projection hides detail but discloses every operation", () => {
  const projection = compileKpFoldableDistributionStaticProjection(
    createKpFoldableDistributionFoldIntent({ mode: "collapsed" })
  );

  assert.equal(projection.visibleNodeIds.length, 4);
  assert.deepEqual(
    projection.disclosures.flatMap(({ hiddenOperationIds }) =>
      hiddenOperationIds
    ),
    projection.operationIds.slice(0, 4)
  );
  assert.deepEqual(
    projection.operationIds.slice(4),
    [
      "transform.foldable-distribution.group-like-terms",
      "transform.foldable-distribution.collect-results"
    ]
  );
});

test("expanded and collapsed projections retain identical semantic truth", () => {
  const expanded = compileKpFoldableDistributionStaticProjection(
    createKpFoldableDistributionFoldIntent({ mode: "expanded" })
  );
  const collapsed = compileKpFoldableDistributionStaticProjection(
    createKpFoldableDistributionFoldIntent({ mode: "collapsed" })
  );

  assert.deepEqual(expanded.semanticTruth, collapsed.semanticTruth);
  assert.deepEqual(collapsed.semanticTruth.sourceObjectIds, [
    "expression.foldable-distribution.factored"
  ]);
  assert.deepEqual(collapsed.semanticTruth.targetObjectIds, [
    "expression.foldable-distribution.collected"
  ]);
});
