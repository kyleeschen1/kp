import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationAsset,
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import {
  decodeKpEquationPresentationProfile
} from "../src/animation/equation-presentation-profile-decoder.ts";
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
  resolveKpCancellationPresentation
} from "../src/rendering/cancellation-presentation-resolver.ts";
import {
  kpEquationPresentationProfile
} from "../src/rendering/equation-presentation-policy.ts";

test("only the canonical solve-x exemplar authors the typed profile", () => {
  const canonical = createLinearSolveAnimationAsset();
  const teacherDetail = createLinearSolveTeacherZeroAnimationAsset();
  const decodedCanonical = decodeKpEquationPresentationProfile({
    animation: canonical,
    resolveCancellation: resolveKpCancellationPresentation
  });
  const decodedTeacherDetail = decodeKpEquationPresentationProfile({
    animation: teacherDetail,
    resolveCancellation: resolveKpCancellationPresentation
  });

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
    continuants: "transit-then-reflow-v1",
    branchStrategy: "together"
  });
  assert.equal(decodedCanonical.status, "accepted");
  assert.equal(
    decodedCanonical.status === "accepted" && decodedCanonical.source,
    "typed-profile"
  );
  assert.equal(teacherDetail.presentationProfile, undefined);
  assert.equal(decodedTeacherDetail.status, "accepted");
  assert.equal(
    decodedTeacherDetail.status === "accepted" && decodedTeacherDetail.source,
    "legacy-metadata"
  );
});

test("typed authoring preserves solve-x semantic and clock serialization", () => {
  const typed = createLinearSolveAnimationAsset();
  const legacyFacade = createKpAnimationAsset({
    id: typed.id,
    title: typed.title,
    bundle: typed.bundle,
    transformations: typed.transformations,
    transformationTree: typed.transformationTree,
    timeline: typed.timeline,
    layout: typed.layout,
    renderTargets: typed.renderTargets,
    checks: typed.checks,
    exportTargets: typed.exportTargets,
    dashboard: typed.dashboard,
    metadata: {
      sourceAnimationId: "linear-equation-solve-x",
      equationMotionPresentationRecipe: "continuity-v1",
      equationNativeHandoffRecipe: "atomic-v1",
      equationCancellationTeachingGoal: "preserve-flow",
      equationZeroWitnessPresentationRecipe: "none",
      equationSuccessorPresentationRecipe: "counter-convergence-v1",
      equationDepthPresentationRecipe: "semantic-depth-v1",
      equationContinuantPresentationRecipe: "transit-then-reflow-v1",
      equationBranchPresentationStrategy: "together"
    }
  });

  assert.equal(
    JSON.stringify(semanticClockSnapshot(typed)),
    JSON.stringify(semanticClockSnapshot(legacyFacade))
  );
  assert.deepEqual(
    kpEquationPresentationProfile(typed),
    kpEquationPresentationProfile(legacyFacade)
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
