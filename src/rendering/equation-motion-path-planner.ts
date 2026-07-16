import type {
  KpEquationLayoutPlan,
  KpEquationLayoutPoint,
  KpEquationLayoutRect
} from "./equation-layout-plan.ts";

export const kpEquationMotionPathVariantIds = [
  "direct",
  "arc-above",
  "arc-below",
  "around-left",
  "around-right"
] as const;

export type KpEquationMotionPathVariantId =
  (typeof kpEquationMotionPathVariantIds)[number];

export interface KpEquationMotionPathCandidate {
  readonly id: string;
  readonly variant: KpEquationMotionPathVariantId;
  readonly start: KpEquationLayoutPoint;
  readonly control: KpEquationLayoutPoint;
  readonly end: KpEquationLayoutPoint;
  readonly collisionCount: number;
  readonly travelDistance: number;
  readonly readingOrderPenalty: number;
  readonly preferencePenalty: number;
  readonly score: number;
}

export interface KpEquationMotionPathPlan {
  readonly kind: "equation-motion-path-plan";
  readonly id: string;
  readonly relationRecordId?: string | undefined;
  readonly selected: KpEquationMotionPathCandidate;
  readonly candidates: readonly KpEquationMotionPathCandidate[];
  readonly sampleCount: number;
}

export function planKpEquationMotionPath(input: {
  readonly id: string;
  readonly layoutPlan: KpEquationLayoutPlan;
  readonly relationRecordId: string;
  readonly moverRadius?: number | undefined;
  readonly sampleCount?: number | undefined;
  readonly variants?: readonly KpEquationMotionPathVariantId[] | undefined;
  readonly preferredVariant?: KpEquationMotionPathVariantId | undefined;
}): KpEquationMotionPathPlan {
  const waypoints = input.layoutPlan.waypoints
    .filter((waypoint) => waypoint.relationRecordId === input.relationRecordId)
    .sort((left, right) => left.ordinal - right.ordinal);
  const start = waypoints.find((waypoint) => waypoint.role === "source")?.point;
  const end = [...waypoints].reverse().find((waypoint) => waypoint.role === "target")?.point;
  if (start === undefined || end === undefined) {
    throw new Error(`Relation ${input.relationRecordId} requires source and target waypoints.`);
  }
  return planKpEquationMotionPathBetweenPoints({
    id: input.id,
    relationRecordId: input.relationRecordId,
    start,
    end,
    obstacles: input.layoutPlan.reservations
      .filter((reservation) =>
        reservation.kind === "destination" &&
        reservation.relationRecordId !== input.relationRecordId
      )
      .map((reservation) => reservation.bounds),
    ...(input.moverRadius === undefined ? {} : { moverRadius: input.moverRadius }),
    ...(input.sampleCount === undefined ? {} : { sampleCount: input.sampleCount }),
    ...(input.variants === undefined ? {} : { variants: input.variants }),
    ...(input.preferredVariant === undefined
      ? {}
      : { preferredVariant: input.preferredVariant })
  });
}

export function planKpEquationMotionPathBetweenPoints(input: {
  readonly id: string;
  readonly relationRecordId?: string | undefined;
  readonly start: KpEquationLayoutPoint;
  readonly end: KpEquationLayoutPoint;
  readonly obstacles?: readonly KpEquationLayoutRect[] | undefined;
  readonly moverRadius?: number | undefined;
  readonly sampleCount?: number | undefined;
  readonly variants?: readonly KpEquationMotionPathVariantId[] | undefined;
  readonly preferredVariant?: KpEquationMotionPathVariantId | undefined;
  readonly clearance?: number | undefined;
}): KpEquationMotionPathPlan {
  const sampleCount = positiveInteger(input.sampleCount ?? 24, "path sample count");
  const moverRadius = nonNegative(input.moverRadius ?? 2, "mover radius");
  const variants = uniqueVariants(input.variants ?? kpEquationMotionPathVariantIds);
  const clearance = input.clearance ?? Math.max(
    14,
    Math.abs(input.end.x - input.start.x) * 0.18
  );
  nonNegative(clearance, "path clearance");
  const candidates = variants.map((variant, variantIndex) => {
    const control = controlPoint(variant, input.start, input.end, clearance);
    const points = sampleQuadraticPath(input.start, control, input.end, sampleCount);
    const collisionCount = collisionSampleCount(
      points,
      input.obstacles ?? [],
      moverRadius
    );
    const travelDistance = polylineDistance(points);
    const readingOrderPenalty = readingOrderPenaltyFor(
      variant,
      input.start,
      input.end
    );
    const preferencePenalty = input.preferredVariant === undefined ||
      input.preferredVariant === variant
      ? 0
      : 25;
    return {
      id: `${input.id}.${variant}`,
      variant,
      start: { ...input.start },
      control,
      end: { ...input.end },
      collisionCount,
      travelDistance,
      readingOrderPenalty,
      preferencePenalty,
      // Collisions are a hard tier; the remaining terms only rank safe paths.
      score: collisionCount * 10_000 +
        preferencePenalty +
        readingOrderPenalty * 10 +
        travelDistance * 0.01 +
        variantIndex * 0.000_001
    } satisfies KpEquationMotionPathCandidate;
  });
  const ranked = [...candidates].sort((left, right) =>
    left.score - right.score ||
    kpEquationMotionPathVariantIds.indexOf(left.variant) -
      kpEquationMotionPathVariantIds.indexOf(right.variant)
  );
  return {
    kind: "equation-motion-path-plan",
    id: input.id,
    ...(input.relationRecordId === undefined
      ? {}
      : { relationRecordId: input.relationRecordId }),
    selected: ranked[0]!,
    candidates: ranked,
    sampleCount
  };
}

