import type { KpMeasuredEquationTransitionGeometry } from "../rendering/equation-motion-dom.ts";
import {
  applyKpEquationTokenMotionFrame,
  sampleKpEquationTokenMotion,
  type KpEquationTokenMotionFrame
} from "../rendering/semantic-equation-token-renderer.ts";
import type { KpEditorAnimationPlayerState } from "./animation-player-state.ts";
import type { KpEditorPrecomputedEquationMotionPlan } from "./precomputed-equation-motion.ts";
import {
  sampleKpEquationSemanticTimeline,
  type KpEquationSemanticTimelineFrame
} from "../rendering/equation-visual-motif-timeline.ts";
import {
  createKpEquationMotifAccessibilityPlan,
  sampleKpEquationMotifAccessibility,
  type KpEquationMotifAccessibilityMode
} from "../rendering/equation-motif-accessibility.ts";

export interface KpEditorSemanticEquationTokenFrame {
  readonly kind: "editor-semantic-equation-token-frame";
  readonly animationId: string;
  readonly runtimeFrameId: string;
  readonly phaseId: string;
  readonly direction: KpEditorAnimationPlayerState["direction"];
  readonly globalProgress: number;
  readonly phaseLocalProgress: number;
  readonly semanticProgress: number;
  readonly motion: KpEquationTokenMotionFrame;
  readonly semanticTimeline: KpEquationSemanticTimelineFrame;
  readonly accessibilityMode: KpEquationMotifAccessibilityMode;
  readonly narration: string;
}

export function createKpEditorSemanticEquationTokenFrame(input: {
  readonly geometry: KpMeasuredEquationTransitionGeometry;
  readonly playerState: KpEditorAnimationPlayerState;
  readonly phaseLocalProgress: number;
  readonly precomputedPlan?: KpEditorPrecomputedEquationMotionPlan | undefined;
  readonly accessibilityMode?: KpEquationMotifAccessibilityMode | undefined;
}): KpEditorSemanticEquationTokenFrame {
  const phaseLocalProgress = clamp01(input.phaseLocalProgress);
  const semanticProgress = input.playerState.direction === "forward"
    ? phaseLocalProgress
    : 1 - phaseLocalProgress;
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
    kind: "editor-semantic-equation-token-frame",
    animationId: input.playerState.animationId,
    runtimeFrameId: input.playerState.runtimeFrame.id,
    phaseId: input.playerState.runtimeFrame.phase.phaseId,
    direction: input.playerState.direction,
    globalProgress: input.playerState.progress,
    phaseLocalProgress,
    semanticProgress: accessibleProgress,
    motion: sampleKpEquationTokenMotion(input.geometry, accessibleProgress),
    semanticTimeline: accessibility?.semanticTimeline ?? (
      semanticTimeline === undefined
        ? fallbackSemanticTimelineFrame(accessibleProgress)
        : sampleKpEquationSemanticTimeline(semanticTimeline, accessibleProgress)
    ),
    accessibilityMode,
    narration: accessibility?.narration ?? "Animation checkpoint"
  };
}

function fallbackSemanticTimelineFrame(
  progress: number
): KpEquationSemanticTimelineFrame {
  return {
    progress,
    activePhaseIds: [],
    completedPhaseIds: [],
    previousCheckpointId: "semantic-checkpoint.start",
    nextCheckpointId: "semantic-checkpoint.end",
    visualFrame: { progress, motifs: [] }
  };
}

export function applyKpEditorSemanticEquationTokenFrame(
  geometry: KpMeasuredEquationTransitionGeometry,
  frame: KpEditorSemanticEquationTokenFrame
): void {
  applyKpEquationTokenMotionFrame(geometry, frame.motion);
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}
