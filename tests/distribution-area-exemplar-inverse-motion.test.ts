import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpDistributionAreaForwardMotionPlan,
  sampleKpDistributionAreaForwardMotion
} from "../src/animation/distribution-area-exemplar-forward-motion.ts";
import {
  sampleKpDistributionAreaInverseMotion
} from "../src/animation/distribution-area-exemplar-inverse-motion.ts";

const plan = createKpDistributionAreaForwardMotionPlan();

test("inverse geometry equals forward geometry at complementary progress", () => {
  for (const progress of [0, 0.1, 0.28, 0.5, 0.72, 0.9, 1]) {
    const inverse = sampleKpDistributionAreaInverseMotion({ plan, progress });
    const forward = sampleKpDistributionAreaForwardMotion({
      plan,
      progress: 1 - progress
    });
    assert.deepEqual(inverse.area, forward.area, `progress ${progress}`);
  }
});

test("inverse uses factoring fusion after six decomposes", () => {
  const decomposing = sampleKpDistributionAreaInverseMotion({ plan, progress: 0.14 });
  const factoring = sampleKpDistributionAreaInverseMotion({ plan, progress: 0.64 });

  assert.ok(decomposing.area.rightAreaLabelOpacity > 0);
  assert.ok(decomposing.area.rightFactorPairOpacity > 0);
  assert.equal(decomposing.factoringProgress, 0);
  assert.ok(factoring.factoringProgress > 0);
  assert.ok(factoring.algebra.factorCopies.some(({ pathProgress }) => pathProgress > 0));
});

test("inverse preserves exact non-crossfading endpoint ownership", () => {
  const frames = [0, 0.001, 0.999, 1].map((progress) =>
    sampleKpDistributionAreaInverseMotion({ plan, progress })
  );
  assert.deepEqual(frames.map(({ owner }) => owner), [
    "expanded-native", "material", "material", "factored-native"
  ]);
  for (const frame of frames) {
    assert.equal(
      frame.opacity.expandedNative + frame.opacity.material + frame.opacity.factoredNative,
      1
    );
  }
});
