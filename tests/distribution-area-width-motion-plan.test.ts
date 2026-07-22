import assert from "node:assert/strict";
import test from "node:test";

import { createKpDistributionAreaWidthLayoutSnapshot } from "../src/reader/renderers/distribution-area-layout.ts";
import { createKpDistributionAreaWidthMotionPlan } from "../src/reader/renderers/distribution-area-width-motion-plan.ts";

test("one geometric x plus 2 label splits continuously into measured component labels", () => {
  const ids = ["source.x", "source.plus", "source.two", "target.x", "target.two"] as const;
  const layout = createKpDistributionAreaWidthLayoutSnapshot({
    revision: 2,
    rootRect: { left: 0, top: 0, width: 400, height: 220 },
    measurements: ids.map((selectorId, index) => ({
      stateId: "factored" as const,
      selectorId,
      lineage: selectorId,
      rect: { left: 180 + index * 8, top: 20, width: 10, height: 18 }
    })).map((measurement) => measurement.selectorId === "target.x"
      ? { ...measurement, rect: { ...measurement.rect, left: 120 } }
      : measurement.selectorId === "target.two"
        ? { ...measurement, rect: { ...measurement.rect, left: 290 } }
        : measurement)
  });
  const plan = createKpDistributionAreaWidthMotionPlan(layout);
  const start = plan.sample(0);
  const middle = plan.sample(0.5);
  const end = plan.sample(1);

  assert.equal(start.x.x, layout.anchor("source.x").center.x);
  assert.equal(start.two.x, layout.anchor("source.two").center.x);
  assert.ok(middle.x.x < start.x.x);
  assert.ok(middle.two.x > start.two.x);
  assert.equal(end.x.x, layout.anchor("target.x").center.x);
  assert.equal(end.two.x, layout.anchor("target.two").center.x);
  assert.equal(end.plus.opacity, 0);
});
