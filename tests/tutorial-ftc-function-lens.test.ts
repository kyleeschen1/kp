import assert from "node:assert/strict";
import test from "node:test";
import {
  kpFtcGenericContinuousClaim,
  listKpFtcFunctionLenses,
  sampleKpFtcFunctionLens
} from "../src/tutorial/ftc-function-lens.ts";

test("FTC exposes a generic continuous claim through curated exact lenses", () => {
  assert.equal(listKpFtcFunctionLenses().length, 3);
  assert.deepEqual(
    listKpFtcFunctionLenses().map(({ id }) => id),
    ["quadratic", "affine", "sine-offset"]
  );
  assert.deepEqual(kpFtcGenericContinuousClaim.assumptions, [
    "f is continuous on the interval under discussion"
  ]);
});

test("curated FTC lens samples exact integrand and accumulator values", () => {
  assert.deepEqual(sampleKpFtcFunctionLens("quadratic", 3), {
    lensId: "quadratic",
    t: 3,
    integrand: 9,
    accumulatedArea: 9
  });
  assert.deepEqual(sampleKpFtcFunctionLens("affine", 2), {
    lensId: "affine",
    t: 2,
    integrand: 3,
    accumulatedArea: 4
  });
  const sine = sampleKpFtcFunctionLens("sine-offset", 0);
  assert.equal(sine.integrand, 1);
  assert.equal(sine.accumulatedArea, 0);
});
