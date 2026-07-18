import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpFtcConvergenceSequence,
  kpFtcGuidedDeltaXLevels
} from "../src/tutorial/ftc-convergence.ts";

test("guided delta x narrows finite bounds without prematurely claiming exactness", () => {
  const sequence = createKpFtcConvergenceSequence({
    lensId: "quadratic",
    x: 2
  });

  assert.deepEqual(
    sequence.map(({ strip }) => strip.deltaX),
    [...kpFtcGuidedDeltaXLevels]
  );
  assert.ok(sequence.at(-1)!.quotientError < sequence[0]!.quotientError);
  assert.ok(sequence.at(-1)!.boundWidth < sequence[0]!.boundWidth);
  assert.ok(sequence.every((frame) => frame.epistemicStatus === "finite-approximation"));
  assert.ok(sequence.every((frame) => frame.exactDerivativeClaimed === false));
});

test("guided delta x levels must approach rather than oscillate", () => {
  assert.throws(
    () =>
      createKpFtcConvergenceSequence({
        lensId: "quadratic",
        x: 2,
        deltaXLevels: [0.5, 0.75]
      }),
    /strictly decreasing/
  );
});
