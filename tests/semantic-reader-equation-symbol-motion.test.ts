import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { createKpWitnessedAnnihilationBinding } from "../src/animation/witnessed-annihilation.ts";
import { createKpLinearRearrangementChoreography } from "../src/animation/linear-rearrangement-choreography.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  compileKpReaderEquationMaterialPlan,
  createKpReaderEquationLayoutSnapshot,
  planKpReaderEquationPerceptualAlignment,
  projectKpReaderEquationRenderPlan,
  sampleKpReaderEquationSymbolMotion
} from "../src/reader/renderers/public-api.ts";

function fixture(direction: "forward" | "rewind", globalProgress = 0.5) {
  const animation = createLinearSolveAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: `runtime.reader.motion.${direction}`,
    animation,
    direction,
    progress: globalProgress
  });
  const materialPlan = compileKpReaderEquationMaterialPlan(
    projectKpReaderEquationRenderPlan({ animation, runtimeFrame })
  );
  const transition = materialPlan.transitions[0]!;
  const selectorIds = animation.bundle.objects.flatMap((object) =>
    object.selectors.map((selector) => selector.id)
  );
  const measurements = transition.anchors.map((anchor) => {
    const selectorIndex = selectorIds.indexOf(anchor.selectorId);
    return {
    anchorId: anchor.id,
    rect: {
      left: anchor.selectorId.endsWith(".equals")
        ? anchor.objectId.includes("after-subtract") ? 100 : 60
        : 18 + selectorIndex * 11,
      top: anchor.objectId.includes("after-subtract") ? 20 : 24,
      width: 9 + selectorIndex % 2,
      height: 16
    }
    };
  });
  const layout = createKpReaderEquationLayoutSnapshot({
    materialPlan,
    transitionId: transition.transitionId,
    revision: 0,
    rootRect: { left: 0, top: 0, width: 240, height: 80 },
    measurements
  });
  const alignment = planKpReaderEquationPerceptualAlignment({
    materialPlan,
    layout,
    policy: {
      maxInlineCorrectionPx: 12,
      maxBlockCorrectionPx: 4,
      anchorPriority: ["relation-center", "ink-center", "operator-center"]
    }
  });
  return { materialPlan, alignment, layout };
}

test("symbol motion continuously hands persistent material between native endpoints", () => {
  const context = fixture("forward");
  const start = sampleKpReaderEquationSymbolMotion({ ...context, progress: 0 });
  const middle = sampleKpReaderEquationSymbolMotion({ ...context, progress: 0.5 });
  const end = sampleKpReaderEquationSymbolMotion({ ...context, progress: 1 });
  assert.equal(middle.samplingAuthority, "generic-fallback");
  const xId = "material-owner.x-persists";
  const cancellationId = "material-owner.left-inverses-cancel";
  const xStart = start.owners.find((owner) => owner.ownerId === xId)!;
  const xMiddle = middle.owners.find((owner) => owner.ownerId === xId)!;
  const xEnd = end.owners.find((owner) => owner.ownerId === xId)!;

  assert.equal(xStart.sourceNativeOpacity, 1);
  assert.equal(xStart.materialOpacity, 0);
  assert.equal(xMiddle.sourceNativeOpacity, 0);
  assert.equal(xMiddle.materialOpacity, 1);
  assert.equal(xMiddle.targetNativeOpacity, 0);
  assert.equal(xEnd.materialOpacity, 0);
  assert.equal(xEnd.targetNativeOpacity, 1);
  assert.notDeepEqual(xMiddle.currentBounds, xStart.currentBounds);
  assert.notDeepEqual(xMiddle.currentBounds, xEnd.currentBounds);

  const cancelledEnd = end.owners.find(
    (owner) => owner.ownerId === cancellationId
  )!;
  assert.equal(cancelledEnd.materialOpacity, 0);
  assert.equal(cancelledEnd.sourceNativeOpacity, 0);
  assert.equal(cancelledEnd.targetNativeOpacity, 0);
});

