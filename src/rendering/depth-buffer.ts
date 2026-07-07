import type {
  ProjectedGeometryPoint,
  ProjectedTriangle
} from "./geometry.ts";

export interface DepthBufferInput {
  logicalWidth: number;
  logicalHeight: number;
  scale?: number;
}

export type ProjectedDepthPoint = ProjectedGeometryPoint;
export type ProjectedDepthTriangle = ProjectedTriangle;

export interface ProjectedPoint {
  x: number;
  y: number;
}

const EMPTY_DEPTH = Number.NEGATIVE_INFINITY;
const DEFAULT_DEPTH_EPSILON = 0.015;

export class DepthBuffer {
  readonly width: number;
  readonly height: number;
  readonly scale: number;
  readonly depths: Float32Array;

  constructor(input: DepthBufferInput) {
    this.scale = input.scale ?? 1;
    this.width = Math.max(1, Math.ceil(input.logicalWidth * this.scale));
    this.height = Math.max(1, Math.ceil(input.logicalHeight * this.scale));
    this.depths = new Float32Array(this.width * this.height);
    this.clear();
  }

  clear(): void {
    this.depths.fill(EMPTY_DEPTH);
  }

  depthAtCell(x: number, y: number): number | undefined {
    if (!this.containsCell(x, y)) {
      return undefined;
    }

    const depth = this.depths[this.cellIndex(x, y)];

    return depth === EMPTY_DEPTH ? undefined : depth;
  }

  depthAtPoint(point: ProjectedPoint): number | undefined {
    const cell = this.pointToCell(point);

    if (cell === undefined) {
      return undefined;
    }

    return this.depthAtCell(cell.x, cell.y);
  }

  writeDepthAtCell(x: number, y: number, depth: number): void {
    if (!this.containsCell(x, y)) {
      return;
    }

    const index = this.cellIndex(x, y);
    const currentDepth = this.depths[index];

    if (currentDepth === undefined || depth > currentDepth) {
      this.depths[index] = depth;
    }
  }

  cellCenter(x: number, y: number): ProjectedPoint {
    return {
      x: (x + 0.5) / this.scale,
      y: (y + 0.5) / this.scale
    };
  }

  pointToCell(point: ProjectedPoint): ProjectedPoint | undefined {
    const x = Math.floor(point.x * this.scale);
    const y = Math.floor(point.y * this.scale);

    return this.containsCell(x, y) ? { x, y } : undefined;
  }

  private containsCell(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  private cellIndex(x: number, y: number): number {
    return y * this.width + x;
  }
}

export function rasterizeDepthTriangle(
  buffer: DepthBuffer,
  triangle: ProjectedDepthTriangle
): void {
  const bounds = triangleCellBounds(buffer, triangle);

  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      const depth = interpolateTriangleDepthAtPoint(
        buffer.cellCenter(x, y),
        triangle
      );

      if (depth !== undefined) {
        buffer.writeDepthAtCell(x, y, depth);
      }
    }
  }
}

export function isPointVisibleAgainstDepth(
  buffer: DepthBuffer,
  point: ProjectedDepthPoint,
  epsilon = DEFAULT_DEPTH_EPSILON
): boolean {
  const surfaceDepth = buffer.depthAtPoint(point);

  return surfaceDepth === undefined ? true : point.depth >= surfaceDepth - epsilon;
}

export function interpolateTriangleDepthAtPoint(
  point: ProjectedPoint,
  triangle: ProjectedDepthTriangle
): number | undefined {
  const [a, b, c] = triangle.points;
  const denominator =
    (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);

  if (Math.abs(denominator) < 0.000_001) {
    return undefined;
  }

  const alpha =
    ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) /
    denominator;
  const beta =
    ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) /
    denominator;
  const gamma = 1 - alpha - beta;
  const tolerance = 0.000_001;

  if (alpha < -tolerance || beta < -tolerance || gamma < -tolerance) {
    return undefined;
  }

  return alpha * a.depth + beta * b.depth + gamma * c.depth;
}

function triangleCellBounds(
  buffer: DepthBuffer,
  triangle: ProjectedDepthTriangle
): { minX: number; maxX: number; minY: number; maxY: number } {
  const xs = triangle.points.map((point) => point.x * buffer.scale);
  const ys = triangle.points.map((point) => point.y * buffer.scale);
  const minX = clamp(Math.floor(Math.min(...xs)), 0, buffer.width - 1);
  const maxX = clamp(Math.ceil(Math.max(...xs)), 0, buffer.width - 1);
  const minY = clamp(Math.floor(Math.min(...ys)), 0, buffer.height - 1);
  const maxY = clamp(Math.ceil(Math.max(...ys)), 0, buffer.height - 1);

  return { minX, maxX, minY, maxY };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
