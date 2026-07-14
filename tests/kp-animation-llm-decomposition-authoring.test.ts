import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationDecompositionAuthoringRequest
} from "../src/animation/llm-decomposition-authoring.ts";
import {
  createLinearSolvePausedFrameDecompositionExample
} from "../src/animation/llm-paused-frame-decomposition-example.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";

test("decomposition authoring request packages selected runtime transformation context", () => {
  const animation = createLinearSolveAnimationAsset();
  const frame = sampleKpAnimationRuntimeFrame({
    id: "runtime.linear-solve.cancel",
    animation,
    progress: 0.5
  });
  const request = createKpAnimationDecompositionAuthoringRequest({
    animation,
    frame,
    selectedTransformationId:
      "transform.linear-solve.cancel-left-additive-inverse",
    question: "Why do the +3 and -3 disappear?"
  });

  assert.equal(
    request.id,
    "decomposition.animation.linear-solve.solve-x.transform.linear-solve.cancel-left-additive-inverse"
  );
  assert.equal(request.kind, "animation-decomposition-authoring-request");
  assert.equal(request.animationId, "animation.linear-solve.solve-x");
  assert.equal(request.frameId, "runtime.linear-solve.cancel");
  assert.equal(request.clock.progress, 0.5);
  assert.equal(
    request.selectedTransformationId,
    "transform.linear-solve.cancel-left-additive-inverse"
  );
  assert.equal(request.selectedTransformationKind, "cancelAdditiveInverses");
  assert.deepEqual(request.sourceObjectIds, [
    "equation.linear-solve.after-subtract"
  ]);
  assert.deepEqual(request.targetObjectIds, [
    "equation.linear-solve.left-simplified"
  ]);
  assert.deepEqual(request.focusSelectorIds, [
    "equation.linear-solve.after-subtract.lhs.plus3",
    "equation.linear-solve.after-subtract.lhs.minus3"
  ]);
  assert.deepEqual(request.activeTransformationIds, [
    "transform.linear-solve.cancel-left-additive-inverse"
  ]);
  assert.deepEqual(request.diagnostics, []);
});

test("decomposition authoring request reports missing selected transformation", () => {
  const animation = createLinearSolveAnimationAsset();
  const frame = sampleKpAnimationRuntimeFrame({ animation, progress: 0.5 });
  const request = createKpAnimationDecompositionAuthoringRequest({
    animation,
    frame,
    selectedTransformationId: "transform.missing"
  });

  assert.deepEqual(request.diagnostics, [
    {
      severity: "error",
      code: "decomposition.transformation-missing",
      path: "selectedTransformationId",
      message:
        "Animation animation.linear-solve.solve-x does not contain selected transformation transform.missing."
    }
  ]);
});

test("linear solve paused-frame decomposition example packages an LLM drill-down blueprint", () => {
  const example = createLinearSolvePausedFrameDecompositionExample();

  assert.equal(
    example.id,
    "llm-decomposition-example.animation.linear-solve.solve-x.cancel-additive-inverse"
  );
  assert.equal(example.kind, "llm-paused-frame-decomposition-example");
  assert.equal(example.animationId, "animation.linear-solve.solve-x");
  assert.equal(example.pausedFrameId, "runtime.linear-solve.paused-cancel");
  assert.equal(example.progress, 0.5);
  assert.equal(
    example.request.selectedTransformationId,
    "transform.linear-solve.cancel-left-additive-inverse"
  );
  assert.deepEqual(example.request.focusSelectorIds, [
    "equation.linear-solve.after-subtract.lhs.plus3",
    "equation.linear-solve.after-subtract.lhs.minus3"
  ]);
  assert.deepEqual(example.drillDownBlueprint, {
    animationId:
      "animation.drilldown.linear-solve.cancel-left-additive-inverse",
    title: "Drill down into additive inverse cancellation",
    sourceTransformationId:
      "transform.linear-solve.cancel-left-additive-inverse",
    requiredSelectorIds: [
      "equation.linear-solve.after-subtract.lhs.plus3",
      "equation.linear-solve.after-subtract.lhs.minus3"
    ],
    suggestedTransformTypes: [
      "focusSelectors",
      "pairAdditiveInverses",
      "vanishToZero",
      "restoreParentFrame"
    ]
  });
  assert.ok(example.searchFields.includes("llm-paused-frame-decomposition"));
  assert.ok(
    example.searchFields.includes(
      "selected-transformation:transform.linear-solve.cancel-left-additive-inverse"
    )
  );
});
