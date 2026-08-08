import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpAnimationStationCuePresence,
  projectKpAnimationStationEntrance,
  projectKpAnimationStationExit,
  projectKpAnimationStationGeometry,
  projectKpAnimationStationMotionCuePresence,
  projectKpAnimationStationMotionCorridor,
  projectKpAnimationStationReadingCycle,
  projectKpAnimationStationReadingPresence,
  projectKpInlineStickyLessonLayout,
  projectKpInlineStickyParagraph,
  projectKpInlineStickyParagraphMotionCorridor,
  projectKpTwoColumnScrollMotionCorridor,
  projectKpTwoColumnScrollParagraph,
  projectKpTwoColumnScrollSequence,
  kpEconomicsTwoColumnParagraphGapDefaultVh,
  kpEconomicsTwoColumnParagraphGapMaximumVh,
  kpEconomicsMotionBridgeDwellExemplarSearch,
  kpEconomicsMotionBridgeExemplarSearch,
  kpEconomicsAnimationStationExemplarSearch,
  kpEconomicsTwoColumnScrollCanonicalSearch,
  readKpEconomicsTwoColumnParagraphGapVh,
  readKpEconomicsDemandShiftPresentationLayout,
  readKpEconomicsMotionBridgeDwellProfile,
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
  kpEconomicsContextOpacityDefault,
  kpEconomicsProseLineHeightDefault,
  kpEconomicsProseWeightDefault,
  kpEconomicsTextWidthDefaultRem,
  readKpEconomicsContextOpacity,
  readKpEconomicsMutedBlue,
  readKpEconomicsMutedRed,
  readKpEconomicsProseLineHeight,
  readKpEconomicsProseWeight,
  readKpEconomicsTextWidthRem,
  writeKpEconomicsContextOpacity,
  writeKpEconomicsMutedBlue,
  writeKpEconomicsMutedRed,
  writeKpEconomicsProseLineHeight,
  writeKpEconomicsProseWeight,
  writeKpEconomicsTextWidthRem
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-visual-tuning.ts";

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
    readKpEconomicsDemandShiftPresentationLayout(
      kpEconomicsAnimationStationExemplarSearch
    ),
    "animation-station"
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

test("motion bridge dwell profiles are named and fail closed outside the exemplar", () => {
  assert.equal(
    kpEconomicsMotionBridgeDwellExemplarSearch,
    "?layout=two-column-scroll&scrub=motion-bridge&dwell=recommended"
  );
  for (const profile of ["preserve", "medium", "recommended"] as const) {
    assert.equal(
      readKpEconomicsMotionBridgeDwellProfile(
        `${kpEconomicsMotionBridgeExemplarSearch}&dwell=${profile}`
      ),
      profile
    );
  }
  assert.equal(
    readKpEconomicsMotionBridgeDwellProfile(
      `${kpEconomicsMotionBridgeExemplarSearch}&dwell=unknown`
    ),
    "none"
  );
  assert.equal(
    readKpEconomicsMotionBridgeDwellProfile("?dwell=recommended"),
    "none"
  );
  assert.equal(
    readKpEconomicsMotionBridgeDwellProfile(
      "?layout=two-column-scroll&dwell=recommended"
    ),
    "none"
  );
});

