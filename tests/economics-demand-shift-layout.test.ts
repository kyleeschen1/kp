import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpInlineStickyLessonLayout,
  projectKpInlineStickyParagraph,
  projectKpInlineStickyParagraphMotionCorridor,
  projectKpTwoColumnScrollMotionCorridor,
  projectKpTwoColumnScrollParagraph,
  projectKpTwoColumnScrollSequence,
  kpEconomicsTwoColumnParagraphGapDefaultVh,
  kpEconomicsTwoColumnParagraphGapMaximumVh,
  kpEconomicsMotionBridgeExemplarSearch,
  kpEconomicsTwoColumnScrollCanonicalSearch,
  readKpEconomicsTwoColumnParagraphGapVh,
  readKpEconomicsDemandShiftPresentationLayout,
  readKpEconomicsScrollScrubStrategy,
  readKpEconomicsTwoColumnTextSide,
  writeKpEconomicsTwoColumnParagraphGapVh,
  writeKpEconomicsTwoColumnTextSide
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-layout.ts";
import {
  projectKpTutorialMotionCorridor
} from "../src/tutorial/kp-tutorial-motion.ts";
import {
  readKpEconomicsDemandShiftTheme,
  writeKpEconomicsDemandShiftTheme
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-theme.ts";
import {
  projectKpEconomicsGraphStrokeWidths,
  readKpEconomicsGraphStrokeScale,
  writeKpEconomicsGraphStrokeScale
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-graph-style.ts";

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

test("motion bridge is an opt-in strategy isolated from the accepted route", () => {
  assert.equal(
    kpEconomicsTwoColumnScrollCanonicalSearch,
    "?layout=two-column-scroll"
  );
  assert.equal(
    kpEconomicsMotionBridgeExemplarSearch,
    "?layout=two-column-scroll&scrub=motion-bridge"
  );
  assert.equal(
    readKpEconomicsScrollScrubStrategy(
      kpEconomicsTwoColumnScrollCanonicalSearch
    ),
    "continuous-passage"
  );
  assert.equal(
    readKpEconomicsScrollScrubStrategy(
      kpEconomicsMotionBridgeExemplarSearch
    ),
    "motion-bridge"
  );
  assert.equal(
    readKpEconomicsScrollScrubStrategy("?scrub=motion-bridge"),
    "continuous-passage"
  );
  assert.equal(
    readKpEconomicsScrollScrubStrategy(
      "?layout=inline-sticky&scrub=motion-bridge"
    ),
    "continuous-passage"
  );
});

test("two-column text side is URL-reproducible and defaults right", () => {
  assert.equal(readKpEconomicsTwoColumnTextSide(""), "right");
  assert.equal(
    readKpEconomicsTwoColumnTextSide("?layout=two-column-scroll&text=left"),
    "left"
  );
  assert.equal(
    writeKpEconomicsTwoColumnTextSide({
      search: "?layout=two-column-scroll&theme=light",
      side: "left"
    }),
    "?layout=two-column-scroll&theme=light&text=left"
  );
  assert.equal(
    writeKpEconomicsTwoColumnTextSide({
      search: "?layout=two-column-scroll&text=left&theme=light",
      side: "right"
    }),
    "?layout=two-column-scroll&theme=light"
  );
});

test("two-column paragraph spacing is bounded and URL-reproducible", () => {
  assert.equal(
    readKpEconomicsTwoColumnParagraphGapVh(""),
    kpEconomicsTwoColumnParagraphGapDefaultVh
  );
  assert.equal(readKpEconomicsTwoColumnParagraphGapVh("?gap=42.4"), 42);
  assert.equal(readKpEconomicsTwoColumnParagraphGapVh("?gap=-9"), 0);
  assert.equal(
    readKpEconomicsTwoColumnParagraphGapVh("?gap=900"),
    kpEconomicsTwoColumnParagraphGapMaximumVh
  );
  assert.equal(
    readKpEconomicsTwoColumnParagraphGapVh("?gap=not-a-number"),
    kpEconomicsTwoColumnParagraphGapDefaultVh
  );
  assert.equal(
    writeKpEconomicsTwoColumnParagraphGapVh({
      search: "?layout=two-column-scroll&theme=light",
      gapVh: 42
    }),
    "?layout=two-column-scroll&theme=light&gap=42"
  );
  assert.equal(
    writeKpEconomicsTwoColumnParagraphGapVh({
      search: "?layout=two-column-scroll&gap=42&theme=light",
      gapVh: kpEconomicsTwoColumnParagraphGapDefaultVh
    }),
    "?layout=two-column-scroll&theme=light"
  );
});

test("graph stroke tuning is bounded, theme-relative, and URL-reproducible", () => {
  assert.equal(readKpEconomicsGraphStrokeScale(""), 1);
  assert.equal(readKpEconomicsGraphStrokeScale("?stroke=1.21"), 1.2);
  assert.equal(readKpEconomicsGraphStrokeScale("?stroke=9"), 1.75);
  assert.equal(
    writeKpEconomicsGraphStrokeScale({
      search: "?layout=two-column-scroll&theme=light",
      scale: 1.2
    }),
    "?layout=two-column-scroll&theme=light&stroke=1.20"
  );
  assert.equal(
    writeKpEconomicsGraphStrokeScale({
      search: "?layout=two-column-scroll&stroke=1.20",
      scale: 1
    }),
    "?layout=two-column-scroll"
  );
  assert.deepEqual(projectKpEconomicsGraphStrokeWidths(1.2), {
    darkPx: 1.2,
    darkGhostCorePx: 0.6,
    lightPx: 1.5,
    lightGhostCorePx: 0.75
  });
});

test("two-column prose focuses at 35vh with a short-block plateau", () => {
  const focused = projectKpTwoColumnScrollParagraph({
    paragraphTopPx: 280,
    paragraphBottomPx: 360,
    previousParagraphTopPx: 40,
    focusTopPx: 280,
    viewportHeightPx: 800
  });
  assert.equal(focused.phase, "passed");
  assert.equal(focused.travel, 1);
  assert.equal(focused.distanceFromStageBottomPx, 0);
  assert.equal(focused.salience, 1);
  assert.equal(focused.opacity, 1);

  const approaching = projectKpTwoColumnScrollParagraph({
    paragraphTopPx: 520,
    paragraphBottomPx: 600,
    previousParagraphTopPx: 280,
    focusTopPx: 280,
    viewportHeightPx: 800
  });
  assert.equal(approaching.phase, "approach");
  assert.equal(approaching.travel, 0);
  assert.ok(approaching.salience > 0);
  assert.ok(approaching.salience < 1);

  const passed = projectKpTwoColumnScrollParagraph({
    paragraphTopPx: 80,
    paragraphBottomPx: 160,
    previousParagraphTopPx: -160,
    focusTopPx: 280,
    viewportHeightPx: 800
  });
  assert.equal(passed.phase, "passed");
  assert.equal(passed.travel, 1);
  assert.equal(passed.salience, 0);
  assert.equal(passed.opacity, 0.32);
});

test("opening prose exposes continuous approach progress without replaying state", () => {
  const project = (paragraphTopPx: number) =>
    projectKpTwoColumnScrollParagraph({
      paragraphTopPx,
      paragraphBottomPx: paragraphTopPx + 80,
      focusTopPx: 280,
      viewportHeightPx: 800,
      opening: true
    });

  assert.equal(project(624).crossingProgress, 0);
  assert.equal(project(452).crossingProgress, 0.5);
  assert.equal(project(280).crossingProgress, 1);
  assert.equal(project(452).travel, 0);
});

test("paragraph salience hands off after predecessor settlement", () => {
  const settled = projectKpTwoColumnScrollSequence({
    paragraphTopPx: [280, 700, 1000],
    paragraphBottomPx: [360, 780, 1080],
    focusTopPx: 280,
    viewportHeightPx: 800
  });
  assert.equal(settled.attentionIndex, 0);
  assert.deepEqual(settled.paragraphs.map(({ opacity }) => opacity), [
    1, 0.32, 0.32
  ]);

  const handoff = projectKpTwoColumnScrollSequence({
    paragraphTopPx: [200, 400, 800],
    paragraphBottomPx: [280, 480, 880],
    focusTopPx: 280,
    viewportHeightPx: 800
  });
  assert.equal(handoff.attentionIndex, 1);
  assert.ok(handoff.paragraphs[0]!.opacity < handoff.paragraphs[1]!.opacity);

  const focused = projectKpTwoColumnScrollSequence({
    paragraphTopPx: [160, 280, 700],
    paragraphBottomPx: [240, 360, 780],
    focusTopPx: 280,
    viewportHeightPx: 800
  });
  assert.equal(focused.attentionIndex, 1);
  assert.deepEqual(focused.paragraphs.map(({ ownsAttention }) => ownsAttention), [
    false, true, false
  ]);
});

test("two-column motion stays at zero through its post-latch start", () => {
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
    focusTopPx: 280,
    viewportHeightPx: 800
  });

  assert.equal(corridor.startViewportRatio, 0.62);
  assert.equal(corridor.endViewportRatio, 0.35);
  assert.deepEqual(corridor.keyframes, [
    { travel: 0, progress: 0 },
    { travel: 0.5375, progress: 0.72 },
    { travel: 0.6875, progress: 0.72 },
    { travel: 1, progress: 1 }
  ]);
  assert.deepEqual(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 496,
    viewportHeight: 800
  }), { travel: 0, progress: 0 });
  const firstPostLatchPixel = projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 495,
    viewportHeight: 800
  });
  assert.ok(firstPostLatchPixel.travel > 0);
  assert.ok(firstPostLatchPixel.progress > 0);
  assert.deepEqual(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 280,
    viewportHeight: 800
  }), { travel: 1, progress: 1 });

  const shortCorridor = projectKpTwoColumnScrollMotionCorridor({
    corridor,
    paragraphDistancePx: 160,
    focusTopPx: 280,
    viewportHeightPx: 800
  });
  assert.equal(shortCorridor.startViewportRatio, 0.55);
  assert.equal(shortCorridor.endViewportRatio, 0.35);
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
