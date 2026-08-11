import type {
  KpEquationLayoutPlan,
  KpEquationLayoutPoint,
  KpEquationLayoutRect
} from "./equation-layout-plan.ts";
import {
  evaluateKpEquationMotionClearanceSequence
} from "./equation-motion-clearance.ts";
import type {
  KpEquationProtectedTransitCertificate
} from "./equation-protected-transit-types.ts";
import type {
  KpVerifiedOperationPresentationPlanId
} from "../animation/operation-presentation-plan-authority.ts";

export type {
  KpEquationProtectedTransitCertificate
} from "./equation-protected-transit-types.ts";

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

export interface KpEquationMotionStageOccupancy {
  readonly measurementIdentity: {
    readonly revision: number;
    readonly coordinateSpaceId: string;
  };
  readonly rows: readonly {
    readonly id: string;
    readonly rect: KpEquationLayoutRect;
  }[];
  readonly protectedCorridor: KpEquationLayoutRect;
  readonly geometryAuthority: "certified-stage-layout";
}

export const kpMaximumFanInExcursionInLocalInkHeights = 1.5;
export const kpMaximumFanInSettlementAspectRatio = 5;
const kpFanInContextMotionRange = Object.freeze({ start: 0.05, end: 0.34 });
const kpFanInFocalMotionRange = Object.freeze({ start: 0.4, end: 0.95 });
const kpFanInLeaderMotionRange = Object.freeze({ start: 0.4, end: 0.78 });
const kpReorderSettlementAspectRatio = 8;
const kpFanInLiftRiseEnd = 0.22;
const kpFanInTransitStart = 0.55;
const kpFanInLiftRatios = [0.35, 0.5, 0.75, 1, 1.25, 1.5] as const;
const kpProtectedTransitContextRanges = [
  { start: 0, end: 0.5 },
  { start: 0, end: 0.65 },
  { start: 0, end: 0.8 },
  { start: 0.2, end: 1 },
  { start: 0.35, end: 1 },
  { start: 0.5, end: 1 },
  { start: 0.8, end: 1 },
  { start: 0.9, end: 1 },
  { start: 0.94, end: 1 }
] as const;
// Measured paint includes antialiasing fringes that may touch in native KaTeX.
export const kpNativeInkContactTolerancePx = 0.75;
export const kpNativeReorderInkContactTolerancePx = 1.5;

interface KpEquationReorderChoreography {
  readonly moverRange: {
    readonly start: number;
    readonly end: number;
  };
  readonly contextRange: {
    readonly start: number;
    readonly end: number;
  };
  readonly structuralRange: {
    readonly start: number;
    readonly end: number;
  };
}

const kpEnteringReorderChoreography = Object.freeze({
  // The crossing cohort rises first, remains in the clearance lane while
  // context vacates its destination, and only then settles. Ending mover
  // motion before context motion made collision freedom font-engine-specific.
  moverRange: Object.freeze({ start: 0.05, end: 0.9 }),
  contextRange: Object.freeze({ start: 0.32, end: 0.58 }),
  structuralRange: Object.freeze({ start: 0.9, end: 0.98 })
}) satisfies KpEquationReorderChoreography;

const kpExitingReorderChoreography = Object.freeze({
  moverRange: Object.freeze({ start: 0.42, end: 0.95 }),
  contextRange: Object.freeze({ start: 0.1, end: 0.38 }),
  structuralRange: Object.freeze({ start: 0.02, end: 0.1 })
}) satisfies KpEquationReorderChoreography;

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
  /**
   * Some continuants carry the expression's reading axis. Collision repair
   * may retime them, but must route other paint around that semantic scaffold.
   */
  readonly motionAxisConstraint?: "horizontal" | undefined;
  readonly motionProgressRange?: {
    readonly start: number;
    readonly end: number;
  } | undefined;
  readonly opacityStepAt?: number | undefined;
  /**
   * Collision repair may move a semantic timing group, but it must not replace
   * an opacity law already owned by a verified motif choreography.
   */
  readonly opacityScheduleAuthority?:
    "renderer-default" | "semantic-choreography" | undefined;
  /**
   * Generic collision repair may retime a whole semantic operation, but must
   * never retime one member independently and break simultaneous entry.
   */
  readonly timingGroupId?: string | undefined;
  /**
   * Related components can retain shared routing provenance without gaining
   * permission to overlap. Lane selection remains component-local so the
   * collision compiler can separate members of the cohort when required.
   */
  readonly routingCohortId?: string | undefined;
  /**
   * Identifies one rigid member inside a routing cohort. Every paint component
   * from that source member receives the same leader/follower timing and lane.
   */
  readonly routingMemberId?: string | undefined;
  /**
   * Deliberate motif contact is not crowding. The protected-transit audit
   * ignores contact only when both tracks carry the same compiler-owned ID.
   */
  readonly intentionalContactGroupId?: string | undefined;
  /**
   * Binds renderer metadata to a validator-minted plan. It never waives
   * collision checks by itself: a pair must also share an explicit contact
   * group before the visible-paint audit can certify their overlap.
   */
  readonly verifiedOperationCohortId?:
    KpVerifiedOperationPresentationPlanId | undefined;
  readonly motionGroupTravel?: number | undefined;
  readonly motionSettlementAspectRatio?: number | undefined;
}

export interface KpEquationProtectedTransitFrame {
  readonly trackId: string;
  readonly componentId: string;
  readonly rect: KpEquationLayoutRect;
  readonly expectedPaintRect?: KpEquationLayoutRect | undefined;
  readonly opacity: number;
}

export interface KpEquationProtectedTransitCompilation<
  Track extends KpEquationCollisionTrack
