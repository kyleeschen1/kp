import assert from "node:assert/strict";
import test from "node:test";

import { createKpDistributionAreaLayoutSnapshot, type KpDistributionAreaAnchorMeasurement, type KpDistributionAreaStateId } from "../src/reader/renderers/distribution-area-layout.ts";
import { createKpDistributionAreaMotionPlan } from "../src/reader/renderers/distribution-area-motion-plan.ts";

const suffixes: Readonly<Record<KpDistributionAreaStateId, readonly string[]>> = {
  factored: ["factor.3", "left-paren", "term.x", "plus", "term.2", "right-paren"],
  distributed: ["left.factor.3", "left.term.x", "plus", "right.factor.3", "right.times", "right.term.2"],
  expanded: ["left.factor.3", "left.term.x", "plus", "right.product.6"]
};

function layout() {
  const stateX = { factored: 80, distributed: 140, expanded: 200 };
  let index = 0;
  const measurements = (Object.entries(suffixes) as Array<[KpDistributionAreaStateId, readonly string[]]>).flatMap(
    ([stateId, stateSuffixes]) => stateSuffixes.map((suffix): KpDistributionAreaAnchorMeasurement => ({
      stateId,
      selectorId: `exemplar.state.${stateId}.${suffix}`,
      lineage: suffix,
      rect: { left: stateX[stateId] + index++ * 10, top: 60, width: 10, height: 20 }
    }))
  );
  return createKpDistributionAreaLayoutSnapshot({
    revision: 3,
    rootRect: { left: 0, top: 0, width: 500, height: 160 },
    measurements
  });
}

test("distribution motion lands exactly on every measured algebra state", () => {
  const measured = layout();
  const plan = createKpDistributionAreaMotionPlan(measured);
  const start = plan.sample(0);
  const distributed = plan.sample(0.72);
  const expanded = plan.sample(1);

  assert.equal(start.tokens.x.x, measured.anchor("factored", "term.x").center.x);
  assert.equal(distributed.tokens.x.x, measured.anchor("distributed", "left.term.x").center.x);
  assert.equal(distributed.tokens["right-three"].x, measured.anchor("distributed", "right.factor.3").center.x);
  assert.equal(expanded.tokens.x.x, measured.anchor("expanded", "left.term.x").center.x);
  assert.equal(expanded.tokens.six.x, measured.anchor("expanded", "right.product.6").center.x);
});

test("one timeline is continuously sampleable in either direction", () => {
  const plan = createKpDistributionAreaMotionPlan(layout());
  for (let step = 0; step <= 100; step += 1) {
    const progress = step / 100;
    const forward = plan.sample(progress);
    const rewind = plan.sample(1 - (1 - progress));
    for (const id of Object.keys(forward.tokens) as Array<keyof typeof forward.tokens>) {
      const left = forward.tokens[id];
      const right = rewind.tokens[id];
      assert.ok(Math.abs(left.x - right.x) < 1e-9);
      assert.ok(Math.abs(left.y - right.y) < 1e-9);
      assert.ok(Math.abs(left.opacity - right.opacity) < 1e-9);
      assert.ok(Math.abs(left.scale - right.scale) < 1e-9);
    }
    for (const pose of Object.values(forward.tokens)) {
      assert.ok([pose.x, pose.y, pose.opacity, pose.scale].every(Number.isFinite));
    }
  }
});
