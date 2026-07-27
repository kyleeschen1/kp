import type {
  KpEquationLayoutPlan,
  KpEquationLayoutPoint,
  KpEquationLayoutRect
} from "./equation-layout-plan.ts";
import {
  evaluateKpEquationMotionClearanceSequence
} from "./equation-motion-clearance.ts";

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
  | "canonical-clearance-lane";

export const kpMaximumFanInExcursionInLocalInkHeights = 1.5;
export const kpMaximumFanInSettlementAspectRatio = 5;
const kpFanInContextMotionRange = Object.freeze({ start: 0.35, end: 0.55 });
const kpFanInFocalMotionRange = Object.freeze({ start: 0.05, end: 0.95 });
const kpFanInLeaderMotionRange = Object.freeze({ start: 0.05, end: 0.72 });
const kpReorderSettlementAspectRatio = 8;
const kpFanInLiftRiseEnd = 0.22;
const kpFanInTransitStart = 0.55;
const kpFanInLiftRatios = [0.35, 0.5, 0.75, 1, 1.25, 1.5] as const;
// Measured paint includes antialiasing fringes that may touch in native KaTeX.
const kpNativeInkContactTolerancePx = 0.75;
export const kpNativeReorderInkContactTolerancePx = 1.5;

export interface KpEquationCollisionTrack {
  readonly id: string;
  readonly componentId: string;
  readonly lifecycle: string;
  readonly startRect: KpEquationLayoutRect;
  readonly endRect: KpEquationLayoutRect;
  readonly startPaintRect?: KpEquationLayoutRect | undefined;
  readonly endPaintRect?: KpEquationLayoutRect | undefined;
  readonly startOpacity?: number | undefined;
  readonly endOpacity?: number | undefined;
  readonly motionPath?: KpEquationMotionPathCandidate | undefined;
  readonly motionPathSampling?: KpEquationMotionPathSampling | undefined;
  readonly motionProgressRange?: {
    readonly start: number;
    readonly end: number;
  } | undefined;
  readonly opacityStepAt?: number | undefined;
  readonly motionGroupTravel?: number | undefined;
  readonly motionSettlementAspectRatio?: number | undefined;
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
  sampling: KpEquationMotionPathSampling,
  groupTravel?: number,
  settlementAspectRatio = kpMaximumFanInSettlementAspectRatio
): KpEquationLayoutPoint {
  if (sampling === "planned-curve") {
    return sampleKpEquationMotionPath(path, progress);
  }
  const p = clamp01(progress);
  if (p === 0) return path.start;
  if (p === 1) return path.end;
  const midpointY = (path.start.y + path.end.y) / 2;
  const lift = path.control.y - midpointY;
  const transitProgress = clamp01(
    (p - kpFanInTransitStart) / (1 - kpFanInTransitStart)
  );
  const baseline = {
    x: interpolate(path.start.x, path.end.x, transitProgress),
    y: interpolate(path.start.y, path.end.y, transitProgress)
  };
  const remainingGroupTravel = (
    groupTravel ?? Math.hypot(
      path.end.x - path.start.x,
      path.end.y - path.start.y
    )
  ) * (1 - transitProgress);
  const settlementLift = Math.abs(lift) === 0
    ? 0
    : clamp01(
        remainingGroupTravel *
          settlementAspectRatio /
          Math.abs(lift)
      );
  const liftProgress = p < kpFanInLiftRiseEnd
    ? smoothstep(p / kpFanInLiftRiseEnd)
    : settlementLift;
  return {
    x: baseline.x,
    // Linear transit keeps visible travel pending through the final descent.
    y: baseline.y + lift * liftProgress
  };
}

export function compileKpCollisionSafeFanInTracks<
  Track extends KpEquationCollisionTrack
