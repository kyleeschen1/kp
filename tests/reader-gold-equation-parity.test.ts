import assert from "node:assert/strict";
import test from "node:test";

import {
  kpGoldEquationParityFrame,
  kpGoldEquationParityFrames
} from "../src/rendering/equation-gold-parity.ts";

test("gold equation parity contract names every accepted causal beat", () => {
  assert.deepEqual(kpGoldEquationParityFrames.map((frame) => frame.id), [
    "start",
    "subtraction-entry",
    "subtraction-settled",
    "cancellation-meet",
    "zero-witness-dwell",
    "cancellation-settled",
    "successor-convergence",
    "final",
    "reverse-cancellation"
  ]);
  assert.ok(kpGoldEquationParityFrames.every((frame) =>
    frame.requiredEvidence.includes("stable-katex-typography")
  ));
});

test("forward parity instants are ordered and permille-addressable", () => {
  const forward = kpGoldEquationParityFrames.filter((frame) => frame.direction === "forward");
  assert.deepEqual(
    forward.map((frame) => frame.progressPermille),
    [0, 167, 333, 500, 620, 667, 833, 1_000]
  );
  assert.ok(forward.every((frame, index) =>
    index === 0 || frame.progress > forward[index - 1]!.progress
  ));
  assert.equal(kpGoldEquationParityFrame("reverse-cancellation").progressPermille, 500);
});

test("parity contract distinguishes causal operations from endpoint handoff", () => {
  assert.ok(kpGoldEquationParityFrame("subtraction-entry").requiredEvidence
    .includes("paired-subtraction-entry"));
  assert.ok(kpGoldEquationParityFrame("cancellation-meet").requiredEvidence
    .includes("witnessed-cancellation"));
  assert.ok(kpGoldEquationParityFrame("zero-witness-dwell").requiredEvidence
    .includes("independent-zero-witness"));
  assert.ok(kpGoldEquationParityFrame("successor-convergence").requiredEvidence
    .includes("successor-convergence"));
  assert.ok(kpGoldEquationParityFrame("final").requiredEvidence
    .includes("exact-native-handoff"));
});
