import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  checkKpAnimationVisualFramePersistentTokenRewindLaw
} from "../src/animation/visual-frame-laws.ts";
import {
  createKatexRuntimeVisualFrame
} from "../src/rendering/katex-runtime-visual-bindings.ts";
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

const stableTokens: readonly KatexMotionToken[] = [
  token("tok.x", "x", 0),
  token("tok.plus", "+", 18),
  token("tok.plus-three", "3", 30),
  token("tok.left-minus", "-", 48),
  token("tok.left-minus-three", "3", 60),
  token("tok.equals", "=", 82),
  token("tok.seven", "7", 104),
  token("tok.right-minus", "-", 122),
  token("tok.right-three", "3", 134)
];

function visualFrameFor(
  direction: "forward" | "rewind",
  tokens: readonly KatexMotionToken[]
) {
  return createKatexRuntimeVisualFrame({
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation: createLinearSolveAnimationAsset(),
      direction,
      progress: 0.5
    }),
    tokens
  });
}

test("checkKpAnimationVisualFramePersistentTokenRewindLaw accepts stable persistent token refs", () => {
  assert.deepEqual(
    checkKpAnimationVisualFramePersistentTokenRewindLaw({
      animation: createLinearSolveAnimationAsset(),
      forwardFrame: visualFrameFor("forward", stableTokens),
      rewindFrame: visualFrameFor("rewind", stableTokens)
    }),
    {
      lawId: "animation-visual-frame.persistent-token-rewind",
      passed: true,
      failures: []
    }
  );
});

test("checkKpAnimationVisualFramePersistentTokenRewindLaw reports changed persistent token refs", () => {
  const changedRewindTokens = stableTokens.map((candidate) =>
    candidate.id === "tok.x"
      ? { ...candidate, id: "tok.rewind-x" }
      : candidate
  );

  assert.deepEqual(
    checkKpAnimationVisualFramePersistentTokenRewindLaw({
      animation: createLinearSolveAnimationAsset(),
      forwardFrame: visualFrameFor("forward", stableTokens),
      rewindFrame: visualFrameFor("rewind", changedRewindTokens)
    }),
    {
      lawId: "animation-visual-frame.persistent-token-rewind",
      passed: false,
      failures: [
        {
          path:
            "transformations[transform.linear-solve.cancel-left-additive-inverse].correspondence[0].sourceSelectorId",
          message:
            "Persistent selector equation.linear-solve.after-subtract.lhs.x must bind the same visual refs in forward and rewind frames."
        },
        {
          path:
            "transformations[transform.linear-solve.cancel-left-additive-inverse].correspondence[0].targetSelectorId",
          message:
            "Persistent selector equation.linear-solve.left-simplified.lhs.x must bind the same visual refs in forward and rewind frames."
        }
      ]
    }
  );
});
