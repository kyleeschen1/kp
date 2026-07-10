import type {
  KpAnimationSampler,
  KpSampledAnimationFrame
} from "../animation/kernel.ts";
import type {
  EasingName,
  EquationMotionPlan,
  EquationMotionTrack,
  MotionPose
} from "./equation-motion-plan.ts";
import {
  createEquationVisualMotifTimeline,
  sampleEquationVisualMotifTimeline,
  type EquationVisualMotifFrameMotif
} from "./equation-visual-motif-timeline.ts";
import {
  linearEquationDemoBeatTimeline,
  type SemanticBeatTimeline
} from "./semantic-beat-compiler.ts";

export interface EquationMotionFrame extends KpSampledAnimationFrame {
  readonly progress: number;
  readonly tokens: readonly EquationMotionFrameToken[];
  readonly visualMotifs: readonly EquationVisualMotifFrameMotif[];
}

export interface EquationMotionFrameToken {
  readonly tokenId: string;
  readonly pose: MotionPose;
}

export interface EquationMotionSamplerOptions {
  readonly timeline?: SemanticBeatTimeline | undefined;
}

export interface EquationMotionSampler
  extends KpAnimationSampler<EquationMotionFrame> {
  readonly plan: EquationMotionPlan;
  sample(progress: number): EquationMotionFrame;
}

export function createEquationMotionSampler(
  plan: EquationMotionPlan,
  options: EquationMotionSamplerOptions = {}
): EquationMotionSampler {
  const visualMotifTimeline = createEquationVisualMotifTimeline(
    plan,
    options.timeline ?? linearEquationDemoBeatTimeline
  );

  return {
    plan,
    sample(progress) {
      const frameProgress = clamp01(progress);

      return {
        progress: frameProgress,
        tokens: plan.tracks.map((track) => ({
          tokenId: track.tokenId,
          pose: sampleTrackPose(track, frameProgress)
        })),
        visualMotifs: sampleEquationVisualMotifTimeline(
          visualMotifTimeline,
          frameProgress
        ).motifs
      };
    }
  };
}

export function sampleEquationMotion(
  plan: EquationMotionPlan,
  progress: number,
  options: EquationMotionSamplerOptions = {}
): EquationMotionFrame {
  return createEquationMotionSampler(plan, options).sample(progress);
}

function sampleTrackPose(
  track: EquationMotionTrack,
  progress: number
): MotionPose {
  const localProgress = easedProgress(
    track.easing,
    localTrackProgress(track, progress)
  );

  return {
    opacity: interpolate(track.from.opacity, track.to.opacity, localProgress),
    x: interpolate(track.from.x, track.to.x, localProgress),
    y: interpolate(track.from.y, track.to.y, localProgress),
    scale: interpolate(track.from.scale, track.to.scale, localProgress)
  };
}

function localTrackProgress(
  track: EquationMotionTrack,
  progress: number
): number {
  if (track.end <= track.start) {
    return progress >= track.start ? 1 : 0;
  }

  if (progress <= track.start) {
    return 0;
  }

  if (progress >= track.end) {
    return 1;
  }

  return clamp01((progress - track.start) / (track.end - track.start));
}

function easedProgress(easing: EasingName, progress: number): number {
  switch (easing) {
    case "linear":
      return progress;
    case "ease-in":
      return progress * progress;
    case "ease-out":
      return 1 - (1 - progress) * (1 - progress);
    case "ease-in-out":
      return (1 - Math.cos(Math.PI * progress)) / 2;
    default:
      return assertNever(easing);
  }
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function assertNever(value: never): never {
  throw new Error(`Unhandled equation motion easing: ${value}`);
}
