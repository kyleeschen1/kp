import assert from "node:assert/strict";
import test from "node:test";

import {
  createLinearSolvePausedFrameDrillDownSample
} from "../src/animation/paused-frame-drilldown.ts";
import {
  createLinearSolveRuntimeVisualFrameSample
} from "../src/rendering/linear-solve-runtime-visual-sample.ts";

test("createLinearSolvePausedFrameDrillDownSample explains the paused cancel frame", () => {
  const sample = createLinearSolvePausedFrameDrillDownSample({
    progress: 0.5,
    createVisualSample: createLinearSolveRuntimeVisualFrameSample
  });

  assert.equal(
    sample.id,
    "paused-frame-drilldown.animation.linear-solve.solve-x.forward.beat-25"
  );
  assert.equal(sample.kind, "animation-paused-frame-drilldown-sample");
  assert.equal(sample.animationId, "animation.linear-solve.solve-x");
  assert.equal(sample.runtimeFrameId, "runtime.linear-solve.visual-sample");
  assert.equal(sample.visualFrameId, "visual.linear-solve.visual-sample");
  assert.equal(sample.clock.progress, 0.5);
  assert.equal(sample.clock.beat, 25);
  assert.equal(
    sample.phase.phaseId,
    "animation.linear-solve.solve-x.forward.1"
  );
  assert.deepEqual(sample.activeTransformationRows, [
    {
      id:
        "paused-frame-drilldown.animation.linear-solve.solve-x.forward.beat-25.transform.transform.linear-solve.cancel-left-additive-inverse",
      transformationId: "transform.linear-solve.cancel-left-additive-inverse",
      title: "Cancel +3 and -3 on the left",
      transformType: "cancelAdditiveInverses",
      sourceObjectIds: ["equation.linear-solve.after-subtract"],
      targetObjectIds: ["equation.linear-solve.left-simplified"]
    }
  ]);
  assert.deepEqual(
    sample.focusSelectorRows.map((row) => ({
      selectorId: row.selectorId,
      label: row.label,
      roles: row.roles,
      nodeRefs: row.nodeRefs,
      xPositions: row.geometry.map((geometry) => geometry.x)
    })),
    [
      {
        selectorId: "equation.linear-solve.after-subtract.lhs.plus3",
        label: "+3",
        roles: ["source", "focus"],
        nodeRefs: ["tok.plus", "tok.plus-three"],
        xPositions: [18, 30]
      },
      {
        selectorId: "equation.linear-solve.after-subtract.lhs.minus3",
        label: "-3",
        roles: ["source", "focus"],
        nodeRefs: ["tok.left-minus", "tok.left-minus-three"],
        xPositions: [48, 60]
      }
    ]
  );
  assert.deepEqual(
    sample.flashcardRows.map((row) => ({
      cardId: row.cardId,
      interactionKind: row.interactionKind,
      activeTransformationIds: row.activeTransformationIds
    })),
    [
      {
        cardId: "card.linear-solve.cloze-plus3",
        interactionKind: "cloze",
        activeTransformationIds: [
          "transform.linear-solve.cancel-left-additive-inverse"
        ]
      },
      {
        cardId: "card.linear-solve.predict-subtract",
        interactionKind: "predict-next",
        activeTransformationIds: [
          "transform.linear-solve.subtract-both-sides-3"
        ]
      },
      {
        cardId: "card.linear-solve.explain-cancel",
        interactionKind: "review",
        activeTransformationIds: [
          "transform.linear-solve.cancel-left-additive-inverse"
        ]
      },
      {
        cardId: "card.linear-solve.focus-x-persistence",
        interactionKind: "review",
        activeTransformationIds: [
          "transform.linear-solve.cancel-left-additive-inverse"
        ]
      }
    ]
  );
  assert.deepEqual(sample.diagnostics, []);
});
