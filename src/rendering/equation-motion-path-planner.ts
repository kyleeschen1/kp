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

export type KpEquationMotionPathSampling =
  | "planned-curve"
  | "canonical-fan-in-lift";

export interface KpEquationCollisionTrack {
  readonly id: string;
  readonly componentId: string;
  readonly lifecycle: string;
  readonly startRect: KpEquationLayoutRect;
  readonly endRect: KpEquationLayoutRect;
  readonly startPaintRect?: KpEquationLayoutRect | undefined;
  readonly endPaintRect?: KpEquationLayoutRect | undefined;
  readonly motionPath?: KpEquationMotionPathCandidate | undefined;
  readonly motionPathSampling?: KpEquationMotionPathSampling | undefined;
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

export function sampleKpEquationMotionPathWithSampling(
  path: KpEquationMotionPathCandidate,
  progress: number,
  sampling: KpEquationMotionPathSampling
): KpEquationLayoutPoint {
  if (sampling === "planned-curve") {
    return sampleKpEquationMotionPath(path, progress);
  }
  const p = clamp01(progress);
  if (p === 0) return path.start;
  if (p === 1) return path.end;
  const midpointY = (path.start.y + path.end.y) / 2;
  const lift = path.control.y - midpointY;
  return {
    x: interpolate(path.start.x, path.end.x, p),
    // Clear the protected row early and settle late without an oversized arc.
    y:
      interpolate(path.start.y, path.end.y, p) +
      lift * Math.pow(Math.max(0, Math.sin(Math.PI * p)), 0.55)
  };
}

export function compileKpCollisionSafeFanInTracks<
  Track extends KpEquationCollisionTrack
>(tracks: readonly Track[]): readonly Track[] {
  const mergeTracks = tracks.filter(({ lifecycle }) => lifecycle === "merge");
  if (mergeTracks.length === 0) return tracks;
  const directPaths = new Map(mergeTracks.map((track) => [
    track.id,
    planTrackPath(track, "direct", 0)
  ]));
  // Fan-in paint is the focal mover; persistent context must not be displaced
  // merely because it occupies the direct extraction lane.
  const obstructedMergeTrackIds = new Set(mergeTracks
    .filter((mergeTrack) =>
      tracks.some((candidate) =>
        candidate.componentId !== mergeTrack.componentId &&
        motionPathIntersectsPaint(
          directPaths.get(mergeTrack.id)!,
          mergeTrack,
          [candidate]
        )
      )
    )
    .map(({ id }) => id));
  if (obstructedMergeTrackIds.size === 0) return tracks;
  for (const clearance of [24, 40, 64, 96, 128]) {
    const candidates = tracks.map((track) =>
      !obstructedMergeTrackIds.has(track.id)
        ? track
        : Object.freeze({
            ...track,
            motionPath: Object.freeze(
              planTrackPath(track, "arc-above", clearance)
            ),
            motionPathSampling: "canonical-fan-in-lift" as const
          }) as Track
    );
    const safe = candidates
      .filter(({ id }) => obstructedMergeTrackIds.has(id))
      .every((mergeTrack) =>
      !motionPathIntersectsPaint(
        mergeTrack.motionPath!,
        mergeTrack,
        candidates.filter((candidate) =>
          candidate.componentId !== mergeTrack.componentId
        )
      )
    );
    if (safe) return Object.freeze(candidates);
  }
  throw new Error(
    `Fan-in material cannot clear blocking paint: ${
      [...obstructedMergeTrackIds].join(", ")
    }.`
  );
}

export function sampleKpEquationMotionTrackRect(
  track: KpEquationCollisionTrack,
  progress: number
): KpEquationLayoutRect {
  const p = clamp01(progress);
  return track.motionPath === undefined
    ? interpolateRect(track.startRect, track.endRect, p)
    : layoutRectAt(track, track.motionPath, p);
}

function planTrackPath(
  track: KpEquationCollisionTrack,
  variant: "direct" | "arc-above",
  clearance: number
): KpEquationMotionPathCandidate {
  return planKpEquationMotionPathBetweenPoints({
    id: `paint-path.${track.id}.${variant}.${clearance}`,
    start: rectCenter(track.startRect),
    end: rectCenter(track.endRect),
    moverRadius: 0,
    variants: [variant],
    clearance
  }).selected;
}

function motionPathIntersectsPaint(
  path: KpEquationMotionPathCandidate,
  track: KpEquationCollisionTrack,
  obstacles: readonly KpEquationCollisionTrack[]
): boolean {
  return Array.from({ length: 81 }, (_value, index) => {
    const progress = smoothstep((index + 10) / 100);
    const mover = paintRectAt(
      track,
      layoutRectAt(track, path, progress),
      progress
    );
    return obstacles.some((obstacleTrack) => {
      const obstaclePath = obstacleTrack.motionPath;
      const obstacle = paintRectAt(
        obstacleTrack,
        obstaclePath === undefined
          ? interpolateRect(
              obstacleTrack.startRect,
              obstacleTrack.endRect,
              progress
            )
          : layoutRectAt(obstacleTrack, obstaclePath, progress),
        progress
      );
      return mover.left < obstacle.left + obstacle.width - 0.25 &&
        mover.left + mover.width > obstacle.left + 0.25 &&
        mover.top < obstacle.top + obstacle.height - 0.25 &&
        mover.top + mover.height > obstacle.top + 0.25;
    });
  }).some(Boolean);
}

function layoutRectAt(
  track: KpEquationCollisionTrack,
  path: KpEquationMotionPathCandidate,
  progress: number
): KpEquationLayoutRect {
  const center = sampleKpEquationMotionPathWithSampling(
    path,
    progress,
    track.motionPathSampling ?? "planned-curve"
  );
  const width = interpolate(track.startRect.width, track.endRect.width, progress);
  const height = interpolate(
    track.startRect.height,
    track.endRect.height,
    progress
  );
  return {
    left: center.x - width / 2,
    top: center.y - height / 2,
    width,
    height
  };
}

function paintRectAt(
  track: KpEquationCollisionTrack,
  layoutRect: KpEquationLayoutRect,
  progress: number
): KpEquationLayoutRect {
  const start = track.startPaintRect ?? track.startRect;
  const end = track.endPaintRect ?? track.endRect;
  return {
    left: layoutRect.left + interpolate(
      start.left - track.startRect.left,
      end.left - track.endRect.left,
      progress
    ),
    top: layoutRect.top + interpolate(
      start.top - track.startRect.top,
      end.top - track.endRect.top,
      progress
    ),
    width: interpolate(start.width, end.width, progress),
    height: interpolate(start.height, end.height, progress)
  };
}

function interpolateRect(
  source: KpEquationLayoutRect,
  target: KpEquationLayoutRect,
  progress: number
): KpEquationLayoutRect {
  return {
    left: interpolate(source.left, target.left, progress),
    top: interpolate(source.top, target.top, progress),
    width: interpolate(source.width, target.width, progress),
    height: interpolate(source.height, target.height, progress)
  };
}

function rectCenter(rect: KpEquationLayoutRect): KpEquationLayoutPoint {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function interpolate(source: number, target: number, progress: number): number {
  return source + (target - source) * progress;
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
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