>(tracks: readonly Track[]): readonly Track[] {
  const mergeTracks = tracks.filter(({ lifecycle }) => lifecycle === "merge");
  if (mergeTracks.length === 0) return tracks;
  const groupTravel = Math.max(...mergeTracks.map((track) => {
    const start = rectCenter(track.startPaintRect ?? track.startRect);
    const end = rectCenter(track.endPaintRect ?? track.endRect);
    return Math.hypot(end.x - start.x, end.y - start.y);
  }));
  const localInkScale = Math.max(...tracks.map(kpEquationMotionTrackScale));
  const fusionLeaderId = [...mergeTracks].sort((left, right) =>
    trackTravel(left) - trackTravel(right) || left.id.localeCompare(right.id)
  )[0]!.id;
  const scheduled = tracks.map((track) => Object.freeze({
    ...track,
    ...(track.lifecycle === "persist"
      ? { motionProgressRange: kpFanInContextMotionRange }
      : track.lifecycle === "merge"
        ? {
            motionProgressRange: track.id === fusionLeaderId
              ? kpFanInLeaderMotionRange
              : kpFanInFocalMotionRange
          }
        : {})
  }) as Track);
  const obstructedMergeTrackIds = new Set(mergeTracks
    .filter((track) =>
      !evaluateFanInTrackClearance(scheduled, [track.id]).passed
    )
    .map(({ id }) => id));
  if (obstructedMergeTrackIds.size === 0) {
    return Object.freeze(scheduled);
  }
  // Merge-fan-in is a space-time motif: context opens the lane first, then
  // only obstructed focal paint lifts into a directly routed fusion leader.
  let blockers: readonly string[] = [];
  for (const liftRatio of kpFanInLiftRatios) {
    const candidates = scheduled.map((track) =>
      !obstructedMergeTrackIds.has(track.id)
        ? track
        : Object.freeze({
            ...track,
            motionPath: Object.freeze(planTrackPath(
              track,
              "arc-above",
              localInkScale * liftRatio
            )),
            motionPathSampling: "canonical-clearance-lane" as const,
            motionGroupTravel: groupTravel
          }) as Track
    );
    const clearance = evaluateFanInTrackClearance(
      candidates,
      [...obstructedMergeTrackIds]
    );
    if (clearance.passed) {
      return Object.freeze(candidates);
    }
    blockers = clearance.blockers;
  }
  throw new Error(
    "Fan-in material cannot clear blocking paint within its measured " +
      `motion corridor: ${[...obstructedMergeTrackIds].join(", ")}; ` +
      `blocked by ${blockers.join(", ")}.`
  );
}

export function compileKpCollisionSafeReorderTracks<
  Track extends KpEquationCollisionTrack
