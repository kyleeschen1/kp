import assert from "node:assert/strict";
import test from "node:test";

import {
  decodeKpFoldableDistributionUrl,
  encodeKpFoldableDistributionUrl
} from "../src/reader/runtime/foldable-distribution-url-codec.ts";

const route = {
  route: "/reader/foldable-distribution/",
  documentId: "lesson.algebra.foldable-distribution",
  documentVersion: "1"
} as const;

test("foldable distribution URL round trips canonical fold state", () => {
  const encoded = encodeKpFoldableDistributionUrl(
    "https://kinetic.press/reader/foldable-distribution/?utm_source=teacher",
    route,
    {
      checkpoint: "products-evaluated",
      progressPermille: 438,
      direction: "inverse",
      foldMode: "pinned",
      activeNodeId: "evaluation.foldable-distribution.evaluate-products",
      collapsedNodeIds: [
        "evaluation.foldable-distribution.evaluate-products",
        "evaluation.foldable-distribution.distribute"
      ],
      pinnedNodeIds: [
        "evaluation.foldable-distribution.evaluate-products"
      ]
    }
  );

  assert.equal(new URL(encoded).searchParams.get("utm_source"), "teacher");
  assert.deepEqual(decodeKpFoldableDistributionUrl(encoded, route), {
    checkpoint: "products-evaluated",
    progressPermille: 438,
    direction: "inverse",
    foldMode: "pinned",
    activeNodeId: "evaluation.foldable-distribution.evaluate-products",
    collapsedNodeIds: [
      "evaluation.foldable-distribution.distribute",
      "evaluation.foldable-distribution.evaluate-products"
    ],
    pinnedNodeIds: [
      "evaluation.foldable-distribution.evaluate-products"
    ]
  });
});

test("foldable distribution URL encoding is stable across input order", () => {
  const state = {
    checkpoint: "grouped",
    direction: "forward",
    foldMode: "collapsed",
    collapsedNodeIds: [
      "evaluation.foldable-distribution.evaluate-products",
      "evaluation.foldable-distribution.distribute"
    ],
    pinnedNodeIds: []
  } as const;
  const forward = encodeKpFoldableDistributionUrl(
    "https://kinetic.press/reader/foldable-distribution/",
    route,
    state
  );
  const reversed = encodeKpFoldableDistributionUrl(
    "https://kinetic.press/reader/foldable-distribution/",
    route,
    { ...state, collapsedNodeIds: [...state.collapsedNodeIds].reverse() }
  );

  assert.equal(forward, reversed);
});

test("foldable distribution URL supplies bounded defaults", () => {
  assert.deepEqual(
    decodeKpFoldableDistributionUrl(
      "https://kinetic.press/reader/foldable-distribution/"
    ),
    {
      checkpoint: "factored",
      direction: "forward",
      foldMode: "automatic",
      collapsedNodeIds: [],
      pinnedNodeIds: []
    }
  );
});

test("foldable distribution URL rejects fabricated nodes and incoherent pins", () => {
  assert.throws(
    () => decodeKpFoldableDistributionUrl(
      "https://kinetic.press/reader/foldable-distribution/?kpFold=unknown"
    ),
    /Unknown foldable distribution kpFold node unknown/
  );
  assert.throws(
    () => decodeKpFoldableDistributionUrl(
      "https://kinetic.press/reader/foldable-distribution/?kpFoldMode=expanded&kpPin=evaluation.foldable-distribution.distribute"
    ),
    /expanded fold intent cannot carry pinned nodes/
  );
  assert.throws(
    () => decodeKpFoldableDistributionUrl(
      "https://kinetic.press/reader/foldable-distribution/?kpProgress=continuous"
    ),
    /must be an integer/
  );
});
