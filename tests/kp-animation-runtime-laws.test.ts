import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationRuntimeCompositionLaw,
  checkKpAnimationRuntimeRewindClockLaw
} from "../src/animation/runtime-laws.ts";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createLinearSolveProgrammingComparisonAnimationAsset
} from "../src/animation/comparison-layout-adapter.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import {
  createExponentExpansionAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";

test("checkKpAnimationRuntimeCompositionLaw accepts shared-clock child sampling", () => {
  const animation = createLinearSolveProgrammingComparisonAnimationAsset();

  assert.deepEqual(
    checkKpAnimationRuntimeCompositionLaw({
      animation,
      childAnimations: createKpAnimationAssets(),
      progressSamples: [0, 0.5, 1]
    }),
    {
      lawId: "animation-runtime.composition",
      passed: true,
      failures: []
    }
  );
});

test("checkKpAnimationRuntimeCompositionLaw reports missing child animations", () => {
  const animation = createLinearSolveProgrammingComparisonAnimationAsset();

  assert.deepEqual(
    checkKpAnimationRuntimeCompositionLaw({
      animation,
      childAnimations: [createLinearSolveAnimationAsset()],
      progressSamples: [0.5]
    }),
    {
      lawId: "animation-runtime.composition",
      passed: false,
      failures: [
        {
          path: "samples[0].childFrames[animation.programming.add.execution-trace]",
          message:
            "Animation animation.comparison.linear-solve-programming did not sample child animation animation.programming.add.execution-trace at progress 0.5."
        }
      ]
    }
  );
});

test("checkKpAnimationRuntimeRewindClockLaw accepts mirrored linear solve sampling", () => {
  assert.deepEqual(
    checkKpAnimationRuntimeRewindClockLaw({
      animation: createLinearSolveAnimationAsset(),
      progressSamples: [0.25, 0.5, 0.75]
    }),
    {
      lawId: "animation-runtime.rewind-clock",
      passed: true,
      failures: []
    }
  );
});

test("rewind clock keeps even-phase midpoint boundaries on the mirrored node", () => {
  assert.deepEqual(
    checkKpAnimationRuntimeRewindClockLaw({
      animation: createExponentExpansionAnimationAsset(),
      progressSamples: [0.25, 0.5, 0.75]
    }),
    {
      lawId: "animation-runtime.rewind-clock",
      passed: true,
      failures: []
    }
  );
});

test("solve-x playback remains seek and rewind equivalent across dense samples", () => {
  const progressSamples = Array.from(
    { length: 21 },
    (_, index) => index / 20
  );

  assert.deepEqual(
    checkKpAnimationRuntimeRewindClockLaw({
      animation: createLinearSolveAnimationAsset(),
      progressSamples
    }),
    {
      lawId: "animation-runtime.rewind-clock",
      passed: true,
      failures: []
    }
  );
});

test("checkKpAnimationRuntimeRewindClockLaw accepts composed child sampling", () => {
  assert.deepEqual(
    checkKpAnimationRuntimeRewindClockLaw({
      animation: createLinearSolveProgrammingComparisonAnimationAsset(),
      childAnimations: createKpAnimationAssets(),
      progressSamples: [0.25, 0.5, 0.75]
    }),
    {
      lawId: "animation-runtime.rewind-clock",
      passed: true,
      failures: []
    }
  );
});
