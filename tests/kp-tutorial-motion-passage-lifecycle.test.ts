import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  disposeKpTutorialMotionPassage,
  projectKpTutorialBoundaryCueSalience,
  projectKpTutorialMotionPassageLifecycle,
  projectKpTutorialScrollPassagePhase,
  type KpTutorialMotionPassage
} from "../src/tutorial/kp-tutorial-motion-passage-lifecycle.ts";
import {
  projectKpTutorialUsableViewport,
  projectKpTutorialViewportAnchors,
  projectKpTutorialSynchronizedLatch,
  projectKpTutorialStageAssembly
} from "../src/tutorial/kp-tutorial-usable-viewport.ts";

test("the lifecycle contract remains framework and renderer neutral", async () => {
  const source = await readFile(
    new URL("../src/tutorial/kp-tutorial-motion-passage-lifecycle.ts", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(source, /^import\s/m);
  assert.doesNotMatch(
    source,
    /\b(?:HTMLElement|Window|IntersectionObserver|SVGElement|WebGLRenderingContext)\b/
  );
});

test("one focused passage owns motion while nearby stages hydrate within a bound", () => {
  const plan = projectKpTutorialMotionPassageLifecycle({
    passages: [
      passage("far-before", "economics", "distant", 1),
      passage("near-before", "economics", "near", 1),
      passage("focused", "economics", "visible", 0.42),
      passage("visible-after", "physics", "visible", 0),
      passage("near-after", "physics", "near", 0),
      passage("far-after", "physics", "distant", 0)
    ],
    focusedPassageId: "focused",
    reducedMotion: false,
    policy: { maxHydratedPassages: 3 }
  });

  assert.equal(plan.activeMotionPassageId, "focused");
  assert.deepEqual(plan.hydratedPassageIds, [
    "focused",
    "visible-after",
    "near-before"
  ]);
  assert.deepEqual(plan.requiredCapabilityIds, ["economics", "physics"]);
  assert.equal(
    plan.passages.filter(({ motion }) => motion === "active").length,
    1
  );
  assert.deepEqual(projected(plan, "far-before"), {
    attention: "background",
    geometry: "reserved",
    runtime: "dehydrated",
    motion: "paused",
    accessibility: "static",
    semanticProgress: 1
  });
  assert.deepEqual(projected(plan, "near-before"), {
    attention: "background",
    geometry: "reserved",
    runtime: "hydrated",
    motion: "paused",
    accessibility: "synchronized",
    semanticProgress: 1
  });
});

test("reduced motion retains visible focus and exact state without a motion owner", () => {
  const plan = projectKpTutorialMotionPassageLifecycle({
    passages: [passage("focused", "economics", "visible", 0.625)],
    focusedPassageId: "focused",
    reducedMotion: true,
    policy: { maxHydratedPassages: 1 }
  });

  assert.equal(plan.focusedPassageId, "focused");
  assert.equal(plan.activeMotionPassageId, undefined);
  assert.deepEqual(projected(plan, "focused"), {
    attention: "focused",
    geometry: "reserved",
    runtime: "hydrated",
    motion: "paused",
    accessibility: "synchronized",
    semanticProgress: 0.625
  });
});

test("shared capabilities deduplicate without sharing per-passage state", () => {
  const plan = projectKpTutorialMotionPassageLifecycle({
    passages: [
      passage("first", "shared.graph-2d", "visible", 1),
      passage("second", "shared.graph-2d", "near", 0.2),
      passage("third", "shared.graph-2d", "near", 0)
    ],
    focusedPassageId: "first",
    reducedMotion: false,
    policy: { maxHydratedPassages: 3 }
  });

  assert.deepEqual(plan.requiredCapabilityIds, ["shared.graph-2d"]);
  assert.deepEqual(
    plan.passages.map(({ id, semanticProgress }) => [id, semanticProgress]),
    [["first", 1], ["second", 0.2], ["third", 0]]
  );
});

test("disposal releases geometry, retains restorable state, and is idempotent", () => {
  const present = passage("removed", "economics", "near", 0.8);
  const disposed = disposeKpTutorialMotionPassage(present);
  assert.equal(disposeKpTutorialMotionPassage(disposed), disposed);

  const plan = projectKpTutorialMotionPassageLifecycle({
    passages: [disposed],
    reducedMotion: false,
    policy: { maxHydratedPassages: 1 }
  });
  assert.deepEqual(projected(plan, "removed"), {
    attention: "background",
    geometry: "released",
    runtime: "disposed",
    motion: "paused",
    accessibility: "removed",
    semanticProgress: 0.8
  });
  assert.deepEqual(plan.hydratedPassageIds, []);
  assert.deepEqual(plan.requiredCapabilityIds, []);
});

test("invalid focus, progress, identity, and hydration policy fail closed", () => {
  const base = [passage("one", "economics", "visible", 0.5)];
  assert.throws(() => projectKpTutorialMotionPassageLifecycle({
    passages: base,
    focusedPassageId: "missing",
    reducedMotion: false,
    policy: { maxHydratedPassages: 1 }
  }), /Unknown focused tutorial passage/);
  assert.throws(() => projectKpTutorialMotionPassageLifecycle({
    passages: [passage("one", "economics", "distant", 0.5)],
    focusedPassageId: "one",
    reducedMotion: false,
    policy: { maxHydratedPassages: 1 }
  }), /must be visible/);
  assert.throws(() => projectKpTutorialMotionPassageLifecycle({
    passages: [...base, ...base],
    reducedMotion: false,
    policy: { maxHydratedPassages: 1 }
  }), /Duplicate tutorial motion passage id/);
  assert.throws(() => projectKpTutorialMotionPassageLifecycle({
    passages: [passage("one", "economics", "visible", 1.01)],
    reducedMotion: false,
    policy: { maxHydratedPassages: 1 }
  }), /semantic progress must be within/);
  assert.throws(() => projectKpTutorialMotionPassageLifecycle({
    passages: base,
    reducedMotion: false,
    policy: { maxHydratedPassages: 0 }
  }), /positive integer/);
});

test("scroll passage phases depend on position rather than traversal history", () => {
  const timeline = {
    entryLatchScrollY: 100,
    motionStartScrollY: 120,
    terminalLatchScrollY: 500,
    releaseScrollY: 560
  };
  const positions = [80, 100, 119, 120, 499, 500, 559, 560];
  const forward = positions.map((scrollY) =>
    projectKpTutorialScrollPassagePhase({ scrollY, timeline })
  );
  const reverse = [...positions].reverse().map((scrollY) =>
    projectKpTutorialScrollPassagePhase({ scrollY, timeline })
  ).reverse();

  assert.deepEqual(forward, reverse);
  assert.deepEqual(forward.map(({ phase }) => phase), [
    "ordinary-document",
    "entry-latched",
    "entry-latched",
    "scrubbing",
    "scrubbing",
    "terminal-latched",
    "terminal-latched",
    "released"
  ]);
  assert.deepEqual(forward.map(({ motionEligible }) => motionEligible), [
    false, false, false, true, true, false, false, false
  ]);
});

test("scroll passage timelines reject non-finite and unordered authority", () => {
  assert.throws(() => projectKpTutorialScrollPassagePhase({
    scrollY: Number.NaN,
    timeline: {
      entryLatchScrollY: 0,
      motionStartScrollY: 1,
      terminalLatchScrollY: 2,
      releaseScrollY: 3
    }
  }), /scroll position must be finite/);
  assert.throws(() => projectKpTutorialScrollPassagePhase({
    scrollY: 0,
    timeline: {
      entryLatchScrollY: 0,
      motionStartScrollY: 2,
      terminalLatchScrollY: 1,
      releaseScrollY: 3
    }
  }), /thresholds must be ordered/);
});

test("boundary cue salience pins only the outer endpoint for passage state", () => {
  assert.deepEqual(projectKpTutorialBoundaryCueSalience({
    phase: "ordinary-document",
    cueIndex: 0,
    cueCount: 4,
    projectedOpacity: 0.32
  }), { opacity: 1, endpointPinned: true });
  assert.deepEqual(projectKpTutorialBoundaryCueSalience({
    phase: "scrubbing",
    cueIndex: 0,
    cueCount: 4,
    projectedOpacity: 0.48
  }), { opacity: 0.48, endpointPinned: false });
  assert.deepEqual(projectKpTutorialBoundaryCueSalience({
    phase: "terminal-latched",
    cueIndex: 3,
    cueCount: 4,
    projectedOpacity: 0.32
  }), { opacity: 1, endpointPinned: true });
  assert.deepEqual(projectKpTutorialBoundaryCueSalience({
    phase: "released",
    cueIndex: 2,
    cueCount: 4,
    projectedOpacity: 0.32
  }), { opacity: 0.32, endpointPinned: false });
});

test("boundary salience rejects invalid cue identity and opacity", () => {
  assert.throws(() => projectKpTutorialBoundaryCueSalience({
    phase: "scrubbing",
    cueIndex: 1,
    cueCount: 1,
    projectedOpacity: 1
  }), /cue index is outside/);
  assert.throws(() => projectKpTutorialBoundaryCueSalience({
    phase: "scrubbing",
    cueIndex: 0,
    cueCount: 1,
    projectedOpacity: 1.1
  }), /opacity must be within/);
});

test("one usable viewport removes persistent chrome exactly once", () => {
  assert.deepEqual(projectKpTutorialUsableViewport({
    viewportHeightPx: 800
  }), {
    viewportHeightPx: 800,
    topPx: 0,
    bottomPx: 800,
    heightPx: 800
  });
  assert.deepEqual(projectKpTutorialUsableViewport({
    viewportHeightPx: 800,
    persistentTopInsetPx: 64,
    persistentBottomInsetPx: 24
  }), {
    viewportHeightPx: 800,
    topPx: 64,
    bottomPx: 776,
    heightPx: 712
  });
});

test("usable viewport authority rejects invalid or occluded intervals", () => {
  assert.throws(() => projectKpTutorialUsableViewport({
    viewportHeightPx: 0
  }), /height must be positive/);
  assert.throws(() => projectKpTutorialUsableViewport({
    viewportHeightPx: 800,
    persistentTopInsetPx: -1
  }), /top inset must be finite and non-negative/);
  assert.throws(() => projectKpTutorialUsableViewport({
    viewportHeightPx: 800,
    persistentTopInsetPx: 700,
    persistentBottomInsetPx: 100
  }), /must leave a usable viewport/);
});

test("text and graph anchors share the same usable viewport interval", () => {
  assert.deepEqual(projectKpTutorialViewportAnchors({
    viewport: projectKpTutorialUsableViewport({ viewportHeightPx: 800 })
  }), {
    textY: 280,
    stageCenterY: 400,
    textRatio: 0.35,
    stageCenterRatio: 0.5
  });
  assert.deepEqual(projectKpTutorialViewportAnchors({
    viewport: projectKpTutorialUsableViewport({
      viewportHeightPx: 800,
      persistentTopInsetPx: 64,
      persistentBottomInsetPx: 24
    })
  }), {
    textY: 313.2,
    stageCenterY: 420,
    textRatio: 0.35,
    stageCenterRatio: 0.5
  });
});

test("viewport anchor ratios fail closed outside their shared interval", () => {
  const viewport = projectKpTutorialUsableViewport({ viewportHeightPx: 800 });
  assert.throws(() => projectKpTutorialViewportAnchors({
    viewport,
    textRatio: -0.01
  }), /text anchor ratio must be within/);
  assert.throws(() => projectKpTutorialViewportAnchors({
    viewport,
    stageCenterRatio: 1.01
  }), /stage-center anchor ratio must be within/);
});

test("one local offset settles text and graph on the same latch tick", () => {
  const viewport = projectKpTutorialUsableViewport({ viewportHeightPx: 800 });
  const anchors = projectKpTutorialViewportAnchors({ viewport });
  assert.deepEqual(projectKpTutorialSynchronizedLatch({
    viewport,
    anchors,
    stageBlockSizePx: 480
  }), {
    stageTopY: 160,
    stageCenterY: 400,
    textY: 280,
    textDocumentOffsetFromStagePx: 120
  });

  const insetViewport = projectKpTutorialUsableViewport({
    viewportHeightPx: 800,
    persistentTopInsetPx: 64,
    persistentBottomInsetPx: 24
  });
  assert.deepEqual(projectKpTutorialSynchronizedLatch({
    viewport: insetViewport,
    anchors: projectKpTutorialViewportAnchors({ viewport: insetViewport }),
    stageBlockSizePx: 480
  }), {
    stageTopY: 180,
    stageCenterY: 420,
    textY: 313.2,
    textDocumentOffsetFromStagePx: 133.2
  });
});

test("synchronized latch rejects a stage that cannot fit", () => {
  const viewport = projectKpTutorialUsableViewport({ viewportHeightPx: 400 });
  assert.throws(() => projectKpTutorialSynchronizedLatch({
    viewport,
    anchors: projectKpTutorialViewportAnchors({ viewport }),
    stageBlockSizePx: 480
  }), /does not fit inside/);
});

test("stage divider and horizontal boundary retain one local assembly", () => {
  const viewport = projectKpTutorialUsableViewport({ viewportHeightPx: 800 });
  const anchors = projectKpTutorialViewportAnchors({ viewport });
  const latch = projectKpTutorialSynchronizedLatch({
    viewport,
    anchors,
    stageBlockSizePx: 480
  });
  assert.deepEqual(projectKpTutorialStageAssembly({
    latch,
    stageBlockSizePx: 480,
    boundaryGapPx: 20
  }), {
    stageTopY: 160,
    stageBottomY: 640,
    dividerTopY: 160,
    dividerBottomY: 640,
    horizontalBoundaryY: 660,
    horizontalBoundaryOffsetFromStageTopPx: 500
  });

  const shifted = projectKpTutorialStageAssembly({
    latch: { ...latch, stageTopY: 180 },
    stageBlockSizePx: 480,
    boundaryGapPx: 20
  });
  assert.equal(shifted.dividerBottomY - shifted.dividerTopY, 480);
  assert.equal(shifted.horizontalBoundaryOffsetFromStageTopPx, 500);
});

function passage(
  id: string,
  capabilityId: string,
  proximity: "distant" | "near" | "visible",
  semanticProgress: number
): KpTutorialMotionPassage {
  return {
    id,
    capabilityId,
    disposition: "present",
    proximity,
    semanticProgress
  };
}

function projected(
  plan: ReturnType<typeof projectKpTutorialMotionPassageLifecycle>,
  id: string
) {
  const projection = plan.passages.find((candidate) => candidate.id === id);
  assert.ok(projection);
  return {
    attention: projection.attention,
    geometry: projection.geometry,
    runtime: projection.runtime,
    motion: projection.motion,
    accessibility: projection.accessibility,
    semanticProgress: projection.semanticProgress
  };
}
