import type { KpLineageConstrainedGlyphMatchResult } from "./lineage-constrained-glyph-matcher.ts";
import type {
  KpNativeNotationMeasurementSnapshot,
  KpNotationRect,
  KpProtectedNotationRegion
} from "./native-notation-measurement.ts";

export interface KpNotationPoint {
  readonly x: number;
  readonly y: number;
}

export interface KpScheduledGlyphMotion {
  readonly matchId: string;
  readonly status: "direct" | "clearance-route" | "settle";
  readonly waypoints: readonly KpNotationPoint[];
  readonly sourceStyleFingerprint: string;
  readonly targetStyleFingerprint: string;
}

export interface KpBoundedClearanceSchedule {
  readonly kind: "bounded-glyph-clearance-schedule";
  readonly motions: readonly KpScheduledGlyphMotion[];
  readonly operationCount: number;
  readonly usedOperationSpecificPolicy: false;
}

export function scheduleKpBoundedGlyphClearance(input: {
  readonly matches: KpLineageConstrainedGlyphMatchResult;
  readonly source: KpNativeNotationMeasurementSnapshot;
  readonly target: KpNativeNotationMeasurementSnapshot;
  readonly clearancePx?: number | undefined;
  readonly maxOperations: number;
}): KpBoundedClearanceSchedule {
  const clearance = input.clearancePx ?? 6;
  if (!Number.isFinite(clearance) || clearance < 0) {
    throw new Error("Glyph clearance must be a non-negative finite number.");
  }
  const sourceGlyphs = new Map(input.source.glyphs.map((glyph) => [glyph.id, glyph]));
  const targetGlyphs = new Map(input.target.glyphs.map((glyph) => [glyph.id, glyph]));
  const viewport = intersectViewport(input.source.viewport, input.target.viewport);
  const obstacles = [...input.source.protectedRegions, ...input.target.protectedRegions];
  let operationCount = 0;
  const motions = input.matches.matches.map((match) => {
    const source = sourceGlyphs.get(match.sourceGlyphId);
    const target = targetGlyphs.get(match.targetGlyphId);
    if (source === undefined || target === undefined) {
      throw new Error(`Missing measured glyph for match ${match.id}.`);
    }
    const relevantObstacles = obstacles.filter(({ ownerEntityId }) =>
      ownerEntityId !== source.entityId && ownerEntityId !== target.entityId
    );
    const start = center(source.bounds);
    const end = center(target.bounds);
    operationCount += relevantObstacles.length + 1;
    const directBlocked = routeBlocked(
      [start, end],
      source.bounds,
      relevantObstacles,
      clearance
    );
    if (!directBlocked) {
      return motion(match.id, "direct", [start, end], source.styleFingerprint, target.styleFingerprint);
    }
    const routes = clearanceRoutes(start, end, source.bounds, relevantObstacles, viewport, clearance);
    operationCount += routes.length * relevantObstacles.length;
    const route = routes
      .filter((candidate) => !routeBlocked(candidate, source.bounds, relevantObstacles, clearance))
      .sort((left, right) => routeLength(left) - routeLength(right))[0];
    return route === undefined
      ? motion(match.id, "settle", [end], source.styleFingerprint, target.styleFingerprint)
      : motion(match.id, "clearance-route", route, source.styleFingerprint, target.styleFingerprint);
  });
  input.matches.multiplicity.forEach((group) => {
    const sources = group.sourceGlyphIds.map((id) => sourceGlyphs.get(id));
    const targets = group.targetGlyphIds.map((id) => targetGlyphs.get(id));
    if (sources.some((glyph) => glyph === undefined) || targets.some((glyph) => glyph === undefined)) {
      throw new Error(`Missing measured glyph for multiplicity ${group.id}.`);
    }
    const pairs = group.kind === "merge"
      ? sources.map((source) => [source!, targets[0]!] as const)
      : targets.map((target) => [sources[0]!, target!] as const);
    pairs.forEach(([source, target], index) => {
      const relevantObstacles = obstacles.filter(({ ownerEntityId }) =>
        ownerEntityId !== source.entityId && ownerEntityId !== target.entityId
      );
      const start = center(source.bounds);
      const end = center(target.bounds);
      operationCount += relevantObstacles.length + 1;
      const directBlocked = routeBlocked([start, end], source.bounds, relevantObstacles, clearance);
      const routes = directBlocked
        ? clearanceRoutes(start, end, source.bounds, relevantObstacles, viewport, clearance)
        : [];
      operationCount += routes.length * relevantObstacles.length;
      const route = directBlocked
        ? routes
            .filter((candidate) => !routeBlocked(candidate, source.bounds, relevantObstacles, clearance))
            .sort((left, right) => routeLength(left) - routeLength(right))[0]
        : [start, end];
      motions.push(motion(
        `${group.id}.${index}`,
        route === undefined ? "settle" : directBlocked ? "clearance-route" : "direct",
        route ?? [end],
        source.styleFingerprint,
        target.styleFingerprint
      ));
    });
  });
  if (operationCount > input.maxOperations) {
    throw new Error(
      `Glyph clearance schedule requires ${operationCount} operations; limit is ${input.maxOperations}.`
    );
  }
  return Object.freeze({
    kind: "bounded-glyph-clearance-schedule",
    motions: Object.freeze(motions),
    operationCount,
    usedOperationSpecificPolicy: false
  });
}

