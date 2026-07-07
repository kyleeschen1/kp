import {
  DepthBuffer,
  isPointVisibleAgainstDepth,
  rasterizeDepthTriangle
} from "./depth-buffer.ts";
import {
  interpolateProjectedPoint,
  projectedLineAverageDepth,
  projectedLineMidpoint,
  projectedTrianglesOverlap,
  splitProjectedLineAt,
  splitProjectedQuadToTriangles,
  type ProjectedGeometryPoint,
  type ProjectedLineSegment,
  type ProjectedQuad,
  type ProjectedTriangle
} from "./geometry.ts";

export type ProjectedVisibility = "hidden" | "visible";

export interface DepthSceneInput {
  logicalWidth: number;
  logicalHeight: number;
  overlapCount?: number;
  scale?: number;
  surfaceCount?: number;
  triangles: readonly ProjectedTriangle[];
}

export interface DepthScene {
  buffer: DepthBuffer;
  overlapCount: number;
  surfaceCount: number;
  triangleCount: number;
}

export interface DepthSceneDiagnostics {
  bufferHeight: number;
  bufferScale: number;
  bufferWidth: number;
  depthCellCount: number;
  overlapCount: number;
  surfaceCount: number;
  triangleCount: number;
}

export interface ProjectedDepthSurface {
  surfaceId: string;
  triangles: readonly ProjectedTriangle[];
}

export interface DepthSurfaceOverlap {
  depthOrder: DepthSurfaceOverlapDepthOrder;
  frontSurfaceId?: string;
  surfaceIds: readonly [string, string];
  triangleIndices: readonly [number, number];
}

export type DepthSurfaceOverlapDepthOrder =
  | "ambiguous"
  | "left-front"
  | "right-front";

export interface SegmentProjectedLineOptions {
  maxDepth?: number;
  maxSegments?: number;
}

export interface VisibilityBoundaryOptions {
  iterations?: number;
}

export interface ProjectedPointDepthClassification {
  surfaceDepth: number | undefined;
  delta: number | undefined;
  visibility: ProjectedVisibility;
}

export interface VisibilityBoundary {
  point: ProjectedGeometryPoint;
  fromVisibility: ProjectedVisibility;
  toVisibility: ProjectedVisibility;
}

export interface VisibilitySegment extends ProjectedLineSegment {
  averageDepth: number;
  visibility: ProjectedVisibility;
}

const DEFAULT_VISIBILITY_SUBDIVISION_DEPTH = 6;
const DEFAULT_BOUNDARY_ITERATIONS = 12;

export function buildDepthScene(input: DepthSceneInput): DepthScene {
  const buffer = new DepthBuffer({
    logicalWidth: input.logicalWidth,
    logicalHeight: input.logicalHeight,
    ...(input.scale === undefined ? {} : { scale: input.scale })
  });

  for (const triangle of input.triangles) {
    rasterizeDepthTriangle(buffer, triangle);
  }

  return {
    buffer,
    overlapCount: input.overlapCount ?? 0,
    surfaceCount: input.surfaceCount ?? 0,
    triangleCount: input.triangles.length
  };
}

export function projectedQuadsToDepthTriangles(
  quads: readonly ProjectedQuad[]
): readonly ProjectedTriangle[] {
  return quads.flatMap((quad) => splitProjectedQuadToTriangles(quad));
}

export function depthSceneDiagnostics(scene: DepthScene): DepthSceneDiagnostics {
  return {
    bufferHeight: scene.buffer.height,
    bufferScale: scene.buffer.scale,
    bufferWidth: scene.buffer.width,
    depthCellCount: scene.buffer.width * scene.buffer.height,
    overlapCount: scene.overlapCount,
    surfaceCount: scene.surfaceCount,
    triangleCount: scene.triangleCount
  };
}

export function detectDepthSurfaceOverlaps(
  surfaces: readonly ProjectedDepthSurface[]
): readonly DepthSurfaceOverlap[] {
  const overlaps: DepthSurfaceOverlap[] = [];

  for (let leftIndex = 0; leftIndex < surfaces.length; leftIndex += 1) {
    const leftSurface = surfaces[leftIndex];

    if (leftSurface === undefined) {
      continue;
    }

    for (
      let rightIndex = leftIndex + 1;
      rightIndex < surfaces.length;
      rightIndex += 1
    ) {
      const rightSurface = surfaces[rightIndex];

      if (rightSurface === undefined) {
        continue;
      }

      overlaps.push(
        ...detectSurfacePairOverlaps(leftSurface, rightSurface)
      );
    }
  }

  return overlaps;
}