test("forward and rewind retrace every owner at complementary progress", () => {
  const forward = sampleKpReaderEquationSymbolMotion({
    ...fixture("forward"),
    progress: 0.27
  });
  const rewind = sampleKpReaderEquationSymbolMotion({
    ...fixture("rewind"),
    progress: 0.73
  });
  assert.deepEqual(
    rewind.owners.map((owner) => owner.ownerId),
    forward.owners.map((owner) => owner.ownerId)
  );
  for (const forwardOwner of forward.owners) {
    const rewindOwner = rewind.owners.find(
      (owner) => owner.ownerId === forwardOwner.ownerId
    )!;
    assertRectApproximatelyEqual(
      rewindOwner.currentBounds,
      forwardOwner.currentBounds
    );
    assertApproximatelyEqual(
      rewindOwner.materialOpacity,
      forwardOwner.materialOpacity
    );
    assertApproximatelyEqual(
      rewindOwner.targetNativeOpacity,
      forwardOwner.sourceNativeOpacity
    );
    assertApproximatelyEqual(
      rewindOwner.sourceNativeOpacity,
      forwardOwner.targetNativeOpacity
    );
    assertApproximatelyEqual(
      rewindOwner.focusStrength,
      forwardOwner.focusStrength
    );
  }
});

test("generic fallback keeps continuous geometry and semantic focus", () => {
  const context = fixture("forward");
  const cancellationId = "material-owner.left-inverses-cancel";
  const samples = [0.2, 0.21, 0.22].map((progress) =>
    sampleKpReaderEquationSymbolMotion({ ...context, progress }).owners.find(
      (owner) => owner.ownerId === cancellationId
    )!
  );
  assert.ok(samples[1]!.currentBounds.top < samples[0]!.currentBounds.top);
  assert.ok(samples[2]!.currentBounds.top < samples[1]!.currentBounds.top);
  assert.ok(samples.every((sample) => sample.focusStrength === 1));
  assert.throws(
    () => sampleKpReaderEquationSymbolMotion({
      ...context,
      progress: Number.NaN
    }),
    /must be finite/
  );
});

test("solve-x samples its selected branch schedule through measured rendering", () => {
  const animation = createLinearSolveAnimationAsset();
  const step = createKpLinearRearrangementChoreography(animation).steps.find(
    (candidate) => candidate.kind === "balanced-introduction"
  )!;
  const frame = sampleKpReaderEquationSymbolMotion({
    ...fixture("forward", 0.1),
    progress: 0.5,
    linearRearrangementKind: step.kind,
    branchSchedule: step.branchSchedule
  });

  assert.equal(frame.samplingAuthority, "operation-specific");
  assert.equal(frame.linearRearrangement?.branchScheduleId, step.branchSchedule?.id);
  const branchProgress = frame.linearRearrangement?.scheduledBranchProgress;
  assert.ok(branchProgress !== undefined);
  assert.ok(
    (branchProgress["lhs"] ?? 0) > 0 && (branchProgress["lhs"] ?? 0) < 1
  );
  assert.equal(branchProgress["lhs"], branchProgress["rhs"]);
  const introduced = frame.owners.flatMap((owner) => owner.fragmentPoses).filter(
    (fragment) => fragment.side === "target" &&
      step.branchOperation?.branches.some((branch) =>
        branch.entityIds.some((entityId) => fragment.anchorId.endsWith(entityId))
      )
  );
  assert.ok(introduced.length > 0);
  assert.ok(introduced[0]!.pose.opacity > 0 && introduced[0]!.pose.opacity < 1);
  assert.ok(introduced.every(
    (fragment) => fragment.pose.opacity === introduced[0]!.pose.opacity
  ));
});