>(tracks: readonly Track[]): readonly Track[] {
  const persistComponents = groupTrackGeometry(
    tracks.filter(({ lifecycle }) => lifecycle === "persist")
  );
  const crossingPairs = persistComponents.flatMap((left, leftIndex) =>
    persistComponents.slice(leftIndex + 1).flatMap((right) =>
      componentsInvertOrder(left, right) ? [[left, right] as const] : []
    )
  );
  if (crossingPairs.length === 0) return tracks;

  const movingComponentIds = new Set(crossingPairs.map(([left, right]) =>
    componentTravel(left) > componentTravel(right) ||
      (
        componentTravel(left) === componentTravel(right) &&
        left.id.localeCompare(right.id) < 0
      )
      ? left.id
      : right.id
  ));
  const entering = tracks.some(({ lifecycle }) => lifecycle === "introduce");
  const moverRange = entering
    ? { start: 0.05, end: 0.62 }
    : { start: 0.42, end: 0.95 };
  const contextRange = entering
    ? { start: 0.62, end: 0.9 }
    : { start: 0.1, end: 0.38 };
  const structuralRange = entering
    ? { start: 0.9, end: 0.98 }
    : { start: 0.02, end: 0.1 };
  const scheduled = tracks.map((track) => Object.freeze({
    ...track,
    ...(track.lifecycle === "persist"
      ? {
          motionProgressRange: movingComponentIds.has(track.componentId)
            ? moverRange
            : contextRange
        }
      : track.lifecycle === "introduce" || track.lifecycle === "eliminate"
        ? {
            motionProgressRange: structuralRange,
            opacityStepAt: entering
              ? structuralRange.start
              : structuralRange.end
          }
        : {})
  }) as Track);
  const movingTrackIds = scheduled
    .filter(({ componentId, lifecycle }) =>
      lifecycle === "persist" && movingComponentIds.has(componentId)
    )
    .map(({ id }) => id);
  const localInkScale = Math.max(...scheduled.map(
    kpEquationMotionTrackScale
  ));
  const groupTravel = Math.max(...persistComponents
    .filter(({ id }) => movingComponentIds.has(id))
    .map(componentTravel));
  const componentGeometry = new Map(
    persistComponents.map((component) => [component.id, component])
  );

  // A semantic reorder cannot swap opaque material on one baseline without a
  // crossing. The cohort that owns the larger displacement carries the lift.
  let blockers: readonly string[] = [];
  for (const liftRatio of [0.5, 0.75, 1, 1.25, 1.5] as const) {
    const candidates = scheduled.map((track) =>
      movingComponentIds.has(track.componentId)
        ? Object.freeze({
            ...track,
            motionPath: Object.freeze(planTrackPath(
              track,
              componentTravelDirection(
                componentGeometry.get(track.componentId)!
              ) < 0
                ? "arc-above"
                : "arc-below",
              localInkScale * liftRatio
            )),
            motionPathSampling: "canonical-clearance-lane" as const,
            motionGroupTravel: groupTravel,
            motionSettlementAspectRatio: kpReorderSettlementAspectRatio
          }) as Track
        : track
    );
    const clearance = evaluateTrackClearance(
      candidates,
      movingTrackIds,
      kpNativeReorderInkContactTolerancePx
    );
    if (clearance.passed) return Object.freeze(candidates);
    blockers = clearance.blockers;
  }
  throw new Error(
    "Reordered material cannot clear blocking paint within its measured " +
      `motion corridor: ${movingTrackIds.join(", ")}; ` +
      `blocked by ${blockers.join(", ")}.`
  );
}

export function sampleKpEquationMotionTrackRect(
  track: KpEquationCollisionTrack,
  progress: number
): KpEquationLayoutRect {
  const p = clamp01(progress);
  const motionProgress = trackMotionProgress(track, p);
  return track.motionPath === undefined
    ? interpolateRect(track.startRect, track.endRect, motionProgress)
    : layoutRectAt(track, track.motionPath, motionProgress);
}

export function sampleKpEquationMotionTrackPaintRect(
  track: KpEquationCollisionTrack,
  progress: number
): KpEquationLayoutRect {
  const p = clamp01(progress);
  return projectKpEquationMotionTrackPaintRect(
    track,
    sampleKpEquationMotionTrackRect(track, p),
    p
  );
}

export function projectKpEquationMotionTrackPaintRect(
  track: KpEquationCollisionTrack,
  layoutRect: KpEquationLayoutRect,
  progress: number
): KpEquationLayoutRect {
  return paintRectAt(track, layoutRect, clamp01(progress));
}

export function sampleKpEquationMotionTrackOpacityProgress(
  track: KpEquationCollisionTrack,
  progress: number
): number {
  if (track.startOpacity === track.endOpacity) return progress;
  if (track.opacityStepAt !== undefined) {
    return progress < track.opacityStepAt ? 0 : 1;
  }
  const [start, end] =
    track.lifecycle === "merge" ? [0.62, 0.94] :
    track.lifecycle === "split" ? [0.18, 0.68] :
    track.lifecycle === "introduce" ? [0.28, 0.82] :
    track.lifecycle === "eliminate" ? [0.08, 0.62] :
    [0, 1];
  return smoothstep(clamp01((progress - start) / (end - start)));
}

function planTrackPath(
  track: KpEquationCollisionTrack,
  variant: "direct" | "arc-above" | "arc-below",
  clearance: number
): KpEquationMotionPathCandidate {
  return planKpEquationMotionPathBetweenPoints({
    id: `paint-path.${track.id}.${variant}.${clearance}`,
    start: rectCenter(track.startPaintRect ?? track.startRect),
    end: rectCenter(track.endPaintRect ?? track.endRect),
    moverRadius: 0,
    variants: [variant],
    clearance
  }).selected;
}

