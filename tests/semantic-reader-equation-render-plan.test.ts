import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import { projectKpReaderEquationRenderPlan } from "../src/reader/renderers/public-api.ts";

test("reader equation plans project the active neutral frame without DOM state", () => {
  const animation = createLinearSolveAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.reader.cancel.forward",
    animation,
    progress: 0.5
  });
  const plan = projectKpReaderEquationRenderPlan({ animation, runtimeFrame });

  assert.equal(plan.kind, "reader-equation-render-plan");
  assert.equal(plan.runtimeFrameId, runtimeFrame.id);
  assert.equal(plan.phaseId, "animation.linear-solve.solve-x.forward.1");
  assert.equal(plan.progress, 0.5);
  assert.deepEqual(plan.diagnostics, []);
  assert.equal(plan.transitions.length, 1);

  const transition = plan.transitions[0]!;
  assert.equal(
    transition.id,
    "transform.linear-solve.cancel-left-additive-inverse"
  );
  assert.equal(transition.semanticStatus, "ready");
  assert.deepEqual(transition.source.map((state) => state.latex), [
    "x + 3 - 3 = 7 - 3"
  ]);
  assert.deepEqual(transition.target.map((state) => state.latex), [
    "x = 7 - 3"
  ]);
  assert.deepEqual(
    transition.source[0]!.selectors
      .filter((selector) => selector.focused)
      .map((selector) => selector.label),
    ["+3", "-3"]
  );
  assert.deepEqual(
    transition.relations.find((relation) => relation.lifecycle === "cancel"),
    {
      recordId: "left-inverses-cancel",
      relation: "cancelation",
      lifecycle: "cancel",
      sourceSelectorIds: [
        "equation.linear-solve.after-subtract.lhs.plus3",
        "equation.linear-solve.after-subtract.lhs.minus3"
      ],
      targetSelectorIds: [],
      summary: "+3 and -3 cancel."
    }
  );
});

test("reader equation plans reverse endpoints and lifecycle intent for rewind", () => {
  const animation = createLinearSolveAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.reader.cancel.rewind",
    animation,
    direction: "rewind",
    progress: 0.5
  });
  const plan = projectKpReaderEquationRenderPlan({ animation, runtimeFrame });
  const transition = plan.transitions[0]!;

  assert.equal(plan.direction, "rewind");
  assert.deepEqual(transition.source.map((state) => state.latex), [
    "x = 7 - 3"
  ]);
  assert.deepEqual(transition.target.map((state) => state.latex), [
    "x + 3 - 3 = 7 - 3"
  ]);

  const restoredTerms = transition.relations.find(
    (relation) => relation.recordId === "left-inverses-cancel"
  );
  assert.deepEqual(restoredTerms, {
    recordId: "left-inverses-cancel",
    relation: "cancelation",
    lifecycle: "enter",
    sourceSelectorIds: [],
    targetSelectorIds: [
      "equation.linear-solve.after-subtract.lhs.plus3",
      "equation.linear-solve.after-subtract.lhs.minus3"
    ],
    summary: "+3 and -3 cancel."
  });
  assert.deepEqual(
    transition.target[0]!.selectors
      .filter((selector) => selector.focused)
      .map((selector) => selector.label),
    ["+3", "-3"]
  );
});

test("reader equation plans reject frames from another animation", () => {
  const animation = createLinearSolveAnimationAsset();
  const runtimeFrame = {
    ...sampleKpAnimationRuntimeFrame({ animation, progress: 0.5 }),
    animationId: "animation.other"
  };

  assert.throws(
    () => projectKpReaderEquationRenderPlan({ animation, runtimeFrame }),
    /does not match runtime frame animation\.other/
  );
});
