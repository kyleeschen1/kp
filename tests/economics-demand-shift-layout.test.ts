import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpInlineStickyCue,
  projectKpInlineStickyLessonLayout,
  projectKpInlineStickyMotionCorridor,
  readKpEconomicsDemandShiftPresentationLayout
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-layout.ts";
import {
  projectKpTutorialMotionCorridor
} from "../src/tutorial/kp-tutorial-motion.ts";

test("inline sticky economics layout is an explicit reversible query mode", () => {
  assert.equal(
    readKpEconomicsDemandShiftPresentationLayout("?layout=inline-sticky"),
    "inline-sticky"
  );
  assert.equal(
    readKpEconomicsDemandShiftPresentationLayout("?layout=unknown&demand=18"),
    "split"
  );
  assert.equal(readKpEconomicsDemandShiftPresentationLayout(""), "split");
});

test("phone layout preserves readable text by contracting the stage first", () => {
  assert.deepEqual(projectKpInlineStickyLessonLayout({
    viewportWidthPx: 390,
    viewportHeightPx: 844,
    cueHeightPx: 262
  }), {
    fit: "comfortable",
    stageHeightPx: 354,
    availableHeightPx: 785
  });

  const compact = projectKpInlineStickyLessonLayout({
    viewportWidthPx: 390,
    viewportHeightPx: 640,
    cueHeightPx: 330
  });
  assert.equal(compact.fit, "compact");
  assert.ok(compact.stageHeightPx >= 208);
});

test("large text falls back to reading flow instead of becoming illegible", () => {
  assert.deepEqual(projectKpInlineStickyLessonLayout({
    viewportWidthPx: 360,
    viewportHeightPx: 640,
    cueHeightPx: 432
  }), {
    fit: "reading",
    stageHeightPx: 208,
    availableHeightPx: 595
  });
});

test("cue holds for 5vh then fades prose over 10vh from its top edge", () => {
  const project = (cueAnchorTopPx: number) => projectKpInlineStickyCue({
    cueAnchorTopPx,
    stageTopPx: 100,
    stageBottomPx: 400,
    viewportHeightPx: 800
  });

  assert.deepEqual(project(800), {
    phase: "below",
    opacity: 1,
    fadeProgress: 0,
    distanceFromHandoffThresholdPx: 400
  });
  assert.equal(project(600).phase, "approach");
  assert.equal(project(600).opacity, 1);
  assert.equal(project(400).phase, "hold");
  assert.equal(project(400).opacity, 1);
  assert.equal(project(360).phase, "hold");
  assert.equal(project(360).opacity, 1);
  assert.equal(project(320).phase, "fade");
  assert.equal(project(320).opacity, 0.5);
  assert.equal(project(320).fadeProgress, 0.5);
  assert.equal(project(280).phase, "occluded");
  assert.equal(project(280).opacity, 0);
  assert.equal(project(280).fadeProgress, 1);
  assert.equal(project(200).phase, "occluded");
  assert.equal(project(200).opacity, 0);
  assert.deepEqual(project(320), project(320));
});

test("motion track height is the exact semantic scroll corridor", () => {
  const corridor = projectKpInlineStickyMotionCorridor({
    corridor: {
      startViewportRatio: 0.72,
      endViewportRatio: 0.16,
      keyframes: [
        { travel: 0, progress: 0 },
        { travel: 1, progress: 1 }
      ]
    },
    stageBottomPx: 400,
    viewportHeightPx: 800,
    scrollTravelViewportRatio: 0.52
  });

  assert.equal(corridor.startViewportRatio, 0.35);
  assert.ok(Math.abs(corridor.endViewportRatio - (-0.17)) < 1e-12);
  assert.ok(Math.abs(
    corridor.startViewportRatio - corridor.endViewportRatio - 0.52
  ) < 1e-12);
  assert.deepEqual(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 280,
    viewportHeight: 800
  }), { travel: 0, progress: 0 });
  assert.deepEqual(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: -136,
    viewportHeight: 800
  }), { travel: 1, progress: 1 });
});
