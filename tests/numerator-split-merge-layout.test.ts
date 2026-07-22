import assert from "node:assert/strict";
import test from "node:test";

import { planKpNumeratorSplitMergeLayout } from "../src/reader/renderers/numerator-split-merge-layout.ts";
import { numeratorSplitMergeEquationAssetIds as ids } from "../src/semantic/numerator-split-merge-equation-asset.ts";

const measurements = [
  { stateId: ids.combined, widthPx: 92, heightPx: 58 },
  { stateId: ids.split, widthPx: 164, heightPx: 58 }
] as const;

test("split-merge layout reserves the widest native KaTeX hierarchy", () => {
  const plan = planKpNumeratorSplitMergeLayout({
    measurements,
    combinedStateId: ids.combined,
    splitStateId: ids.split,
    viewportWidthPx: 360,
    horizontalPaddingPx: 24,
    verticalPaddingPx: 12
  });

  assert.equal(plan.envelope.status, "native");
  assert.equal(plan.widestStateId, ids.split);
  assert.equal(plan.envelope.contentWidthPx, 164);
  assert.equal(plan.envelope.reservedWidthPx, 212);
  assert.equal(plan.envelope.reservedHeightPx, 82);
  assert.equal(plan.hierarchyPolicy, "preserve-native-katex-tree");
  assert.equal(plan.horizontalOriginPolicy, "center-in-sequence-envelope");
  assert.equal(plan.wrapAllowed, false);
  assert.deepEqual(plan.envelope.placements.map(({ stateId, offsetXPx }) => [stateId, offsetXPx]), [
    [ids.combined, 36],
    [ids.split, 0]
  ]);
});

test("split-merge layout selects one phone scale without changing endpoint hierarchy", () => {
  const plan = planKpNumeratorSplitMergeLayout({
    measurements,
    combinedStateId: ids.combined,
    splitStateId: ids.split,
    viewportWidthPx: 170,
    horizontalPaddingPx: 20,
    minScale: 0.72
  });

  assert.equal(plan.envelope.status, "scaled");
  assert.equal(plan.envelope.scale, 130 / 164);
  assert.equal(plan.envelope.geometryPolicy, "measure-once-per-sequence");
  assert.ok(plan.envelope.placements.every((placement) =>
    placement.widthPx <= plan.envelope.contentWidthPx
  ));
});

test("split-merge layout rejects missing endpoints or a non-widest split state", () => {
  assert.throws(() => planKpNumeratorSplitMergeLayout({
    measurements: [measurements[0]],
    combinedStateId: ids.combined,
    splitStateId: ids.split,
    viewportWidthPx: 360
  }), /exactly one combined and one split endpoint/);

  assert.throws(() => planKpNumeratorSplitMergeLayout({
    measurements: [
      { ...measurements[0], widthPx: 180 },
      measurements[1]
    ],
    combinedStateId: ids.combined,
    splitStateId: ids.split,
    viewportWidthPx: 360
  }), /split endpoint to own the width budget/);
});