function evaluateFanInTrackClearance(
  tracks: readonly KpEquationCollisionTrack[],
  movingTrackIds?: readonly string[]
): { readonly passed: boolean; readonly blockers: readonly string[] } {
  const selectedIds = movingTrackIds === undefined
    ? undefined
    : new Set(movingTrackIds);
  const mergeTracks = tracks.filter(({ id, lifecycle }) =>
    lifecycle === "merge" && (selectedIds === undefined || selectedIds.has(id))
  );
  return evaluateTrackClearance(
    tracks,
    mergeTracks.map(({ id }) => id)
  );
}

function evaluateTrackClearance(
  tracks: readonly KpEquationCollisionTrack[],
  movingTrackIds: readonly string[],
  inkInset = kpNativeInkContactTolerancePx
): { readonly passed: boolean; readonly blockers: readonly string[] } {
  const movingIds = new Set(movingTrackIds);
  const requirements = tracks
    .filter(({ id }) => movingIds.has(id))
    .flatMap((movingTrack) => {
      const protectedIds = tracks
        .filter(({ componentId }) =>
          componentId !== movingTrack.componentId
        )
        .map(({ id }) => id);
      return protectedIds.length === 0
        ? []
        : [{
            id: `motion-clearance.${movingTrack.id}`,
            movingIds: [movingTrack.id],
            protectedIds,
            minClearancePx: 0.001
          }];
    });
  if (requirements.length === 0) {
    return { passed: true, blockers: [] };
  }
  const frames = Array.from({ length: 19 }, (_value, index) => {
    const progress = (index + 1) / 20;
    const easedProgress = smoothstep(progress);
    return {
      progress,
      ink: tracks.map((track) => {
        const paint = insetRect(
          sampleKpEquationMotionTrackPaintRect(track, easedProgress),
          inkInset
        );
        return {
          id: track.id,
          ...paint,
          opacity: collisionTrackOpacity(track, progress)
        };
      })
    };
  });
  const report = evaluateKpEquationMotionClearanceSequence({
    frames,
    requirements,
    maxSpatialStepPx: 1,
    maxProgressStep: 0.01
  });
  const blockerProgress = new Map<string, number>();
  for (const diagnostic of report.diagnostics) {
    const pair = `${diagnostic.movingId}->${diagnostic.protectedId}`;
    if (!blockerProgress.has(pair)) {
      blockerProgress.set(pair, diagnostic.progress);
    }
  }
  return {
    passed: report.passed,
    blockers: [...blockerProgress].map(([pair, progress]) =>
      `${pair}@${progress.toFixed(3)}`
    )
  };
}

interface KpTrackComponentGeometry {
  readonly id: string;
  readonly start: KpEquationLayoutRect;
  readonly end: KpEquationLayoutRect;
}

function groupTrackGeometry(
  tracks: readonly KpEquationCollisionTrack[]
): readonly KpTrackComponentGeometry[] {
  const byComponent = new Map<string, KpEquationCollisionTrack[]>();
  for (const track of tracks) {
    const group = byComponent.get(track.componentId) ?? [];
    group.push(track);
    byComponent.set(track.componentId, group);
  }
  return [...byComponent].map(([id, group]) => ({
    id,
    start: unionRects(group.map((track) =>
      track.startPaintRect ?? track.startRect
    )),
    end: unionRects(group.map((track) =>
      track.endPaintRect ?? track.endRect
    ))
  }));
}

function componentsInvertOrder(
  left: KpTrackComponentGeometry,
  right: KpTrackComponentGeometry
): boolean {
  const startDelta = rectCenter(left.start).x - rectCenter(right.start).x;
  const endDelta = rectCenter(left.end).x - rectCenter(right.end).x;
  const startSameRow = Math.abs(
    rectCenter(left.start).y - rectCenter(right.start).y
  ) <= Math.max(left.start.height, right.start.height);
  const endSameRow = Math.abs(
    rectCenter(left.end).y - rectCenter(right.end).y
  ) <= Math.max(left.end.height, right.end.height);
  return startSameRow && endSameRow && startDelta * endDelta < 0;
}

