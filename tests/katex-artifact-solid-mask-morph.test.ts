import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createSignedDistanceField,
  sampleKatexArtifactSolidMaskMorphFrame,
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

test("solid-mask motion forms continuously along a reversible quadratic arc", () => {
  const plan = {
    start: 0.1,
    end: 0.9,
    easing: "ease-in-out" as const,
    shapeLeadFraction: 0.12
  };

  const start = sampleKatexArtifactSolidMaskMorphFrame(plan, 0);
  const quarter = sampleKatexArtifactSolidMaskMorphFrame(plan, 0.3);
  const middle = sampleKatexArtifactSolidMaskMorphFrame(plan, 0.5);
  const end = sampleKatexArtifactSolidMaskMorphFrame(plan, 1);

  assert.deepEqual(start, {
    travelProgress: 0,
    shapeProgress: 0,
    arcProgress: 0
  });
  assert.ok(quarter.travelProgress > 0);
  assert.ok(quarter.shapeProgress > quarter.travelProgress);
  assert.ok(quarter.arcProgress > 0);
  assert.equal(middle.arcProgress, 1);
  assert.ok(middle.shapeProgress > middle.travelProgress);
  assert.deepEqual(end, {
    travelProgress: 1,
    shapeProgress: 1,
    arcProgress: 0
  });
  assert.deepEqual(
    sampleKatexArtifactSolidMaskMorphFrame(plan, 0.3),
    quarter
  );
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
