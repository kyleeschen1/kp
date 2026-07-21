import type {
  KpLessonAttentionPhase,
  KpLessonAttentionPhaseKind,
  KpLessonAttentionPlan
} from "../document/lesson-document.ts";

export type KpReaderAttentionPrimaryTarget = "prose" | "visual" | "correspondence";
export type KpReaderAttentionMotionGate = "hold" | "play";

export interface KpReaderAttentionProjection {
  readonly phaseId: string;
  readonly phaseKind: KpLessonAttentionPhaseKind;
  readonly beatId: string;
  readonly checkpointId: string;
  readonly cue: string;
  readonly focusRefs: readonly string[];
  readonly semanticProgressPermille: number;
  readonly visualProgressPermille: number;
  readonly phaseProgress: number;
  readonly cycleIndex: number;
  readonly primaryTarget: KpReaderAttentionPrimaryTarget;
  readonly motionGate: KpReaderAttentionMotionGate;
}

export function projectKpReaderAttention(input: {
  readonly attention?: KpLessonAttentionPlan | undefined;
  readonly progressPermille: number;
}): KpReaderAttentionProjection | undefined {
  const attention = input.attention;
  if (attention === undefined) return undefined;
  const progress = input.progressPermille;
  if (!Number.isFinite(progress) || progress < 0 || progress > 1_000) {
    throw new RangeError("Attention progress must be finite and within 0 through 1000");
  }
  if (attention.phases.length === 0 || attention.phases.length % 4 !== 0) {
    throw new Error("Attention projection requires complete four-phase cycles");
  }
  const phaseIndex = attention.phases.findIndex((phase, index) =>
    progress >= phase.startProgressPermille
      && (progress < phase.endProgressPermille
        || (index === attention.phases.length - 1 && progress === phase.endProgressPermille))
  );
  if (phaseIndex < 0) throw new Error(`Attention plan does not cover progress ${progress}`);
  const phase = attention.phases[phaseIndex]!;
  const cycleIndex = Math.floor(phaseIndex / 4);
  const cycle = attention.phases.slice(cycleIndex * 4, cycleIndex * 4 + 4);
  const cycleStart = cycle[0]!.startProgressPermille;
  const cycleEnd = cycle[3]!.endProgressPermille;
  const phaseProgress = unitProgress(phase, progress);
  const visualProgressPermille = phase.kind === "orient"
    ? cycleStart
    : phase.kind === "act"
      ? cycleStart + (cycleEnd - cycleStart) * phaseProgress
      : cycleEnd;
  return {
    phaseId: phase.id,
    phaseKind: phase.kind,
    beatId: phase.beatId,
    checkpointId: phase.checkpointId,
    cue: phase.cue,
    focusRefs: [...phase.focusRefs],
    semanticProgressPermille: progress,
    visualProgressPermille,
    phaseProgress,
    cycleIndex,
    primaryTarget: primaryTarget(phase.kind),
    motionGate: phase.kind === "act" ? "play" : "hold"
  };
}

function unitProgress(phase: KpLessonAttentionPhase, progress: number): number {
  return Math.max(0, Math.min(1,
    (progress - phase.startProgressPermille)
      / (phase.endProgressPermille - phase.startProgressPermille)
  ));
}

function primaryTarget(kind: KpLessonAttentionPhaseKind): KpReaderAttentionPrimaryTarget {
  if (kind === "act") return "visual";
  if (kind === "inspect") return "correspondence";
  return "prose";
}
