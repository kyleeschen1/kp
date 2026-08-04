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

test("cue rises from viewport entry then eases to neutral by midpoint", () => {
  const project = (cueAnchorCenterPx: number) => projectKpInlineStickyCue({
    cueAnchorCenterPx,
    cueHeightPx: 100,
    stageTopPx: 100,
    stageBottomPx: 400,
    viewportBottomPx: 800
  });

  assert.deepEqual(project(850), {
    phase: "below",
    opacity: 1,
    handoffProgress: 0,
    elevationProgress: 0,
    depthPx: 0,
    scale: 1,
    stacking: "front",
    stageMidpointPx: 250,
    distanceFromStageBottomPx: 450
  });
  assert.equal(project(625).phase, "approach");
  assert.equal(project(625).elevationProgress, 0.5);
  assert.equal(project(625).depthPx, 12);
  assert.equal(project(400).phase, "handoff");
  assert.equal(project(400).elevationProgress, 1);
  assert.equal(project(400).depthPx, 24);
  assert.equal(project(400).scale, 1.012);
  assert.equal(project(325).phase, "handoff");
  assert.equal(project(325).opacity, 0.5);
  assert.equal(project(325).handoffProgress, 0.5);
  assert.equal(project(325).elevationProgress, 0.5);
  assert.equal(project(325).depthPx, 12);
  assert.equal(project(325).scale, 1.006);
  assert.equal(project(250).stacking, "behind");
  assert.equal(project(250).opacity, 0);
  assert.equal(project(250).depthPx, 0);
  assert.equal(project(250).scale, 1);
  assert.equal(project(175).phase, "occluded");
  assert.equal(project(175).opacity, 0);
  assert.equal(project(175).depthPx, 0);
  assert.deepEqual(project(325), project(325));
});
