import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpEditorAnimationPlayerState } from "./animation-player-state.ts";

export const KP_SOLVE_X_ANIMATION_ID = "animation.linear-solve.solve-x";

export interface KpEditorSolveXSharedPlayerFrame {
  readonly kind: "editor-solve-x-shared-player-frame";
  readonly visualProgress: number;
  readonly activeStepIndex: number;
  readonly steps: readonly KpEditorSolveXSharedPlayerStep[];
}

export interface KpEditorSolveXSharedPlayerStep {
  readonly id: string;
  readonly title: string;
  readonly latex: string;
  readonly status: "complete" | "active" | "upcoming";
}

export function createKpEditorSolveXSharedPlayerFrame(input: {
  readonly animation: KpAnimationAsset;
  readonly state: KpEditorAnimationPlayerState;
}): KpEditorSolveXSharedPlayerFrame | undefined {
  if (input.animation.id !== KP_SOLVE_X_ANIMATION_ID) return undefined;

  const steps = input.animation.bundle.objects.flatMap((object) => {
    const value = isRecord(object.value) ? object.value["latex"] : undefined;
    return typeof value === "string"
      ? [{ id: object.id, title: object.title, latex: value }]
      : [];
  });
  const visualProgress = input.state.direction === "forward"
    ? input.state.progress
    : 1 - input.state.progress;
  const activeStepIndex = Math.min(
    steps.length - 1,
    Math.max(0, Math.round(visualProgress * (steps.length - 1)))
  );

  return {
    kind: "editor-solve-x-shared-player-frame",
    visualProgress,
    activeStepIndex,
    steps: steps.map((step, index) => ({
      ...step,
      status: index < activeStepIndex
        ? "complete"
        : index === activeStepIndex
          ? "active"
          : "upcoming"
    }))
  };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}
