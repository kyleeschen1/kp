import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEquationSemanticDepthPlan,
  sampleKpEquationSemanticDepth
} from "../src/rendering/equation-semantic-depth.ts";

test("flat presentation does not construct a depth channel", () => {
  assert.equal(createKpEquationSemanticDepthPlan("flat-v1"), undefined);
});

test("semantic depth lifts gently and returns to exact flat endpoints", () => {
  const plan = createKpEquationSemanticDepthPlan("semantic-depth-v1")!;
  const start = sampleKpEquationSemanticDepth(plan, 0);
  const lifted = sampleKpEquationSemanticDepth(plan, 0.5);
  const settling = sampleKpEquationSemanticDepth(plan, 0.8);
  const end = sampleKpEquationSemanticDepth(plan, 1);

  assert.deepEqual(start, {
    elevation: 0,
    scale: 1,
    translateY: 0,
    shadowBlurPx: 0,
    shadowOpacity: 0,
    layer: 0
  });
  assert.equal(lifted.elevation, 1);
  assert.equal(lifted.scale, plan.maximumScale);
  assert.equal(lifted.translateY, -plan.maximumLiftPx);
  assert.ok(settling.elevation > 0 && settling.elevation < 1);
  assert.deepEqual(end, start);
});

test("depth sampling is bounded, deterministic, and exactly reversible", () => {
  const plan = createKpEquationSemanticDepthPlan("semantic-depth-v1")!;
  for (let step = 0; step <= 100; step += 1) {
    const progress = step / 100;
    const forward = sampleKpEquationSemanticDepth(plan, progress);
    const rewind = sampleKpEquationSemanticDepth(plan, progress);
    assert.deepEqual(rewind, forward);
    assert.ok(forward.elevation >= 0 && forward.elevation <= 1);
    assert.ok(forward.scale >= 1 && forward.scale <= plan.maximumScale);
    assert.ok(forward.translateY <= 0);
    assert.ok(forward.translateY >= -plan.maximumLiftPx);
    assert.ok(forward.shadowOpacity <= plan.maximumShadowOpacity);
    assert.equal(forward.layer, forward.elevation > 0 ? 1 : 0);
  }
});

test("depth clamps out-of-range progress without disturbing endpoint laws", () => {
  const plan = createKpEquationSemanticDepthPlan("semantic-depth-v1")!;
  assert.deepEqual(
    sampleKpEquationSemanticDepth(plan, -5),
    sampleKpEquationSemanticDepth(plan, 0)
  );
  assert.deepEqual(
    sampleKpEquationSemanticDepth(plan, 9),
    sampleKpEquationSemanticDepth(plan, 1)
  );
});
