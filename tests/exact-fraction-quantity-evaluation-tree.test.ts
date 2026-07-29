import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpExactFractionQuantityFoldProjection,
  createKpExactFractionQuantityEvaluationTree,
  createKpExactFractionQuantityFoldIntent,
  KP_EXACT_FRACTION_FOLDABLE_NODE_IDS
} from "../src/semantic/exact-fraction-quantity-evaluation-tree.ts";
import {
  semanticTransformationForwardPhases,
  semanticTransformationLeafRefs,
  semanticTransformationRewindPhases
} from "../src/semantic/transformation-composition.ts";

test("evaluation tree owns the same five immutable trace beats", () => {
  const tree = createKpExactFractionQuantityEvaluationTree();
  const leafIds = semanticTransformationLeafRefs(tree.root).map(({ id }) => id);

  assert.ok(Object.isFrozen(tree));
  assert.ok(Object.isFrozen(tree.root));
  assert.deepEqual(leafIds, tree.trace.beats.map(({ id }) => id));
  assert.deepEqual(
    semanticTransformationForwardPhases(tree.root).flat(),
    leafIds
  );
  assert.deepEqual(
    semanticTransformationRewindPhases(tree.root).flat(),
    [...leafIds].reverse()
  );
});

test("expanded collapsed automatic and pinned folds preserve one truth", () => {
  const projections = [
    compileKpExactFractionQuantityFoldProjection({
      intent: createKpExactFractionQuantityFoldIntent({ mode: "expanded" })
    }),
    compileKpExactFractionQuantityFoldProjection({
      intent: createKpExactFractionQuantityFoldIntent({ mode: "collapsed" })
    }),
    compileKpExactFractionQuantityFoldProjection({
      intent: createKpExactFractionQuantityFoldIntent({ mode: "automatic" }),
      detailBudget: "balanced"
    }),
    compileKpExactFractionQuantityFoldProjection({
      intent: createKpExactFractionQuantityFoldIntent({
        mode: "pinned",
        pinnedNodeIds: [KP_EXACT_FRACTION_FOLDABLE_NODE_IDS[1]]
      })
    })
  ];

  assert.deepEqual(
    projections.map(({ semanticTruth }) => semanticTruth),
    projections.map(() => projections[0]!.semanticTruth)
  );
  assert.ok(projections.every(({ beatIds }) => beatIds.length === 5));
  assert.deepEqual(projections[1]?.disclosures.flatMap(
    ({ hiddenBeatIds }) => hiddenBeatIds
  ), projections[1]?.beatIds.slice(1));
});

test("fold intents reject repeated, unknown, leaf, and incompatible pins", () => {
  assert.throws(
    () => createKpExactFractionQuantityFoldIntent({
      mode: "pinned",
      pinnedNodeIds: [
        KP_EXACT_FRACTION_FOLDABLE_NODE_IDS[0],
        KP_EXACT_FRACTION_FOLDABLE_NODE_IDS[0]
      ]
    }),
    /repeats a pinned node/
  );
  assert.throws(
    () => createKpExactFractionQuantityFoldIntent({
      mode: "pinned",
      pinnedNodeIds: ["missing.group"]
    }),
    /unknown node/
  );
  assert.throws(
    () => createKpExactFractionQuantityFoldIntent({
      mode: "pinned",
      pinnedNodeIds: ["beat.exact-fraction.refine-third"]
    }),
    /cannot pin leaf/
  );
  assert.throws(
    () => createKpExactFractionQuantityFoldIntent({
      mode: "expanded",
      pinnedNodeIds: [KP_EXACT_FRACTION_FOLDABLE_NODE_IDS[0]]
    }),
    /cannot carry pins/
  );
});
