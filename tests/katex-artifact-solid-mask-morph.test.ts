import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createSignedDistanceField,
  sampleKatexArtifactSolidMaskMorphProgress
} from "../src/rendering/katex-artifact-solid-mask-morph.ts";

test("solid-mask progress has stable endpoints and conventional easing", () => {
  const plan = {
    start: 0.1,
    end: 0.9,
    easing: "ease-in-out" as const
  };

  assert.equal(sampleKatexArtifactSolidMaskMorphProgress(plan, 0), 0);
  assert.equal(sampleKatexArtifactSolidMaskMorphProgress(plan, 0.1), 0);
  assert.equal(sampleKatexArtifactSolidMaskMorphProgress(plan, 0.5), 0.5);
  assert.equal(sampleKatexArtifactSolidMaskMorphProgress(plan, 0.9), 1);
  assert.equal(sampleKatexArtifactSolidMaskMorphProgress(plan, 1), 1);
});

test("signed-distance fields preserve solid ink and transparent space", () => {
  const alpha = new Uint8ClampedArray([
    0, 0, 0,
    0, 255, 0,
    0, 0, 0
  ]);
  const field = createSignedDistanceField(alpha, 3, 3, 4);

  assert.ok((field[4] ?? 0) < 0);
  assert.ok((field[0] ?? 0) > 0);
  assert.equal(field.length, alpha.length);
});

test("signed-distance fields reject masks without an ink boundary", () => {
  assert.throws(
    () => createSignedDistanceField(new Uint8ClampedArray(4), 2, 2, 4),
    /both ink and transparent pixels/
  );
});