function componentTravel(component: KpTrackComponentGeometry): number {
  const start = rectCenter(component.start);
  const end = rectCenter(component.end);
  return Math.hypot(end.x - start.x, end.y - start.y);
}

function componentTravelDirection(
  component: KpTrackComponentGeometry
): number {
  return rectCenter(component.end).x - rectCenter(component.start).x;
}

function collisionTrackOpacity(
  track: KpEquationCollisionTrack,
  progress: number
): number {
  const start = track.startOpacity ?? 1;
  const end = track.endOpacity ?? 1;
  if (start === end) return start;
  if (track.opacityStepAt !== undefined) {
    return progress < track.opacityStepAt ? start : end;
  }
  return interpolate(start, end, progress);
}

function unionRects(
  rects: readonly KpEquationLayoutRect[]
): KpEquationLayoutRect {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function layoutRectAt(
  track: KpEquationCollisionTrack,
  path: KpEquationMotionPathCandidate,
  progress: number
): KpEquationLayoutRect {
  const center = sampleKpEquationMotionPathWithSampling(
    path,
    progress,
    track.motionPathSampling ?? "planned-curve",
    track.motionGroupTravel,
    track.motionSettlementAspectRatio
  );
  const width = interpolate(track.startRect.width, track.endRect.width, progress);
  const height = interpolate(
    track.startRect.height,
    track.endRect.height,
    progress
  );
  const startPaint = track.startPaintRect ?? track.startRect;
  const endPaint = track.endPaintRect ?? track.endRect;
  const paintWidth = interpolate(startPaint.width, endPaint.width, progress);
  const paintHeight = interpolate(startPaint.height, endPaint.height, progress);
  const paintOffsetX = interpolate(
    startPaint.left - track.startRect.left,
    endPaint.left - track.endRect.left,
    progress
  );
  const paintOffsetY = interpolate(
    startPaint.top - track.startRect.top,
    endPaint.top - track.endRect.top,
    progress
  );
  return {
    // Curves are planned against visible paint, then wrapper layout is
    // reconstructed so inner KaTeX offsets cannot reintroduce baseline sag.
    left: center.x - paintWidth / 2 - paintOffsetX,
    top: center.y - paintHeight / 2 - paintOffsetY,
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
  const motionProgress = trackMotionProgress(track, progress);
  return {
    left: layoutRect.left + interpolate(
      start.left - track.startRect.left,
      end.left - track.endRect.left,
      motionProgress
    ),
    top: layoutRect.top + interpolate(
      start.top - track.startRect.top,
      end.top - track.endRect.top,
      motionProgress
    ),
    width: interpolate(start.width, end.width, motionProgress),
    height: interpolate(start.height, end.height, motionProgress)
  };
}

export function kpEquationMotionTrackScale(
  track: KpEquationCollisionTrack
): number {
  const start = track.startPaintRect ?? track.startRect;
  const end = track.endPaintRect ?? track.endRect;
  return Math.max(
    1,
    start.height,
    end.height,
    track.startRect.height,
    track.endRect.height
  );
}

function trackTravel(track: KpEquationCollisionTrack): number {
  const start = rectCenter(track.startPaintRect ?? track.startRect);
  const end = rectCenter(track.endPaintRect ?? track.endRect);
  return Math.hypot(end.x - start.x, end.y - start.y);
}

function trackMotionProgress(
  track: KpEquationCollisionTrack,
  progress: number
): number {
  const range = track.motionProgressRange;
  if (range === undefined) return clamp01(progress);
  const local = clamp01((progress - range.start) / (range.end - range.start));
  return smoothstep(local);
}

function insetRect(
  rect: KpEquationLayoutRect,
  inset: number
): KpEquationLayoutRect {
  const horizontal = Math.min(inset, rect.width / 2);
  const vertical = Math.min(inset, rect.height / 2);
  return {
    left: rect.left + horizontal,
    top: rect.top + vertical,
    width: Math.max(0, rect.width - horizontal * 2),
    height: Math.max(0, rect.height - vertical * 2)
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
