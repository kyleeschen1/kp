import assert from "node:assert/strict";
import test from "node:test";

import { runKpInterpreter } from "../src/semantic/asset-interpreter.ts";
import { sampleKpBehaviorAtProgress } from "../src/semantic/asset-behavior.ts";
import { createLinearSolveKpAssetBundle } from "../src/semantic/linear-solve-asset.ts";
import {
  createLinearSolveEquationFrameBehavior,
  createLinearSolveEquationFrameInterpreter
} from "../src/semantic/linear-solve-equation-frame-interpreter.ts";

test("linear-solve equation frame interpreter samples the active cancel transformation", () => {
  const asset = createLinearSolveKpAssetBundle();
  const interpreter = createLinearSolveEquationFrameInterpreter();
  const interpretation = runKpInterpreter(interpreter, {
    asset,
    progress: 0.5
  });

  assert.equal(interpretation.target, "katex-dom");
  assert.equal(interpretation.preservation, "sampled");
  assert.equal(interpretation.output.assetId, "asset.linear-solve");
  assert.equal(interpretation.output.surface, "katex-dom");
  assert.equal(interpretation.output.progress, 0.5);
  assert.deepEqual(
    interpretation.output.transformationRefs.map((ref) => [
      ref.transformationId,
      ref.progress
    ]),
    [["transform.linear-solve.cancel-left-additive-inverse", 0.5]]
  );
  assert.deepEqual(interpretation.output.activeTransformationIds, [
    "transform.linear-solve.cancel-left-additive-inverse"
  ]);
  assert.deepEqual(
    interpretation.output.objectRefs.map((ref) => [ref.objectId, ref.role]),
    [
      ["equation.linear-solve.after-subtract", "source"],
      ["equation.linear-solve.left-simplified", "target"]
    ]
  );
  assert.deepEqual(
    interpretation.output.selectorRefs
      .filter((ref) => ref.role === "persistent")
      .map((ref) => ref.selectorId),
    [
      "equation.linear-solve.after-subtract.lhs.x",
      "equation.linear-solve.left-simplified.lhs.x",
      "equation.linear-solve.after-subtract.equals",
      "equation.linear-solve.left-simplified.equals",
      "equation.linear-solve.after-subtract.rhs.7",
      "equation.linear-solve.left-simplified.rhs.7",
      "equation.linear-solve.after-subtract.rhs.minus3",
      "equation.linear-solve.left-simplified.rhs.minus3"
    ]
  );
  assert.deepEqual(interpretation.output.selectorCorrespondenceRefs, [
    {
      sourceSelectorId: "equation.linear-solve.after-subtract.lhs.x",
      targetSelectorId: "equation.linear-solve.left-simplified.lhs.x",
      preserves: ["identity", "role"]
    },
    {
      sourceSelectorId: "equation.linear-solve.after-subtract.equals",
      targetSelectorId: "equation.linear-solve.left-simplified.equals",
      preserves: ["identity", "role"]
    },
    {
      sourceSelectorId: "equation.linear-solve.after-subtract.rhs.7",
      targetSelectorId: "equation.linear-solve.left-simplified.rhs.7",
      preserves: ["identity", "role"]
    },
    {
      sourceSelectorId: "equation.linear-solve.after-subtract.rhs.minus3",
      targetSelectorId: "equation.linear-solve.left-simplified.rhs.minus3",
      preserves: ["identity", "role"]
    }
  ]);
  assert.deepEqual(interpretation.output.drillDownIds, [
    "drilldown.linear-solve.cancel-additive-inverse"
  ]);
  assert.deepEqual(interpretation.output.flashcardIds, [
    "card.linear-solve.explain-cancel",
    "card.linear-solve.focus-x-persistence"
  ]);
  assert.deepEqual(interpretation.diagnostics, []);
  assert.deepEqual(interpretation.output.diagnostics, []);
});

test("linear-solve equation frame interpreter clamps progress at the solved step", () => {
  const interpretation = runKpInterpreter(
    createLinearSolveEquationFrameInterpreter(),
    {
      asset: createLinearSolveKpAssetBundle(),
      progress: 2
    }
  );

  assert.equal(interpretation.output.progress, 1);
  assert.deepEqual(
    interpretation.output.transformationRefs.map((ref) => [
      ref.transformationId,
      ref.progress
    ]),
    [["transform.linear-solve.simplify-right-difference", 1]]
  );
});

test("linear-solve equation frame behavior exposes active semantic transformation ids", () => {
  const behavior = createLinearSolveEquationFrameBehavior(
    createLinearSolveKpAssetBundle()
  );
  const frame = sampleKpBehaviorAtProgress(behavior, 0.5);
  const rewindFrame = sampleKpBehaviorAtProgress(behavior, 0.5);

  assert.deepEqual(frame, rewindFrame);
  assert.equal(behavior.id, "behavior.linear-solve.katex-equation-frame");
  assert.deepEqual(frame.activeTransformationIds, [
    "transform.linear-solve.cancel-left-additive-inverse"
  ]);
  assert.deepEqual(frame.inspection, {
    behaviorId: "behavior.linear-solve.katex-equation-frame",
    timeMs: 1500,
    progress: 0.5,
    phaseId: "transform.linear-solve.cancel-left-additive-inverse",
    activeTransformationIds: [
      "transform.linear-solve.cancel-left-additive-inverse"
    ],
    activeSelectorIds: [
      "equation.linear-solve.after-subtract.lhs.x",
      "equation.linear-solve.left-simplified.lhs.x",
      "equation.linear-solve.after-subtract.equals",
      "equation.linear-solve.left-simplified.equals",
      "equation.linear-solve.after-subtract.rhs.7",
      "equation.linear-solve.left-simplified.rhs.7",
      "equation.linear-solve.after-subtract.rhs.minus3",
      "equation.linear-solve.left-simplified.rhs.minus3"
    ]
  });
});
