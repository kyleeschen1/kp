import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  compileKpReaderEquationMaterialPlan,
  createKpReaderEquationLayoutSnapshot,
  planKpReaderEquationPerceptualAlignment,
  projectKpReaderEquationRenderPlan,
  sampleKpReaderEquationSymbolMotion
} from "../src/reader/renderers/public-api.ts";

function fixture(direction: "forward" | "rewind") {
  const animation = createLinearSolveAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: `runtime.reader.motion.${direction}`,
    animation,
    direction,
    progress: 0.5
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
  return { materialPlan, alignment };
}

test("symbol motion continuously hands persistent material between native endpoints", () => {
  const context = fixture("forward");
  const start = sampleKpReaderEquationSymbolMotion({ ...context, progress: 0 });
  const middle = sampleKpReaderEquationSymbolMotion({ ...context, progress: 0.5 });
  const end = sampleKpReaderEquationSymbolMotion({ ...context, progress: 1 });
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

test("focused cancellation gains salience without discontinuous geometry", () => {
  const context = fixture("forward");
  const cancellationId = "material-owner.left-inverses-cancel";
  const samples = [0.2, 0.21, 0.22].map((progress) =>
    sampleKpReaderEquationSymbolMotion({ ...context, progress }).owners.find(
      (owner) => owner.ownerId === cancellationId
    )!
  );
  assert.ok(samples[1]!.currentBounds.top < samples[0]!.currentBounds.top);
  assert.ok(samples[2]!.currentBounds.top < samples[1]!.currentBounds.top);
  assert.ok(samples[1]!.focusStrength > samples[0]!.focusStrength);
  assert.ok(samples[2]!.focusStrength > samples[1]!.focusStrength);
  assert.throws(
    () => sampleKpReaderEquationSymbolMotion({
      ...context,
      progress: Number.NaN
    }),
    /must be finite/
  );
});

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
