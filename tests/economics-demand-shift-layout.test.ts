import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpInlineStickyCue,
  projectKpInlineStickyLessonLayout,
  readKpEconomicsDemandShiftPresentationLayout
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-layout.ts";

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

test("cue hands attention from the stage bottom to its midpoint", () => {
  const project = (cueAnchorCenterPx: number) => projectKpInlineStickyCue({
    cueAnchorCenterPx,
    stageTopPx: 100,
    stageBottomPx: 400,
  });

  assert.deepEqual(project(500), {
    phase: "below",
    opacity: 1,
    handoffProgress: 0,
    depthPx: 0,
    scale: 1,
    stageMidpointPx: 250,
    distanceFromStageBottomPx: 100
  });
  assert.equal(project(400).phase, "below");
  assert.equal(project(325).phase, "handoff");
  assert.equal(project(325).opacity, 0.5);
  assert.equal(project(325).handoffProgress, 0.5);
  assert.equal(project(325).depthPx, -12);
  assert.equal(project(325).scale, 0.994);
  assert.equal(project(250).phase, "occluded");
  assert.equal(project(250).opacity, 0);
  assert.equal(project(250).depthPx, -24);
  assert.deepEqual(project(325), project(325));
});
