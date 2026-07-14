import type {
  KpAnimationRuntimeFrame
} from "../animation/runtime-sampler.ts";
import type {
  KpAnimationVisualFrame
} from "../animation/visual-frame-adapter.ts";
import {
  createKatexRuntimeVisualFrame
} from "./katex-runtime-visual-bindings.ts";
import {
  snapshotKatexTokens,
  type KatexSnapshot,
  type KatexSnapshotOptions
} from "./katex-token-snapshot.ts";

export interface CreateKatexDomRuntimeVisualFrameInput {
  readonly id?: string | undefined;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly root?: Element | undefined;
  readonly snapshot?: KatexSnapshot | undefined;
  readonly snapshotOptions?: KatexSnapshotOptions | undefined;
  readonly renderTargetRef?: string | undefined;
}

export function createKatexDomRuntimeVisualFrame(
  input: CreateKatexDomRuntimeVisualFrameInput
): KpAnimationVisualFrame {
  const snapshot = resolveSnapshot(input);

  return createKatexRuntimeVisualFrame({
    id: input.id,
    runtimeFrame: input.runtimeFrame,
    tokens: snapshot.tokens,
    renderTargetRef: input.renderTargetRef,
    renderTargetGeometry: {
      x: 0,
      y: 0,
      width: snapshot.bounds.width,
      height: snapshot.bounds.height
    }
  });
}

function resolveSnapshot(
  input: CreateKatexDomRuntimeVisualFrameInput
): KatexSnapshot {
  if (input.snapshot !== undefined) {
    return input.snapshot;
  }

  if (input.root === undefined) {
    throw new Error(
      "createKatexDomRuntimeVisualFrame requires either root or snapshot."
    );
  }

  return snapshotKatexTokens(input.root, input.snapshotOptions);
}
