import type {
  KpAnimationAsset,
  KpAnimationAssetTransformationTreeDirection
} from "../animation/asset.ts";
import {
  sampleKpAnimationRuntimeFrame,
  type KpAnimationRuntimeFrame
} from "../animation/runtime-sampler.ts";
import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";
import {
  dispatchKpEditorAnimationSurface,
  type KpEditorAnimationSurfaceDispatch
} from "./animation-surface-dispatch.ts";

export type KpEditorAnimationPlaybackStatus =
  | "idle"
  | "playing"
  | "paused"
  | "complete";

export interface KpEditorAnimationPlayerState {
  readonly kind: "editor-animation-player-state";
  readonly descriptorId: string;
  readonly animationId: string;
  readonly playbackStatus: KpEditorAnimationPlaybackStatus;
  readonly direction: KpAnimationAssetTransformationTreeDirection;
  readonly progress: number;
  readonly durationMs?: number | undefined;
  readonly beatCount?: number | undefined;
  readonly surface: KpEditorAnimationSurfaceDispatch;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
}

export interface CreateKpEditorAnimationPlayerStateInput {
  readonly descriptor: KpEditorAnimationDescriptor;
  readonly animation: KpAnimationAsset;
  readonly catalog?: readonly KpAnimationAsset[] | undefined;
  readonly playbackStatus?: KpEditorAnimationPlaybackStatus | undefined;
  readonly direction?: KpAnimationAssetTransformationTreeDirection | undefined;
  readonly progress?: number | undefined;
}

export function createKpEditorAnimationPlayerState(
  input: CreateKpEditorAnimationPlayerStateInput
): KpEditorAnimationPlayerState {
  if (input.descriptor.animationId !== input.animation.id) {
    throw new Error(
      `Editor animation descriptor ${input.descriptor.id} selects ${input.descriptor.animationId}, not ${input.animation.id}.`
    );
  }

  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: `runtime.editor.${input.animation.id}`,
    animation: input.animation,
    childAnimations: input.catalog,
    direction: input.direction,
    progress: input.progress ?? 0
  });

  // The runtime clock is the single source of truth for normalized playback.
  // Keeping its sampled values here prevents editor controls from inventing a
  // second clock when they are added on top of this state.
  return {
    kind: "editor-animation-player-state",
    descriptorId: input.descriptor.id,
    animationId: input.animation.id,
    playbackStatus: input.playbackStatus ?? "idle",
    direction: runtimeFrame.clock.direction,
    progress: runtimeFrame.clock.progress,
    ...(input.descriptor.durationMs ?? input.animation.timeline?.durationMs) ===
    undefined
      ? {}
      : {
          durationMs:
            input.descriptor.durationMs ?? input.animation.timeline?.durationMs
        },
    ...(input.descriptor.beatCount ?? input.animation.timeline?.beatCount) ===
    undefined
      ? {}
      : {
          beatCount:
            input.descriptor.beatCount ?? input.animation.timeline?.beatCount
        },
    surface: dispatchKpEditorAnimationSurface(input.descriptor),
    runtimeFrame
  };
}
