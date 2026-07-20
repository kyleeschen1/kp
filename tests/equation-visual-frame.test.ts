import assert from "node:assert/strict";
import test from "node:test";

import { assertKpEquationVisualFrame } from "../src/rendering/equation-visual-frame.ts";

const valid = {
  id: "frame.solve-x.500",
  progress: 0.5,
  easedProgress: 0.5,
  direction: "forward" as const,
  owners: [{
    ownerId: "material.x",
    currentBounds: { left: 1, top: 2, width: 10, height: 12 },
    materialOpacity: 1,
    sourceNativeOpacity: 0,
    targetNativeOpacity: 0,
    focusStrength: 0.5
  }]
};

test("neutral equation visual frame accepts deterministic owner poses", () => {
  assert.doesNotThrow(() => assertKpEquationVisualFrame(valid));
});

test("neutral equation visual frame rejects duplicate and invalid owners", () => {
  assert.throws(() => assertKpEquationVisualFrame({
    ...valid,
    owners: [...valid.owners, valid.owners[0]!]
  }), /repeats owner/);
  assert.throws(() => assertKpEquationVisualFrame({
    ...valid,
    owners: [{ ...valid.owners[0]!, materialOpacity: 1.1 }]
  }), /invalid pose/);
});