test("reader cancellation meets through a readable zero before compaction", () => {
  const animation = createLinearSolveAnimationAsset();
  const transformation = animation.transformations.find(
    (candidate) => candidate.transformType === "cancelAdditiveInverses"
  )!;
  const cancellation = transformation.correspondenceMap!.records.find(
    (record) => record.relation === "cancelation"
  )!;
  const binding = createKpWitnessedAnnihilationBinding({
    operationId: "kp.algebra.cancel-additive-inverses",
    transformation,
    bundle: animation.bundle,
    cancellationRecordId: cancellation.id
  });
  const frame = sampleKpReaderEquationSymbolMotion({
    ...fixture("forward"),
    progress: 0.66,
    linearRearrangementKind: "cancel-additive-inverses",
    witnessedAnnihilationBinding: binding
  });
  assert.equal(frame.witnessedAnnihilation?.frame.witnessReadable, true);
  assert.equal(frame.samplingAuthority, "operation-specific");
  assert.equal(frame.witnessedAnnihilation?.frame.witness.latex, "0");
  assert.equal(frame.witnessedAnnihilation?.frame.phase, "witness-dwell");
  const cancellationOwner = frame.owners.find(
    (owner) => owner.ownerId === "material-owner.left-inverses-cancel"
  )!;
  assert.equal(cancellationOwner.fragmentPoses.length, 2);
  assert.ok(cancellationOwner.fragmentPoses.every(
    (fragment) => fragment.pose.scale === 0.72
  ));
  assert.equal(cancellationOwner.focusStrength, 1);
  assert.deepEqual(
    cancellationOwner.currentBounds,
    posedFragmentBounds(cancellationOwner.fragmentPoses, fixture("forward").layout)
  );
});

test("reader successor synthesis converges inputs before revealing four", () => {
  const animation = createLinearSolveAnimationAsset();
  const step = createKpLinearRearrangementChoreography(animation).steps.find(
    (candidate) => candidate.kind === "simplify-constant-difference"
  )!;
  const frame = sampleKpReaderEquationSymbolMotion({
    ...fixture("forward", 0.84),
    progress: 0.8,
    linearRearrangementKind: step.kind,
    successorSynthesisBinding: step.successorSynthesisBinding
  });
  const derived = frame.owners.find(
    (owner) => owner.ownerId === "material-owner.constants-merge"
  )!;
  const source = derived.fragmentPoses.filter(
    (fragment) => fragment.side === "source"
  );
  const target = derived.fragmentPoses.find(
    (fragment) => fragment.side === "target"
  );
  assert.equal(source.length, 3);
  assert.ok(source.every((fragment) => fragment.pose.opacity < 1));
  assert.ok(source.some((fragment) => Math.abs(fragment.pose.x) > 0));
  assert.ok((target?.pose.opacity ?? 0) > 0);
  assert.ok(derived.visualAnchorIds.includes(
    "anchor.equation.linear-solve.solved.rhs.4"
  ));
  assert.equal(frame.samplingAuthority, "operation-specific");
});

function posedFragmentBounds(
  fragments: readonly {
    readonly anchorId: string;
    readonly pose: { readonly opacity: number; readonly x: number; readonly y: number; readonly scale: number };
  }[],
  layout: ReturnType<typeof fixture>["layout"]
) {
  const anchors = new Map(layout.anchors.map((anchor) => [anchor.id, anchor.rect]));
  const visible = fragments.filter((fragment) => fragment.pose.opacity > 0.001);
  const rects = (visible.length > 0 ? visible : fragments).map((fragment) => {
    const rect = anchors.get(fragment.anchorId)!;
    return {
      left: rect.left + fragment.pose.x + rect.width * (1 - fragment.pose.scale) / 2,
      top: rect.top + fragment.pose.y + rect.height * (1 - fragment.pose.scale) / 2,
      width: rect.width * fragment.pose.scale,
      height: rect.height * fragment.pose.scale
    };
  });
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function assertRectApproximatelyEqual(
  actual: { readonly left: number; readonly top: number; readonly width: number; readonly height: number },
  expected: { readonly left: number; readonly top: number; readonly width: number; readonly height: number }
): void {
  assertApproximatelyEqual(actual.left, expected.left);
  assertApproximatelyEqual(actual.top, expected.top);
  assertApproximatelyEqual(actual.width, expected.width);
  assertApproximatelyEqual(actual.height, expected.height);
}

function assertApproximatelyEqual(actual: number, expected: number): void {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
}
