import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS,
  createKpPlaceValueAdditionEvaluationTree
} from "../src/semantic/place-value-addition-evaluation-tree.ts";
import {
  compileKpPlaceValueAdditionFoldProjection,
  createKpPlaceValueAdditionFoldIntent,
  kpPlaceValueAdditionOutlineAnchors
} from "../src/semantic/place-value-addition-fold-plan.ts";
import {
  kpPlaceValueAdditionTrace
} from "../src/semantic/place-value-addition-trace.ts";
import {
  semanticTransformationLeafRefs
} from "../src/semantic/transformation-composition.ts";

test("evaluation tree groups the same seven trace beats by place", () => {
  const tree = createKpPlaceValueAdditionEvaluationTree();
  assert.equal(tree.root.kind, "sequence");
  assert.deepEqual(
    semanticTransformationLeafRefs(tree.root).map(({ id }) => id),
    kpPlaceValueAdditionTrace.beats.map(({ id }) => id)
  );
  if (tree.root.kind !== "sequence") {
    return;
  }
  assert.deepEqual(
    tree.root.children.map(({ id }) => id),
    [
      "beat.place-value.establish",
      ...KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS
    ]
  );
  assert.ok(Object.isFrozen(tree.root));
  assert.ok(Object.isFrozen(tree.annotations));
});

test("expanded and collapsed projections preserve identical semantic truth", () => {
  const expanded = compileKpPlaceValueAdditionFoldProjection({
    intent: createKpPlaceValueAdditionFoldIntent({ mode: "expanded" })
  });
  const collapsed = compileKpPlaceValueAdditionFoldProjection({
    intent: createKpPlaceValueAdditionFoldIntent({ mode: "collapsed" })
  });
  assert.deepEqual(expanded.semanticTruth, collapsed.semanticTruth);
  assert.deepEqual(expanded.operationIds, collapsed.operationIds);
  assert.deepEqual(expanded.expandedNodeIds, [
    ...KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS
  ]);
  assert.deepEqual(collapsed.collapsedNodeIds, [
    ...KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS
  ]);
  assert.deepEqual(
    collapsed.disclosures.map(({ hiddenOperationIds }) => hiddenOperationIds),
    [
      [
        "beat.place-value.evaluate-ones",
        "beat.place-value.exchange-ones"
      ],
      [
        "beat.place-value.evaluate-tens",
        "beat.place-value.exchange-tens"
      ],
      [
        "beat.place-value.evaluate-hundreds",
        "beat.place-value.settle"
      ]
    ]
  );
  assert.equal(collapsed.semanticTruth.exactResult, 434n);
});

test("automatic and pinned disclosure are deterministic", () => {
  const balanced = compileKpPlaceValueAdditionFoldProjection({
    intent: createKpPlaceValueAdditionFoldIntent({ mode: "automatic" }),
    detailBudget: "balanced"
  });
  assert.deepEqual(balanced.expandedNodeIds, [
    KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS[0]
  ]);
  const pinned = compileKpPlaceValueAdditionFoldProjection({
    intent: createKpPlaceValueAdditionFoldIntent({
      mode: "pinned",
      pinnedNodeIds: [KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS[1]]
    })
  });
  assert.deepEqual(pinned.expandedNodeIds, [
    KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS[1]
  ]);
  assert.throws(
    () => createKpPlaceValueAdditionFoldIntent({
      mode: "pinned",
      pinnedNodeIds: ["beat.place-value.evaluate-ones"]
    }),
    /cannot pin leaf/
  );
  assert.throws(
    () => createKpPlaceValueAdditionFoldIntent({
      mode: "expanded",
      pinnedNodeIds: [KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS[0]]
    }),
    /cannot carry pins/
  );
});

test("outline anchors can never expose evaluated transient states", () => {
  assert.deepEqual(
    kpPlaceValueAdditionOutlineAnchors.map((anchor) => ({
      progress: anchor.progressPermille,
      state: anchor.stateId,
      boundary: anchor.boundary,
      transient: anchor.mayExposeTransient
    })),
    [
      {
        progress: 0,
        state: "state.place-value.established",
        boundary: "animation-start",
        transient: false
      },
      {
        progress: 100,
        state: "state.place-value.established",
        boundary: "animation-start",
        transient: false
      },
      {
        progress: 400,
        state: "state.place-value.ones-exchanged",
        boundary: "settled-checkpoint",
        transient: false
      },
      {
        progress: 710,
        state: "state.place-value.tens-exchanged",
        boundary: "settled-checkpoint",
        transient: false
      },
      {
        progress: 1_000,
        state: "state.place-value.settled",
        boundary: "settled-checkpoint",
        transient: false
      }
    ]
  );
  const transientStates = new Set([
    "state.place-value.ones-evaluated",
    "state.place-value.tens-evaluated",
    "state.place-value.hundreds-evaluated"
  ]);
  assert.ok(
    kpPlaceValueAdditionOutlineAnchors.every(
      ({ stateId }) => !transientStates.has(stateId)
    )
  );
  assert.equal(
    new Set(
      kpPlaceValueAdditionOutlineAnchors.map(({ progressPermille }) =>
        progressPermille
      )
    ).size,
    kpPlaceValueAdditionOutlineAnchors.length
  );
});
