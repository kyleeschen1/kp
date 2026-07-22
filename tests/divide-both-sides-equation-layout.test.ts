import assert from "node:assert/strict";
import test from "node:test";

import { planKpEquationSequenceEnvelope } from "../src/reader/renderers/equation-sequence-envelope.ts";

const divideStates = [
  { stateId: "initial", widthPx: 96, heightPx: 30 },
  { stateId: "divided", widthPx: 168, heightPx: 58 },
  { stateId: "coefficient-cancelled", widthPx: 108, heightPx: 58 },
  { stateId: "solved", widthPx: 69, heightPx: 30 }
] as const;

test("divide sequence reserves its two-sided fraction state for every frame", () => {
  const plan = planKpEquationSequenceEnvelope({
    measurements: divideStates,
    viewportWidthPx: 360,
    horizontalPaddingPx: 24,
    verticalPaddingPx: 12
  });

  assert.equal(plan.status, "native");
  assert.equal(plan.widestStateId, "divided");
  assert.equal(plan.tallestStateId, "divided");
  assert.equal(plan.contentWidthPx, 168);
  assert.equal(plan.contentHeightPx, 58);
  assert.equal(plan.reservedWidthPx, 216);
  assert.equal(plan.reservedHeightPx, 82);
  assert.equal(plan.geometryPolicy, "measure-once-per-sequence");
  assert.equal(plan.wrapAllowed, false);
  assert.deepEqual(
    plan.placements.map(({ stateId, offsetXPx, offsetYPx }) => ({
      stateId,
      offsetXPx,
      offsetYPx
    })),
    [
      { stateId: "initial", offsetXPx: 36, offsetYPx: 14 },
      { stateId: "divided", offsetXPx: 0, offsetYPx: 0 },
      { stateId: "coefficient-cancelled", offsetXPx: 30, offsetYPx: 0 },
      { stateId: "solved", offsetXPx: 49.5, offsetYPx: 14 }
    ]
  );
});

test("divide sequence selects one scale without wrapping or per-state font changes", () => {
  const plan = planKpEquationSequenceEnvelope({
    measurements: divideStates,
    viewportWidthPx: 180,
    horizontalPaddingPx: 24,
    minScale: 0.72
  });

  assert.equal(plan.status, "scaled");
  assert.equal(plan.scale, 132 / 168);
  assert.equal(plan.fontSizePx, plan.baseFontSizePx * plan.scale);
  assert.ok(plan.placements.every((placement) => placement.widthPx <= plan.contentWidthPx));
  assert.ok(plan.placements.every((placement) => placement.heightPx <= plan.contentHeightPx));
});

test("equation sequence envelope rejects invalid and impossible geometry explicitly", () => {
  assert.throws(() => planKpEquationSequenceEnvelope({
    measurements: [],
    viewportWidthPx: 360
  }), /requires measured states/);

  const overflow = planKpEquationSequenceEnvelope({
    measurements: divideStates,
    viewportWidthPx: 150,
    horizontalPaddingPx: 24,
    minScale: 0.72
  });
  assert.equal(overflow.status, "overflow");
  assert.equal(overflow.scale, 0.72);
});
