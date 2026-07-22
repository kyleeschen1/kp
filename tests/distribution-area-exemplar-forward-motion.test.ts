import assert from "node:assert/strict";
import test from "node:test";

import "../src/animation/fission-fusion-register.ts";
import {
  createKpDistributionAreaForwardMotionPlan,
  sampleKpDistributionAreaForwardMotion
} from "../src/animation/distribution-area-exemplar-forward-motion.ts";

const plan = createKpDistributionAreaForwardMotionPlan();

test("forward motion uses exact non-crossfading endpoint ownership", () => {
  const frames = [0, 0.001, 0.999, 1].map((progress) =>
    sampleKpDistributionAreaForwardMotion({ plan, progress })
  );

  assert.deepEqual(frames.map(({ owner }) => owner), [
    "factored-native", "material", "material", "expanded-native"
  ]);
  for (const frame of frames) {
    assert.equal(
      frame.opacity.factoredNative + frame.opacity.material + frame.opacity.expandedNative,
      1
    );
  }
});

test("factor fan-out and area partition advance in the same distribution window", () => {
  const early = sampleKpDistributionAreaForwardMotion({ plan, progress: 0.2 });
  const middle = sampleKpDistributionAreaForwardMotion({ plan, progress: 0.42 });
  const settled = sampleKpDistributionAreaForwardMotion({ plan, progress: 0.72 });

  assert.ok(middle.area.partitionProgress > early.area.partitionProgress);
  assert.ok(middle.algebra.factorCopies.some(({ pathProgress }) => pathProgress > 0));
  assert.equal(settled.distributionProgress, 1);
  assert.equal(settled.area.partitionProgress, 1);
  assert.equal(settled.area.componentWidthOpacity, 1);
});

test("six settles only after distribution exposes three times two", () => {
  const distributed = sampleKpDistributionAreaForwardMotion({ plan, progress: 0.72 });
  const evaluating = sampleKpDistributionAreaForwardMotion({ plan, progress: 0.86 });
  const expanded = sampleKpDistributionAreaForwardMotion({ plan, progress: 1 });

  assert.equal(distributed.area.rightFactorPairOpacity, 1);
  assert.equal(distributed.area.rightAreaLabelOpacity, 0);
  assert.ok(evaluating.area.rightFactorPairOpacity > 0);
  assert.ok(evaluating.area.rightAreaLabelOpacity > 0);
  assert.equal(expanded.area.rightFactorPairOpacity, 0);
  assert.equal(expanded.area.rightAreaLabelOpacity, 1);
});
