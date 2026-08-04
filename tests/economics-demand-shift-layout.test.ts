import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpInlineStickyLessonLayout,
  projectKpInlineStickyParagraph,
  projectKpInlineStickyParagraphMotionCorridor,
  projectKpTwoColumnScrollMotionCorridor,
  projectKpTwoColumnScrollParagraph,
  projectKpTwoColumnScrollSequence,
  readKpEconomicsDemandShiftPresentationLayout
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-layout.ts";
import {
  projectKpTutorialMotionCorridor
} from "../src/tutorial/kp-tutorial-motion.ts";
import {
  readKpEconomicsDemandShiftTheme,
  writeKpEconomicsDemandShiftTheme
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-theme.ts";

test("inline sticky economics layout is an explicit reversible query mode", () => {
  assert.equal(
    readKpEconomicsDemandShiftPresentationLayout("?layout=two-column-scroll"),
    "two-column-scroll"
  );
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

test("two-column prose peaks near center and settles at the divider", () => {
  assert.deepEqual(projectKpTwoColumnScrollParagraph({
    paragraphTopPx: 128,
    dividerTopPx: 128,
    viewportHeightPx: 800
  }), {
    phase: "passed",
    travel: 1,
    crossingProgress: 1,
    distanceFromStageBottomPx: 0,
    salience: 0.65,
    opacity: 0.762,
    ruleScale: 0.7060000000000001
  });
  assert.deepEqual(projectKpTwoColumnScrollParagraph({
    paragraphTopPx: 376,
    previousParagraphTopPx: 88,
    dividerTopPx: 128,
    viewportHeightPx: 800
  }), {
    phase: "approach",
    travel: 0,
    crossingProgress: 0,
    distanceFromStageBottomPx: 248,
    salience: 1,
    opacity: 1,
    ruleScale: 1
  });
  assert.deepEqual(projectKpTwoColumnScrollParagraph({
    paragraphTopPx: 128,
    previousParagraphTopPx: -120,
    dividerTopPx: 128,
    viewportHeightPx: 800
  }), {
    phase: "passed",
    travel: 1,
    crossingProgress: 1,
    distanceFromStageBottomPx: 0,
    salience: 0.65,
    opacity: 0.762,
    ruleScale: 0.7060000000000001
  });
});

test("paragraph salience hands off after predecessor settlement", () => {
  const settled = projectKpTwoColumnScrollSequence({
    paragraphTopPx: [128, 376, 650],
    dividerTopPx: 128,
    viewportHeightPx: 800
  });
  assert.equal(settled.attentionIndex, 0);
  assert.deepEqual(settled.paragraphs.map(({ opacity }) => opacity), [
    1, 0.32, 0.32
  ]);

  const handoff = projectKpTwoColumnScrollSequence({
    paragraphTopPx: [108, 356, 630],
    dividerTopPx: 128,
    viewportHeightPx: 800
  });
  assert.equal(handoff.attentionIndex, 0);
  assert.deepEqual(handoff.paragraphs.map(({ opacity }) => opacity), [
    0.89375, 0.6599999999999999, 0.32
  ]);

  const focused = projectKpTwoColumnScrollSequence({
    paragraphTopPx: [88, 336, 610],
    dividerTopPx: 128,
    viewportHeightPx: 800
  });
  assert.equal(focused.attentionIndex, 1);
  assert.deepEqual(focused.paragraphs.map(({ ownsAttention }) => ownsAttention), [
    false, true, false
  ]);
  assert.deepEqual(focused.paragraphs.map(({ ruleScale }) => ruleScale), [
    0.58, 1, 0.16
  ]);
});

test("two-column motion begins after focus and completes at the divider", () => {
  const corridor = projectKpTwoColumnScrollMotionCorridor({
    corridor: {
      startViewportRatio: 0.72,
      endViewportRatio: 0.16,
      keyframes: [
        { travel: 0, progress: 0 },
        { travel: 0.14, progress: 0 },
        { travel: 0.57, progress: 0.72 },
        { travel: 0.69, progress: 0.72 },
        { travel: 0.94, progress: 1 },
        { travel: 1, progress: 1 }
      ]
    },
    paragraphDistancePx: 248,
    dividerTopPx: 128,
    viewportHeightPx: 800
  });

  assert.equal(corridor.startViewportRatio, 0.42);
  assert.equal(corridor.endViewportRatio, 0.16);
  assert.deepEqual(corridor.keyframes, [
    { travel: 0, progress: 0 },
    { travel: 0.5375, progress: 0.72 },
    { travel: 0.6875, progress: 0.72 },
    { travel: 1, progress: 1 }
  ]);
  assert.deepEqual(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 336,
    viewportHeight: 800
  }), { travel: 0, progress: 0 });
  assert.deepEqual(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 128,
    viewportHeight: 800
  }), { travel: 1, progress: 1 });

  const shortCorridor = projectKpTwoColumnScrollMotionCorridor({
    corridor,
    paragraphDistancePx: 160,
    dividerTopPx: 128,
    viewportHeightPx: 800
  });
  assert.equal(shortCorridor.startViewportRatio, 0.36);
  assert.equal(shortCorridor.endViewportRatio, 0.16);
});