test("two-column text side is URL-reproducible and defaults left", () => {
  assert.equal(readKpEconomicsTwoColumnTextSide(""), "left");
  assert.equal(
    readKpEconomicsTwoColumnTextSide("?layout=two-column-scroll&text=right"),
    "right"
  );
  assert.equal(
    writeKpEconomicsTwoColumnTextSide({
      search: "?layout=two-column-scroll&theme=light",
      side: "left"
    }),
    "?layout=two-column-scroll&theme=light"
  );
  assert.equal(
    writeKpEconomicsTwoColumnTextSide({
      search: "?layout=two-column-scroll&text=right&theme=light",
      side: "right"
    }),
    "?layout=two-column-scroll&text=right&theme=light"
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

test("economics salience and typography tuning is bounded and URL-reproducible", () => {
  assert.equal(readKpEconomicsContextOpacity(""), kpEconomicsContextOpacityDefault);
  assert.equal(readKpEconomicsContextOpacity("?context=0.43"), 0.45);
  assert.equal(readKpEconomicsContextOpacity("?context=-2"), 0.1);
  assert.equal(
    writeKpEconomicsContextOpacity({
      search: "?layout=two-column-scroll&theme=light",
      opacity: 0.45
    }),
    "?layout=two-column-scroll&theme=light&context=0.45"
  );
  assert.equal(
    writeKpEconomicsContextOpacity({
      search: "?layout=two-column-scroll&context=0.45",
      opacity: kpEconomicsContextOpacityDefault
    }),
    "?layout=two-column-scroll"
  );

  assert.equal(readKpEconomicsMutedBlue("?mutedBlue=1"), true);
  assert.equal(readKpEconomicsMutedBlue("?mutedBlue=true"), false);
  assert.equal(readKpEconomicsMutedRed("?mutedRed=1"), true);
  assert.equal(
    writeKpEconomicsMutedBlue({ search: "?layout=two-column-scroll", muted: true }),
    "?layout=two-column-scroll&mutedBlue=1"
  );
  assert.equal(
    writeKpEconomicsMutedRed({ search: "?mutedRed=1&theme=light", muted: false }),
    "?theme=light"
  );

  assert.equal(
    readKpEconomicsProseLineHeight(""),
    kpEconomicsProseLineHeightDefault
  );
  assert.equal(readKpEconomicsProseLineHeight("?leading=1.91"), 1.92);
  assert.equal(
    writeKpEconomicsProseLineHeight({ search: "?theme=light", lineHeight: 1.92 }),
    "?theme=light&leading=1.92"
  );

  assert.equal(readKpEconomicsTextWidthRem(""), kpEconomicsTextWidthDefaultRem);
  assert.equal(readKpEconomicsTextWidthRem("?measure=21.3"), 21.5);
  assert.equal(
    writeKpEconomicsTextWidthRem({ search: "?layout=two-column-scroll", widthRem: 21.5 }),
    "?layout=two-column-scroll&measure=21.5"
  );

  assert.equal(readKpEconomicsProseWeight(""), kpEconomicsProseWeightDefault);
  assert.equal(readKpEconomicsProseWeight("?weight=547"), 500);
  assert.equal(
    writeKpEconomicsProseWeight({ search: "?theme=light", weight: 600 }),
    "?theme=light&weight=600"
  );
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
    paragraphBottomPx: [480, 780, 1080],
    focusTopPx: 280,
    viewportHeightPx: 800
  });
  assert.equal(settled.attentionIndex, 0);
  assert.deepEqual(settled.paragraphs.map(({ salience }) => salience), [1, 0, 0]);

  const handoff = projectKpTwoColumnScrollSequence({
    paragraphTopPx: [200, 340, 800],
    paragraphBottomPx: [280, 420, 880],
    focusTopPx: 280,
    viewportHeightPx: 800
  });
  assert.equal(handoff.attentionIndex, 1);
  assert.ok(handoff.paragraphs[0]!.salience < handoff.paragraphs[1]!.salience);
  assert.equal(
    handoff.paragraphs[0]!.salience + handoff.paragraphs[1]!.salience,
    1
  );

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

  const terminal = projectKpTwoColumnScrollSequence({
    paragraphTopPx: [-200, 160],
    paragraphBottomPx: [-120, 240],
    focusTopPx: 280,
    viewportHeightPx: 800,
    totalParagraphCount: 2
  });
  assert.deepEqual(terminal.paragraphs.map(({ salience }) => salience), [0, 1]);
});

test("two-column motion consumes the full gap after its preceding passage", () => {
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

  assert.equal(corridor.startViewportRatio, 0.66);
  assert.equal(corridor.endViewportRatio, 0.35);
  assert.deepEqual(corridor.keyframes, [
    { travel: 0, progress: 0 },
    { travel: 0.5375, progress: 0.72 },
    { travel: 0.6875, progress: 0.72 },
    { travel: 1, progress: 1 }
  ]);
  assert.deepEqual(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 528,
    viewportHeight: 800
  }), { travel: 0, progress: 0 });
  const firstPostLatchPixel = projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 527,
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

test("animation station projects one usable-viewport rhythm", () => {
  const geometry = projectKpAnimationStationGeometry({
    viewportHeightPx: 900,
    usableTopPx: 50,
    usableBottomPx: 850
  });

  assert.deepEqual(Object.fromEntries(Object.entries(geometry).map(
    ([key, value]) => [key, Math.round(value * 1_000) / 1_000]
  )), {
    usableTopPx: 50,
    usableBottomPx: 850,
    usableHeightPx: 800,
    railTopY: 170,
    railBottomY: 730,
    railHeightPx: 560,
    graphTopY: 186,
    graphBottomY: 450,
    graphHeightPx: 264,
    cueRevealStartY: 730,
    cueRevealEndY: 610,
    cuePinStartY: 490,
    cuePinEndY: 370,
    cueExitEndY: 344.4,
    motionDistancePx: 400,
    motionScrubEndY: 24.4,
    motionSettleDistancePx: 80,
    motionEndY: -55.6,
    beatDistancePx: 592,
    railExitEndY: 674,
    graphExitStartY: 650,
    graphExitEndY: 530
  });
});

test("animation station rails wait for the graph's local latch", () => {
  const geometry = projectKpAnimationStationGeometry({
    viewportHeightPx: 900,
    usableTopPx: 50,
    usableBottomPx: 850
  });
  const approaching = projectKpAnimationStationEntrance({
    stageTopPx: 250,
    geometry
  });
  const near = projectKpAnimationStationEntrance({
    stageTopPx: 171.01,
    geometry
  });
  const latched = projectKpAnimationStationEntrance({
    stageTopPx: 170,
    geometry
  });
  const releasedAbove = projectKpAnimationStationEntrance({
    stageTopPx: 120,
    geometry
  });

  assert.equal(approaching.phase, "approaching");
  assert.equal(approaching.distanceToLatchPx, 80);
  assert.equal(approaching.railPresence, 0);
  assert.ok(approaching.stageProgress > 0);
  assert.ok(approaching.stageProgress < 1);
  assert.equal(near.phase, "approaching");
  assert.equal(near.railPresence, 0);
  assert.deepEqual(latched, {
    phase: "latched",
    distanceToLatchPx: 0,
    stageProgress: 1,
    railPresence: 1
  });
  assert.deepEqual(releasedAbove, latched);
});

test("animation station cue presence is reversible at every boundary", () => {
  const geometry = projectKpAnimationStationGeometry({
    viewportHeightPx: 800
  });
  const samples = [
    { cueTopPx: 720, cueBottomPx: 800 },
    { cueTopPx: 600, cueBottomPx: 680 },
    { cueTopPx: 540, cueBottomPx: 620 },
    { cueTopPx: 480, cueBottomPx: 560 },
    { cueTopPx: 440, cueBottomPx: 520 },
    { cueTopPx: 400, cueBottomPx: 480 },
    { cueTopPx: 307.2, cueBottomPx: 387.2 },
    { cueTopPx: 294.4, cueBottomPx: 374.4 }
  ].map(({ cueTopPx, cueBottomPx }) =>
    projectKpAnimationStationCuePresence({
      cueTopPx,
      cueBottomPx,
      geometry
    })
  );

  assert.deepEqual(samples.map(({ phase }) => phase), [
    "waiting",
    "waiting",
    "materializing",
    "bright",
    "bright",
    "pinned",
    "dissolving",
    "gone"
  ]);
  assert.deepEqual(samples.map(({ presence }) =>
    Math.round(presence * 1_000) / 1_000), [
    0, 0, 0.5, 1, 1, 1, 0.5, 0
  ]);
  assert.deepEqual(samples.map(({ scale }) =>
    Math.round(scale * 1_000) / 1_000), [
    0.95, 0.95, 0.975, 1, 1, 1, 0.975, 0.95
  ]);
  assert.deepEqual(samples.map(({ pinOffsetPx }) =>
    Math.round(pinOffsetPx * 1_000) / 1_000), [
    0, 0, 0, 0, 0, 40, 132.8, 145.6
  ]);
  assert.deepEqual(
    [...samples].reverse(),
    [
      { cueTopPx: 294.4, cueBottomPx: 374.4 },
      { cueTopPx: 307.2, cueBottomPx: 387.2 },
      { cueTopPx: 400, cueBottomPx: 480 },
      { cueTopPx: 440, cueBottomPx: 520 },
      { cueTopPx: 480, cueBottomPx: 560 },
      { cueTopPx: 540, cueBottomPx: 620 },
      { cueTopPx: 600, cueBottomPx: 680 },
      { cueTopPx: 720, cueBottomPx: 800 }
    ].map(({ cueTopPx, cueBottomPx }) =>
      projectKpAnimationStationCuePresence({
        cueTopPx,
        cueBottomPx,
        geometry
      })
    )
  );
});

test("animation station motion prose stays pinned through semantic motion", () => {
  const geometry = projectKpAnimationStationGeometry({
    viewportHeightPx: 800
  });
  const duringScrub = projectKpAnimationStationMotionCuePresence({
    cueTopPx: 100,
    cueBottomPx: 180,
    successorPresence: 0.8,
    geometry
  });
  const duringSettle = projectKpAnimationStationMotionCuePresence({
    cueTopPx: -50,
    cueBottomPx: 30,
    successorPresence: 0.8,
    geometry
  });

  assert.equal(duringScrub.phase, "pinned");
  assert.equal(duringScrub.presence, 1);
  assert.equal(duringScrub.pinOffsetPx, geometry.cuePinStartY - 100);
  assert.ok(Math.abs(duringSettle.presence - 0.2) < 1e-12);
  assert.equal(duringSettle.phase, "dissolving");
});

test("animation station reading release revives the same stage directly", () => {
  const geometry = projectKpAnimationStationGeometry({
    viewportHeightPx: 800
  });
  assert.equal(projectKpAnimationStationReadingPresence({
    paragraphAnchorPx: 620,
    geometry
  }), 0.5);

  const reading = projectKpAnimationStationReadingCycle({
    readingCueTopPx: 480,
    revivalCueTopPx: 800,
    terminalCueTopPx: 800,
    geometry
  });
  const reviving = projectKpAnimationStationReadingCycle({
    readingCueTopPx: 480,
    revivalCueTopPx: 620,
    terminalCueTopPx: 800,
    geometry
  });
  const revived = projectKpAnimationStationReadingCycle({
    readingCueTopPx: 480,
    revivalCueTopPx: 560,
    terminalCueTopPx: 800,
    geometry
  });
  const terminal = projectKpAnimationStationReadingCycle({
    readingCueTopPx: 480,
    revivalCueTopPx: 560,
    terminalCueTopPx: 540,
    geometry
  });

  assert.equal(reading.phase, "reading");
  assert.equal(reading.exit.graphProgress, 1);
  assert.equal(reviving.phase, "reviving");
  assert.equal(reviving.revivalProgress, 0.5);
  assert.equal(reviving.exit.graphProgress, 0.5);
  assert.equal(revived.phase, "revived");
  assert.equal(revived.exit.graphProgress, 0);
  assert.equal(terminal.phase, "terminal-release");
  assert.equal(terminal.exit.graphProgress, 0.5);
});

test("animation station release passage staggers rails before graph roles", () => {
  const geometry = projectKpAnimationStationGeometry({
    viewportHeightPx: 800
  });
  const initial = projectKpAnimationStationExit({
    releaseCueTopPx: 680,
    geometry
  });
  const midpoint = projectKpAnimationStationExit({
    releaseCueTopPx: 540,
    geometry
  });
  const final = projectKpAnimationStationExit({
    releaseCueTopPx: 480,
    geometry
  });

  assert.equal(initial.railProgress, 0);
  assert.equal(initial.graphProgress, 0);
  assert.deepEqual(Object.values(initial).slice(2), [1, 1, 1, 1, 1, 1, 1]);
  assert.equal(midpoint.railProgress, 1);
  assert.equal(midpoint.graphProgress, 0.5);
  assert.ok(midpoint.gridPresence < midpoint.guidePresence);
  assert.ok(midpoint.guidePresence < midpoint.axisPresence);
  assert.ok(midpoint.axisPresence < midpoint.supplyPresence);
  assert.ok(midpoint.supplyPresence < midpoint.demandPresence);
  assert.ok(midpoint.demandPresence < midpoint.pointPresence);
  assert.ok(midpoint.pointPresence < midpoint.labelPresence);
  assert.equal(final.railProgress, 1);
  assert.equal(final.graphProgress, 1);
  assert.deepEqual(Object.values(final).slice(2), [0, 0, 0, 0, 0, 0, 0]);
});

test("animation station spends its graph runway on a deterministic cue handoff", () => {
  const corridor = projectKpAnimationStationMotionCorridor({
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
    motionStartPx: 334,
    viewportHeightPx: 800,
    runwayPx: 400,
    settleRunwayPx: 80
  });

  assert.equal(corridor.startViewportRatio, 0.4175);
  assert.equal(corridor.endViewportRatio, -0.0825);
  assert.deepEqual(corridor.keyframes.map(({ progress }) => progress), [
    0, 0, 0.72, 0.72, 1, 1, 1
  ]);
  assert.deepEqual(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 334,
    viewportHeight: 800
  }), { travel: 0, progress: 0 });
  const handoff = projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 326,
    viewportHeight: 800
  });
  assert.ok(Math.abs(handoff.travel - 0.02) < 1e-12);
  assert.equal(handoff.progress, 0);
  assert.ok(Math.abs(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 170,
    viewportHeight: 800
  }).progress - 0.72) < 1e-12);
  assert.deepEqual(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: -66,
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
