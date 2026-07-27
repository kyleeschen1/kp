import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFoldableDistributionFoldIntent
} from "../src/semantic/foldable-distribution-fold-intent.ts";

test("fold intent exposes four bounded presentation modes", () => {
  const intents = [
    createKpFoldableDistributionFoldIntent({ mode: "expanded" }),
    createKpFoldableDistributionFoldIntent({ mode: "collapsed" }),
    createKpFoldableDistributionFoldIntent({ mode: "automatic" }),
    createKpFoldableDistributionFoldIntent({
      mode: "pinned",
      pinnedNodeIds: ["evaluation.foldable-distribution.distribute"]
    })
  ];

  assert.deepEqual(intents.map(({ mode }) => mode), [
    "expanded",
    "collapsed",
    "automatic",
    "pinned"
  ]);
  assert.ok(intents.every(
    ({ treeId }) => treeId === "evaluation.foldable-distribution.root"
  ));
  assert.deepEqual(intents[0]?.foldableNodeIds, [
    "evaluation.foldable-distribution.distribute",
    "evaluation.foldable-distribution.evaluate-products"
  ]);
});

test("fold intent cannot mutate semantic or renderer authority", () => {
  const intent = createKpFoldableDistributionFoldIntent({ mode: "automatic" });

  assert.ok(Object.isFrozen(intent));
  assert.deepEqual(Object.keys(intent).sort(), [
    "foldableNodeIds",
    "mode",
    "pinnedNodeIds",
    "schemaVersion",
    "treeId"
  ]);
  assert.equal(JSON.stringify(intent).includes("duration"), false);
  assert.equal(JSON.stringify(intent).includes("geometry"), false);
  assert.equal(JSON.stringify(intent).includes("opacity"), false);
});

test("fold intent rejects unknown, duplicate, and mode-incompatible pins", () => {
  assert.throws(
    () => createKpFoldableDistributionFoldIntent({
      mode: "pinned",
      pinnedNodeIds: []
    }),
    /requires at least one pinned node/
  );
  assert.throws(
    () => createKpFoldableDistributionFoldIntent({
      mode: "pinned",
      pinnedNodeIds: ["missing"]
    }),
    /unknown node missing/
  );
  assert.throws(
    () => createKpFoldableDistributionFoldIntent({
      mode: "expanded",
      pinnedNodeIds: ["evaluation.foldable-distribution.distribute"]
    }),
    /expanded fold intent cannot carry pinned nodes/
  );
});
