import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  createKatexRuntimeVisualFrame
} from "../src/rendering/katex-runtime-visual-bindings.ts";
import type { KatexMotionToken } from "../src/rendering/katex-transition-types.ts";

function token(
  id: string,
  text: string,
  left: number,
  top = 0
): KatexMotionToken {
  return {
    id,
    text,
    signature: text === "+" || text === "-" || text === "=" ? "mbin" : "mord",
    rect: { left, top, width: 10, height: 12 },
    localRect: { left, top, width: 10, height: 12 },
    row: 0
  };
}

test("createKatexRuntimeVisualFrame maps runtime term selectors to KaTeX token refs", () => {
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.linear-solve.cancel",
    animation: createLinearSolveAnimationAsset(),
    progress: 0.5
  });

  const visualFrame = createKatexRuntimeVisualFrame({
    id: "visual.katex.linear-solve.cancel",
    runtimeFrame,
    renderTargetRef: "katex-root",
    tokens: [
      token("tok.x", "x", 0),
      token("tok.plus", "+", 18),
      token("tok.plus-three", "3", 30),
      token("tok.minus", "-", 48),
      token("tok.minus-three", "3", 60),
      token("tok.equals", "=", 82),
      token("tok.seven", "7", 104),
      token("tok.right-minus", "-", 122),
      token("tok.right-three", "3", 134)
    ]
  });

  const plus3 = visualFrame.selectorVisuals.find(
    (selector) =>
      selector.selectorId === "equation.linear-solve.after-subtract.lhs.plus3"
  );
  const minus3 = visualFrame.selectorVisuals.find(
    (selector) =>
      selector.selectorId === "equation.linear-solve.after-subtract.lhs.minus3"
  );

  assert.deepEqual(
    plus3?.nodeIds.flatMap((nodeId) =>
      visualFrame.nodes
        .filter((node) => node.id === nodeId)
        .map((node) => [node.ref, node.geometry?.x])
    ),
    [
      ["tok.plus", 18],
      ["tok.plus-three", 30]
    ]
  );
  assert.deepEqual(
    minus3?.nodeIds.flatMap((nodeId) =>
      visualFrame.nodes
        .filter((node) => node.id === nodeId)
        .map((node) => [node.ref, node.geometry?.x])
    ),
    [
      ["tok.minus", 48],
      ["tok.minus-three", 60]
    ]
  );
  assert.deepEqual(visualFrame.renderTargetVisuals[0]?.nodeIds, [
    "katex-render-target.render.linear-solve.equation"
  ]);
  assert.equal(
    visualFrame.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "visual-frame.selector-unbound" &&
        diagnostic.path ===
          "selectorFrames[equation.linear-solve.after-subtract.lhs.plus3]"
    ),
    false
  );
});

test("createKatexRuntimeVisualFrame reports ambiguous selector token refs", () => {
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    animation: createLinearSolveAnimationAsset(),
    progress: 0.5
  });

  const visualFrame = createKatexRuntimeVisualFrame({
    runtimeFrame,
    tokens: [
      token("tok.left-x", "x", 0),
      token("tok.right-x", "x", 80)
    ]
  });

  assert.ok(
    visualFrame.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "katex-runtime.selector-token-ambiguous" &&
        diagnostic.path ===
          "selectorFrames[equation.linear-solve.after-subtract.lhs.x]"
    )
  );
});
