import assert from "node:assert/strict";
import test from "node:test";

import { projectKpReaderEquationIdentityWitness } from
  "../src/reader/renderers/public-api.ts";

test("held identities appear atomically once certified and remain until settlement", () => {
  const samples = [0.4, 0.64, 0.8, 0.99, 1].map((progress) =>
    projectKpReaderEquationIdentityWitness({
      mode: "hold-until-settled-v1",
      witness: {
        latex: "1",
        readable: progress >= 0.64,
        ready: progress >= 0.8,
        progress
      }
    })
  );
  assert.deepEqual(samples.map((sample) => sample.state), [
    "waiting",
    "waiting",
    "held",
    "held",
    "settled"
  ]);
  assert.deepEqual(samples.map((sample) => sample.opacity), [0, 0, 1, 1, 0]);
  assert.ok(samples.every((sample) => sample.opacity === 0 || sample.opacity === 1));
});

test("omitted identities never leak additive or multiplicative witness ink", () => {
  for (const latex of ["0", "1"] as const) {
    for (const progress of [0, 0.64, 0.8, 0.99, 1]) {
      assert.deepEqual(projectKpReaderEquationIdentityWitness({
        mode: "omit-transient-v1",
        witness: { latex, readable: true, ready: true, progress }
      }), { state: "omitted", opacity: 0, readable: false });
    }
  }
});
