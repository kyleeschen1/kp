import {
  createKpSemanticAnimationPreservationManifest,
  type KpSemanticAnimationPreservationEntry
} from "./semantic-animation-preservation-manifest.ts";

export type KpSemanticAnimationConvergenceVisualFrameKind =
  | "source-endpoint"
  | "phase-forward"
  | "direct-seek"
  | "phase-rewind"
  | "target-endpoint";

export interface KpSemanticAnimationConvergenceVisualFrame {
  readonly id: string;
  readonly kind: KpSemanticAnimationConvergenceVisualFrameKind;
  readonly direction: "forward" | "rewind";
  readonly progress: number;
  readonly matchingForwardProgress: number;
  readonly directionEntryProgress: number;
  readonly requiresNativeEndpoint: boolean;
}

export interface KpSemanticAnimationConvergenceVisualCase {
  readonly preservation: KpSemanticAnimationPreservationEntry;
  readonly surface: "editor-player" | "equation-reader" | "distribution-reader";
  readonly frames: readonly KpSemanticAnimationConvergenceVisualFrame[];
}

const frames = [
  frame("source", "source-endpoint", "forward", 0, 0, 0, true),
  frame("forward-330", "phase-forward", "forward", 0.33, 0.33, 0.33, false),
  frame("direct-670", "direct-seek", "forward", 0.67, 0.67, 0.67, false),
  // Entering from a later point establishes reverse direction. The captured
  // state remains comparable to forward sampling at the same shared progress.
  frame("rewind-330", "phase-rewind", "rewind", 0.33, 0.33, 0.67, false),
  frame("target", "target-endpoint", "forward", 1, 1, 1, true)
] as const satisfies readonly KpSemanticAnimationConvergenceVisualFrame[];

export function createKpSemanticAnimationConvergenceVisualPlan():
  readonly KpSemanticAnimationConvergenceVisualCase[] {
  return createKpSemanticAnimationPreservationManifest().map(
    (preservation) => ({
      preservation,
      surface: preservation.topic === "distribution"
        ? "distribution-reader"
        : preservation.canonicalSource.kind === "lesson-animation"
          ? "equation-reader"
          : "editor-player",
      frames: frames.map((item) => ({
        ...item,
        ...(preservation.topic === "distribution" && item.direction === "rewind"
          ? { directionEntryProgress: 1 }
          : {})
      }))
    })
  );
}

function frame(
  id: string,
  kind: KpSemanticAnimationConvergenceVisualFrameKind,
  direction: KpSemanticAnimationConvergenceVisualFrame["direction"],
  progress: number,
  matchingForwardProgress: number,
  directionEntryProgress: number,
  requiresNativeEndpoint: boolean
): KpSemanticAnimationConvergenceVisualFrame {
  return {
    id,
    kind,
    direction,
    progress,
    matchingForwardProgress,
    directionEntryProgress,
    requiresNativeEndpoint
  };
}
