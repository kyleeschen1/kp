import assert from "node:assert/strict";
import test from "node:test";

import { createKpPresentationContinuityVisualPlan } from
  "../src/editor/presentation-continuity-visual-plan.ts";

test("presentation continuity visual plan has stable family checkpoints", () => {
  const plan = createKpPresentationContinuityVisualPlan();
  assert.equal(plan.length, 17);
  assert.deepEqual(
    [...new Set(plan.map((visualCase) => visualCase.id))].length,
    plan.length
  );
  assert.deepEqual(
    [...new Set(plan.map((visualCase) => visualCase.family))].sort(),
    ["distribution", "radical"]
  );
  assert.ok(plan.some((visualCase) =>
    visualCase.family === "distribution" &&
    visualCase.progress === 1 &&
    visualCase.viewport.width === 390
  ));
  for (const progress of [0.72, 0.83, 0.94, 1]) {
    for (const surface of ["workbench-card", "lesson"] as const) {
      assert.deepEqual(
        plan
          .filter((visualCase) =>
            visualCase.family === "distribution" &&
            visualCase.progress === progress &&
            visualCase.surface === surface
          )
          .map((visualCase) => visualCase.viewport.width)
          .sort((left, right) => left - right),
        [390, 1280]
      );
    }
  }
});
