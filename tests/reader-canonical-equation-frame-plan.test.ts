import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import {
  compileKpAnimationTransformationPhaseCohorts,
  findKpAnimationTransformationPhaseCohort
} from "../src/animation/transformation-phase-cohorts.ts";
import {
  planKpReaderCanonicalEquationFrame
} from "../src/reader/app/canonical-equation-frame-plan.ts";
import {
  createKpReaderClockSample,
  sampleKpReaderAnimationFrame
} from "../src/reader/runtime/playback-clock.ts";

const animation = createKpFractionCompositionEquationAnimationAsset();
const cohorts = compileKpAnimationTransformationPhaseCohorts(animation);

test("canonical frame planning preserves the reader calculation at sampled points", () => {
  for (const [progress, previousProgress] of [
    [0, 0],
    [0.02, 0],
    [0.25, 0.2],
    [0.5, 0.7],
    [0.999, 0.8],
    [1, 1]
  ] as const) {
    const clock = createKpReaderClockSample({
      source: "controls",
      progress,
      previousProgress
    });
    const legacyFrame = sampleKpReaderAnimationFrame({
      animation,
      clock: { ...clock, direction: "forward" }
    });
    const legacyCohort = findKpAnimationTransformationPhaseCohort({
      cohorts,
      transformationIds: legacyFrame.activeTransformationIds
    });
    const legacyPhaseProgress = progress === 1
      ? 1
      : Math.max(
          0,
          Math.min(1, progress * cohorts.length - legacyFrame.phase.phaseIndex)
        );
    const planned = planKpReaderCanonicalEquationFrame({
      animation,
      clock,
      animationProgress: progress,
      cohorts
    });

    assert.equal(planned?.transitionId, legacyCohort?.id);
    assert.equal(planned?.phaseProgress, legacyPhaseProgress);
    assert.deepEqual(planned?.runtimeFrame, legacyFrame);
  }
});

test("rewind traversal retains the same forward semantic frame at one point", () => {
  const progress = 0.42;
  const forward = planKpReaderCanonicalEquationFrame({
    animation,
    clock: createKpReaderClockSample({
      source: "controls",
      progress,
      previousProgress: 0.2
    }),
    animationProgress: progress,
    cohorts
  });
  const rewind = planKpReaderCanonicalEquationFrame({
    animation,
    clock: createKpReaderClockSample({
      source: "controls",
      progress,
      previousProgress: 0.7
    }),
    animationProgress: progress,
    cohorts
  });

  assert.deepEqual(rewind, forward);
  assert.equal(Object.isFrozen(rewind), true);
});

test("frame planning rejects invalid progress and empty cohort authority", () => {
  const clock = createKpReaderClockSample({ source: "controls", progress: 0 });
  assert.throws(() => planKpReaderCanonicalEquationFrame({
    animation,
    clock,
    animationProgress: Number.NaN,
    cohorts
  }), /between 0 and 1/u);
  assert.throws(() => planKpReaderCanonicalEquationFrame({
    animation,
    clock,
    animationProgress: 0,
    cohorts: []
  }), /requires phase cohorts/u);
});