test("economics theme is explicit, reversible, and preserves other query state", () => {
  assert.equal(readKpEconomicsDemandShiftTheme("?theme=dark"), "dark");
  assert.equal(readKpEconomicsDemandShiftTheme("?theme=light"), "light");
  assert.equal(readKpEconomicsDemandShiftTheme("?theme=unknown"), "dark");
  assert.equal(readKpEconomicsDemandShiftTheme(""), "dark");
  assert.equal(writeKpEconomicsDemandShiftTheme({
    search: "?layout=inline-sticky&demand=19",
    theme: "dark"
  }), "?layout=inline-sticky&demand=19");
  assert.equal(writeKpEconomicsDemandShiftTheme({
    search: "?layout=inline-sticky&demand=19",
    theme: "light"
  }), "?layout=inline-sticky&demand=19&theme=light");
  assert.equal(writeKpEconomicsDemandShiftTheme({
    search: "?layout=inline-sticky&demand=19&theme=light",
    theme: "dark"
  }), "?layout=inline-sticky&demand=19");
});

test("inline sticky stage is exactly half the viewport on every width", () => {
  assert.deepEqual(projectKpInlineStickyLessonLayout({
    viewportWidthPx: 390,
    viewportHeightPx: 844,
    proseLineHeightPx: 29.45
  }), {
    fit: "comfortable",
    stageHeightPx: 422,
    availableHeightPx: 844
  });

  assert.deepEqual(projectKpInlineStickyLessonLayout({
    viewportWidthPx: 390,
    viewportHeightPx: 640,
    proseLineHeightPx: 29.45
  }), {
    fit: "comfortable",
    stageHeightPx: 320,
    availableHeightPx: 640
  });
});

test("large text does not resize the fixed half-viewport stage", () => {
  assert.deepEqual(projectKpInlineStickyLessonLayout({
    viewportWidthPx: 360,
    viewportHeightPx: 640,
    proseLineHeightPx: 56
  }), {
    fit: "comfortable",
    stageHeightPx: 320,
    availableHeightPx: 640
  });
  assert.deepEqual(projectKpInlineStickyLessonLayout({
    viewportWidthPx: 360,
    viewportHeightPx: 400,
    proseLineHeightPx: 56
  }), {
    fit: "comfortable",
    stageHeightPx: 200,
    availableHeightPx: 400
  });
});

test("paragraph remains opaque while its full height passes beneath the stage", () => {
  const project = (paragraphTopPx: number) => projectKpInlineStickyParagraph({
    paragraphTopPx,
    paragraphBottomPx: paragraphTopPx + 200,
    stageBottomPx: 400,
    viewportHeightPx: 800
  });

  assert.deepEqual(project(800), {
    phase: "below",
    travel: 0,
    crossingProgress: 0,
    distanceFromStageBottomPx: 400
  });
  assert.equal(project(600).phase, "approach");
  assert.ok(Math.abs(project(600).travel - 1 / 3) < 1e-12);
  assert.equal(project(400).phase, "crossing");
  assert.equal(project(400).crossingProgress, 0);
  assert.equal(project(300).phase, "crossing");
  assert.equal(project(300).crossingProgress, 0.5);
  assert.equal(project(200).phase, "passed");
  assert.equal(project(200).travel, 1);
  assert.equal(project(200).crossingProgress, 1);
  assert.deepEqual(project(300), project(300));
});

test("paragraph crossing is the exact semantic motion corridor", () => {
  const corridor = projectKpInlineStickyParagraphMotionCorridor({
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
    paragraphHeightPx: 200
  });

  assert.equal(corridor.startViewportRatio, 1);
  assert.equal(corridor.endViewportRatio, 0.25);
  assert.deepEqual(corridor.keyframes, [
    { travel: 0, progress: 0 },
    { travel: 2 / 3, progress: 0 },
    { travel: 1, progress: 1 }
  ]);
  assert.deepEqual(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 800,
    viewportHeight: 800
  }), { travel: 0, progress: 0 });
  assert.deepEqual(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 400,
    viewportHeight: 800
  }), { travel: 2 / 3, progress: 0 });
  const midpoint = projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 300,
    viewportHeight: 800
  });
  assert.equal(midpoint.travel, 5 / 6);
  assert.ok(Math.abs(midpoint.progress - 0.5) < 1e-12);
  assert.deepEqual(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 200,
    viewportHeight: 800
  }), { travel: 1, progress: 1 });
});

test("inline crossing consumes the shared pre-motion hold before the threshold", () => {
  const corridor = projectKpInlineStickyParagraphMotionCorridor({
    corridor: {
      startViewportRatio: 0.72,
      endViewportRatio: 0.16,
      keyframes: [
        { travel: 0, progress: 0 },
        { travel: 0.14, progress: 0 },
        { travel: 0.57, progress: 0.72 },
        { travel: 0.69, progress: 0.72 },
        { travel: 0.94, progress: 1 },
        { travel: 1, progress: 1 }
      ]
    },
    stageBottomPx: 400,
    viewportHeightPx: 800,
    paragraphHeightPx: 200
  });

  assert.deepEqual(corridor.keyframes.map(({ progress }) => progress), [
    0, 0, 0.72, 0.72, 1, 1
  ]);
  const expectedTravels = [
    0,
    2 / 3,
    5 / 6,
    2 / 3 + ((0.69 - 0.14) / 0.86) / 3,
    2 / 3 + ((0.94 - 0.14) / 0.86) / 3,
    1
  ];
  corridor.keyframes.forEach(({ travel }, index) => {
    assert.ok(Math.abs(travel - expectedTravels[index]!) < 1e-12);
  });
  assert.equal(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 399,
    viewportHeight: 800
  }).progress > 0, true);
});
