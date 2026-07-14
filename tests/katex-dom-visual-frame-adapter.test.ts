import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  createKatexDomRuntimeVisualFrame
} from "../src/rendering/katex-dom-visual-frame-adapter.ts";
import type { KatexSnapshot } from "../src/rendering/katex-token-snapshot.ts";
import type { KatexMotionToken } from "../src/rendering/katex-transition-types.ts";

function token(
  id: string,
  text: string,
  absoluteLeft: number,
  localLeft: number
): KatexMotionToken {
  return {
    id,
    text,
    signature: text === "+" || text === "-" || text === "=" ? "mbin" : "mord",
    rect: { left: absoluteLeft, top: 24, width: 10, height: 12 },
    localRect: { left: localLeft, top: 4, width: 10, height: 12 },
    row: 0
  };
}

test("createKatexDomRuntimeVisualFrame preserves measured snapshot geometry", () => {
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.linear-solve.cancel",
    animation: createLinearSolveAnimationAsset(),
    progress: 0.5
  });
  const snapshot: KatexSnapshot = {
    bounds: { left: 80, top: 20, width: 220, height: 48 },
    tokens: [
      token("tok.x", "x", 84, 4),
      token("tok.plus", "+", 102, 22),
      token("tok.plus-three", "3", 114, 34),
      token("tok.minus", "-", 132, 52),
      token("tok.minus-three", "3", 144, 64),
      token("tok.equals", "=", 166, 86)
    ]
  };

  const visualFrame = createKatexDomRuntimeVisualFrame({
    id: "visual.dom.linear-solve.cancel",
    runtimeFrame,
    snapshot,
    renderTargetRef: "katex-root"
  });

  assert.deepEqual(
    visualFrame.nodes.find(
      (node) => node.id === "katex-render-target.render.linear-solve.equation"
    )?.geometry,
    { x: 0, y: 0, width: 220, height: 48 }
  );
  assert.deepEqual(
    visualFrame.nodes.find(
      (node) =>
        node.id ===
        "katex-selector.equation.linear-solve.after-subtract.lhs.plus3.tok.plus"
    )?.geometry,
    { x: 22, y: 4, width: 10, height: 12 }
  );
  assert.equal(visualFrame.runtimeFrameId, "runtime.linear-solve.cancel");
});
