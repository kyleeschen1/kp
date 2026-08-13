import assert from "node:assert/strict";
import test from "node:test";

import { validateKpAnimationAsset } from "../src/animation/asset.ts";
import {
  createLinearSolveAnimationAsset,
  createLinearSolveTeacherZeroAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import {
  checkKpAnimationRuntimeRewindClockLaw
} from "../src/animation/runtime-laws.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  kpEquationPresentationProfile
} from "../src/animation/equation-presentation-policy.ts";

test("accepted linear-solve variants author typed presentation profiles", () => {
  const canonical = createLinearSolveAnimationAsset();
  const teacherDetail = createLinearSolveTeacherZeroAnimationAsset();

  assert.deepEqual(canonical.metadata, {
    sourceAnimationId: "linear-equation-solve-x"
  });
  assert.deepEqual(canonical.presentationProfile?.payload, {
    kind: "equation-presentation",
    motion: "continuity-v1",
    nativeHandoff: "atomic-v1",
    cancellation: "counter-orbit-v1",
    zeroWitness: "none",
    successor: "counter-convergence-v1",
    depth: "semantic-depth-v1",
    continuants: "concurrent-v1",
    branchStrategy: "together"
  });
  assert.deepEqual(teacherDetail.metadata, {
    sourceAnimationId: "linear-equation-solve-x"
  });
  assert.deepEqual(teacherDetail.presentationProfile?.payload, {
    kind: "equation-presentation",
    motion: "continuity-v1",
    nativeHandoff: "atomic-v1",
    cancellation: "counter-orbit-v1",
    zeroWitness: "none",
    successor: "counter-convergence-v1",
    depth: "semantic-depth-v1",
    continuants: "transit-then-reflow-v1",
    branchStrategy: "together"
  });
  assert.equal(kpEquationPresentationProfile(canonical).recipe, "continuity-v1");
  assert.equal(kpEquationPresentationProfile(teacherDetail).recipe, "continuity-v1");
});

test("typed authoring preserves solve-x semantic and clock serialization", () => {
  const typed = createLinearSolveAnimationAsset();
  assert.deepEqual(semanticClockSnapshot(typed), semanticClockSnapshot(
    createLinearSolveAnimationAsset()
  ));
  assert.equal(
    typed.presentationConstraints?.clearancePlanning,
    "measured-native-notation"
  );
  assert.deepEqual(validateKpAnimationAsset(typed), []);
});

test("typed solve-x remains direct-seek and rewind equivalent", () => {
  const animation = createLinearSolveAnimationAsset();

  for (const progress of [0, 0.13, 0.25, 0.5, 0.75, 0.91, 1]) {
    const forward = sampleKpAnimationRuntimeFrame({
      animation,
      progress,
      direction: "forward"
    });
    const rewind = sampleKpAnimationRuntimeFrame({
      animation,
      progress: 1 - progress,
      direction: "rewind"
    });
    assert.equal(forward.clock.progress + rewind.clock.progress, 1);
    assert.equal(
      (forward.clock.elapsedMs ?? 0) + (rewind.clock.elapsedMs ?? 0),
      forward.clock.durationMs
    );
    assert.equal(
      (forward.clock.beat ?? 0) + (rewind.clock.beat ?? 0),
      forward.clock.beatCount
    );
    assert.deepEqual(
      forward.activeTransformationIds,
      rewind.activeTransformationIds
    );
    assert.deepEqual(forward.phase.nodeIds, rewind.phase.nodeIds);
    assert.deepEqual(
      forward.selectorFrames.map(({ id }) => id),
      rewind.selectorFrames.map(({ id }) => id)
    );
  }
  assert.equal(checkKpAnimationRuntimeRewindClockLaw({
    animation,
    progressSamples: [0, 0.13, 0.25, 0.5, 0.75, 0.91, 1]
  }).passed, true);
});

function semanticClockSnapshot(
  animation: ReturnType<typeof createLinearSolveAnimationAsset>
) {
  return {
    bundle: animation.bundle,
    transformations: animation.transformations,
    transformationTree: animation.transformationTree,
    timeline: animation.timeline,
    layout: animation.layout,
    renderTargets: animation.renderTargets
  };
}
