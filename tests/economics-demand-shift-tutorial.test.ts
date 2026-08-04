import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  findKpEconomicsDemandShiftCheckpointIndex,
  kpEconomicsDemandShiftCheckpoints,
  selectKpEconomicsDemandShiftPlaybackCheckpointId,
  stepKpEconomicsDemandShiftCheckpoint
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-checkpoints.ts";
import {
  compileKpEconomicsDemandShiftLesson
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-lesson-compiler.ts";
import {
  compileKpEconomicsDemandShiftPublication
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-publication.ts";
import {
  resolveKpEconomicsDemandShiftInitialDestination
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-deep-link.ts";
import {
  findKpEconomicsMotionBlock,
  findKpEconomicsMotionCheckpoint,
  kpEconomicsMotionBlocks,
  projectKpEconomicsLessonMotion
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-motion-blocks.ts";
import {
  projectKpTutorialCorridorTravel,
  projectKpTutorialMotionCorridor,
  projectKpTutorialRebasedCorridor,
  projectKpTutorialScrollFrame
} from "../src/tutorial/kp-tutorial-motion.ts";
import {
  kpEconomicsStageCompositionInterval,
  projectKpEconomicsStageComposition
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-stage-composition.ts";
import {
  projectKpEconomicsVerificationReveal
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-verification.ts";
import {
  renderKpEconomicsVerificationSurface
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-verification-surface.ts";
import {
  isKpEconomicsDemandShiftTutorialRoute,
  kpEconomicsDemandShiftTutorialPath
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-route.ts";
import {
  resolveKpEconomicsDemandShiftTocDestination
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-toc.ts";
import {
  renderKpTutorialScrubBar
} from "../src/tutorial/kp-tutorial-scrub-bar-renderer.ts";
import {
  parseKpTutorialDestinationHash,
  serializeKpTutorialDestinationHash,
  serializeKpTutorialDestinationHref
} from "../src/tutorial/kp-tutorial-url.ts";

test("economics demand-shift tutorial owns one stable route", () => {
  assert.equal(
    kpEconomicsDemandShiftTutorialPath,
    "/tutorials/economics/demand-shift/"
  );
  assert.equal(
    isKpEconomicsDemandShiftTutorialRoute(
      "/tutorials/economics/demand-shift"
    ),
    true
  );
  assert.equal(isKpEconomicsDemandShiftTutorialRoute("/"), false);
});

test("semantic tutorial URLs round-trip without choreography coordinates", () => {
  const destinations = [
    { kind: "section" as const, id: "market-clearing" },
    { kind: "block" as const, id: "supply-movement" },
    { kind: "checkpoint" as const, id: "movement-verified" }
  ];
  for (const destination of destinations) {
    const hash = serializeKpTutorialDestinationHash(destination);
    assert.deepEqual(parseKpTutorialDestinationHash(hash), destination);
  }
  assert.equal(
    serializeKpTutorialDestinationHref(
      "/tutorials/economics/demand-shift/?example=18#old",
      destinations[2]!
    ),
    "/tutorials/economics/demand-shift/?example=18#kp-checkpoint-movement-verified"
  );
  assert.deepEqual(
    parseKpTutorialDestinationHash("#kp-section-market%2Dclearing"),
    destinations[0]
  );
  for (const invalid of [
    "",
    "#kp-progress-0.72",
    "#kp-checkpoint-0.72",
    "#kp-block-Supply-Movement",
    "#kp-section-",
    "#kp-checkpoint-movement--verified",
    "#kp-checkpoint-%E0%A4%A"
  ]) {
    assert.equal(parseKpTutorialDestinationHash(invalid), undefined);
  }
  assert.throws(
    () => serializeKpTutorialDestinationHash({
      kind: "checkpoint",
      id: "0.72"
    }),
    /require a section, block, or checkpoint slug/
  );
});

test("semantic deep links resolve complete cumulative economics state", () => {
  const markdown = readFileSync(new URL(
    "../content/lessons/economics-demand-shift.md",
    import.meta.url
  ), "utf8");
  const lesson = compileKpEconomicsDemandShiftLesson(markdown);
  const handoff = resolveKpEconomicsDemandShiftInitialDestination({
    lesson,
    hash: "#kp-checkpoint-shift-handoff"
  });
  assert.equal(handoff.passageId, "follow-shift");
  assert.equal(handoff.motion.demandShiftProgress, 0.72);
  assert.equal(handoff.motion.supplyMovementProgress, 0);
  assert.equal(handoff.motion.scene.market, "shifting");
  assert.equal(handoff.motionScroll?.travel, 0.57);

  const supplyBlock = resolveKpEconomicsDemandShiftInitialDestination({
    lesson,
    hash: "#kp-block-supply-movement"
  });
  assert.equal(supplyBlock.passageId, "shift-versus-movement");
  assert.equal(supplyBlock.motion.demandShiftProgress, 1);
  assert.equal(supplyBlock.motion.supplyMovementProgress, 0);
  assert.equal(supplyBlock.motionScroll?.travel, 0);

  const verified = resolveKpEconomicsDemandShiftInitialDestination({
    lesson,
    hash: "#kp-checkpoint-movement-verified"
  });
  assert.equal(verified.motion.demandShiftProgress, 1);
  assert.equal(verified.motion.supplyMovementProgress, 1);
  assert.equal(verified.motion.scene.presentation, "comparison-verified");
  assert.equal(verified.motion.composition.phase, "split");
  assert.equal(verified.motion.verification.phase, "verified");

  const modelScope = resolveKpEconomicsDemandShiftInitialDestination({
    lesson,
    hash: "#kp-section-model-scope"
  });
  assert.equal(modelScope.passageId, "scope");
  assert.equal(modelScope.motion.demandShiftProgress, 1);
  assert.equal(modelScope.motion.supplyMovementProgress, 1);
  assert.equal(modelScope.motionScroll, undefined);

  const invalid = resolveKpEconomicsDemandShiftInitialDestination({
    lesson,
    hash: "#kp-checkpoint-0.72"
  });
  assert.equal(invalid.destination, undefined);
  assert.equal(invalid.passageId, "context");
  assert.equal(invalid.motion.demandShiftProgress, 0);
  assert.equal(invalid.motion.supplyMovementProgress, 0);
});

test("economics defines two local motion blocks with exact scene handoff", () => {
  assert.deepEqual(kpEconomicsMotionBlocks.map((block) => ({
    id: block.id,
    passageId: block.passageId,
    entry: block.entry,
    settled: block.settled,
    inlineStickyScrollTravelRatio: block.inlineStickyScrollTravelRatio,
    checkpoints: block.checkpoints.map(({ id, progress }) => [id, progress])
  })), [
    {
      id: "demand-shift",
      passageId: "follow-shift",
      entry: { market: "initial", presentation: "graph-only" },
      settled: { market: "shifted", presentation: "graph-only" },
      inlineStickyScrollTravelRatio: 0.52,
      checkpoints: [
        ["shift-ready", 0],
        ["shift-handoff", 0.72],
        ["shift-settled", 1]
      ]
    },
    {
      id: "supply-movement",
      passageId: "shift-versus-movement",
      entry: { market: "shifted", presentation: "graph-only" },
      settled: { market: "shifted", presentation: "comparison-verified" },
      inlineStickyScrollTravelRatio: 0.48,
      checkpoints: [
        ["movement-ready", 0],
        ["movement-traced", 0.58],
        ["movement-verified", 1]
      ]
    }
  ]);
  assert.deepEqual(
    kpEconomicsMotionBlocks[0]!.settled,
    kpEconomicsMotionBlocks[1]!.entry
  );
  assert.equal(findKpEconomicsMotionBlock("missing"), undefined);
  assert.equal(findKpEconomicsMotionCheckpoint({
    blockId: "supply-movement",
    checkpointId: "movement-traced"
  })?.progress, 0.58);
});

test("lesson motion projection settles predecessors and ignores DOM history", () => {
  const shifting = projectKpEconomicsLessonMotion({
    activeBlockId: "demand-shift",
    localProgress: 0.4
  });
  assert.deepEqual({
    activeBlockId: shifting.activeBlockId,
    blocks: shifting.blocks,
    demandShiftProgress: shifting.demandShiftProgress,
    supplyMovementProgress: shifting.supplyMovementProgress,
    scene: shifting.scene
  }, {
    activeBlockId: "demand-shift",
    blocks: [
      { id: "demand-shift", status: "active", progress: 0.4 },
      { id: "supply-movement", status: "inactive", progress: 0 }
    ],
    demandShiftProgress: 0.4,
    supplyMovementProgress: 0,
    scene: { market: "shifting", presentation: "graph-only" }
  });

  const tracing = projectKpEconomicsLessonMotion({
    activeBlockId: "supply-movement",
    localProgress: 0.58
  });
  assert.deepEqual({
    activeBlockId: tracing.activeBlockId,
    blocks: tracing.blocks,
    demandShiftProgress: tracing.demandShiftProgress,
    supplyMovementProgress: tracing.supplyMovementProgress,
    scene: tracing.scene
  }, {
    activeBlockId: "supply-movement",
    blocks: [
      { id: "demand-shift", status: "settled", progress: 1 },
      { id: "supply-movement", status: "active", progress: 0.58 }
    ],
    demandShiftProgress: 1,
    supplyMovementProgress: 0.58,
    scene: { market: "shifted", presentation: "supply-trace" }
  });

  assert.equal(projectKpEconomicsLessonMotion({
    activeBlockId: "supply-movement",
    localProgress: 1
  }).scene.presentation, "comparison-verified");
  assert.equal(projectKpEconomicsLessonMotion({
    activeBlockId: "supply-movement",
    localProgress: -4
  }).demandShiftProgress, 1);
  assert.equal(projectKpEconomicsLessonMotion({
    activeBlockId: "demand-shift",
    localProgress: Number.NaN
  }).demandShiftProgress, 0);
  assert.equal(shifting.composition.phase, "merged");
  assert.equal(tracing.composition.phase, "merged");
});

test("economics stage composition has stable reversible merge and split endpoints", () => {
  const merged = projectKpEconomicsStageComposition(
    kpEconomicsStageCompositionInterval.start
  );
  const midpoint = projectKpEconomicsStageComposition(0.71);
  const split = projectKpEconomicsStageComposition(
    kpEconomicsStageCompositionInterval.end
  );

  assert.deepEqual(merged, {
    phase: "merged",
    progress: 0,
    stage: {
      id: "economics-stage",
      rect: { inline: 0, block: 0, inlineSize: 1, blockSize: 1 }
    },
    slots: [
      {
        id: "graph-slot",
        rect: { inline: 0, block: 0, inlineSize: 1, blockSize: 1 }
      },
      {
        id: "verification-slot",
        rect: { inline: 0.7, block: 0.14, inlineSize: 0.28, blockSize: 0.72 }
      }
    ],
    aperture: {
      id: "verification-aperture",
      edge: "inline-end",
      openness: 0,
      rect: { inline: 0.98, block: 0.14, inlineSize: 0, blockSize: 0.72 }
    },
    surfaces: [
      {
        id: "market-graph",
        slotId: "graph-slot",
        lifecycle: "present",
        rect: { inline: 0, block: 0, inlineSize: 1, blockSize: 1 }
      },
      {
        id: "equilibrium-verification",
        slotId: "verification-slot",
        lifecycle: "outside",
        rect: { inline: 0.98, block: 0.14, inlineSize: 0.28, blockSize: 0.72 }
      }
    ]
  });
  assert.equal(midpoint.phase, "composing");
  assert.equal(midpoint.progress, 0.5);
  assert.deepEqual(midpoint.slots[0]!.rect, {
    inline: 0.01,
    block: 0.015,
    inlineSize: 0.8200000000000001,
    blockSize: 0.97
  });
  assert.deepEqual(split, {
    phase: "split",
    progress: 1,
    stage: merged.stage,
    slots: [
      {
        id: "graph-slot",
        rect: { inline: 0.02, block: 0.03, inlineSize: 0.64, blockSize: 0.94 }
      },
      merged.slots[1]
    ],
    aperture: {
      id: "verification-aperture",
      edge: "inline-end",
      openness: 1,
      rect: { inline: 0.7, block: 0.14, inlineSize: 0.28, blockSize: 0.72 }
    },
    surfaces: [
      {
        id: "market-graph",
        slotId: "graph-slot",
        lifecycle: "present",
        rect: { inline: 0.02, block: 0.03, inlineSize: 0.64, blockSize: 0.94 }
      },
      {
        id: "equilibrium-verification",
        slotId: "verification-slot",
        lifecycle: "settled",
        rect: { inline: 0.7, block: 0.14, inlineSize: 0.28, blockSize: 0.72 }
      }
    ]
  });
  assert.deepEqual(
    projectKpEconomicsStageComposition(Number.NaN),
    projectKpEconomicsStageComposition(-1)
  );
  assert.deepEqual(
    projectKpEconomicsStageComposition(1),
    projectKpEconomicsStageComposition(4)
  );
  assert.equal(Object.isFrozen(split), true);
  assert.equal(Object.isFrozen(split.slots), true);
  assert.equal(Object.isFrozen(split.slots[0]!.rect), true);

  const sampleInputs = Array.from({ length: 101 }, (_, index) => index / 100);
  const reverseSamples = [...sampleInputs].reverse().map((progress) =>
    projectKpEconomicsStageComposition(progress).progress
  ).reverse();
  const forwardSamples = sampleInputs.map((progress) =>
    projectKpEconomicsStageComposition(progress).progress
  );
  assert.deepEqual(reverseSamples, forwardSamples);
});

test("verification math is static KaTeX HTML with synchronized semantic groups", () => {
  const html = renderKpEconomicsVerificationSurface();

  assert.match(html, /data-kp-math-renderer="static-katex-html"/);
  assert.match(html, /data-kp-economics-verification-group="supply-rule"/);
  assert.match(html, /data-kp-economics-verification-group="equilibria"/);
  assert.match(html, /data-kp-economics-verification-group="changes"/);
  assert.match(html, /data-kp-economics-verification-targets="initial-equilibrium settled-equilibrium"/);
  assert.match(html, /class="katex"/);
  assert.match(html, /<math/);
  assert.doesNotMatch(html, /<script/);

  assert.deepEqual(projectKpEconomicsVerificationReveal(0.58), {
    phase: "hidden",
    groups: { "supply-rule": 0, equilibria: 0, changes: 0 }
  });
  const supplyMidpoint = projectKpEconomicsVerificationReveal(0.64);
  assert.equal(supplyMidpoint.phase, "supply-rule");
  assert.equal(Math.abs(supplyMidpoint.groups["supply-rule"] - 0.5) < 1e-12, true);
  assert.equal(supplyMidpoint.groups.equilibria, 0);
  assert.equal(supplyMidpoint.groups.changes, 0);

  const equilibriaMidpoint = projectKpEconomicsVerificationReveal(0.79);
  assert.equal(equilibriaMidpoint.phase, "equilibria");
  assert.equal(equilibriaMidpoint.groups["supply-rule"], 1);
  assert.equal(Math.abs(equilibriaMidpoint.groups.equilibria - 0.5) < 1e-12, true);
  assert.equal(equilibriaMidpoint.groups.changes, 0);

  const changesMidpoint = projectKpEconomicsVerificationReveal(0.93);
  assert.equal(changesMidpoint.phase, "changes");
  assert.equal(changesMidpoint.groups["supply-rule"], 1);
  assert.equal(changesMidpoint.groups.equilibria, 1);
  assert.equal(Math.abs(changesMidpoint.groups.changes - 0.5) < 1e-12, true);
  assert.deepEqual(projectKpEconomicsVerificationReveal(1), {
    phase: "verified",
    groups: { "supply-rule": 1, equilibria: 1, changes: 1 }
  });
});

test("viewport corridors preserve authored holds in both scroll directions", () => {
  const corridor = kpEconomicsMotionBlocks[0]!.corridor;
  const sampledTravel = Array.from({ length: 1001 }, (_, index) => index / 1000);
  const forward = sampledTravel.map((travel) =>
    projectKpTutorialCorridorTravel(corridor, travel)
  );
  const reverse = [...sampledTravel].reverse().map((travel) =>
    projectKpTutorialCorridorTravel(corridor, travel)
  ).reverse();

  assert.deepEqual(forward, reverse);
  assert.equal(forward.every((progress, index) =>
    index === 0 || progress + Number.EPSILON >= forward[index - 1]!
  ), true);
  assert.equal(projectKpTutorialCorridorTravel(corridor, 0.14), 0);
  assert.equal(projectKpTutorialCorridorTravel(corridor, 0.57), 0.72);
  assert.equal(projectKpTutorialCorridorTravel(corridor, 0.63), 0.72);
  assert.equal(projectKpTutorialCorridorTravel(corridor, 0.94), 1);

  assert.deepEqual(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 720,
    viewportHeight: 1000
  }), { travel: 0, progress: 0 });
  assert.deepEqual(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 160,
    viewportHeight: 1000
  }), { travel: 1, progress: 1 });
  assert.equal(projectKpTutorialMotionCorridor({
    corridor,
    anchorTop: 380,
    viewportHeight: 1000
  }).progress, 0.72);
});

test("one coordinated scroll frame grants paint ownership to one block", () => {
  const projection = projectKpTutorialScrollFrame({
    viewportHeight: 1000,
    blocks: [
      {
        id: "demand-shift",
        anchorTop: 410,
        corridor: kpEconomicsMotionBlocks[0]!.corridor
      },
      {
        id: "supply-movement",
        anchorTop: 385,
        corridor: kpEconomicsMotionBlocks[1]!.corridor
      }
    ]
  });

  assert.equal(projection.activeBlockId, "supply-movement");
  assert.deepEqual(
    projection.blocks.filter(({ ownsScroll }) => ownsScroll).map(({ id }) => id),
    ["supply-movement"]
  );
  assert.equal(projectKpTutorialScrollFrame({
    viewportHeight: 1000,
    blocks: []
  }).activeBlockId, undefined);
});

test("manual corridor takeover rebases the next scroll without a jump", () => {
  const corridor = kpEconomicsMotionBlocks[0]!.corridor;
  const takeover = projectKpTutorialRebasedCorridor({
    corridor,
    rawTravelAtTakeover: 0.4,
    manualProgress: 0.72,
    rawTravel: 0.4
  });
  const onePixelDown = projectKpTutorialRebasedCorridor({
    corridor,
    rawTravelAtTakeover: 0.4,
    manualProgress: 0.72,
    rawTravel: 0.401
  });
  const upward = projectKpTutorialRebasedCorridor({
    corridor,
    rawTravelAtTakeover: 0.4,
    manualProgress: 0.72,
    rawTravel: 0.3
  });

  assert.deepEqual(takeover, { travel: 0.57, progress: 0.72 });
  assert.equal(onePixelDown.progress - takeover.progress < 0.01, true);
  assert.equal(onePixelDown.progress >= takeover.progress, true);
  assert.equal(upward.progress < takeover.progress, true);
});

test("approved Markdown compiles into the complete annotated lesson", () => {
  const markdown = readFileSync(new URL(
    "../content/lessons/economics-demand-shift.md",
    import.meta.url
  ), "utf8");
  const lesson = compileKpEconomicsDemandShiftLesson(markdown);
  const passageIds = lesson.sections.flatMap(({ passages }) =>
    passages.map(({ id }) => id)
  );

  assert.equal(lesson.sections.length, 4);
  assert.deepEqual(lesson.sections.map(({ id }) => id), [
    "equilibrium",
    "demand-increase",
    "market-clearing",
    "model-scope"
  ]);
  assert.deepEqual(passageIds, [
    "context",
    "initial-equilibrium",
    "demand-change",
    "prediction",
    "follow-shift",
    "new-equilibrium",
    "shift-versus-movement",
    "equation-check",
    "scope",
    "synthesis",
    "explore"
  ]);
  assert.deepEqual(
    lesson.sections.flatMap(({ passages }) => passages.flatMap((passage) =>
      passage.motionBlockId === undefined
        ? []
        : [[passage.id, passage.motionBlockId]]
    )),
    [
      ["follow-shift", "demand-shift"],
      ["shift-versus-movement", "supply-movement"]
    ]
  );
  assert.match(
    lesson.sections[0]!.passages[0]!.paragraphs[0]!.html,
    /data-kp-latex="Q"/
  );
  assert.doesNotMatch(
    lesson.sections[0]!.passages[0]!.paragraphs[0]!.html,
    /<script/
  );
});

test("active TOC destinations stop at lesson sections and animation blocks", () => {
  const markdown = readFileSync(new URL(
    "../content/lessons/economics-demand-shift.md",
    import.meta.url
  ), "utf8");
  const lesson = compileKpEconomicsDemandShiftLesson(markdown);
  assert.deepEqual(resolveKpEconomicsDemandShiftTocDestination({
    lesson,
    passageId: "context"
  }), { kind: "section", id: "equilibrium" });
  assert.deepEqual(resolveKpEconomicsDemandShiftTocDestination({
    lesson,
    passageId: "follow-shift"
  }), { kind: "block", id: "demand-shift" });
  assert.deepEqual(resolveKpEconomicsDemandShiftTocDestination({
    lesson,
    passageId: "shift-versus-movement"
  }), { kind: "block", id: "supply-movement" });
});

test("static tutorial scrubber has final light DOM and native checkpoint links", () => {
  const html = renderKpTutorialScrubBar({
    blockId: "demand-shift",
    checkpoints: [
      { id: "ready", label: "Ready", progress: 0, href: "#ready" },
      { id: "handoff", label: "Handoff", progress: 0.72, href: "#handoff" },
      { id: "settled", label: "Settled", progress: 1, href: "#settled" }
    ]
  });

  assert.match(html, /^<kp-tutorial-scrub-bar/);
  assert.match(html, /data-kp-tutorial-scrub-enhancement="pending"/);
  assert.match(html, /<a[^>]+href="#ready"[^>]+data-action="rewind"/);
  assert.match(html, /<a[^>]+href="#handoff"[^>]+data-action="next"/);
  assert.match(html, /<button[^>]+data-action="toggle" disabled>Play/);
  assert.match(html, /<input[^>]+data-action="seek"[^>]+disabled/);
  assert.match(html, /<option value="0\.72" label="Handoff">/);
  assert.doesNotMatch(html, /<style|<script|shadow/);
});

test("concise lesson authoring expands into one complete static publication", () => {
  const markdown = readFileSync(new URL(
    "../content/lessons/economics-demand-shift.md",
    import.meta.url
  ), "utf8");
  const publication = compileKpEconomicsDemandShiftPublication(markdown);

  assert.equal(publication.lesson.sections.length, 4);
  assert.deepEqual(Object.keys(publication.motionScrubBarHtml), [
    "demand-shift",
    "supply-movement"
  ]);
  assert.match(publication.tocHtml, /<kp-tutorial-toc/);
  assert.match(
    publication.motionScrubBarHtml["demand-shift"],
    /href="\/tutorials\/economics\/demand-shift\/#kp-checkpoint-shift-handoff"/
  );
  assert.match(
    publication.motionScrubBarHtml["supply-movement"],
    /data-kp-tutorial-motion-controls="supply-movement"/
  );
  assert.match(publication.verificationSurfaceHtml, /<math/);
  assert.equal(Object.isFrozen(publication), true);
  assert.equal(Object.isFrozen(publication.motionScrubBarHtml), true);
  assert.deepEqual(
    compileKpEconomicsDemandShiftPublication(markdown),
    publication
  );
});

test("semantic checkpoint navigation is ordered, bounded, and reversible", () => {
  assert.deepEqual(
    kpEconomicsDemandShiftCheckpoints.map(({ id, progress }) => [id, progress]),
    [
      ["orient-market", 0],
      ["initial-equilibrium", 0],
      ["identify-change", 0],
      ["predict", 0],
      ["ready-to-shift", 0],
      ["handoff", 0.72],
      ["settled", 1],
      ["compare-equilibria", 1],
      ["equation-check", 1],
      ["scope", 1],
      ["synthesis", 1],
      ["explore", 1]
    ]
  );
  assert.equal(
    stepKpEconomicsDemandShiftCheckpoint({ currentIndex: 0, direction: -1 }),
    0
  );
  assert.equal(
    stepKpEconomicsDemandShiftCheckpoint({
      currentIndex: kpEconomicsDemandShiftCheckpoints.length - 1,
      direction: 1
    }),
    kpEconomicsDemandShiftCheckpoints.length - 1
  );
  const handoff = findKpEconomicsDemandShiftCheckpointIndex("handoff");
  assert.equal(
    stepKpEconomicsDemandShiftCheckpoint({ currentIndex: handoff, direction: -1 }),
    handoff - 1
  );
  assert.equal(
    stepKpEconomicsDemandShiftCheckpoint({ currentIndex: handoff, direction: 1 }),
    handoff + 1
  );
});

test("playback progress selects visual checkpoints without owning prose", () => {
  assert.deepEqual(
    [-1, 0.719, 0.72, 0.994, 0.995, 2].map((progress) =>
      selectKpEconomicsDemandShiftPlaybackCheckpointId(progress)
    ),
    [
      "ready-to-shift",
      "ready-to-shift",
      "handoff",
      "handoff",
      "settled",
      "settled"
    ]
  );
});

test("every semantic checkpoint declares one local salience target and context profile", () => {
  assert.deepEqual(
    kpEconomicsDemandShiftCheckpoints.map(({ id, attention }) => [
      id,
      attention.profile,
      attention.target
    ]),
    [
      ["orient-market", "market", "market"],
      ["initial-equilibrium", "equilibrium", "equilibrium"],
      ["identify-change", "demand", "demand"],
      ["predict", "equilibrium", "equilibrium"],
      ["ready-to-shift", "transition", "demand"],
      ["handoff", "transition", "equilibrium"],
      ["settled", "equilibrium", "equilibrium"],
      ["compare-equilibria", "comparison", "supply"],
      ["equation-check", "equations", "equations"],
      ["scope", "boundary", "equilibrium"],
      ["synthesis", "synthesis", "supply"],
      ["explore", "exploration", "demand"]
    ]
  );
  assert.equal(
    kpEconomicsDemandShiftCheckpoints.every(({ attention }) =>
      attention.targetSelector.startsWith("[data-kp-economics-") &&
      attention.spotlightRadius >= 72 &&
      attention.targetAnchor >= 0 && attention.targetAnchor <= 1
    ),
    true
  );
});
