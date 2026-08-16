import type { KpMeasuredEquationTransitionGeometry } from "./equation-motion-dom.ts";
import {
  applyKpEquationTokenMotionFrame,
  sampleKpEquationTokenMotion,
  type KpEquationTokenMotionFrame
} from "./semantic-equation-token-renderer.ts";
import type { KpPrecomputedEquationMotionPlan } from "./precomputed-equation-motion.ts";
import type {
  KpAnimationRuntimeCapabilities
} from "../animation/runtime-capabilities.ts";
import {
  sampleKpEquationSemanticTimeline,
  type KpEquationSemanticTimelineFrame
} from "./equation-visual-motif-timeline.ts";
import {
  createKpEquationMotifAccessibilityPlan,
  sampleKpEquationMotifAccessibility,
  type KpEquationMotifAccessibilityMode
} from "./equation-motif-accessibility.ts";

export interface KpSemanticEquationFrameClock {
  readonly animationId: string;
  readonly runtimeFrameId: string;
  readonly phaseId: string;
  readonly direction: "forward" | "rewind";
  readonly globalProgress: number;
  readonly phaseLocalProgress: number;
}

export interface KpSemanticEquationTokenFrame {
  readonly kind: "semantic-equation-token-frame";
  readonly animationId: string;
  readonly runtimeFrameId: string;
  readonly phaseId: string;
  readonly direction: KpSemanticEquationFrameClock["direction"];
  readonly globalProgress: number;
  readonly phaseLocalProgress: number;
  readonly semanticProgress: number;
  readonly semanticMotionChoreographyId?: string | undefined;
  readonly motion: KpEquationTokenMotionFrame;
  readonly semanticTimeline: KpEquationSemanticTimelineFrame;
  readonly accessibilityMode: KpEquationMotifAccessibilityMode;
  readonly narration: string;
}

export function createKpSemanticEquationTokenFrame(input: {
  readonly geometry: KpMeasuredEquationTransitionGeometry;
  readonly clock: KpSemanticEquationFrameClock;
  readonly precomputedPlan?: KpPrecomputedEquationMotionPlan | undefined;
  readonly accessibilityMode?: KpEquationMotifAccessibilityMode | undefined;
  readonly runtimeCapabilities?: KpAnimationRuntimeCapabilities | undefined;
}): KpSemanticEquationTokenFrame {
  const phaseLocalProgress = clamp01(input.clock.phaseLocalProgress);
  const semanticMotionSample = input.runtimeCapabilities?.semanticMotion
    ?.sampleForAnimationId({
      animationId: input.clock.animationId,
      progress: phaseLocalProgress,
      direction: input.clock.direction
    });
  const semanticProgress = semanticMotionSample?.semanticProgress ?? (
    input.clock.direction === "forward"
      ? phaseLocalProgress
      : 1 - phaseLocalProgress
  );
  const semanticTimeline = input.precomputedPlan?.semanticTimeline;
  const accessibilityMode = input.accessibilityMode ?? "full-motion";
  const accessibility = semanticTimeline === undefined
    ? undefined
    : sampleKpEquationMotifAccessibility({
        plan: createKpEquationMotifAccessibilityPlan({ timeline: semanticTimeline }),
        mode: accessibilityMode,
        progress: semanticProgress
      });
  const accessibleProgress = accessibility?.semanticProgress ?? semanticProgress;
  return {
    kind: "semantic-equation-token-frame",
    animationId: input.clock.animationId,
    runtimeFrameId: input.clock.runtimeFrameId,
    phaseId: input.clock.phaseId,
    direction: input.clock.direction,
    globalProgress: input.clock.globalProgress,
    phaseLocalProgress,
    semanticProgress: accessibleProgress,
    ...(semanticMotionSample === undefined
      ? {}
      : {
          semanticMotionChoreographyId:
            semanticMotionSample.choreographyId
        }),
    motion: sampleKpEquationTokenMotion(
      input.geometry,
      accessibleProgress,
      input.runtimeCapabilities
    ),
    semanticTimeline: accessibility?.semanticTimeline ?? (
      semanticTimeline === undefined
        ? fallbackSemanticTimelineFrame(accessibleProgress)
        : sampleKpEquationSemanticTimeline(semanticTimeline, accessibleProgress)
    ),
    accessibilityMode,
    narration: accessibility?.narration ?? "Animation checkpoint"
  };
}

export function applyKpSemanticEquationTokenFrame(
  geometry: KpMeasuredEquationTransitionGeometry,
  frame: KpSemanticEquationTokenFrame
): void {
  applyKpEquationTokenMotionFrame(geometry, frame.motion);
}

function fallbackSemanticTimelineFrame(progress: number): KpEquationSemanticTimelineFrame {
  return {
    progress,
    activePhaseIds: [],
    completedPhaseIds: [],
    previousCheckpointId: "semantic-checkpoint.start",
    nextCheckpointId: "semantic-checkpoint.end",
    visualFrame: { progress, motifs: [] }
  };
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}
