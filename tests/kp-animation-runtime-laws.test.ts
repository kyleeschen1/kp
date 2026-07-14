import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationRuntimeCompositionLaw
} from "../src/animation/runtime-laws.ts";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createLinearSolveProgrammingComparisonAnimationAsset
} from "../src/animation/comparison-layout-adapter.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";

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

