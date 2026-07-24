import assert from "node:assert/strict";
import test from "node:test";

import { createKpPresentationContinuityVisualPlan } from
  "../src/editor/presentation-continuity-visual-plan.ts";

test("presentation continuity visual plan has stable family checkpoints", () => {
  const plan = createKpPresentationContinuityVisualPlan();
  assert.equal(plan.length, 7);
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
});
