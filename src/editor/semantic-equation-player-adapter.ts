import type { KpMeasuredEquationTransitionGeometry } from "../rendering/equation-motion-dom.ts";
import {
  applyKpEquationTokenMotionFrame,
  sampleKpEquationTokenMotion,
  type KpEquationTokenMotionFrame
} from "../rendering/semantic-equation-token-renderer.ts";
import type { KpEditorAnimationPlayerState } from "./animation-player-state.ts";

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
}

export function createKpEditorSemanticEquationTokenFrame(input: {
  readonly geometry: KpMeasuredEquationTransitionGeometry;
  readonly playerState: KpEditorAnimationPlayerState;
  readonly phaseLocalProgress: number;
}): KpEditorSemanticEquationTokenFrame {
  const phaseLocalProgress = clamp01(input.phaseLocalProgress);
  const semanticProgress = input.playerState.direction === "forward"
    ? phaseLocalProgress
    : 1 - phaseLocalProgress;
  return {
    kind: "editor-semantic-equation-token-frame",
    animationId: input.playerState.animationId,
    runtimeFrameId: input.playerState.runtimeFrame.id,
    phaseId: input.playerState.runtimeFrame.phase.phaseId,
    direction: input.playerState.direction,
    globalProgress: input.playerState.progress,
    phaseLocalProgress,
    semanticProgress,
    motion: sampleKpEquationTokenMotion(input.geometry, semanticProgress)
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
