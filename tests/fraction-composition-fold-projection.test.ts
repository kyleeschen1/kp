import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionCompositionEvaluationTree,
  KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS
} from "../src/semantic/fraction-composition-evaluation-tree.ts";
import {
  createKpFractionCompositionFoldIntent
} from "../src/semantic/fraction-composition-fold-intent.ts";
import {
  compileKpFractionCompositionAdaptiveProjection,
  compileKpFractionCompositionStaticProjection
} from "../src/semantic/fraction-composition-fold-projection.ts";
import {
  semanticTransformationForwardPhases,
  semanticTransformationLeafRefs,
  semanticTransformationRewindPhases
} from "../src/semantic/transformation-composition.ts";

test("fraction composition tree preserves all certified operations and states", () => {
  const tree = createKpFractionCompositionEvaluationTree();

  assert.ok(Object.isFrozen(tree));
  assert.ok(Object.isFrozen(tree.root));
  assert.equal(semanticTransformationLeafRefs(tree.root).length, 13);
  assert.equal(tree.traceProof.stateCount, 14);
  assert.deepEqual(
    semanticTransformationForwardPhases(tree.root).flat(),
    tree.traceProof.stepIds
  );
  assert.deepEqual(
    semanticTransformationRewindPhases(tree.root).flat(),
    [...tree.traceProof.stepIds].reverse()
  );
  assert.deepEqual(
    tree.annotations.map(({ targetNodeId }) => targetNodeId),
    [
      KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS[0],
      KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS[2]
    ]
  );
});

test("expanded and collapsed views retain one semantic truth", () => {
  const expanded = compileKpFractionCompositionStaticProjection(
    createKpFractionCompositionFoldIntent({ mode: "expanded" })
  );
  const collapsed = compileKpFractionCompositionStaticProjection(
    createKpFractionCompositionFoldIntent({ mode: "collapsed" })
  );

  assert.deepEqual(expanded.semanticTruth, collapsed.semanticTruth);
  assert.equal(expanded.operationIds.length, 13);
  assert.equal(expanded.semanticTruth.stateIds.length, 14);
  assert.equal(expanded.visibleNodeIds.length, 18);
  assert.equal(collapsed.visibleNodeIds.length, 5);
  assert.deepEqual(
    collapsed.disclosures.flatMap(({ hiddenOperationIds }) => hiddenOperationIds),
    collapsed.operationIds
  );
  assert.deepEqual(collapsed.semanticTruth.solution, {
    numerator: "9",
    denominator: "1"
  });
});

test("automatic and pinned projections alter detail but not algebra", () => {
  const intent = createKpFractionCompositionFoldIntent({ mode: "automatic" });
  const compact = compileKpFractionCompositionAdaptiveProjection({
    intent,
    detailBudget: "compact"
  });
  const balanced = compileKpFractionCompositionAdaptiveProjection({
    intent,
    detailBudget: "balanced"
  });
  const roomy = compileKpFractionCompositionAdaptiveProjection({
    intent,
    detailBudget: "roomy"
  });
  const pinned = compileKpFractionCompositionAdaptiveProjection({
    intent: createKpFractionCompositionFoldIntent({
      mode: "pinned",
      pinnedNodeIds: [KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS[2]]
    }),
    detailBudget: "compact"
  });

  assert.deepEqual(compact.expandedNodeIds, []);
  assert.deepEqual(
    balanced.expandedNodeIds,
    KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS.slice(0, 2)
  );
  assert.deepEqual(roomy.expandedNodeIds, KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS);
  assert.deepEqual(pinned.expandedNodeIds, [
    KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS[2]
  ]);
  assert.deepEqual(
    [compact, balanced, roomy, pinned].map(({ semanticTruth }) => semanticTruth),
    [compact.semanticTruth, compact.semanticTruth, compact.semanticTruth, compact.semanticTruth]
  );
});

test("fraction composition fold intent rejects leaf pins and incompatible pins", () => {
  assert.throws(
    () => createKpFractionCompositionFoldIntent({
      mode: "pinned",
      pinnedNodeIds: ["fraction-solve.step.distribute"]
    }),
    /cannot pin leaf/
  );
  assert.throws(
    () => createKpFractionCompositionFoldIntent({
      mode: "expanded",
      pinnedNodeIds: [KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS[0]]
    }),
    /cannot carry pins/
  );
});