export function sampleKpEquationMotionPath(
  path: Pick<KpEquationMotionPathCandidate, "start" | "control" | "end">,
  progress: number
): KpEquationLayoutPoint {
  const p = clamp01(progress);
  const remaining = 1 - p;
  return {
    x: remaining * remaining * path.start.x +
      2 * remaining * p * path.control.x +
      p * p * path.end.x,
    y: remaining * remaining * path.start.y +
      2 * remaining * p * path.control.y +
      p * p * path.end.y
  };
}

function controlPoint(
  variant: KpEquationMotionPathVariantId,
  start: KpEquationLayoutPoint,
  end: KpEquationLayoutPoint,
  clearance: number
): KpEquationLayoutPoint {
  const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  switch (variant) {
    case "direct": return midpoint;
    case "arc-above": return { x: midpoint.x, y: Math.min(start.y, end.y) - clearance };
    case "arc-below": return { x: midpoint.x, y: Math.max(start.y, end.y) + clearance };
    case "around-left": return { x: Math.min(start.x, end.x) - clearance, y: midpoint.y };
    case "around-right": return { x: Math.max(start.x, end.x) + clearance, y: midpoint.y };
  }
}

function readingOrderPenaltyFor(
  variant: KpEquationMotionPathVariantId,
  start: KpEquationLayoutPoint,
  end: KpEquationLayoutPoint
): number {
  if (variant === "direct") return 0;
  if (end.x >= start.x) {
    if (variant === "arc-above") return 0;
    if (variant === "arc-below") return 1;
  } else {
    if (variant === "arc-below") return 0;
    if (variant === "arc-above") return 1;
  }
  return 2;
}

function sampleQuadraticPath(
  start: KpEquationLayoutPoint,
  control: KpEquationLayoutPoint,
  end: KpEquationLayoutPoint,
  sampleCount: number
): readonly KpEquationLayoutPoint[] {
  return Array.from({ length: sampleCount + 1 }, (_value, index) =>
    sampleKpEquationMotionPath({ start, control, end }, index / sampleCount)
  );
}

function collisionSampleCount(
  points: readonly KpEquationLayoutPoint[],
  obstacles: readonly KpEquationLayoutRect[],
  moverRadius: number
): number {
  return points.reduce((total, point) => total + obstacles.filter((obstacle) =>
    point.x >= obstacle.left - moverRadius &&
    point.x <= obstacle.left + obstacle.width + moverRadius &&
    point.y >= obstacle.top - moverRadius &&
    point.y <= obstacle.top + obstacle.height + moverRadius
  ).length, 0);
}

function polylineDistance(points: readonly KpEquationLayoutPoint[]): number {
  return points.slice(1).reduce((total, point, index) => {
    const previous = points[index]!;
    return total + Math.hypot(point.x - previous.x, point.y - previous.y);
  }, 0);
}

function uniqueVariants(
  variants: readonly KpEquationMotionPathVariantId[]
): readonly KpEquationMotionPathVariantId[] {
  const unique = [...new Set(variants)];
  if (unique.length === 0) throw new Error("Motion path planning requires a variant.");
  return unique;
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${label} must be positive.`);
  return value;
}

function nonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be non-negative.`);
  return value;
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}
