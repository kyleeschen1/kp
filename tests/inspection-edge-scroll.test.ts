import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectionEdgeVelocity, inspectionScrollBounds } from "../src/reader/runtime/inspection-edge-scroll.ts";

test("endpoint scrolling reserves room for content beyond the handle center", () => {
  const bottom = inspectionScrollBounds({ top: -600, bottom: 630 }, { top: -630, bottom: 680 }, 630, 650);
  assert.equal(bottom.bottom - 630, 78);
  const top = inspectionScrollBounds({ top: 12, bottom: 1000 }, { top: -30, bottom: 1040 }, 12, 650);
  assert.equal(top.top - 12, -78);
  const settled = inspectionScrollBounds({ top: 80, bottom: 580 }, { top: 48, bottom: 602 }, 635, 650);
  assert.equal(settled.bottom, 635);
});

test("edge velocity is symmetric, bounded, gradual and inactive in the reading area", () => {
  for (const height of [200, 600, 1200]) {
    assert.equal(inspectionEdgeVelocity(height / 2, height), 0);
    for (const distance of [0, 10, 20, 40]) {
      const upward = inspectionEdgeVelocity(distance, height);
      assert.equal(upward, -inspectionEdgeVelocity(height - distance, height));
      assert.ok(Math.abs(upward) <= 540);
    }
  }
  assert.ok(inspectionEdgeVelocity(590, 600) > inspectionEdgeVelocity(550, 600));
  assert.equal(inspectionEdgeVelocity(-1000, 600), -540);
  assert.equal(inspectionEdgeVelocity(1000, 600), 540);
  assert.equal(inspectionEdgeVelocity(NaN, 600), 0);
});
