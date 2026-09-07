import type {
  AnnotatedMotionToken,
  KpMeasuredEquationTransitionGeometry,
  KpMeasuredEquationTransitionRelationGeometry
} from "./equation-motion-dom.ts";

import type {
  KpEquationLayoutRect,
  KpEquationLayoutPoint,
  KpEquationLayoutSnapshot,
  KpEquationLayoutReservation,
  KpEquationSemanticWaypoint,
  KpEquationLayoutPlan
} from "./equation-layout-types.ts";

export type {
  KpEquationLayoutRect,
  KpEquationLayoutPoint,
  KpEquationLayoutTokenSnapshot,
  KpEquationLayoutSnapshot,
  KpEquationLayoutReservation,
  KpEquationSemanticWaypoint,
  KpEquationLayoutPlan
} from "./equation-layout-types.ts";

export function createKpEquationLayoutPlan(input: {
  readonly id: string;
  readonly geometry: KpMeasuredEquationTransitionGeometry;
  readonly revision?: number | undefined;
  readonly destinationPadding?: number | undefined;
  readonly transitPadding?: number | undefined;
}): KpEquationLayoutPlan {
  const revision = input.revision ?? 0;
  if (!Number.isInteger(revision) || revision < 0) {
    throw new Error("Equation layout plan revision must be a non-negative integer.");
  }
  const destinationPadding = nonNegative(input.destinationPadding ?? 2, "destination padding");
  const transitPadding = nonNegative(input.transitPadding ?? 6, "transit padding");
  const source = snapshot("source", input.geometry.sourceTokens);
  const target = snapshot("target", input.geometry.targetTokens);

  return {
    kind: "equation-layout-plan",
    id: input.id,
    transitionId: input.geometry.transitionId,
    revision,
    source,
    target,
    reservations: [
      ...destinationReservations(input.geometry, destinationPadding),
      ...transitReservations(input.geometry.relations, transitPadding)
    ],
    waypoints: input.geometry.relations.flatMap(relationWaypoints),
    geometryPolicy: "measure-once-per-step"
  };
}

export function replanKpEquationLayoutBetweenSteps(input: {
  readonly previous: KpEquationLayoutPlan;
  readonly geometry: KpMeasuredEquationTransitionGeometry;
}): KpEquationLayoutPlan {
  if (input.previous.transitionId !== input.geometry.transitionId) {
    throw new Error(
      `Cannot replan ${input.geometry.transitionId} from ${input.previous.transitionId}.`
    );
  }
  return createKpEquationLayoutPlan({
    id: input.previous.id,
    geometry: input.geometry,
    revision: input.previous.revision + 1
  });
}

export function waypointsForKpEquationLayoutRelation(
  plan: KpEquationLayoutPlan,
  relationRecordId: string
): readonly KpEquationSemanticWaypoint[] {
  return plan.waypoints
    .filter((waypoint) => waypoint.relationRecordId === relationRecordId)
    .sort((left, right) => left.ordinal - right.ordinal)
    .map((waypoint) => ({ ...waypoint, point: { ...waypoint.point } }));
}

function snapshot(
  side: KpEquationLayoutSnapshot["side"],
  tokens: readonly AnnotatedMotionToken[]
): KpEquationLayoutSnapshot {
  return {
    side,
    tokens: tokens.map((token) => ({
      motionId: token.motionId,
      text: token.text,
      bounds: { ...token.localRect }
    }))
  };
}

function destinationReservations(
  geometry: KpMeasuredEquationTransitionGeometry,
  padding: number
): readonly KpEquationLayoutReservation[] {
  const relationByMotionId = new Map(
    geometry.relations.flatMap((relation) =>
      (relation.target?.motionIds ?? []).map((motionId) => [motionId, relation.recordId] as const)
    )
  );
  return geometry.targetTokens.map((token) => ({
    id: `${geometry.transitionId}.destination.${token.motionId}`,
    kind: "destination",
    relationRecordId: relationByMotionId.get(token.motionId) ?? "unbound-target",
    motionId: token.motionId,
    bounds: inflateRect(token.localRect, padding)
  }));
}

function transitReservations(
  relations: readonly KpMeasuredEquationTransitionRelationGeometry[],
  padding: number
): readonly KpEquationLayoutReservation[] {
  return relations.flatMap((relation) => {
    if (relation.source === undefined || relation.target === undefined) return [];
    const start = center(relation.source.bounds);
    const end = center(relation.target.bounds);
    const clearance = clearancePoint(start, end);
    return [{
      id: `${relation.recordId}.transit`,
      kind: "transit" as const,
      relationRecordId: relation.recordId,
      bounds: inflateRect(boundsForPoints([start, clearance, end]), padding)
    }];
  });
}

function relationWaypoints(
  relation: KpMeasuredEquationTransitionRelationGeometry
): readonly KpEquationSemanticWaypoint[] {
  const source = relation.source === undefined ? undefined : center(relation.source.bounds);
  const target = relation.target === undefined ? undefined : center(relation.target.bounds);
  if (source !== undefined && target !== undefined) {
    return [
      waypoint(relation.recordId, "source", 0, source),
      waypoint(relation.recordId, "clearance", 1, clearancePoint(source, target)),
      waypoint(relation.recordId, "target", 2, target)
    ];
  }
  if (source !== undefined) {
    return [
      waypoint(relation.recordId, "source", 0, source),
      waypoint(relation.recordId, "clearance", 1, { x: source.x, y: source.y - 12 })
    ];
  }
  if (target !== undefined) {
    return [
      waypoint(relation.recordId, "clearance", 0, { x: target.x, y: target.y + 12 }),
      waypoint(relation.recordId, "target", 1, target)
    ];
  }
  return [];
}

function waypoint(
  relationRecordId: string,
  role: KpEquationSemanticWaypoint["role"],
  ordinal: number,
  point: KpEquationLayoutPoint
): KpEquationSemanticWaypoint {
  return {
    id: `${relationRecordId}.waypoint.${ordinal}.${role}`,
    relationRecordId,
    role,
    ordinal,
    point
  };
}

function clearancePoint(
  start: KpEquationLayoutPoint,
  end: KpEquationLayoutPoint
): KpEquationLayoutPoint {
  const horizontalTravel = Math.abs(end.x - start.x);
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2 - Math.max(12, horizontalTravel * 0.15)
  };
}

function center(rect: KpEquationLayoutRect): KpEquationLayoutPoint {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function boundsForPoints(points: readonly KpEquationLayoutPoint[]): KpEquationLayoutRect {
  const left = Math.min(...points.map((point) => point.x));
  const top = Math.min(...points.map((point) => point.y));
  const right = Math.max(...points.map((point) => point.x));
  const bottom = Math.max(...points.map((point) => point.y));
  return { left, top, width: right - left, height: bottom - top };
}

function inflateRect(rect: KpEquationLayoutRect, padding: number): KpEquationLayoutRect {
  return {
    left: rect.left - padding,
    top: rect.top - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2
  };
}

function nonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be non-negative.`);
  return value;
}
