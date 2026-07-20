import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpEquationLinearRearrangementOwnerMotion
} from "../src/rendering/equation-linear-rearrangement-owner-motion.ts";

const persistent = {
  kind: "balanced-introduction" as const,
  relationRecordId: "x-persists",
  lifecycle: "persist" as const,
  sourceAnchors: [{
    id: "source.x",
    rect: { left: 20, top: 20, width: 12, height: 20 }
  }],
  targetAnchors: [{
    id: "target.x",
    rect: { left: 8, top: 20, width: 12, height: 20 }
  }]
};

test("balanced introduction reserves space before inverse terms enter", () => {
  const beforeReservation = sampleKpEquationLinearRearrangementOwnerMotion({
    kind: "balanced-introduction",
    relationRecordId: "inverse-terms-enter",
    lifecycle: "enter",
    sourceAnchors: [],
    targetAnchors: [
      { id: "target.left-minus-three", rect: { left: 44, top: 20, width: 18, height: 20 } },
      { id: "target.right-minus", rect: { left: 98, top: 20, width: 8, height: 20 } },
      { id: "target.right-three", rect: { left: 108, top: 20, width: 10, height: 20 } }
    ],
    progress: 0.3
  });
  assert.ok(beforeReservation.every((fragment) => fragment.pose.opacity === 0));

  const entering = sampleKpEquationLinearRearrangementOwnerMotion({
    kind: "balanced-introduction",
    relationRecordId: "inverse-terms-enter",
    lifecycle: "enter",
    sourceAnchors: [],
    targetAnchors: [
      { id: "target.left-minus-three", rect: { left: 44, top: 20, width: 18, height: 20 } },
      { id: "target.right-minus", rect: { left: 98, top: 20, width: 8, height: 20 } },
      { id: "target.right-three", rect: { left: 108, top: 20, width: 10, height: 20 } }
    ],
    progress: 0.52
  });
  assert.ok(entering.every((fragment) => fragment.pose.opacity > 0));
  assert.equal(new Set(entering.map((fragment) => fragment.pose.opacity)).size, 1);
  assert.ok(new Set(entering.map((fragment) => Math.sign(fragment.pose.x))).size > 1);
});

test("persistent material moves during the reservation phase", () => {
  const before = sampleKpEquationLinearRearrangementOwnerMotion({
    ...persistent,
    progress: 0.3
  })[0]!;
  const reserved = sampleKpEquationLinearRearrangementOwnerMotion({
    ...persistent,
    progress: 0.52
  })[0]!;
  assert.notEqual(before.pose.x, 0);
  assert.equal(reserved.pose.x, -12);
  assert.equal(reserved.pose.opacity, 1);
});
