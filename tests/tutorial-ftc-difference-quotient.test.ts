import assert from "node:assert/strict";
import test from "node:test";
import { createKpFtcConvergenceSequence } from "../src/tutorial/ftc-convergence.ts";
import { createKpFtcDifferenceQuotientFrames } from "../src/tutorial/ftc-difference-quotient.ts";

test("FTC names persistent strip material before forming its quotient", () => {
  const convergence = createKpFtcConvergenceSequence({
    lensId: "quadratic",
    x: 2
  })[0]!;
  const frames = createKpFtcDifferenceQuotientFrames(convergence);

  assert.deepEqual(
    frames.map(({ stage }) => stage),
    ["name-area-change", "form-ratio", "expand-area-change"]
  );
  assert.equal(
    frames[0]?.semanticRoles["ftc.symbol.delta-area"],
    "same finite area as the graph strip"
  );
  assert.ok(
    frames.every(({ crossViewCorrespondenceIds }) =>
      crossViewCorrespondenceIds.includes(
        "correspondence.ftc.strip-to-delta-area"
      )
    )
  );
});

test("finite quotient frames contain neither derivative nor limit notation", () => {
  const convergence = createKpFtcConvergenceSequence({
    lensId: "quadratic",
    x: 2
  })[0]!;
  const frames = createKpFtcDifferenceQuotientFrames(convergence);

  assert.ok(frames.every((frame) => frame.containsDerivativeNotation === false));
  assert.ok(frames.every(({ latex }) => !latex.includes("\\lim")));
  assert.ok(frames.every(({ latex }) => !latex.includes("A'")));
});
