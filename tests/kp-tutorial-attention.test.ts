import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpTutorialAttentionFrame
} from "../src/tutorial/kp-tutorial-attention.ts";

test("attention selects the region that physically contains the reading cursor", () => {
  const frame = projectKpTutorialAttentionFrame({
    cursorY: 342,
    regions: [
      region("before", 40, 330),
      region("under-cursor", 334, 620, "motion.second")
    ]
  });

  assert.deepEqual(frame, {
    cursorY: 342,
    state: "within-region",
    activeRegionId: "under-cursor",
    activePassageId: "passage.under-cursor",
    activeMotionBlockId: "motion.second",
    nearestRegionDistance: 0
  });
});

test("attention does not retain or approximate a focused card in a physical gap", () => {
  const frame = projectKpTutorialAttentionFrame({
    cursorY: 342,
    regions: [region("before", 40, 320), region("after", 360, 620)]
  });

  assert.deepEqual(frame, {
    cursorY: 342,
    state: "between-regions",
    nearestRegionDistance: 18
  });
});

test("the smallest containing registration owns nested overlap deterministically", () => {
  const frame = projectKpTutorialAttentionFrame({
    cursorY: 342,
    regions: [
      region("composite", 100, 600, "motion.composite"),
      region("specific", 300, 380)
    ]
  });

  assert.equal(frame.activeRegionId, "specific");
  assert.equal(frame.activeMotionBlockId, undefined);
});

test("subpixel layout rounding does not create a false gap at a shared edge", () => {
  const frame = projectKpTutorialAttentionFrame({
    cursorY: 100,
    regions: [region("next", 100.25, 180)]
  });

  assert.equal(frame.state, "within-region");
  assert.equal(frame.activeRegionId, "next");
});

function region(
  id: string,
  top: number,
  bottom: number,
  motionBlockId?: string
) {
  return {
    id,
    passageId: `passage.${id}`,
    ...(motionBlockId === undefined ? {} : { motionBlockId }),
    top,
    bottom
  };
}
