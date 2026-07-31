import assert from "node:assert/strict";
import test from "node:test";

import {
  measureKpAnimationLibraryBundleBoundaryDeltas
} from "./check-animation-library-bundle-boundary.ts";

test("animation library closure deltas retain accepted limits", () => {
  assert.deepEqual(measureKpAnimationLibraryBundleBoundaryDeltas({
    outerGzipBytes: 9_911,
    mainHostGzipBytes: 495_627,
    placeValueIncrementalGzipBytes: 70_436
  }), {
    outerGzipBytes: -40_089,
    mainHostGzipBytes: 5_627,
    placeValueIncrementalGzipBytes: -4_564
  });
});