> {
  readonly kind: "equation-protected-transit-compilation";
  readonly tracks: readonly Track[];
  readonly certificate: KpEquationProtectedTransitCertificate;
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
>(
  tracks: readonly Track[],
  stageOccupancy?: KpEquationMotionStageOccupancy
): readonly Track[] {
  if (stageOccupancy !== undefined) {
    assertKpEquationMotionStageOccupancy(stageOccupancy);
  }
  const mergeTracks = tracks.filter(({ lifecycle }) => lifecycle === "merge");
  if (mergeTracks.length === 0) return tracks;
  const groupTravel = Math.max(...mergeTracks.map((track) => {
    const start = rectCenter(track.startPaintRect ?? track.startRect);
    const end = rectCenter(track.endPaintRect ?? track.endRect);
    return Math.hypot(end.x - start.x, end.y - start.y);
  }));
  const localInkScale = Math.max(...tracks.map(kpEquationMotionTrackScale));
  const motionUnits = new Map<string, typeof mergeTracks>();
  mergeTracks.forEach((track) => {
    const id = track.routingMemberId ?? track.id;
    motionUnits.set(id, [...(motionUnits.get(id) ?? []), track]);
  });
  const fusionLeaderUnitId = [...motionUnits].sort(
    ([leftId, leftTracks], [rightId, rightTracks]) =>
      Math.min(...leftTracks.map(trackTravel)) -
        Math.min(...rightTracks.map(trackTravel)) ||
      leftId.localeCompare(rightId)
  )[0]![0];
  const scheduled = tracks.map((track) => Object.freeze({
    ...track,
    ...(track.lifecycle === "persist"
      ? { motionProgressRange: kpFanInContextMotionRange }
      : track.lifecycle === "merge"
        ? {
            motionProgressRange:
              (track.routingMemberId ?? track.id) === fusionLeaderUnitId
              ? kpFanInLeaderMotionRange
              : kpFanInFocalMotionRange
          }
        : {})
  }) as Track);
  const obstructedMergeTrackIds = new Set(mergeTracks
    .filter((track) =>
      !evaluateFanInTrackClearance(
        scheduled,
        [track.id],
        stageOccupancy
      ).passed
    )
    .map(({ id }) => id));
  if (obstructedMergeTrackIds.size === 0) {
    return Object.freeze(scheduled);
  }
  // Merge-fan-in is a space-time motif: context opens the lane first, then
  // only obstructed focal paint lifts into a directly routed fusion leader.
  let blockers: readonly string[] = [];
  // Fractions commonly place the focal fan-in below persistent numerator
  // paint. Search both canonical sides so clearance follows measured paint
  // instead of encoding the historical assumption that free space is above.
  const routeVariants = fanInRouteVariantsByComponent(
    scheduled,
    obstructedMergeTrackIds
  );
  for (const variantsByComponent of routeVariants) {
    for (const liftRatio of kpFanInLiftRatios) {
      const candidates = scheduled.map((track) =>
        !obstructedMergeTrackIds.has(track.id)
          ? track
          : Object.freeze({
              ...track,
              motionPath: Object.freeze(planTrackPath(
                track,
                variantsByComponent.get(track.componentId) ?? "arc-above",
                localInkScale * liftRatio,
                stageOccupancy
              )),
              motionPathSampling: "canonical-clearance-lane" as const,
              motionGroupTravel: groupTravel
            }) as Track
      );
      const clearance = evaluateFanInTrackClearance(
        candidates,
        [...obstructedMergeTrackIds],
        stageOccupancy
      );
      if (clearance.passed) {
        return Object.freeze(candidates);
      }
      blockers = clearance.blockers;
    }
  }
  throw new Error(
    "Fan-in material cannot clear blocking paint within its measured " +
      `motion corridor: ${[...obstructedMergeTrackIds].join(", ")}; ` +
      `blocked by ${blockers.join(", ")}.`
  );
}

function fanInRouteVariantsByComponent(
  tracks: readonly KpEquationCollisionTrack[],
  obstructedTrackIds: ReadonlySet<string>
): readonly ReadonlyMap<
  string,
  "arc-above" | "arc-below"
>[] {
  const obstructedTracks = tracks.filter(
    ({ id }) => obstructedTrackIds.has(id)
  );
  const routeUnitIds = [...new Set(obstructedTracks
    .map(({ componentId, routingMemberId }) =>
      routingMemberId ?? componentId
    ))]
    .sort();
  const uniform = (variant: "arc-above" | "arc-below") =>
    new Map(obstructedTracks.map((track) => [track.componentId, variant]));
  const variants: ReadonlyMap<
    string,
    "arc-above" | "arc-below"
  >[] = [uniform("arc-above"), uniform("arc-below")];
  // A bounded component-level search lets related paint travel together while
  // independent structural cohorts take opposite lanes. It avoids the
  // per-glyph combinatorics that would make generated scenes unpredictable.
  if (routeUnitIds.length > 1 && routeUnitIds.length <= 6) {
    const allBelow = (1 << routeUnitIds.length) - 1;
    for (let mask = 1; mask < allBelow; mask += 1) {
      variants.push(new Map(obstructedTracks.map((track) => {
        const index = routeUnitIds.indexOf(
          track.routingMemberId ?? track.componentId
        );
        return [
          track.componentId,
          (mask & (1 << index)) === 0 ? "arc-above" : "arc-below"
        ];
      })));
    }
  }
  return Object.freeze(variants);
}

export function compileKpCollisionSafeReorderTracks<
  Track extends KpEquationCollisionTrack
>(
  tracks: readonly Track[],
  stageOccupancy?: KpEquationMotionStageOccupancy
): readonly Track[] {
  if (stageOccupancy !== undefined) {
    assertKpEquationMotionStageOccupancy(stageOccupancy);
  }
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
  const choreography = entering
    ? kpEnteringReorderChoreography
    : kpExitingReorderChoreography;
  const scheduled = tracks.map((track) => Object.freeze({
    ...track,
    ...(track.lifecycle === "persist"
      ? {
          motionProgressRange: movingComponentIds.has(track.componentId)
            ? choreography.moverRange
            : choreography.contextRange
        }
      : track.lifecycle === "introduce" || track.lifecycle === "eliminate"
        ? {
            motionProgressRange: choreography.structuralRange,
            opacityStepAt: entering
              ? choreography.structuralRange.start
              : choreography.structuralRange.end
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
              localInkScale * liftRatio,
              stageOccupancy
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
      kpNativeReorderInkContactTolerancePx,
      stageOccupancy
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

/**
 * Certifies the finalized measured scene, after motif-specific routing but
 * before paint sampling. Callers cannot claim protected transit by attaching
 * metadata: the nominal certificate is created only after dense unrelated-pair
 * inspection reaches zero.
 */
export function compileKpCollisionSafeTransitTracks<
  Track extends KpEquationCollisionTrack
>(input: {
  readonly tracks: readonly Track[];
  readonly stageOccupancy?: KpEquationMotionStageOccupancy | undefined;
  readonly sampleFrames: (
    tracks: readonly Track[],
    progress: number
  ) => readonly KpEquationProtectedTransitFrame[];
  readonly sampleCount?: number | undefined;
}): KpEquationProtectedTransitCompilation<Track> {
  if (input.stageOccupancy !== undefined) {
    assertKpEquationMotionStageOccupancy(input.stageOccupancy);
  }
  const sampleCount = positiveInteger(
    input.sampleCount ?? 100,
    "protected transit sample count"
  );
  assertUniqueCollisionTrackIds(input.tracks);
  let tracks = Object.freeze([...input.tracks]);
  const opacityScheduledTrackIds = new Set<string>();
  const rescheduledComponentIds = new Set<string>();
  const routedComponentIds = new Set<string>();
  const routedTrackIds = new Set<string>();
  let audit = inspectProtectedTransit({
    tracks,
    sampleFrames: input.sampleFrames,
    sampleCount
  });

  const initiallyScheduled = scheduleProtectedTransitStructuralOpacity({
    tracks,
    audit,
    scheduledTrackIds: opacityScheduledTrackIds
  });
  if (initiallyScheduled !== undefined) {
    tracks = initiallyScheduled;
    audit = inspectProtectedTransit({
      tracks,
      sampleFrames: input.sampleFrames,
      sampleCount
    });
  }

  while (audit.intersections.length > 0) {
    const newlyScheduled = scheduleProtectedTransitStructuralOpacity({
      tracks,
      audit,
      scheduledTrackIds: opacityScheduledTrackIds
    });
    if (newlyScheduled !== undefined) {
      // A newly chosen route can expose a later structural contact. Reapply
      // the same generic visibility law after every geometry decision instead
      // of assuming the initial audit found the final obstacle set.
      tracks = newlyScheduled;
      audit = inspectProtectedTransit({
        tracks,
        sampleFrames: input.sampleFrames,
        sampleCount
      });
      continue;
    }
    let bestTiming:
      | {
          readonly tracks: readonly Track[];
          readonly audit: KpProtectedTransitAudit;
          readonly componentId: string;
        }
      | undefined;
    for (const componentId of protectedTransitContextComponentIds(
      tracks,
      audit.intersections
    ).filter((id) => !rescheduledComponentIds.has(id))) {
      for (const range of kpProtectedTransitContextRanges) {
        const candidateTracks = Object.freeze(tracks.map((track) =>
          track.componentId === componentId
            ? Object.freeze({ ...track, motionProgressRange: range }) as Track
            : track
        ));
        const candidateAudit = inspectProtectedTransit({
          tracks: candidateTracks,
          sampleFrames: input.sampleFrames,
          sampleCount
        });
        if (
          bestTiming === undefined ||
          compareProtectedTransitAudits(candidateAudit, bestTiming.audit) < 0
        ) {
          bestTiming = { tracks: candidateTracks, audit: candidateAudit, componentId };
        }
      }
    }
    if (
      bestTiming === undefined ||
      compareProtectedTransitAudits(bestTiming.audit, audit) >= 0
    ) break;
    tracks = bestTiming.tracks;
    audit = bestTiming.audit;
    rescheduledComponentIds.add(bestTiming.componentId);
  }

  const attemptedRouteUnits = new Set<string>();
  while (audit.intersections.length > 0) {
    const newlyScheduled = scheduleProtectedTransitStructuralOpacity({
      tracks,
      audit,
      scheduledTrackIds: opacityScheduledTrackIds
    });
    if (newlyScheduled !== undefined) {
      tracks = newlyScheduled;
      audit = inspectProtectedTransit({
        tracks,
        sampleFrames: input.sampleFrames,
        sampleCount
      });
      continue;
    }
    const candidates = routeCandidateUnits(tracks, audit.intersections)
      .filter(({ id }) => !attemptedRouteUnits.has(id));
    let best:
      | {
          readonly tracks: readonly Track[];
          readonly audit: KpProtectedTransitAudit;
          readonly unit: KpProtectedTransitRouteUnit;
          readonly rescheduledComponentIds: readonly string[];
        }
      | undefined;
    const routeCandidates: Array<{
      readonly tracks: readonly Track[];
      readonly audit: KpProtectedTransitAudit;
      readonly unit: KpProtectedTransitRouteUnit;
    }> = [];
    routeCandidateGeneration:
    for (const unit of candidates) {
      for (
        const sampling of protectedTransitRouteSamplings(
          tracks,
          unit,
          audit.intersections
        )
      ) {
        for (const variant of protectedTransitRouteVariants(
          tracks,
          unit,
          input.stageOccupancy
        )) {
          for (
            const liftRatio of [
              0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1,
              1.125, 1.25, 1.375, 1.5, 1.75, 2, 2.25, 2.5,
              2.75, 3, 3.5, 4
            ] as const
          ) {
            const candidateTracks = routeProtectedTransitUnit({
              tracks,
              unit,
              variant,
              liftRatio,
              sampling,
              collisionScale: protectedTransitCollisionScale(
                tracks,
                unit,
                audit.intersections
              ),
              stageOccupancy: input.stageOccupancy
            });
            if (candidateTracks === undefined) continue;
            const candidateAudit = inspectProtectedTransit({
              tracks: candidateTracks,
              sampleFrames: input.sampleFrames,
              sampleCount
            });
            routeCandidates.push({
              tracks: candidateTracks,
              audit: candidateAudit,
              unit
            });
            if (candidateAudit.intersections.length === 0) {
              best = {
                tracks: candidateTracks,
                audit: candidateAudit,
                unit,
                rescheduledComponentIds: []
              };
              break routeCandidateGeneration;
            }
          }
        }
      }
    }
    if (best === undefined) {
      const beam = routeCandidates
        .sort((left, right) =>
          compareProtectedTransitAudits(left.audit, right.audit)
        )
        .slice(0, 6);
      for (const candidate of beam) {
        const coordinated = optimizeProtectedTransitContextTiming({
          tracks: candidate.tracks,
          audit: candidate.audit,
          sampleFrames: input.sampleFrames,
          sampleCount,
          reschedulableComponentIds: rescheduledComponentIds
        });
        if (
          best === undefined ||
          compareProtectedTransitAudits(coordinated.audit, best.audit) < 0
        ) {
          best = {
            tracks: coordinated.tracks,
            audit: coordinated.audit,
            unit: candidate.unit,
            rescheduledComponentIds: coordinated.rescheduledComponentIds
          };
        }
        if (coordinated.audit.intersections.length === 0) break;
      }
    }
    if (
      best === undefined ||
      compareProtectedTransitAudits(best.audit, audit) >= 0
    ) {
      const coordinatedRoutes = repairProtectedTransitRouteInteraction({
        tracks,
        audit,
        sampleFrames: input.sampleFrames,
        sampleCount,
        stageOccupancy: input.stageOccupancy,
        routedTrackIds,
        reschedulableComponentIds: rescheduledComponentIds
      });
      if (coordinatedRoutes !== undefined) {
        tracks = coordinatedRoutes.tracks;
        audit = coordinatedRoutes.audit;
        coordinatedRoutes.routedComponentIds.forEach((componentId) =>
          routedComponentIds.add(componentId)
        );
        coordinatedRoutes.routedTrackIds.forEach((trackId) =>
          routedTrackIds.add(trackId)
        );
        coordinatedRoutes.rescheduledComponentIds.forEach((componentId) =>
          rescheduledComponentIds.add(componentId)
        );
        continue;
      }
      throw new Error(
        "Measured equation paint has unrelated protected-transit " +
        `intersections: ${audit.intersections.map((entry) =>
          `${entry.leftTrackId}->${entry.rightTrackId}@` +
          `${entry.progress.toFixed(3)}:` +
          `${entry.width.toFixed(2)}x${entry.height.toFixed(2)}`
        ).join(", ")}. ` +
        `Best bounded route: ${best === undefined
          ? "none"
          : `${best.unit.id}=${protectedTransitAuditSummary(best.audit)}`}; ` +
        `current=${protectedTransitAuditSummary(audit)}. ` +
        `Implicated geometry: ${protectedTransitImplicatedGeometry(
          tracks,
          audit.intersections
        )}. ` +
        `Route candidates: ${routeCandidateUnits(
          tracks,
          audit.intersections
        ).map((unit) =>
          `${unit.id}=${protectedTransitRouteStatus(
            tracks,
            unit,
            input.stageOccupancy
          )}`
        ).join(", ")}.`
      );
    }
    tracks = best.tracks;
    audit = best.audit;
    attemptedRouteUnits.add(best.unit.id);
    routedComponentIds.add(best.unit.componentId);
    best.unit.trackIds.forEach((trackId) => routedTrackIds.add(trackId));
    best.rescheduledComponentIds.forEach((componentId) =>
      rescheduledComponentIds.add(componentId)
    );
  }

  return Object.freeze({
    kind: "equation-protected-transit-compilation",
    tracks,
    // The lightweight public type owns the hidden nominal brand. Only this
    // dense measured-paint verifier may assert it after the audit reaches zero.
    certificate: Object.freeze({
      kind: "equation-protected-transit-certificate",
      geometryAuthority: input.stageOccupancy?.geometryAuthority ??
        "measured-visible-paint",
      ...(input.stageOccupancy === undefined
        ? {}
        : {
            measurementIdentity: Object.freeze({
              ...input.stageOccupancy.measurementIdentity
            })
          }),
      sampleCount,
      inspectedPairCount: audit.inspectedPairCount,
      opacityScheduledTrackIds: Object.freeze(
        [...opacityScheduledTrackIds].sort()
      ),
      rescheduledComponentIds: Object.freeze(
        [...rescheduledComponentIds].sort()
      ),
      routedComponentIds: Object.freeze([...routedComponentIds].sort()),
      routedTrackIds: Object.freeze([...routedTrackIds].sort())
    }) as KpEquationProtectedTransitCertificate
  });
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

export function applyKpEquationMotionPathOffset(
  track: KpEquationCollisionTrack,
  rect: KpEquationLayoutRect,
  progress: number
): KpEquationLayoutRect {
  if (track.motionPath === undefined) return rect;
  const p = clamp01(progress);
  const routed = sampleKpEquationMotionPathWithSampling(
    track.motionPath,
    p,
    track.motionPathSampling ?? "planned-curve",
    track.motionGroupTravel,
    track.motionSettlementAspectRatio
  );
  const direct = {
    x: interpolate(track.motionPath.start.x, track.motionPath.end.x, p),
    y: interpolate(track.motionPath.start.y, track.motionPath.end.y, p)
  };
  return {
    ...rect,
    left: rect.left + routed.x - direct.x,
    top: rect.top + routed.y - direct.y
  };
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
  clearance: number,
  stageOccupancy?: KpEquationMotionStageOccupancy
): KpEquationMotionPathCandidate {
  const start = rectCenter(track.startPaintRect ?? track.startRect);
  const end = rectCenter(track.endPaintRect ?? track.endRect);
  const planned = (
    selectedVariant: "direct" | "arc-above" | "arc-below",
    selectedClearance: number
  ) => planKpEquationMotionPathBetweenPoints({
    id: `paint-path.${track.id}.${selectedVariant}.${selectedClearance}`,
    start,
    end,
    moverRadius: 0,
    variants: [selectedVariant],
    clearance: selectedClearance
  }).selected;
  const localPath = planned(variant, clearance);
  if (
    stageOccupancy === undefined ||
    pathStaysWithinCertifiedOccupancy(track, localPath, stageOccupancy)
  ) {
    return localPath;
  }
  const lane = resolveCertifiedClearanceLane(track, stageOccupancy);
  if (lane === undefined) return localPath;
  return planned(lane.variant, Math.min(clearance, lane.clearance));
}

function pathStaysWithinCertifiedOccupancy(
  track: KpEquationCollisionTrack,
  path: KpEquationMotionPathCandidate,
  occupancy: KpEquationMotionStageOccupancy
): boolean {
  const lane = resolveCertifiedClearanceLane(track, occupancy);
  if (lane === undefined) return false;
  if (occupancy.rows.length === 1) {
    // With no competing row, existing paint-to-paint clearance remains the
    // tighter local authority; the corridor still bounds responsive fit.
    return true;
  }
  const allowedBounds = unionRects([
    lane.row.rect,
    occupancy.protectedCorridor
  ]);
  const routedTrack = {
    ...track,
    motionPath: path,
    motionPathSampling: "canonical-clearance-lane" as const
  };
  return Array.from({ length: 19 }, (_value, index) =>
    sampleKpEquationMotionTrackPaintRect(routedTrack, (index + 1) / 20)
  ).every((paint) =>
    containsRect(allowedBounds, paint, kpNativeInkContactTolerancePx) &&
    occupancy.rows.every(({ id, rect }) =>
      id === lane.row.id ||
      !intersectsRect(rect, paint, kpNativeInkContactTolerancePx)
    )
  );
}

function evaluateFanInTrackClearance(
  tracks: readonly KpEquationCollisionTrack[],
  movingTrackIds?: readonly string[],
  stageOccupancy?: KpEquationMotionStageOccupancy
): { readonly passed: boolean; readonly blockers: readonly string[] } {
  const selectedIds = movingTrackIds === undefined
    ? undefined
    : new Set(movingTrackIds);
  const mergeTracks = tracks.filter(({ id, lifecycle }) =>
    lifecycle === "merge" && (selectedIds === undefined || selectedIds.has(id))
  );
  return evaluateTrackClearance(
    tracks,
    mergeTracks.map(({ id }) => id),
    kpNativeInkContactTolerancePx,
    stageOccupancy
  );
}

function evaluateTrackClearance(
  tracks: readonly KpEquationCollisionTrack[],
  movingTrackIds: readonly string[],
  inkInset = kpNativeInkContactTolerancePx,
  stageOccupancy?: KpEquationMotionStageOccupancy
): { readonly passed: boolean; readonly blockers: readonly string[] } {
  const movingIds = new Set(movingTrackIds);
  const requirements = tracks
    .filter(({ id }) => movingIds.has(id))
    .flatMap((movingTrack) => {
      const protectedIds = tracks
        .filter(({ componentId, intentionalContactGroupId }) =>
          componentId !== movingTrack.componentId &&
          (
            movingTrack.intentionalContactGroupId === undefined ||
            intentionalContactGroupId !==
              movingTrack.intentionalContactGroupId
          )
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
  const report = requirements.length === 0
    ? undefined
    : evaluateKpEquationMotionClearanceSequence({
        frames,
        requirements,
        maxSpatialStepPx: 1,
        maxProgressStep: 0.01
      });
  const blockerProgress = new Map<string, number>();
  for (const diagnostic of report?.diagnostics ?? []) {
    const pair = `${diagnostic.movingId}->${diagnostic.protectedId}`;
    if (!blockerProgress.has(pair)) {
      blockerProgress.set(pair, diagnostic.progress);
    }
  }
  if (stageOccupancy !== undefined) {
    for (const track of tracks.filter(({ id }) => movingIds.has(id))) {
      const lane = resolveCertifiedClearanceLane(track, stageOccupancy);
      if (lane === undefined) {
        blockerProgress.set(`${track.id}->uncertified-stage-row`, 0);
        continue;
      }
      if (stageOccupancy.rows.length === 1) continue;
      const allowedBounds = unionRects([
        lane.row.rect,
        stageOccupancy.protectedCorridor
      ]);
      for (const frame of frames) {
        const paint = frame.ink.find(({ id }) => id === track.id)!;
        if (!containsRect(allowedBounds, paint, kpNativeInkContactTolerancePx)) {
          blockerProgress.set(
            `${track.id}->outside-certified-occupancy`,
            frame.progress
          );
          break;
        }
        const foreignRow = stageOccupancy.rows.find(({ id, rect }) =>
          id !== lane.row.id &&
          intersectsRect(rect, paint, kpNativeInkContactTolerancePx)
        );
        if (foreignRow !== undefined) {
          blockerProgress.set(
            `${track.id}->${foreignRow.id}`,
            frame.progress
          );
          break;
        }
      }
    }
  }
  return {
    passed: (report?.passed ?? true) && blockerProgress.size === 0,
    blockers: [...blockerProgress].map(([pair, progress]) =>
      `${pair}@${progress.toFixed(3)}`
    )
  };
}

export interface KpProtectedTransitIntersection {
  readonly leftTrackId: string;
  readonly rightTrackId: string;
  readonly progress: number;
  readonly width: number;
  readonly height: number;
}

export interface KpProtectedTransitAudit {
  readonly intersections: readonly KpProtectedTransitIntersection[];
  readonly inspectedPairCount: number;
  readonly totalIntersectionArea: number;
  readonly maximumIntersectionArea: number;
}

/**
 * Exposes the same measured-paint audit used by final transit certification.
 * Motif planners use this before choosing a route so browser-specific paint
 * metrics cannot pass an approximate preflight and fail the final authority.
 */
export function inspectKpEquationProtectedTransitTracks<
  Track extends KpEquationCollisionTrack
>(input: {
  readonly tracks: readonly Track[];
  readonly sampleFrames: (
    tracks: readonly Track[],
    progress: number
  ) => readonly KpEquationProtectedTransitFrame[];
  readonly sampleCount?: number | undefined;
}): KpProtectedTransitAudit {
  const sampleCount = positiveInteger(
    input.sampleCount ?? 100,
    "protected transit inspection sample count"
  );
  assertUniqueCollisionTrackIds(input.tracks);
  return inspectProtectedTransit({
    tracks: input.tracks,
    sampleFrames: input.sampleFrames,
    sampleCount
  });
}

function scheduleProtectedTransitStructuralOpacity<
  Track extends KpEquationCollisionTrack
>(input: {
  readonly tracks: readonly Track[];
  readonly audit: KpProtectedTransitAudit;
  readonly scheduledTrackIds: Set<string>;
}): readonly Track[] | undefined {
  const trackById = new Map(input.tracks.map((track) => [track.id, track]));
  const ids = new Set(input.audit.intersections.flatMap(
    ({ leftTrackId, rightTrackId }) =>
      [leftTrackId, rightTrackId].filter((trackId) => {
        if (input.scheduledTrackIds.has(trackId)) return false;
        const track = trackById.get(trackId);
        if (track?.opacityScheduleAuthority === "semantic-choreography") {
          return false;
        }
        const lifecycle = track?.lifecycle;
        return lifecycle === "introduce" || lifecycle === "eliminate";
      })
  ));
  if (ids.size === 0) return undefined;
  const timingGroups = new Set([...ids].flatMap((id) => {
    const groupId = trackById.get(id)?.timingGroupId;
    return groupId === undefined ? [] : [groupId];
  }));
  for (const track of input.tracks) {
    if (
      track.timingGroupId !== undefined &&
      timingGroups.has(track.timingGroupId) &&
      track.opacityScheduleAuthority !== "semantic-choreography" &&
      (track.lifecycle === "introduce" || track.lifecycle === "eliminate")
    ) {
      ids.add(track.id);
    }
  }
  // Structural paint already owns enter/exit opacity. Moving its existing
  // visibility step outside the occupied interval avoids inventing a path or
  // a new lifecycle merely to clear temporary syntax.
  return Object.freeze(input.tracks.map((track) => {
    if (!ids.has(track.id)) return track;
    input.scheduledTrackIds.add(track.id);
    return Object.freeze({
      ...track,
      opacityStepAt: track.lifecycle === "introduce" ? 0.94 : 0.08
    }) as Track;
  }));
}

function inspectProtectedTransit<
  Track extends KpEquationCollisionTrack
>(input: {
  readonly tracks: readonly Track[];
  readonly sampleFrames: (
    tracks: readonly Track[],
    progress: number
  ) => readonly KpEquationProtectedTransitFrame[];
  readonly sampleCount: number;
}): KpProtectedTransitAudit {
  const tracksById = new Map(input.tracks.map((track) => [track.id, track]));
  const intersections: KpProtectedTransitIntersection[] = [];
  let inspectedPairCount = 0;
  for (let sampleIndex = 1; sampleIndex < input.sampleCount; sampleIndex += 1) {
    const progress = sampleIndex / input.sampleCount;
    const frames = input.sampleFrames(input.tracks, progress);
    const frameIds = frames.map(({ trackId }) => trackId);
    if (
      frames.length !== input.tracks.length ||
      new Set(frameIds).size !== frameIds.length ||
      frameIds.some((id) => !tracksById.has(id))
    ) {
      throw new Error(
        "Protected transit sampling must return every track exactly once."
      );
    }
    const visible = frames.filter(({ opacity }) => opacity > 0.01);
    for (const [leftIndex, left] of visible.entries()) {
      for (const right of visible.slice(leftIndex + 1)) {
        inspectedPairCount += 1;
        if (left.componentId === right.componentId) continue;
        const leftTrack = tracksById.get(left.trackId)!;
        const rightTrack = tracksById.get(right.trackId)!;
        if (
          leftTrack.intentionalContactGroupId !== undefined &&
          leftTrack.intentionalContactGroupId ===
            rightTrack.intentionalContactGroupId
        ) {
          continue;
        }
        const overlap = rectIntersection(
          left.expectedPaintRect ?? left.rect,
          right.expectedPaintRect ?? right.rect
        );
        if (
          overlap.width <= kpNativeInkContactTolerancePx ||
          overlap.height <= kpNativeInkContactTolerancePx
        ) continue;
        const endpointContact = protectedTransitEndpointContact(
          leftTrack,
          rightTrack
        );
        if (
          endpointContact !== undefined &&
          overlap.width <=
            endpointContact.maximumOverlapWidthPx +
              kpNativeInkContactTolerancePx &&
          overlap.height <=
            endpointContact.maximumOverlapHeightPx +
              kpNativeInkContactTolerancePx
        ) continue;
        intersections.push({
          leftTrackId: left.trackId,
          rightTrackId: right.trackId,
          progress,
          width: overlap.width,
          height: overlap.height
        });
      }
    }
  }
  const areas = intersections.map(({ width, height }) => width * height);
  return {
    intersections,
    inspectedPairCount,
    totalIntersectionArea: areas.reduce((sum, area) => sum + area, 0),
    maximumIntersectionArea: Math.max(0, ...areas)
  };
}

function protectedTransitEndpointContact(
  left: KpEquationCollisionTrack,
  right: KpEquationCollisionTrack
): {
  readonly maximumOverlapWidthPx: number;
  readonly maximumOverlapHeightPx: number;
} | undefined {
  const contacts = [
    ...(left.startOpacity ?? 1) > 0.01 &&
        (right.startOpacity ?? 1) > 0.01
      ? [rectIntersection(
          left.startPaintRect ?? left.startRect,
          right.startPaintRect ?? right.startRect
        )]
      : [],
    ...(left.endOpacity ?? 1) > 0.01 &&
        (right.endOpacity ?? 1) > 0.01
      ? [rectIntersection(
          left.endPaintRect ?? left.endRect,
          right.endPaintRect ?? right.endRect
        )]
      : []
  ].filter(({ width, height }) =>
    width > kpNativeInkContactTolerancePx &&
    height > kpNativeInkContactTolerancePx
  );
  if (contacts.length === 0) return undefined;
  return {
    maximumOverlapWidthPx: Math.max(...contacts.map(({ width }) => width)),
    maximumOverlapHeightPx: Math.max(...contacts.map(({ height }) => height))
  };
}

/**
 * Reconsiders one compiler-owned route together with one newly implicated
 * route. A greedy first route can be collision-free locally yet obstruct a
 * later mover; preserving a small beam here makes the result compositional
 * without allowing the generic planner to overwrite motif-authored paths.
 */
function repairProtectedTransitRouteInteraction<
  Track extends KpEquationCollisionTrack
>(input: {
  readonly tracks: readonly Track[];
  readonly audit: KpProtectedTransitAudit;
  readonly sampleFrames: (
    tracks: readonly Track[],
    progress: number
  ) => readonly KpEquationProtectedTransitFrame[];
  readonly sampleCount: number;
  readonly stageOccupancy?: KpEquationMotionStageOccupancy | undefined;
  readonly routedTrackIds: ReadonlySet<string>;
  readonly reschedulableComponentIds: ReadonlySet<string>;
}): {
  readonly tracks: readonly Track[];
  readonly audit: KpProtectedTransitAudit;
  readonly routedComponentIds: readonly string[];
  readonly routedTrackIds: readonly string[];
  readonly rescheduledComponentIds: readonly string[];
} | undefined {
  const implicated = routeCandidateUnits(input.tracks, input.audit.intersections);
  const revisable = implicated.filter((unit) =>
    unit.trackIds.every((trackId) => input.routedTrackIds.has(trackId))
  );
  for (const priorUnit of revisable) {
    const baseTracks = Object.freeze(input.tracks.map((track) => {
      if (!priorUnit.trackIds.includes(track.id)) return track;
      const {
        motionPath: _path,
        motionPathSampling: _sampling,
        ...base
      } = track;
      return Object.freeze(base) as Track;
    }));
    const allPriorCandidates = protectedTransitRouteCandidates({
      tracks: baseTracks,
      unit: priorUnit,
      audit: input.audit,
      sampleFrames: input.sampleFrames,
      sampleCount: input.sampleCount,
      stageOccupancy: input.stageOccupancy
    });
    // Keep both path shapes in the bounded beam. Ranking all candidates
    // together can fill the beam with near-identical compact curves and hide
    // the only late-hold route that resolves a settlement collision.
    const priorCandidates = protectedTransitRouteSamplings(
      baseTracks,
      priorUnit,
      input.audit.intersections
    ).flatMap((sampling) =>
      allPriorCandidates.filter(({ tracks }) =>
        tracks.find(({ id }) => priorUnit.trackIds.includes(id))
          ?.motionPathSampling === sampling
      ).sort((left, right) =>
        compareProtectedTransitAudits(left.audit, right.audit)
      ).slice(0, 3)
    );
    for (const priorCandidate of priorCandidates) {
      if (priorCandidate.audit.intersections.length === 0) {
        return {
          tracks: priorCandidate.tracks,
          audit: priorCandidate.audit,
          routedComponentIds: [priorUnit.componentId],
          routedTrackIds: priorUnit.trackIds,
          rescheduledComponentIds: []
        };
      }
      const nextUnits = routeCandidateUnits(
        priorCandidate.tracks,
        priorCandidate.audit.intersections
      ).filter((unit) =>
        unit.id !== priorUnit.id &&
        protectedTransitRouteStatus(
          priorCandidate.tracks,
          unit,
          input.stageOccupancy
        ) !== "already-routed"
      );
      for (const nextUnit of nextUnits) {
        for (const nextCandidate of protectedTransitRouteCandidates({
          tracks: priorCandidate.tracks,
          unit: nextUnit,
          audit: priorCandidate.audit,
          sampleFrames: input.sampleFrames,
          sampleCount: input.sampleCount,
          stageOccupancy: input.stageOccupancy
        })) {
          const coordinated = nextCandidate.audit.intersections.length === 0
            ? {
                tracks: nextCandidate.tracks,
                audit: nextCandidate.audit,
                rescheduledComponentIds: [] as readonly string[]
              }
            : optimizeProtectedTransitContextTiming({
                tracks: nextCandidate.tracks,
                audit: nextCandidate.audit,
                sampleFrames: input.sampleFrames,
                sampleCount: input.sampleCount,
                reschedulableComponentIds:
                  input.reschedulableComponentIds
              });
          if (coordinated.audit.intersections.length !== 0) continue;
          return {
            tracks: coordinated.tracks,
            audit: coordinated.audit,
            routedComponentIds: [
              priorUnit.componentId,
              nextUnit.componentId
            ],
            routedTrackIds: [
              ...priorUnit.trackIds,
              ...nextUnit.trackIds
            ],
            rescheduledComponentIds: coordinated.rescheduledComponentIds
          };
        }
      }
    }
  }
  return undefined;
}

function protectedTransitRouteCandidates<
  Track extends KpEquationCollisionTrack
>(input: {
  readonly tracks: readonly Track[];
  readonly unit: KpProtectedTransitRouteUnit;
  readonly audit: KpProtectedTransitAudit;
  readonly sampleFrames: (
    tracks: readonly Track[],
    progress: number
  ) => readonly KpEquationProtectedTransitFrame[];
  readonly sampleCount: number;
  readonly stageOccupancy?: KpEquationMotionStageOccupancy | undefined;
}): Array<{
  readonly tracks: readonly Track[];
  readonly audit: KpProtectedTransitAudit;
}> {
  const candidates: Array<{
    readonly tracks: readonly Track[];
    readonly audit: KpProtectedTransitAudit;
  }> = [];
  for (const variant of protectedTransitRouteVariants(
    input.tracks,
    input.unit,
    input.stageOccupancy
  )) {
    for (const sampling of protectedTransitRouteSamplings(
      input.tracks,
      input.unit,
      input.audit.intersections
    )) {
      for (
        const liftRatio of [
          0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1,
          1.125, 1.25, 1.375, 1.5, 1.75, 2, 2.25, 2.5,
          2.75, 3, 3.5, 4
        ] as const
      ) {
        const tracks = routeProtectedTransitUnit({
          tracks: input.tracks,
          unit: input.unit,
          variant,
          liftRatio,
          sampling,
          collisionScale: protectedTransitCollisionScale(
            input.tracks,
            input.unit,
            input.audit.intersections
          ),
          stageOccupancy: input.stageOccupancy
        });
        if (tracks === undefined) continue;
        candidates.push({
          tracks,
          audit: inspectProtectedTransit({
            tracks,
            sampleFrames: input.sampleFrames,
            sampleCount: input.sampleCount
          })
        });
      }
    }
  }
  return candidates;
}

interface KpProtectedTransitRouteUnit {
  readonly id: string;
  readonly componentId: string;
  readonly trackIds: readonly string[];
}

function optimizeProtectedTransitContextTiming<
  Track extends KpEquationCollisionTrack
>(input: {
  readonly tracks: readonly Track[];
  readonly audit: KpProtectedTransitAudit;
  readonly sampleFrames: (
    tracks: readonly Track[],
    progress: number
  ) => readonly KpEquationProtectedTransitFrame[];
  readonly sampleCount: number;
  readonly reschedulableComponentIds: ReadonlySet<string>;
}): {
  readonly tracks: readonly Track[];
  readonly audit: KpProtectedTransitAudit;
  readonly rescheduledComponentIds: readonly string[];
} {
  let bestTracks = input.tracks;
  let bestAudit = input.audit;
  let bestComponentIds: readonly string[] = [];
  for (const componentId of protectedTransitContextComponentIds(
    input.tracks,
    input.audit.intersections,
    input.reschedulableComponentIds
  )) {
    for (const range of kpProtectedTransitContextRanges) {
      const candidateTracks = Object.freeze(input.tracks.map((track) => {
        if (track.componentId !== componentId) return track;
        const { motionProgressRange: _existing, ...base } = track;
        return Object.freeze({ ...base, motionProgressRange: range }) as Track;
      }));
      const candidateAudit = inspectProtectedTransit({
        tracks: candidateTracks,
        sampleFrames: input.sampleFrames,
        sampleCount: input.sampleCount
      });
      if (compareProtectedTransitAudits(candidateAudit, bestAudit) < 0) {
        bestTracks = candidateTracks;
        bestAudit = candidateAudit;
        bestComponentIds = [componentId];
        if (candidateAudit.intersections.length === 0) {
          return {
            tracks: bestTracks,
            audit: bestAudit,
            rescheduledComponentIds: bestComponentIds
          };
        }
      }
    }
  }
  return {
    tracks: bestTracks,
    audit: bestAudit,
    rescheduledComponentIds: bestComponentIds
  };
}

function protectedTransitContextComponentIds(
  tracks: readonly KpEquationCollisionTrack[],
  intersections: readonly KpProtectedTransitIntersection[],
  reschedulableComponentIds: ReadonlySet<string> = new Set()
): readonly string[] {
  const byId = new Map(tracks.map((track) => [track.id, track]));
  const candidates = new Set<string>();
  for (const intersection of intersections) {
    const pair = [
      byId.get(intersection.leftTrackId)!,
      byId.get(intersection.rightTrackId)!
    ] as const;
    for (const [candidate, counterpart] of [pair, [pair[1], pair[0]] as const]) {
      if (
        candidate.lifecycle === "persist" &&
        (
          candidate.motionProgressRange === undefined ||
          reschedulableComponentIds.has(candidate.componentId)
        ) &&
        (counterpart.lifecycle === "split" || counterpart.lifecycle === "merge")
      ) {
        candidates.add(candidate.componentId);
      }
    }
  }
  return [...candidates].sort();
}

function routeCandidateUnits(
  tracks: readonly KpEquationCollisionTrack[],
  intersections: readonly KpProtectedTransitIntersection[]
): readonly KpProtectedTransitRouteUnit[] {
  const byId = new Map(tracks.map((track) => [track.id, track]));
  const implicated = [...new Set(intersections.flatMap((intersection) => [
    intersection.leftTrackId,
    intersection.rightTrackId
  ]))].map((trackId) => byId.get(trackId)!);
  const units = new Map<string, KpProtectedTransitRouteUnit>();
  for (const track of implicated) {
    const branch = track.lifecycle === "split" || track.lifecycle === "merge";
    const id = branch ? `track:${track.id}` : `component:${track.componentId}`;
    if (units.has(id)) continue;
    units.set(id, {
      id,
      componentId: track.componentId,
      trackIds: branch
        ? Object.freeze([track.id])
        : Object.freeze(tracks
            .filter(({ componentId }) => componentId === track.componentId)
            .map(({ id: trackId }) => trackId))
    });
  }
  return [...units.values()].filter((unit) =>
    tracks.every((track) =>
      !unit.trackIds.includes(track.id) ||
      track.motionAxisConstraint === undefined
    )
  ).sort((leftUnit, rightUnit) => {
    const left = tracks.filter(({ id }) => leftUnit.trackIds.includes(id));
    const right = tracks.filter(({ id }) => rightUnit.trackIds.includes(id));
    return routePriority(left) - routePriority(right) ||
      Math.max(...right.map(trackTravel)) -
        Math.max(...left.map(trackTravel)) ||
      leftUnit.id.localeCompare(rightUnit.id);
  });
}

function protectedTransitRouteStatus(
  tracks: readonly KpEquationCollisionTrack[],
  unit: KpProtectedTransitRouteUnit,
  stageOccupancy?: KpEquationMotionStageOccupancy
): string {
  const routeTracks = tracks.filter((track) =>
    unit.trackIds.includes(track.id)
  );
  if (routeTracks.length !== unit.trackIds.length) return "missing";
  if (routeTracks.some(({ motionPath }) => motionPath !== undefined)) {
    return "already-routed";
  }
  if (stageOccupancy === undefined) return "measured-paint-eligible";
  const lanes = routeTracks.map((track) =>
    resolveCertifiedClearanceLane(track, stageOccupancy)
  );
  if (lanes.some((lane) => lane === undefined)) {
    return "outside-single-certified-row";
  }
  if (new Set(lanes.map((lane) => lane!.variant)).size > 1) {
    return "conflicting-certified-lanes";
  }
  return "certified-lane-eligible";
}

function protectedTransitRouteVariants(
  _tracks: readonly KpEquationCollisionTrack[],
  _unit: KpProtectedTransitRouteUnit,
  _stageOccupancy?: KpEquationMotionStageOccupancy
): readonly ("arc-above" | "arc-below")[] {
  // Both directions are candidates even in a two-row stage. The subsequent
  // occupancy proof rejects a path that leaves its certified row/corridor or
  // enters the foreign row; preselecting the corridor side can miss a smaller
  // safe within-row correction.
  return ["arc-above", "arc-below"];
}

function protectedTransitRouteSamplings(
  tracks: readonly KpEquationCollisionTrack[],
  unit: KpProtectedTransitRouteUnit,
  intersections: readonly KpProtectedTransitIntersection[]
): readonly KpEquationMotionPathSampling[] {
  const relevant = intersections.filter(({ leftTrackId, rightTrackId }) =>
    unit.trackIds.includes(leftTrackId) ||
    unit.trackIds.includes(rightTrackId)
  );
  const implicatedIds = new Set(relevant.flatMap(
    ({ leftTrackId, rightTrackId }) => [leftTrackId, rightTrackId]
  ));
  const hasThinPaint = tracks.some((track) => {
    if (!implicatedIds.has(track.id)) return false;
    const rects = [
      track.startPaintRect ?? track.startRect,
      track.endPaintRect ?? track.endRect
    ];
    return rects.some(({ width, height }) =>
      Math.min(width, height) <= 1.5 &&
      Math.max(width, height) >= Math.min(width, height) * 4
    );
  });
  const onlyLateContacts =
    relevant.length > 0 &&
    relevant.every(({ progress }) => progress >= 0.72);
  // Full-height paint that crosses late must retain clearance through
  // settlement. Thin rules keep the compact curve first because holding their
  // lift can sweep them across adjacent baseline glyphs.
  return onlyLateContacts && !hasThinPaint
    ? ["canonical-clearance-lane", "planned-curve"]
    : ["planned-curve", "canonical-clearance-lane"];
}

function protectedTransitCollisionScale(
  tracks: readonly KpEquationCollisionTrack[],
  unit: KpProtectedTransitRouteUnit,
  intersections: readonly KpProtectedTransitIntersection[]
): number {
  const implicatedIds = new Set(intersections.flatMap((intersection) =>
    unit.trackIds.includes(intersection.leftTrackId) ||
    unit.trackIds.includes(intersection.rightTrackId)
      ? [intersection.leftTrackId, intersection.rightTrackId]
      : []
  ));
  const implicated = tracks.filter(({ id }) => implicatedIds.has(id));
  return Math.max(1, ...implicated.map(kpEquationMotionTrackScale));
}

function routePriority(
  tracks: readonly KpEquationCollisionTrack[]
): number {
  if (tracks.some(({ lifecycle }) =>
    lifecycle === "split" || lifecycle === "merge"
  )) return 0;
  if (tracks.some(({ lifecycle }) => lifecycle === "persist")) return 1;
  return 2;
}

function routeProtectedTransitUnit<
  Track extends KpEquationCollisionTrack
>(input: {
  readonly tracks: readonly Track[];
  readonly unit: KpProtectedTransitRouteUnit;
  readonly variant: "arc-above" | "arc-below";
  readonly liftRatio: number;
  readonly sampling: KpEquationMotionPathSampling;
  readonly collisionScale: number;
  readonly stageOccupancy?: KpEquationMotionStageOccupancy | undefined;
}): readonly Track[] | undefined {
  const routeTracks = input.tracks.filter(
    ({ id }) => input.unit.trackIds.includes(id)
  );
  if (
    routeTracks.length !== input.unit.trackIds.length ||
    routeTracks.some(({ motionPath, motionAxisConstraint }) =>
      motionPath !== undefined || motionAxisConstraint !== undefined
    )
  ) return undefined;
  const lanes = input.stageOccupancy === undefined
    ? []
    : routeTracks.map((track) =>
        resolveCertifiedClearanceLane(track, input.stageOccupancy!)
      );
  if (lanes.some((lane) => lane === undefined)) return undefined;
  const localInkScale = Math.max(
    input.collisionScale,
    ...routeTracks.map(kpEquationMotionTrackScale)
  );
  const groupTravel = Math.max(...routeTracks.map(trackTravel));
  const candidate = Object.freeze(input.tracks.map((track) => {
    if (!input.unit.trackIds.includes(track.id)) return track;
    const motionPath = Object.freeze(planTrackPath(
      track,
      input.variant,
      localInkScale * input.liftRatio,
      input.stageOccupancy
    ));
    if (
      input.stageOccupancy !== undefined &&
      !pathStaysWithinCertifiedOccupancy(
        track,
        motionPath,
        input.stageOccupancy
      )
    ) return undefined;
    return Object.freeze({
      ...track,
      motionPath,
      // The compact curve remains the fast/default candidate. The clearance
      // lane is a second generic option for late crossings that would
      // otherwise re-enter paint during settlement.
      motionPathSampling: input.sampling,
      motionGroupTravel: groupTravel
    }) as Track;
  }));
  return candidate.some((track) => track === undefined)
    ? undefined
    : candidate as readonly Track[];
}

function compareProtectedTransitAudits(
  left: KpProtectedTransitAudit,
  right: KpProtectedTransitAudit
): number {
  return left.intersections.length - right.intersections.length ||
    left.totalIntersectionArea - right.totalIntersectionArea ||
    left.maximumIntersectionArea - right.maximumIntersectionArea;
}

function protectedTransitAuditSummary(audit: KpProtectedTransitAudit): string {
  return `${audit.intersections.length} contacts, ` +
    `${audit.totalIntersectionArea.toFixed(2)} total area, ` +
    `${audit.maximumIntersectionArea.toFixed(2)} max area`;
}

function protectedTransitImplicatedGeometry(
  tracks: readonly KpEquationCollisionTrack[],
  intersections: readonly KpProtectedTransitIntersection[]
): string {
  const ids = new Set(intersections.flatMap(({ leftTrackId, rightTrackId }) =>
    [leftTrackId, rightTrackId]
  ));
  return tracks.filter(({ id }) => ids.has(id)).map((track) => {
    const rect = (value: KpEquationLayoutRect) =>
      `${value.left.toFixed(2)},${value.top.toFixed(2)},` +
      `${value.width.toFixed(2)}x${value.height.toFixed(2)}`;
    const contact = [...tracks]
      .filter((candidate) =>
        candidate.id !== track.id && ids.has(candidate.id)
      )
      .flatMap((candidate) => {
        const bound = protectedTransitEndpointContact(track, candidate);
        return bound === undefined
          ? []
          : [
              `${candidate.id}<=` +
              `${bound.maximumOverlapWidthPx.toFixed(2)}x` +
              `${bound.maximumOverlapHeightPx.toFixed(2)}`
            ];
      });
    return `${track.id}{startPaint=${rect(
      track.startPaintRect ?? track.startRect
    )};endPaint=${rect(track.endPaintRect ?? track.endRect)};` +
      `path=${track.motionPath?.variant ?? "direct"};` +
      `lifecycle=${track.lifecycle};` +
      `opacityStep=${track.opacityStepAt ?? "none"};` +
      `endpointContact=${contact.join("|") || "none"}}`;
  }).join(", ");
}

function rectIntersection(
  left: KpEquationLayoutRect,
  right: KpEquationLayoutRect
): { readonly width: number; readonly height: number } {
  return {
    width: Math.max(0, Math.min(
      left.left + left.width,
      right.left + right.width
    ) - Math.max(left.left, right.left)),
    height: Math.max(0, Math.min(
      left.top + left.height,
      right.top + right.height
    ) - Math.max(left.top, right.top))
  };
}

function assertUniqueCollisionTrackIds(
  tracks: readonly KpEquationCollisionTrack[]
): void {
  const ids = tracks.map(({ id }) => id);
  if (
    ids.some((id) => id.trim() === "") ||
    new Set(ids).size !== ids.length
  ) {
    throw new Error("Protected transit tracks must have unique IDs.");
  }
}

function resolveCertifiedClearanceLane(
  track: KpEquationCollisionTrack,
  occupancy: KpEquationMotionStageOccupancy
): {
  readonly row: KpEquationMotionStageOccupancy["rows"][number];
  readonly variant: "arc-above" | "arc-below";
  readonly clearance: number;
} | undefined {
  const start = rectCenter(track.startPaintRect ?? track.startRect);
  const end = rectCenter(track.endPaintRect ?? track.endRect);
  const sourceRows = occupancy.rows.filter(({ rect }) =>
    containsPoint(rect, start, kpNativeInkContactTolerancePx)
  );
  const targetRows = occupancy.rows.filter(({ rect }) =>
    containsPoint(rect, end, kpNativeInkContactTolerancePx)
  );
  if (
    sourceRows.length !== 1 ||
    targetRows.length !== 1 ||
    sourceRows[0]!.id !== targetRows[0]!.id
  ) {
    return undefined;
  }
  const corridorY = rectCenter(occupancy.protectedCorridor).y;
  const midpointY = (start.y + end.y) / 2;
  return {
    row: sourceRows[0]!,
    variant: corridorY < midpointY ? "arc-above" : "arc-below",
    // The caller may use less lift, but never more than the measured distance
    // to the certified lane; local routing stays the first authority.
    clearance: Math.abs(corridorY - midpointY)
  };
}

export function assertKpEquationMotionStageOccupancy(
  occupancy: KpEquationMotionStageOccupancy
): void {
  if (
    occupancy.geometryAuthority !== "certified-stage-layout" ||
    occupancy.rows.length < 1 ||
    occupancy.rows.length > 2 ||
    occupancy.measurementIdentity.coordinateSpaceId.trim() === "" ||
    !Number.isInteger(occupancy.measurementIdentity.revision) ||
    occupancy.measurementIdentity.revision < 0
  ) {
    throw new Error("Equation motion stage occupancy is not certified.");
  }
  const ids = occupancy.rows.map(({ id }) => id);
  if (
    ids.some((id) => id.trim() === "") ||
    new Set(ids).size !== ids.length
  ) {
    throw new Error("Equation motion stage occupancy rows must be unique.");
  }
  for (const [label, rect] of [
    ...occupancy.rows.map(({ id, rect }) => [`row ${id}`, rect] as const),
    ["protected corridor", occupancy.protectedCorridor] as const
  ]) {
    if (
      ![rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) ||
      rect.width <= 0 ||
      rect.height <= 0
    ) {
      throw new Error(`Equation motion stage ${label} has invalid geometry.`);
    }
  }
  if (occupancy.rows.some(({ rect }) =>
    intersectsRect(
      rect,
      occupancy.protectedCorridor,
      kpNativeInkContactTolerancePx
    )
  )) {
    throw new Error(
      "Equation motion protected corridor intersects certified row occupancy."
    );
  }
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

function containsPoint(
  rect: KpEquationLayoutRect,
  point: KpEquationLayoutPoint,
  tolerance: number
): boolean {
  return point.x >= rect.left - tolerance &&
    point.x <= rect.left + rect.width + tolerance &&
    point.y >= rect.top - tolerance &&
    point.y <= rect.top + rect.height + tolerance;
}

function containsRect(
  outer: KpEquationLayoutRect,
  inner: KpEquationLayoutRect,
  tolerance: number
): boolean {
  return inner.left >= outer.left - tolerance &&
    inner.top >= outer.top - tolerance &&
    inner.left + inner.width <= outer.left + outer.width + tolerance &&
    inner.top + inner.height <= outer.top + outer.height + tolerance;
}

function intersectsRect(
  left: KpEquationLayoutRect,
  right: KpEquationLayoutRect,
  tolerance: number
): boolean {
  return Math.min(left.left + left.width, right.left + right.width) -
      Math.max(left.left, right.left) > tolerance &&
    Math.min(left.top + left.height, right.top + right.height) -
      Math.max(left.top, right.top) > tolerance;
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
