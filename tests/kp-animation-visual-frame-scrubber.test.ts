import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import {
  createKpAnimationRuntimeScrubberControl
} from "../src/animation/runtime-sampler.ts";
import {
  sampleKpAnimationVisualFrameFromScrubber
} from "../src/animation/visual-frame-adapter.ts";
import {
  createKatexDomRuntimeVisualFrame
} from "../src/rendering/katex-dom-visual-frame-adapter.ts";
import type { KatexSnapshot } from "../src/rendering/katex-token-snapshot.ts";
import type { KatexMotionToken } from "../src/rendering/katex-transition-types.ts";

function token(id: string, text: string, left: number): KatexMotionToken {
  return {
    id,
    text,
    signature: text === "+" || text === "-" || text === "=" ? "mbin" : "mord",
    rect: { left, top: 0, width: 10, height: 12 },
    localRect: { left, top: 0, width: 10, height: 12 },
    row: 0
  };
}

test("sampleKpAnimationVisualFrameFromScrubber keeps visual frames on the scrubber clock", () => {
  const animation = createLinearSolveAnimationAsset();
  const scrubber = createKpAnimationRuntimeScrubberControl(animation);
  const snapshot: KatexSnapshot = {
    bounds: { left: 0, top: 0, width: 160, height: 32 },
    tokens: [
      token("tok.x", "x", 0),
      token("tok.plus", "+", 18),
      token("tok.plus-three", "3", 30),
      token("tok.left-minus", "-", 48),
      token("tok.left-minus-three", "3", 60),
      token("tok.equals", "=", 82),
      token("tok.seven", "7", 104),
      token("tok.right-minus", "-", 122),
      token("tok.right-three", "3", 134)
    ]
  };

  const sample = sampleKpAnimationVisualFrameFromScrubber({
    animation,
    scrubber,
    value: 25,
    createVisualFrame: (runtimeFrame) =>
      createKatexDomRuntimeVisualFrame({
        id: "visual.linear-solve.from-scrubber",
        runtimeFrame,
        snapshot
      })
  });

  assert.equal(sample.kind, "animation-visual-frame-scrubber-sample");
  assert.equal(sample.value, 25);
  assert.equal(sample.runtimeFrame.clock.progress, 0.5);
  assert.equal(sample.runtimeFrame.clock.beat, 25);
  assert.deepEqual(sample.visualFrame.clock, sample.runtimeFrame.clock);
  assert.equal(sample.visualFrame.id, "visual.linear-solve.from-scrubber");
});