function clearanceRoutes(
  start: KpNotationPoint,
  end: KpNotationPoint,
  glyph: KpNotationRect,
  obstacles: readonly KpProtectedNotationRegion[],
  viewport: KpNotationRect,
  clearance: number
): readonly (readonly KpNotationPoint[])[] {
  const halfHeight = glyph.height / 2;
  const top = Math.max(
    viewport.y + halfHeight,
    Math.min(...obstacles.map(({ bounds }) => bounds.y)) - clearance - halfHeight
  );
  const bottom = Math.min(
    viewport.y + viewport.height - halfHeight,
    Math.max(...obstacles.map(({ bounds }) => bounds.y + bounds.height)) + clearance + halfHeight
  );
  return [
    [start, { x: start.x, y: top }, { x: end.x, y: top }, end],
    [start, { x: start.x, y: bottom }, { x: end.x, y: bottom }, end]
  ];
}

function routeBlocked(
  points: readonly KpNotationPoint[],
  glyph: KpNotationRect,
  obstacles: readonly KpProtectedNotationRegion[],
  clearance: number
): boolean {
  const halfWidth = glyph.width / 2 + clearance;
  const halfHeight = glyph.height / 2 + clearance;
  return points.slice(1).some((point, index) => {
    const previous = points[index]!;
    const sweep = {
      x: Math.min(previous.x, point.x) - halfWidth,
      y: Math.min(previous.y, point.y) - halfHeight,
      width: Math.abs(point.x - previous.x) + halfWidth * 2,
      height: Math.abs(point.y - previous.y) + halfHeight * 2
    };
    return obstacles.some(({ bounds }) => rectanglesOverlap(sweep, bounds));
  });
}

function rectanglesOverlap(left: KpNotationRect, right: KpNotationRect): boolean {
  return left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y;
}

function center(rect: KpNotationRect): KpNotationPoint {
  return Object.freeze({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
}

function routeLength(points: readonly KpNotationPoint[]): number {
  return points.slice(1).reduce((sum, point, index) => {
    const previous = points[index]!;
    return sum + Math.hypot(point.x - previous.x, point.y - previous.y);
  }, 0);
}

function intersectViewport(left: KpNotationRect, right: KpNotationRect): KpNotationRect {
  const x = Math.max(left.x, right.x);
  const y = Math.max(left.y, right.y);
  return {
    x,
    y,
    width: Math.max(0, Math.min(left.x + left.width, right.x + right.width) - x),
    height: Math.max(0, Math.min(left.y + left.height, right.y + right.height) - y)
  };
}

function motion(
  matchId: string,
  status: KpScheduledGlyphMotion["status"],
  waypoints: readonly KpNotationPoint[],
  sourceStyleFingerprint: string,
  targetStyleFingerprint: string
): KpScheduledGlyphMotion {
  return Object.freeze({
    matchId,
    status,
    waypoints: Object.freeze(waypoints.map((point) => Object.freeze({ ...point }))),
    sourceStyleFingerprint,
    targetStyleFingerprint
  });
}
