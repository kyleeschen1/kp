import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpTutorialProseMotionGeometryCache,
  projectKpTutorialProseMotionGeometry,
  type KpTutorialProseMotionTimingRatios
} from "../src/tutorial/kp-tutorial-motion-bridge-geometry.ts";

const timing = Object.freeze({
  ordinaryBeatApproachRatio: 0.14,
  bridgeDistanceRatios: Object.freeze({
    short: 0.32,
    standard: 0.5,
    extended: 0.8
  })
}) satisfies KpTutorialProseMotionTimingRatios;

test("prose motion geometry shares the usable viewport authority", () => {
  assert.deepEqual(projectKpTutorialProseMotionGeometry({
    viewportHeightPx: 800,
    timing
  }), {
    viewport: {
      viewportHeightPx: 800,
      topPx: 0,
      bottomPx: 800,
      heightPx: 800
    },
    readingAnchorPx: 280,
    ordinaryBeatApproachDistancePx: 112.00000000000001,
    bridgeDistancePx: {
      short: 256,
      standard: 400,
      extended: 640
    }
  });
});

test("persistent chrome moves anchors and scales distances once", () => {
  assert.deepEqual(projectKpTutorialProseMotionGeometry({
    viewportHeightPx: 800,
    persistentTopInsetPx: 80,
    persistentBottomInsetPx: 20,
    timing
  }), {
    viewport: {
      viewportHeightPx: 800,
      topPx: 80,
      bottomPx: 780,
      heightPx: 700
    },
    readingAnchorPx: 325,
    ordinaryBeatApproachDistancePx: 98.00000000000001,
    bridgeDistancePx: {
      short: 224,
      standard: 350,
      extended: 560
    }
  });
});

test("geometry cache measures only after explicit invalidation", () => {
  let reads = 0;
  const cache = createKpTutorialProseMotionGeometryCache(() => {
    reads += 1;
    return projectKpTutorialProseMotionGeometry({
      viewportHeightPx: reads === 1 ? 800 : 900,
      timing
    });
  });

  const first = cache.read();
  assert.equal(cache.read(), first);
  assert.equal(reads, 1);
  cache.invalidate();
  const second = cache.read();
  assert.notEqual(second, first);
  assert.equal(second.viewport.heightPx, 900);
  assert.equal(reads, 2);
});

test("prose motion geometry fails closed on invalid ratios", () => {
  assert.throws(() => projectKpTutorialProseMotionGeometry({
    viewportHeightPx: 800,
    timing: {
      ...timing,
      ordinaryBeatApproachRatio: 0
    }
  }), /ordinary beat approach ratio/);
  assert.throws(() => projectKpTutorialProseMotionGeometry({
    viewportHeightPx: 800,
    timing: {
      ...timing,
      bridgeDistanceRatios: {
        ...timing.bridgeDistanceRatios,
        extended: Number.NaN
      }
    }
  }), /extended bridge distance ratio/);
});
