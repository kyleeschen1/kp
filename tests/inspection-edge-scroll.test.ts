import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectionEdgeVelocity } from "../src/reader/runtime/inspection-edge-scroll.ts";

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
