import {
  applyKpSemanticEquationTokenFrame,
  createKpSemanticEquationTokenFrame,
  type KpSemanticEquationTokenFrame
} from "../rendering/semantic-equation-frame.ts";
import type { KpMeasuredEquationTransitionGeometry } from "../rendering/equation-motion-dom.ts";
import type { KpEditorAnimationPlayerState } from "./animation-player-state.ts";
import type { KpPrecomputedEquationMotionPlan } from "../rendering/precomputed-equation-motion.ts";
import type { KpEquationMotifAccessibilityMode } from "../rendering/equation-motif-accessibility.ts";

export type KpEditorSemanticEquationTokenFrame = KpSemanticEquationTokenFrame;

export function createKpEditorSemanticEquationTokenFrame(input: {
  readonly geometry: KpMeasuredEquationTransitionGeometry;
  readonly playerState: KpEditorAnimationPlayerState;
  readonly phaseLocalProgress: number;
  readonly precomputedPlan?: KpPrecomputedEquationMotionPlan | undefined;
  readonly accessibilityMode?: KpEquationMotifAccessibilityMode | undefined;
}): KpEditorSemanticEquationTokenFrame {
  return createKpSemanticEquationTokenFrame({
    geometry: input.geometry,
    clock: {
      animationId: input.playerState.animationId,
      runtimeFrameId: input.playerState.runtimeFrame.id,
      phaseId: input.playerState.runtimeFrame.phase.phaseId,
      direction: input.playerState.direction,
      globalProgress: input.playerState.progress,
      phaseLocalProgress: input.phaseLocalProgress
    },
    ...(input.precomputedPlan === undefined ? {} : { precomputedPlan: input.precomputedPlan }),
    ...(input.accessibilityMode === undefined ? {} : { accessibilityMode: input.accessibilityMode }),
    runtimeCapabilities: input.playerState.runtimeCapabilities
  });
}

export function applyKpEditorSemanticEquationTokenFrame(
  geometry: KpMeasuredEquationTransitionGeometry,
  frame: KpEditorSemanticEquationTokenFrame
): void {
  applyKpSemanticEquationTokenFrame(geometry, frame);
}
