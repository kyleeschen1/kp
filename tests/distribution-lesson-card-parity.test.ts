import assert from "node:assert/strict";
import test from "node:test";


import {
  createKpDistributionAreaForwardMotionPlan,
  sampleKpDistributionAreaForwardMotion
} from "../src/animation/distribution-area-exemplar-forward-motion.ts";
import {
  sampleKpDistributionChoreography
} from "../src/animation/distribution-choreography.ts";

test("lesson and card share the canonical distribution choreography schedule", () => {
  const plan = createKpDistributionAreaForwardMotionPlan();
  for (const choreographyProgress of [0, 0.18, 0.5, 0.72, 0.83, 0.94, 1]) {
    const lesson = sampleKpDistributionAreaForwardMotion({
      plan,
      progress: choreographyProgress * 0.72
    });
    const card = sampleKpDistributionChoreography({
      plan: plan.forward[0],
      progress: choreographyProgress
    });
    assert.deepEqual(roundFrame(lesson.algebra), roundFrame(card));
  }
});

function roundFrame<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, item: unknown) =>
    typeof item === "number" ? Number(item.toFixed(12)) : item
  )) as T;
}
