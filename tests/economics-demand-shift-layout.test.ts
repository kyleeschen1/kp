import assert from "node:assert/strict";
import test from "node:test";

import {
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
    dockedTextHeightPx: 210,
    controlsHeightPx: 52
  }), {
    fit: "comfortable",
    stageHeightPx: 354,
    availableHeightPx: 761
  });

  const compact = projectKpInlineStickyLessonLayout({
    viewportWidthPx: 390,
    viewportHeightPx: 550,
    dockedTextHeightPx: 210,
    controlsHeightPx: 52
  });
  assert.equal(compact.fit, "compact");
  assert.ok(compact.stageHeightPx >= 208);
});

test("large text falls back to reading flow instead of becoming illegible", () => {
  assert.deepEqual(projectKpInlineStickyLessonLayout({
    viewportWidthPx: 360,
    viewportHeightPx: 640,
    dockedTextHeightPx: 380,
    controlsHeightPx: 52
  }), {
    fit: "reading",
    stageHeightPx: 208,
    availableHeightPx: 571
  });
});