export function classifyProjectedLineVisibility(
  scene: DepthScene,
  line: ProjectedLineSegment
): ProjectedVisibility {
  return classifyProjectedPointDepth(scene, projectedLineMidpoint(line)).visibility;
}

export function classifyProjectedPointDepth(
  scene: DepthScene,
  point: ProjectedGeometryPoint
): ProjectedPointDepthClassification {
  const surfaceDepth = scene.buffer.depthAtPoint(point);

  if (surfaceDepth === undefined) {
    return {
      surfaceDepth,
      delta: undefined,
      visibility: "visible"
    };
  }

  const delta = point.depth - surfaceDepth;

  return {
    surfaceDepth,
    delta,
    visibility: isPointVisibleAgainstDepth(scene.buffer, point)
      ? "visible"
      : "hidden"
  };
}

export function findVisibilityBoundary(
  scene: DepthScene,
  line: ProjectedLineSegment,
  options: VisibilityBoundaryOptions = {}
): VisibilityBoundary {
  const fromVisibility = classifyProjectedPointVisibility(scene, line.from);
  const toVisibility = classifyProjectedPointVisibility(scene, line.to);
  const fromDepth = classifyProjectedPointDepth(scene, line.from);
  const toDepth = classifyProjectedPointDepth(scene, line.to);
  const iterations = options.iterations ?? DEFAULT_BOUNDARY_ITERATIONS;
  let low = 0;
  let high = 1;

  if (
    fromDepth.delta !== undefined &&
    toDepth.delta !== undefined &&
    Math.sign(fromDepth.delta) !== Math.sign(toDepth.delta)
  ) {
    return {
      point: findDepthDeltaBoundaryPoint(scene, line, iterations),
      fromVisibility,
      toVisibility
    };
  }

  for (let index = 0; index < iterations; index += 1) {
    const midpointT = (low + high) / 2;
    const midpoint = interpolateProjectedPoint(line.from, line.to, midpointT);
    const midpointVisibility = classifyProjectedPointVisibility(scene, midpoint);

    if (midpointVisibility === fromVisibility) {
      low = midpointT;
    } else {
      high = midpointT;
    }
  }

  return {
    point: interpolateProjectedPoint(line.from, line.to, (low + high) / 2),
    fromVisibility,
    toVisibility
  };
}

function detectSurfacePairOverlaps(
  leftSurface: ProjectedDepthSurface,
  rightSurface: ProjectedDepthSurface
): readonly DepthSurfaceOverlap[] {
  return leftSurface.triangles.flatMap((leftTriangle, leftTriangleIndex) =>
    rightSurface.triangles.flatMap((rightTriangle, rightTriangleIndex) =>
      projectedTrianglesOverlap(leftTriangle, rightTriangle)
        ? [
            {
              ...classifyDepthSurfaceOverlap(
                leftSurface,
                leftTriangle,
                rightSurface,
                rightTriangle
              ),
              surfaceIds: [
                leftSurface.surfaceId,
                rightSurface.surfaceId
              ] as const,
              triangleIndices: [
                leftTriangleIndex,
                rightTriangleIndex
              ] as const
            }
          ]
        : []
    )
  );
}

function classifyDepthSurfaceOverlap(
  leftSurface: ProjectedDepthSurface,
  leftTriangle: ProjectedTriangle,
  rightSurface: ProjectedDepthSurface,
  rightTriangle: ProjectedTriangle
): Pick<DepthSurfaceOverlap, "depthOrder" | "frontSurfaceId"> {
  const leftRange = triangleDepthRange(leftTriangle);
  const rightRange = triangleDepthRange(rightTriangle);

  if (leftRange.min > rightRange.max) {
    return {
      depthOrder: "left-front",
      frontSurfaceId: leftSurface.surfaceId
    };
  }

  if (rightRange.min > leftRange.max) {
    return {
      depthOrder: "right-front",
      frontSurfaceId: rightSurface.surfaceId
    };
  }

  return {
    depthOrder: "ambiguous"
  };
}

function triangleDepthRange(
  triangle: ProjectedTriangle
): { max: number; min: number } {
  const depths = triangle.points.map((point) => point.depth);

  return {
    max: Math.max(...depths),
    min: Math.min(...depths)
  };
}

