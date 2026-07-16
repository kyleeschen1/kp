import {
  sampleKpEquationSemanticTimeline,
  type KpEquationSemanticTimeline,
  type KpEquationSemanticTimelineFrame
} from "./equation-visual-motif-timeline.ts";

export type KpEquationMotifAccessibilityMode =
  | "full-motion"
  | "reduced-motion"
  | "static"
  | "narrated";

export interface KpEquationMotifAccessibilityVariant {
  readonly mode: KpEquationMotifAccessibilityMode;
  readonly sampling: "continuous" | "semantic-checkpoints";
  readonly automaticPlayback: boolean;
  readonly seekable: true;
  readonly directions: readonly ["forward", "rewind"];
  readonly phaseIds: readonly string[];
  readonly salienceIntentIds: readonly string[];
}

export interface KpEquationMotifAccessibilityPlan {
  readonly kind: "equation-motif-accessibility-plan";
  readonly timeline: KpEquationSemanticTimeline;
  readonly variants: readonly KpEquationMotifAccessibilityVariant[];
  readonly keyboard: readonly {
    readonly key: "Space" | "ArrowLeft" | "ArrowRight" | "Home" | "End" | "r";
    readonly action: "toggle-playback" | "previous-step" | "next-step" | "start" | "end" | "rewind";
  }[];
}

export interface KpEquationMotifAccessibilityFrame {
  readonly mode: KpEquationMotifAccessibilityMode;
  readonly requestedProgress: number;
  readonly semanticProgress: number;
  readonly semanticTimeline: KpEquationSemanticTimelineFrame;
  readonly narration: string;
}

export function createKpEquationMotifAccessibilityPlan(input: {
  readonly timeline: KpEquationSemanticTimeline;
  readonly salienceIntentIds?: readonly string[] | undefined;
}): KpEquationMotifAccessibilityPlan {
  const phaseIds = unique(input.timeline.phases.map((phase) => phase.phaseId));
  const salienceIntentIds = unique(input.salienceIntentIds ?? []);
  return {
    kind: "equation-motif-accessibility-plan",
    timeline: input.timeline,
    variants: [
      variant("full-motion", "continuous", true, phaseIds, salienceIntentIds),
      variant("reduced-motion", "semantic-checkpoints", true, phaseIds, salienceIntentIds),
      variant("static", "semantic-checkpoints", false, phaseIds, salienceIntentIds),
      variant("narrated", "continuous", true, phaseIds, salienceIntentIds)
    ],
    keyboard: [
      { key: "Space", action: "toggle-playback" },
      { key: "ArrowLeft", action: "previous-step" },
      { key: "ArrowRight", action: "next-step" },
      { key: "Home", action: "start" },
      { key: "End", action: "end" },
      { key: "r", action: "rewind" }
    ]
  };
}

export function sampleKpEquationMotifAccessibility(input: {
  readonly plan: KpEquationMotifAccessibilityPlan;
  readonly mode: KpEquationMotifAccessibilityMode;
  readonly progress: number;
}): KpEquationMotifAccessibilityFrame {
  const requestedProgress = clamp01(input.progress);
  const variant = input.plan.variants.find((candidate) => candidate.mode === input.mode)!;
  // Reduced and static presentations remove spatial interpolation while still
  // landing on the exact semantic boundaries used by full motion and narration.
  const semanticProgress = variant.sampling === "continuous"
    ? requestedProgress
    : nearestCheckpointProgress(input.plan.timeline, requestedProgress);
  const semanticTimeline = sampleKpEquationSemanticTimeline(
    input.plan.timeline,
    semanticProgress
  );
  const activeSummary = input.plan.timeline.phases.find((phase) =>
    semanticTimeline.activePhaseIds.includes(phase.phaseId)
  )?.summary;
  const checkpoint = input.plan.timeline.checkpoints.find((candidate) =>
    candidate.id === semanticTimeline.previousCheckpointId
  );
  return {
    mode: input.mode,
    requestedProgress,
    semanticProgress,
    semanticTimeline,
    narration: activeSummary ?? checkpoint?.label ?? "Animation checkpoint"
  };
}

function variant(
  mode: KpEquationMotifAccessibilityMode,
  sampling: KpEquationMotifAccessibilityVariant["sampling"],
  automaticPlayback: boolean,
  phaseIds: readonly string[],
  salienceIntentIds: readonly string[]
): KpEquationMotifAccessibilityVariant {
  return {
    mode,
    sampling,
    automaticPlayback,
    seekable: true,
    directions: ["forward", "rewind"],
    phaseIds: [...phaseIds],
    salienceIntentIds: [...salienceIntentIds]
  };
}

function nearestCheckpointProgress(
  timeline: KpEquationSemanticTimeline,
  progress: number
): number {
  return timeline.checkpoints.reduce((nearest, checkpoint) =>
    Math.abs(checkpoint.progress - progress) < Math.abs(nearest - progress)
      ? checkpoint.progress
      : nearest,
  timeline.checkpoints[0]?.progress ?? 0);
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Accessibility progress must be finite.");
  return Math.max(0, Math.min(1, value));
}
