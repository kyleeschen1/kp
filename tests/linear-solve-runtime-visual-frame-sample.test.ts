import assert from "node:assert/strict";
import test from "node:test";

import {
  createLinearSolveRuntimeVisualFrameSample
} from "../src/rendering/linear-solve-runtime-visual-sample.ts";

test("createLinearSolveRuntimeVisualFrameSample samples x plus 3 equals 7 through visual frames", () => {
  const sample = createLinearSolveRuntimeVisualFrameSample();
  const visualFrame = sample.visualFrame;
  const plus3 = visualFrame.selectorVisuals.find(
    (selector) =>
      selector.selectorId === "equation.linear-solve.after-subtract.lhs.plus3"
  );
  const minus3 = visualFrame.selectorVisuals.find(
    (selector) =>
      selector.selectorId === "equation.linear-solve.after-subtract.lhs.minus3"
  );

  assert.equal(sample.animationId, "animation.linear-solve.solve-x");
  assert.equal(sample.runtimeFrame.phase.phaseId, "animation.linear-solve.solve-x.forward.1");
  assert.equal(visualFrame.kind, "animation-visual-frame");
  assert.equal(visualFrame.clock.progress, 0.5);
  assert.deepEqual(visualFrame.renderTargetVisuals[0]?.nodeIds, [
    "katex-render-target.render.linear-solve.equation"
  ]);
  assert.deepEqual(
    plus3?.nodeIds.map((nodeId) =>
      visualFrame.nodes.find((node) => node.id === nodeId)?.ref
    ),
    ["tok.plus", "tok.plus-three"]
  );
  assert.deepEqual(
    minus3?.nodeIds.map((nodeId) =>
      visualFrame.nodes.find((node) => node.id === nodeId)?.ref
    ),
    ["tok.left-minus", "tok.left-minus-three"]
  );
  assert.equal(
    visualFrame.diagnostics.some((diagnostic) =>
      diagnostic.code.endsWith("unbound") ||
      diagnostic.code.endsWith("ambiguous")
    ),
    false
  );
});