function findDepthDeltaBoundaryPoint(
  scene: DepthScene,
  line: ProjectedLineSegment,
  iterations: number
): ProjectedGeometryPoint {
  const fromDelta = classifyProjectedPointDepth(scene, line.from).delta;
  let low = 0;
  let high = 1;

  if (fromDelta === undefined) {
    return projectedLineMidpoint(line);
  }

  for (let index = 0; index < iterations; index += 1) {
    const midpointT = (low + high) / 2;
    const midpoint = interpolateProjectedPoint(line.from, line.to, midpointT);
    const midpointDelta = classifyProjectedPointDepth(scene, midpoint).delta;

    if (midpointDelta === undefined) {
      break;
    }

    if (
      midpointDelta === 0 ||
      Math.sign(midpointDelta) !== Math.sign(fromDelta)
    ) {
      high = midpointT;
    } else {
      low = midpointT;
    }
  }

  return interpolateProjectedPoint(line.from, line.to, (low + high) / 2);
}

export function segmentProjectedLineByVisibility(
  scene: DepthScene,
  line: ProjectedLineSegment,
  options: SegmentProjectedLineOptions = {}
): readonly VisibilitySegment[] {
  const maxDepth = options.maxDepth ?? DEFAULT_VISIBILITY_SUBDIVISION_DEPTH;
  const segments = coalesceVisibilitySegments(
    splitLineByVisibility(scene, line, 0, maxDepth)
  );

  return options.maxSegments === undefined ||
    segments.length <= options.maxSegments
    ? segments
    : budgetVisibilitySegments(scene, line, options.maxSegments);
}

function splitLineByVisibility(
  scene: DepthScene,
  line: ProjectedLineSegment,
  depth: number,
  maxDepth: number
): readonly VisibilitySegment[] {
  const fromVisibility = classifyProjectedPointVisibility(scene, line.from);
  const toVisibility = classifyProjectedPointVisibility(scene, line.to);
  const midpoint = projectedLineMidpoint(line);
  const midpointVisibility = classifyProjectedPointVisibility(scene, midpoint);

  if (
    depth >= maxDepth ||
    (fromVisibility === toVisibility && toVisibility === midpointVisibility)
  ) {
    return [visibilitySegment(line, midpointVisibility)];
  }

  if (fromVisibility !== toVisibility) {
    const boundary = findVisibilityBoundary(scene, line);

    return coalesceVisibilitySegments([
      visibilitySegment(
        {
          from: line.from,
          to: boundary.point
        },
        fromVisibility
      ),
      visibilitySegment(
        {
          from: boundary.point,
          to: line.to
        },
        toVisibility
      )
    ]);
  }

  const [firstLine, secondLine] = splitProjectedLineAt(line, 0.5);

  return coalesceVisibilitySegments([
    ...splitLineByVisibility(scene, firstLine, depth + 1, maxDepth),
    ...splitLineByVisibility(scene, secondLine, depth + 1, maxDepth)
  ]);
}

function visibilitySegment(
  line: ProjectedLineSegment,
  visibility: ProjectedVisibility
): VisibilitySegment {
  return {
    ...line,
    averageDepth: projectedLineAverageDepth(line),
    visibility
  };
}

function classifyProjectedPointVisibility(
  scene: DepthScene,
  point: ProjectedGeometryPoint
): ProjectedVisibility {
  return classifyProjectedPointDepth(scene, point).visibility;
}

function coalesceVisibilitySegments(
  segments: readonly VisibilitySegment[]
): readonly VisibilitySegment[] {
  return segments.reduce<VisibilitySegment[]>((coalesced, segment) => {
    const previous = coalesced[coalesced.length - 1];

    if (
      previous !== undefined &&
      previous.visibility === segment.visibility &&
      pointsAreEqual(previous.to, segment.from)
    ) {
      coalesced[coalesced.length - 1] = visibilitySegment(
        {
          from: previous.from,
          to: segment.to
        },
        previous.visibility
      );

      return coalesced;
    }

    coalesced.push(segment);

    return coalesced;
  }, []);
}

function budgetVisibilitySegments(
  scene: DepthScene,
  line: ProjectedLineSegment,
  maxSegments: number
): readonly VisibilitySegment[] {
  const segmentCount = Math.max(1, Math.floor(maxSegments));
  const segments = Array.from({ length: segmentCount }, (_, index) => {
    const fromT = index / segmentCount;
    const toT = (index + 1) / segmentCount;
    const budgetedLine = {
      from: interpolateProjectedPoint(line.from, line.to, fromT),
      to: interpolateProjectedPoint(line.from, line.to, toT)
    };

    return visibilitySegment(
      budgetedLine,
      classifyProjectedLineVisibility(scene, budgetedLine)
    );
  });

  return coalesceVisibilitySegments(segments);
}

function pointsAreEqual(
  left: ProjectedGeometryPoint,
  right: ProjectedGeometryPoint
): boolean {
  return left.x === right.x && left.y === right.y && left.depth === right.depth;
}
