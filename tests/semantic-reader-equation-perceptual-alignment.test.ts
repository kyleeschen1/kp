import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  compileKpReaderEquationMaterialPlan,
  createKpReaderEquationLayoutSnapshot,
  planKpReaderEquationPerceptualAlignment,
  projectKpReaderEquationRenderPlan,
  sampleKpReaderEquationPerceptualPathOffset
} from "../src/reader/renderers/public-api.ts";

function fixture(direction: "forward" | "rewind") {
  const animation = createLinearSolveAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: `runtime.reader.alignment.${direction}`,
    animation,
    direction,
    progress: 0.5
  });
  const materialPlan = compileKpReaderEquationMaterialPlan(
    projectKpReaderEquationRenderPlan({ animation, runtimeFrame })
  );
  const transition = materialPlan.transitions[0]!;
  const measurements = transition.anchors.map((anchor, index) => ({
    anchorId: anchor.id,
    rect: {
      left: anchor.selectorId.endsWith(".equals")
        ? anchor.objectId.includes("after-subtract") ? 100 : 60
        : 20 + index * 9,
      top: anchor.objectId.includes("after-subtract") ? 20 : 24,
      width: 10,
      height: 16
    }
  }));
  const layout = createKpReaderEquationLayoutSnapshot({
    materialPlan,
    transitionId: transition.transitionId,
    revision: 1,
    rootRect: { left: 0, top: 0, width: 240, height: 80 },
    measurements
  });
  return { materialPlan, layout };
}

test("perceptual alignment keeps native endpoints exact and bounds the path correction", () => {
  const { materialPlan, layout } = fixture("forward");
  const plan = planKpReaderEquationPerceptualAlignment({
    materialPlan,
    layout,
    policy: {
      maxInlineCorrectionPx: 12,
      maxBlockCorrectionPx: 3,
      anchorPriority: ["relation-center", "ink-center", "operator-center"]
    }
  });

  assert.ok(plan.referenceOwnerId?.endsWith(".relation-persists"));
  assert.deepEqual(plan.correction, {
    x: 12,
    y: -3,
    rawX: 40,
    rawY: -4,
    clamped: true
  });
  const referenceBefore = layout.owners.find(
    (owner) => owner.ownerId === plan.referenceOwnerId
  )!;
  const referenceAfter = plan.owners.find(
    (owner) => owner.ownerId === plan.referenceOwnerId
  )!;
  assert.equal(
    referenceAfter.targetBounds!.left,
    referenceBefore.targetBounds!.left
  );
  assert.equal(
    referenceAfter.sourceBounds!.left,
    referenceBefore.sourceBounds!.left
  );
  assert.deepEqual(sampleKpReaderEquationPerceptualPathOffset({
    alignment: plan,
    progress: 0
  }), { x: 0, y: -0 });
  assert.deepEqual(sampleKpReaderEquationPerceptualPathOffset({
    alignment: plan,
    progress: 0.5
  }), { x: 6, y: -1.5 });
  assert.deepEqual(sampleKpReaderEquationPerceptualPathOffset({
    alignment: plan,
    progress: 1
  }), { x: 0, y: -0 });
});

test("perceptual alignment is directionally reversible", () => {
  const forwardFixture = fixture("forward");
  const rewindFixture = fixture("rewind");
  const policy = {
    maxInlineCorrectionPx: 12,
    maxBlockCorrectionPx: 3,
    anchorPriority: [
      "relation-center",
      "ink-center",
      "operator-center"
    ] as const
  };
  const forward = planKpReaderEquationPerceptualAlignment({
    ...forwardFixture,
    layout: forwardFixture.layout,
    policy
  });
  const rewind = planKpReaderEquationPerceptualAlignment({
    ...rewindFixture,
    layout: rewindFixture.layout,
    policy
  });

  assert.equal(rewind.referenceOwnerId, forward.referenceOwnerId);
  assert.equal(rewind.correction.x, -forward.correction.x);
  assert.equal(rewind.correction.y, -forward.correction.y);
  assert.equal(rewind.correction.rawX, -forward.correction.rawX);
  assert.equal(rewind.correction.rawY, -forward.correction.rawY);
  assert.deepEqual(
    sampleKpReaderEquationPerceptualPathOffset({ alignment: rewind, progress: 0.75 }),
    sampleKpReaderEquationPerceptualPathOffset({ alignment: forward, progress: 0.25 })
  );
});

test("perceptual alignment rejects unsafe correction budgets", () => {
  const { materialPlan, layout } = fixture("forward");
  assert.throws(
    () => planKpReaderEquationPerceptualAlignment({
      materialPlan,
      layout,
      policy: {
        maxInlineCorrectionPx: Number.POSITIVE_INFINITY,
        maxBlockCorrectionPx: 4,
        anchorPriority: ["relation-center"]
      }
    }),
    /finite and non-negative/
  );
});
