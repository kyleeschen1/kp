import {
  projectKpEigenvectorDiagramEndpoint,
  type KpEigenvectorDiagramVector
} from "./eigenvector-diagram.ts";
import {
  kpEigenvectorBeatIds,
  projectKpEigenvectorEndpoint,
  type KpEigenvectorBeatId,
  type KpEigenvectorEquationForm
} from "./eigenvector-endpoints.ts";
import type { KpEigenvectorPoint } from "./eigenvector-math.ts";

export const kpEigenvectorClockId = "eigenvector-demo/clock/main" as const;

export interface KpEigenvectorTransitionPlan {
  readonly id: string;
  readonly clockId: typeof kpEigenvectorClockId;
  readonly fromBeatId: KpEigenvectorBeatId;
  readonly toBeatId: KpEigenvectorBeatId;
  readonly durationMs: number;
}

export interface KpEigenvectorMotionVector {
  readonly id: string;
  readonly semanticObjectId: string;
  readonly role: KpEigenvectorDiagramVector["role"];
  readonly coordinates: KpEigenvectorPoint;
  readonly presence: number;
}

export interface KpEigenvectorMotionFrame {
  readonly clockId: typeof kpEigenvectorClockId;
  readonly fromBeatId: KpEigenvectorBeatId;
  readonly toBeatId: KpEigenvectorBeatId;
  readonly rawProgress: number;
  readonly easedProgress: number;
  readonly settled: boolean;
  readonly vectors: readonly KpEigenvectorMotionVector[];
  readonly equation: {
    readonly fromForm: KpEigenvectorEquationForm;
    readonly toForm: KpEigenvectorEquationForm;
    readonly fromPresence: number;
    readonly toPresence: number;
  };
  readonly invariantLineProgress: number;
}

const adjacentDurations = [1400, 900, 900, 700, 450, 1100, 900, 700] as const;

export function createKpEigenvectorTransitionPlan(
  fromBeatId: KpEigenvectorBeatId,
  toBeatId: KpEigenvectorBeatId
): KpEigenvectorTransitionPlan {
  const fromIndex = kpEigenvectorBeatIds.indexOf(fromBeatId);
  const toIndex = kpEigenvectorBeatIds.indexOf(toBeatId);
  const adjacent = Math.abs(fromIndex - toIndex) === 1;
  const durationIndex = Math.min(fromIndex, toIndex);
  return {
    id: `eigenvector-demo/transition/${fromBeatId}--${toBeatId}`,
    clockId: kpEigenvectorClockId,
    fromBeatId,
    toBeatId,
    // Non-adjacent URL restoration settles immediately instead of replaying.
    durationMs: adjacent ? adjacentDurations[durationIndex]! : 0
  };
}

export function sampleKpEigenvectorTransition(input: {
  readonly plan: KpEigenvectorTransitionPlan;
  readonly progress: number;
  readonly reducedMotion?: boolean;
}): KpEigenvectorMotionFrame {
  const requested = clamp01(input.progress);
  const rawProgress = input.reducedMotion === true && requested > 0
    ? 1
    : requested;
  const easedProgress = smoothstep(rawProgress);
  const fromDiagram = projectKpEigenvectorDiagramEndpoint(
    input.plan.fromBeatId
  );
  const toDiagram = projectKpEigenvectorDiagramEndpoint(input.plan.toBeatId);
  const fromEndpoint = projectKpEigenvectorEndpoint(input.plan.fromBeatId);
  const toEndpoint = projectKpEigenvectorEndpoint(input.plan.toBeatId);
  const vectors = interpolateVectors(
    fromDiagram.vectors,
    toDiagram.vectors,
    easedProgress
  );
  const sameEquation = fromEndpoint.equation === toEndpoint.equation;
  return {
    clockId: input.plan.clockId,
    fromBeatId: input.plan.fromBeatId,
    toBeatId: input.plan.toBeatId,
    rawProgress,
    easedProgress,
    settled: rawProgress === 1,
    vectors,
    equation: {
      fromForm: fromEndpoint.equation,
      toForm: toEndpoint.equation,
      fromPresence: sameEquation ? 1 : 1 - easedProgress,
      toPresence: sameEquation ? 0 : easedProgress
    },
    invariantLineProgress: interpolate(
      fromDiagram.invariantLine.visible ? 1 : 0,
      toDiagram.invariantLine.visible ? 1 : 0,
      easedProgress
    )
  };
}

function interpolateVectors(
  from: readonly KpEigenvectorDiagramVector[],
  to: readonly KpEigenvectorDiagramVector[],
  progress: number
): readonly KpEigenvectorMotionVector[] {
  const fromById = new Map(from.map((vector) => [vector.id, vector]));
  const toById = new Map(to.map((vector) => [vector.id, vector]));
  // Preserve the existing paint order; only genuinely entering objects append.
  const ids = [
    ...from.map(({ id }) => id),
    ...to.map(({ id }) => id).filter((id) => !fromById.has(id))
  ];
  return ids.map((id) => {
    const source = fromById.get(id);
    const target = toById.get(id);
    const representative = target ?? source!;
    const sourceCoordinates = source?.displayed ?? target!.displayed;
    const targetCoordinates = target?.displayed ?? source!.displayed;
    const coordinates: KpEigenvectorPoint = progress === 0
      ? sourceCoordinates
      : progress === 1
        ? targetCoordinates
        : [
            stableNumber(interpolate(sourceCoordinates[0], targetCoordinates[0], progress)),
            stableNumber(interpolate(sourceCoordinates[1], targetCoordinates[1], progress))
          ];
    return {
      id,
      semanticObjectId: representative.semanticObjectId,
      role: representative.role,
      coordinates,
      presence: source === undefined
        ? progress
        : target === undefined
          ? 1 - progress
          : 1
    };
  });
}

function stableNumber(value: number): number {
  return Number(value.toFixed(12));
}

function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}
