import type {
  KpAnimationRuntimeFrame
} from "./runtime-sampler.ts";
import type {
  KpAnimationVisualFrame
} from "./visual-frame-adapter.ts";

export interface CreateKpAnimationRuntimeVisualFrameSampleInput {
  readonly progress?: number | undefined;
}

export interface KpAnimationRuntimeVisualFrameSample {
  readonly animationId: string;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly visualFrame: KpAnimationVisualFrame;
}

export type KpAnimationRuntimeVisualFrameSampleFactory = (
  input?: CreateKpAnimationRuntimeVisualFrameSampleInput
) => KpAnimationRuntimeVisualFrameSample;
