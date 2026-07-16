import type {
  AnnotatedMotionToken,
  KpMeasuredEquationTransitionRelationGeometry
} from "./equation-motion-dom.ts";
import type {
  KpEquationTokenMotionFrameToken,
  KpEquationTokenMotionPose
} from "./semantic-equation-token-renderer.ts";

export type KpEquationLinearRearrangementKind =
  | "balanced-introduction"
  | "cancel-additive-inverses"
  | "simplify-constant-difference";

export interface KpEquationLinearRearrangementFrame {
  readonly kind: KpEquationLinearRearrangementKind;
  readonly reservationProgress: number;
  readonly persistentReflowProgress: number;
  readonly meetProgress: number;
  readonly collapseProgress: number;
  readonly resultRevealProgress: number;
  readonly recognitionProgress: number;
}

export function sampleKpEquationLinearRearrangementFrame(
  kind: KpEquationLinearRearrangementKind,
  progress: number
): KpEquationLinearRearrangementFrame {
  const p = clamp01(progress);
  const reservationProgress = smooth(windowProgress(p, 0.1, 0.46));
  return {
    kind,
    reservationProgress,
    persistentReflowProgress: kind === "cancel-additive-inverses"
      ? smooth(windowProgress(p, 0.1, 0.46))
      : reservationProgress,
    meetProgress: smooth(windowProgress(p, 0.42, 0.68)),
    collapseProgress: smooth(windowProgress(p, 0.62, 0.8)),
    resultRevealProgress: smooth(windowProgress(p, 0.68, 0.88)),
    recognitionProgress: smooth(windowProgress(p, 0.76, 0.92))
  };
}

export function sampleKpEquationLinearRearrangementRelation(input: {
  readonly relation: KpMeasuredEquationTransitionRelationGeometry;
  readonly sourceTokens: readonly AnnotatedMotionToken[];
  readonly targetTokens: readonly AnnotatedMotionToken[];
  readonly progress: number;
  readonly frame: KpEquationLinearRearrangementFrame;
}): readonly KpEquationTokenMotionFrameToken[] | undefined {
  switch (input.relation.lifecycle) {
    case "persist":
    case "role-change":
      return samplePersistentRelation(input);
    case "enter":
      return input.frame.kind === "balanced-introduction"
        ? sampleBalancedIntroduction(input)
        : undefined;
    case "cancel":
      return input.frame.kind === "cancel-additive-inverses"
        ? sampleCancellation(input)
        : undefined;
    case "merge":
      return input.frame.kind === "simplify-constant-difference"
        ? sampleConstantDerivation(input)
        : undefined;
    default:
      return undefined;
  }
}

function samplePersistentRelation(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const travel = input.frame.persistentReflowProgress;
  return [
    ...input.sourceTokens.map((token) => frameToken(token, "source", {
      opacity: input.progress === 1 ? 0 : 1,
      x: (input.relation.delta?.x ?? 0) * travel,
      y: (input.relation.delta?.y ?? 0) * travel,
      scale: 1 + (averageScale(input.relation) - 1) * travel
    })),
    ...input.targetTokens.map((token) => frameToken(token, "target", {
      opacity: input.progress === 1 ? 1 : 0,
      x: 0,
      y: 0,
      scale: 1
    }))
  ];
}

function sampleBalancedIntroduction(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  return input.targetTokens.map((token, index) => {
    // Balanced operations must read as simultaneous even when the terms enter
    // from independently directed diagonals.
    const entry = smooth(windowProgress(input.progress, 0.38, 0.7));
    const direction = index % 2 === 0 ? -1 : 1;
    return frameToken(token, "target", {
      opacity: entry,
      x: direction * 8 * (1 - entry),
      y: -direction * 5 * (1 - entry),
      scale: 0.88 + 0.12 * entry
    });
  });
}

function sampleCancellation(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const groupCenter = center(input.relation.source?.bounds);
  const clearanceProgress = smooth(windowProgress(input.progress, 0.08, 0.3));
  return input.sourceTokens.map((token, index) => {
    const tokenCenter = center(token.localRect);
    const direction = index % 2 === 0 ? -1 : 1;
    return frameToken(token, "source", {
      opacity: 1 - input.frame.collapseProgress,
      x: (groupCenter.x - tokenCenter.x) * input.frame.meetProgress,
      y:
        -30 * clearanceProgress +
        direction * 4 * Math.sin(Math.PI * input.frame.meetProgress),
      scale:
        1 -
        0.16 * input.frame.meetProgress -
        0.18 * input.frame.collapseProgress
    });
  });
}

function sampleConstantDerivation(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const destination = center(input.relation.target?.bounds);
  const sourceOpacity = 1 - smooth(windowProgress(input.progress, 0.68, 0.84));
  return [
    ...input.sourceTokens.map((token, index) => {
      const origin = center(token.localRect);
      const staggered = smooth(windowProgress(
        input.progress,
        0.38 + index * 0.025,
        0.68 + index * 0.025
      ));
      const arcDirection = index % 2 === 0 ? -1 : 1;
      return frameToken(token, "source", {
        opacity: sourceOpacity,
        x: (destination.x - origin.x) * staggered,
        y:
          (destination.y - origin.y) * staggered +
          arcDirection * 8 * Math.sin(Math.PI * staggered),
        scale: 1 - 0.2 * staggered
      });
    }),
    ...input.targetTokens.map((token) => frameToken(token, "target", {
      opacity: input.frame.resultRevealProgress,
      x: 0,
      y: 0,
      scale: 0.78 + 0.22 * input.frame.resultRevealProgress
    }))
  ];
}

function frameToken(
  token: AnnotatedMotionToken,
  side: "source" | "target",
  pose: KpEquationTokenMotionPose
): KpEquationTokenMotionFrameToken {
  return { motionId: token.motionId, side, pose };
}

function averageScale(
  relation: KpMeasuredEquationTransitionRelationGeometry
): number {
  return ((relation.delta?.scaleX ?? 1) + (relation.delta?.scaleY ?? 1)) / 2;
}

function center(
  rect: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  } | undefined
): { readonly x: number; readonly y: number } {
  if (rect === undefined) return { x: 0, y: 0 };
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function windowProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}

function smooth(progress: number): number {
  return progress * progress * progress *
    (progress * (progress * 6 - 15) + 10);
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}
