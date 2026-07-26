import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import { createNumeratorSplitMergeEquationAnimationAsset } from "../src/animation/numerator-split-merge-equation-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  compileKpReaderEquationMaterialPlan,
  projectKpReaderEquationRenderPlan
} from "../src/reader/renderers/public-api.ts";
import {
  createKpReaderClockSample,
  projectKpReaderMotion,
  resolveKpReaderMotionPolicy
} from "../src/reader/runtime/public-api.ts";

test("fraction direct seek is state-independent over a dense forward/rewind grid", () => {
  const animation = createNumeratorSplitMergeEquationAnimationAsset();
  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);

  for (const direction of ["forward", "rewind"] as const) {
    for (let index = 0; index <= 200; index += 1) {
      const progress = index / 200;
      const sample = () => sampleKpAnimationRuntimeFrame({
        animation,
        direction,
        progress
      });
      const first = sample();
      sampleKpAnimationRuntimeFrame({
        animation,
        direction,
        progress: 1 - progress
      });
      assert.equal(JSON.stringify(sample()), JSON.stringify(first));
    }
  }
});

test("fraction material owner identity reverses endpoints without a reverse-only owner", () => {
  const animation = createNumeratorSplitMergeEquationAnimationAsset();
  for (const forwardProgress of [0.25, 0.75]) {
    const material = (direction: "forward" | "rewind", progress: number) => {
      const runtimeFrame = sampleKpAnimationRuntimeFrame({
        animation,
        direction,
        progress
      });
      return compileKpReaderEquationMaterialPlan(
        projectKpReaderEquationRenderPlan({ animation, runtimeFrame })
      ).transitions[0]!;
    };
    const forward = material("forward", forwardProgress);
    const rewind = material("rewind", 1 - forwardProgress);

    assert.deepEqual(
      rewind.owners.map(({ id }) => id).sort(),
      forward.owners.map(({ id }) => id).sort()
    );
    for (const owner of forward.owners) {
      const inverse = rewind.owners.find(({ id }) => id === owner.id)!;
      assert.deepEqual(inverse.sourceAnchorIds, owner.targetAnchorIds);
      assert.deepEqual(inverse.targetAnchorIds, owner.sourceAnchorIds);
    }
  }
});

test("reduced motion preserves causal sampling and static motion settles checkpoints", () => {
  const checkpoints = [
    { id: "combined", label: "Combined", progressPermille: 0 },
    { id: "split", label: "Split", progressPermille: 500 },
    { id: "merged", label: "Merged", progressPermille: 1_000 }
  ];
  const clock = createKpReaderClockSample({
    source: "controls",
    progress: 0.63
  });
  const reduced = projectKpReaderMotion({
    clock,
    checkpoints,
    policy: resolveKpReaderMotionPolicy({
      preference: "reduced",
      systemReducedMotion: false
    })
  });
  const settled = projectKpReaderMotion({
    clock,
    checkpoints,
    policy: resolveKpReaderMotionPolicy({
      preference: "static",
      systemReducedMotion: false
    })
  });

  assert.equal(reduced.mode, "essential");
  assert.equal(reduced.progress, 0.63);
  assert.deepEqual(settled, {
    mode: "checkpoint",
    progress: 0.5,
    progressPermille: 500,
    checkpointId: "split",
    checkpointLabel: "Split"
  });
});
