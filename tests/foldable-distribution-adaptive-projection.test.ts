import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFoldableDistributionFoldIntent
} from "../src/semantic/foldable-distribution-fold-intent.ts";
import {
  compileKpFoldableDistributionAdaptiveProjection
} from "../src/semantic/foldable-distribution-fold-projection.ts";

test("automatic projection deterministically maps detail budgets", () => {
  const intent = createKpFoldableDistributionFoldIntent({
    mode: "automatic"
  });
  const compact = compileKpFoldableDistributionAdaptiveProjection({
    intent,
    detailBudget: "compact"
  });
  const balanced = compileKpFoldableDistributionAdaptiveProjection({
    intent,
    detailBudget: "balanced"
  });
  const roomy = compileKpFoldableDistributionAdaptiveProjection({
    intent,
    detailBudget: "roomy"
  });

  assert.deepEqual(compact.expandedNodeIds, []);
  assert.deepEqual(balanced.expandedNodeIds, [
    "evaluation.foldable-distribution.distribute"
  ]);
  assert.deepEqual(roomy.expandedNodeIds, intent.foldableNodeIds);
  assert.deepEqual(compact.semanticTruth, roomy.semanticTruth);
});

test("pinned projection expands exact pins regardless of detail budget", () => {
  const intent = createKpFoldableDistributionFoldIntent({
    mode: "pinned",
    pinnedNodeIds: [
      "evaluation.foldable-distribution.evaluate-products"
    ]
  });
  const projections = (["compact", "balanced", "roomy"] as const).map(
    (detailBudget) => compileKpFoldableDistributionAdaptiveProjection({
      intent,
      detailBudget
    })
  );

  assert.ok(projections.every(({ expandedNodeIds }) =>
    expandedNodeIds.length === 1 &&
    expandedNodeIds[0] ===
      "evaluation.foldable-distribution.evaluate-products"
  ));
  assert.ok(projections.every(({ collapsedNodeIds }) =>
    collapsedNodeIds[0] ===
      "evaluation.foldable-distribution.distribute"
  ));
});

test("adaptive projections preserve complete disclosure and operation truth", () => {
  const projection = compileKpFoldableDistributionAdaptiveProjection({
    intent: createKpFoldableDistributionFoldIntent({ mode: "automatic" }),
    detailBudget: "balanced"
  });

  assert.equal(projection.operationIds.length, 6);
  assert.deepEqual(
    projection.disclosures.flatMap(({ hiddenOperationIds }) =>
      hiddenOperationIds
    ),
    [
      "transform.foldable-distribution.product.three-times-two",
      "transform.foldable-distribution.product.two-times-negative-one"
    ]
  );
});
