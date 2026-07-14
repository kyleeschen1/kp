import {
  createLinearSolveAnimationAsset
} from "../animation/linear-solve-adapter.ts";
import {
  sampleKpAnimationRuntimeFrame,
  type KpAnimationRuntimeFrame
} from "../animation/runtime-sampler.ts";
import type {
  KpAnimationVisualFrame
} from "../animation/visual-frame-adapter.ts";
import {
  createKatexDomRuntimeVisualFrame
} from "./katex-dom-visual-frame-adapter.ts";
import type {
  KatexSnapshot
} from "./katex-token-snapshot.ts";
import type {
  KatexMotionToken
} from "./katex-transition-types.ts";

export interface CreateLinearSolveRuntimeVisualFrameSampleInput {
  readonly progress?: number | undefined;
}

export interface LinearSolveRuntimeVisualFrameSample {
  readonly animationId: string;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly snapshot: KatexSnapshot;
  readonly visualFrame: KpAnimationVisualFrame;
}

export function createLinearSolveRuntimeVisualFrameSample(
  input: CreateLinearSolveRuntimeVisualFrameSampleInput = {}
): LinearSolveRuntimeVisualFrameSample {
  const animation = createLinearSolveAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.linear-solve.visual-sample",
    animation,
    progress: input.progress ?? 0.5
  });
  const snapshot = linearSolveCancellationKatexSnapshot();

  return {
    animationId: animation.id,
    runtimeFrame,
    snapshot,
    visualFrame: createKatexDomRuntimeVisualFrame({
      id: "visual.linear-solve.visual-sample",
      runtimeFrame,
      snapshot,
      renderTargetRef: "katex.linear-solve.visual-sample"
    })
  };
}

function linearSolveCancellationKatexSnapshot(): KatexSnapshot {
  const tokens = [
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

  return {
    bounds: { left: 0, top: 0, width: 154, height: 32 },
    tokens
  };
}

function token(id: string, text: string, left: number): KatexMotionToken {
  return {
    id,
    text,
    signature: text === "+" || text === "-" || text === "=" ? "mbin" : "mord",
    rect: { left, top: 0, width: 10, height: 16 },
    localRect: { left, top: 0, width: 10, height: 16 },
    row: 0
  };
}
