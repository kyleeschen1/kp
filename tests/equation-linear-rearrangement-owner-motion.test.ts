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

test("counter-orbit cancellation keeps inverse terms distinct on symmetric paths", () => {
  const input = {
    kind: "cancel-additive-inverses" as const,
    relationRecordId: "left-inverses-cancel",
    lifecycle: "cancel" as const,
    sourceAnchors: [
      { id: "source.plus-three", rect: { left: 30, top: 20, width: 18, height: 20 } },
      { id: "source.minus-three", rect: { left: 54, top: 20, width: 18, height: 20 } }
    ],
    targetAnchors: [],
    cancellationPresentationRecipe: "counter-orbit-v1" as const
  };
  const start = sampleKpEquationLinearRearrangementOwnerMotion({
    ...input,
    progress: 0
  });
  assert.ok(start.every((fragment) => fragment.pose.x === 0 && fragment.pose.y === 0));

  const orbiting = sampleKpEquationLinearRearrangementOwnerMotion({
    ...input,
    progress: 0.55
  });
  assert.deepEqual(orbiting.map((fragment) => Math.sign(fragment.pose.y)), [-1, 1]);
  assert.ok(orbiting[0]!.pose.x > 0);
  assert.ok(orbiting[1]!.pose.x < 0);
  assert.ok(orbiting.every((fragment) => fragment.pose.opacity === 1));

  const settled = sampleKpEquationLinearRearrangementOwnerMotion({
    ...input,
    progress: 1
  });
  assert.ok(settled.every((fragment) => fragment.pose.y === 0));
  assert.ok(settled.every((fragment) => fragment.pose.opacity === 0));
});

test("counter-orbit cancellation compacts survivors only after inverse terms fade", () => {
  const input = {
    ...persistent,
    kind: "cancel-additive-inverses" as const,
    cancellationPresentationRecipe: "counter-orbit-v1" as const
  };
  const whileTermsOrbit = sampleKpEquationLinearRearrangementOwnerMotion({
    ...input,
    progress: 0.55
  })[0]!;
  const afterTermsFade = sampleKpEquationLinearRearrangementOwnerMotion({
    ...input,
    progress: 0.97
  })[0]!;

  assert.equal(Math.abs(whileTermsOrbit.pose.x), 0);
  assert.ok(afterTermsFade.pose.x < 0);
});
