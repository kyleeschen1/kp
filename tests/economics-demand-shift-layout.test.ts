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
    paddingHeightPx: 101,
    approachHeightPx: 152,
    readingShelfHeightPx: 25,
    availableHeightPx: 785
  });

  const compact = projectKpInlineStickyLessonLayout({
    viewportWidthPx: 390,
    viewportHeightPx: 550,
    cueHeightPx: 220
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
    paddingHeightPx: 77,
    approachHeightPx: 115,
    readingShelfHeightPx: 20,
    availableHeightPx: 595
  });
});

test("cue opacity peaks on a reading shelf and reverses through padding P", () => {
  const project = (cueAnchorTopPx: number) => projectKpInlineStickyCue({
    cueAnchorTopPx,
    stageBottomPx: 400,
    paddingHeightPx: 100,
    approachHeightPx: 100,
    readingShelfHeightPx: 20
  });

  assert.deepEqual(project(650), {
    phase: "waiting",
    opacity: 0.18,
    focusLinePx: 500,
    distanceFromFocusLinePx: 150
  });
  assert.equal(project(560).phase, "approaching");
  assert.ok(Math.abs(project(560).opacity - 0.59) < 0.0001);
  assert.equal(project(500).phase, "reading");
  assert.equal(project(500).opacity, 1);
  assert.equal(project(445).phase, "receding");
  assert.equal(project(445).opacity, 0.5);
  assert.equal(project(400).phase, "occluded");
  assert.equal(project(400).opacity, 0);
  assert.deepEqual(project(560), project(560));
});
