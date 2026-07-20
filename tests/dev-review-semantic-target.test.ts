import assert from "node:assert/strict";
import test from "node:test";
import { deriveKpDevReviewSemanticTarget } from "../src/dev-review/semantic-target.ts";

test("combines stable nested semantic ids with normalized pointer geometry", () => {
  assert.deepEqual(deriveKpDevReviewSemanticTarget({
    ids: {
      selectorId: "linear-solve.lhs.plus3",
      objectId: "equation.source",
      transformationId: "linear-solve.subtract-three",
      materialOwnerId: "material.plus3"
    },
    rect: { left: 100, top: 80, width: 200, height: 100 },
    point: { clientX: 150, clientY: 105, pageX: 150, pageY: 705 }
  }), {
    selectorId: "linear-solve.lhs.plus3",
    objectId: "equation.source",
    transformationId: "linear-solve.subtract-three",
    materialOwnerId: "material.plus3",
    normalizedPoint: { x: 0.25, y: 0.25 },
    viewportRect: { left: 100, top: 80, width: 200, height: 100 },
    pagePoint: { x: 150, y: 705 }
  });
});

test("clamps pointers outside a target and handles zero-size material", () => {
  assert.deepEqual(deriveKpDevReviewSemanticTarget({
    ids: { objectId: "equation.source" },
    rect: { left: 100, top: 80, width: 0, height: 100 },
    point: { clientX: 600, clientY: 0, pageX: 600, pageY: 0 }
  }).normalizedPoint, { x: 0.5, y: 0 });
});
