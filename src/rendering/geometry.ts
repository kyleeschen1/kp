export interface ProjectedGeometryPoint {
  x: number;
  y: number;
  depth: number;
}

export interface ProjectedLineSegment {
  from: ProjectedGeometryPoint;
  to: ProjectedGeometryPoint;
}

export interface ProjectedTriangle {
  points: readonly [
    ProjectedGeometryPoint,
    ProjectedGeometryPoint,
    ProjectedGeometryPoint
  ];
}

export interface ProjectedQuad {
  points: readonly [
    ProjectedGeometryPoint,
    ProjectedGeometryPoint,
    ProjectedGeometryPoint,
    ProjectedGeometryPoint
  ];
}

export function projectedLineAverageDepth(line: ProjectedLineSegment): number {
  return (line.from.depth + line.to.depth) / 2;
}

export function projectedLineMidpoint(
  line: ProjectedLineSegment
): ProjectedGeometryPoint {
  return interpolateProjectedPoint(line.from, line.to, 0.5);
}

export function interpolateProjectedPoint(
  from: ProjectedGeometryPoint,
  to: ProjectedGeometryPoint,
  t: number
): ProjectedGeometryPoint {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    depth: from.depth + (to.depth - from.depth) * t
  };
}

export function splitProjectedLineAt(
  line: ProjectedLineSegment,
  t: number
): readonly [ProjectedLineSegment, ProjectedLineSegment] {
  const splitPoint = interpolateProjectedPoint(line.from, line.to, t);

  return [
    {
      from: line.from,
      to: splitPoint
    },
    {
      from: splitPoint,
      to: line.to
    }
  ];
}

export function splitProjectedQuadToTriangles(
  quad: ProjectedQuad
): readonly [ProjectedTriangle, ProjectedTriangle] {
  return [
    {
      points: [quad.points[0], quad.points[1], quad.points[2]]
    },
    {
      points: [quad.points[0], quad.points[2], quad.points[3]]
    }
  ];
}

export function projectedTrianglesOverlap(
  left: ProjectedTriangle,
  right: ProjectedTriangle
): boolean {
  if (!boundingBoxesOverlap(triangleBounds(left), triangleBounds(right))) {
    return false;
  }

  return (
    left.points.some((point) => pointInProjectedTriangle(point, right)) ||
    right.points.some((point) => pointInProjectedTriangle(point, left)) ||
    triangleEdges(left).some((leftEdge) =>
      triangleEdges(right).some((rightEdge) =>
        lineSegmentsIntersect(leftEdge, rightEdge)
      )
    )
  );
}

function triangleBounds(triangle: ProjectedTriangle): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const xs = triangle.points.map((point) => point.x);
  const ys = triangle.points.map((point) => point.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
}

function boundingBoxesOverlap(
  left: ReturnType<typeof triangleBounds>,
  right: ReturnType<typeof triangleBounds>
): boolean {
  return (
    left.minX <= right.maxX &&
    left.maxX >= right.minX &&
    left.minY <= right.maxY &&
    left.maxY >= right.minY
  );
}

function pointInProjectedTriangle(
  point: ProjectedGeometryPoint,
  triangle: ProjectedTriangle
): boolean {
  const [a, b, c] = triangle.points;
  const denominator =
    (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);

  if (Math.abs(denominator) < 0.000_001) {
    return false;
  }

  const alpha =
    ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) /
    denominator;
  const beta =
    ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) /
    denominator;
  const gamma = 1 - alpha - beta;
  const tolerance = 0.000_001;

  return alpha >= -tolerance && beta >= -tolerance && gamma >= -tolerance;
}

function triangleEdges(
  triangle: ProjectedTriangle
): readonly ProjectedLineSegment[] {
  return [
    { from: triangle.points[0], to: triangle.points[1] },
    { from: triangle.points[1], to: triangle.points[2] },
    { from: triangle.points[2], to: triangle.points[0] }
  ];
}

function lineSegmentsIntersect(
  left: ProjectedLineSegment,
  right: ProjectedLineSegment
): boolean {
  const leftA = orientation(left.from, left.to, right.from);
  const leftB = orientation(left.from, left.to, right.to);
  const rightA = orientation(right.from, right.to, left.from);
  const rightB = orientation(right.from, right.to, left.to);

  return leftA * leftB <= 0 && rightA * rightB <= 0;
}

function orientation(
  a: ProjectedGeometryPoint,
  b: ProjectedGeometryPoint,
  c: ProjectedGeometryPoint
): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}
