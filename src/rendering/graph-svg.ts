import type { KpSemanticObject } from "../semantic/document.ts";
import type {
  Axis2DObject,
  Axis3DObject,
  Curve2DObject,
  Curve3DObject,
  Graph2DObject,
  Graph3DObject,
  GraphPoint3D,
  NumericDomain,
  Surface3DObject
} from "../semantic/graph.ts";

export interface GraphPoint {
  x: number;
  y: number;
}

export interface ProjectedGraphPoint3D extends GraphPoint {
  depth: number;
}

interface SurfaceQuad3D {
  rowIndex: number;
  columnIndex: number;
  corners: readonly [
    GraphPoint3D,
    GraphPoint3D,
    GraphPoint3D,
    GraphPoint3D
  ];
  projectedCorners: readonly [
    ProjectedGraphPoint3D,
    ProjectedGraphPoint3D,
    ProjectedGraphPoint3D,
    ProjectedGraphPoint3D
  ];
  averageDepth: number;
  facing: "back" | "front";
  fill: string;
}

interface ProjectedLine3D {
  from: ProjectedGraphPoint3D;
  to: ProjectedGraphPoint3D;
  averageDepth: number;
}

interface GraphLine3D {
  from: GraphPoint3D;
  to: GraphPoint3D;
}

export function projectGraphPoint(
  graph: Graph2DObject,
  point: GraphPoint
): GraphPoint {
  const [minX, maxX] = graph.xDomain;
  const [minY, maxY] = graph.yDomain;

  return {
    x: ((point.x - minX) / (maxX - minX)) * graph.width,
    y: graph.height - ((point.y - minY) / (maxY - minY)) * graph.height
  };
}

export function projectGraphPoint3D(
  graph: Graph3DObject,
  point: GraphPoint3D
): ProjectedGraphPoint3D {
  const azimuth = degreesToRadians(graph.camera.azimuthDegrees);
  const elevation = degreesToRadians(graph.camera.elevationDegrees);
  const rotatedX = point.x * Math.cos(azimuth) - point.y * Math.sin(azimuth);
  const rotatedY = point.x * Math.sin(azimuth) + point.y * Math.cos(azimuth);
  const [originX, originY] = graph.camera.origin;

  return {
    x: originX + rotatedX * graph.camera.scale,
    y:
      originY +
      (rotatedY * Math.sin(elevation) - point.z * Math.cos(elevation)) *
        graph.camera.scale,
    depth: rotatedY * Math.cos(elevation) + point.z * Math.sin(elevation)
  };
}

export function sampleParabolaCurve(curve: Curve2DObject): readonly GraphPoint[] {
  const [minX, maxX] = curve.xDomain;
  const step = (maxX - minX) / (curve.sampleCount - 1);

  return Array.from({ length: curve.sampleCount }, (_, index) => {
    const x = minX + step * index;

    return {
      x,
      y: x * x
    };
  });
}

export function sampleTimeSpiralCurve(
  curve: Curve3DObject
): readonly GraphPoint3D[] {
  return sampleDomain(curve.tDomain, curve.sampleCount).map((t) => ({
    x: roundCoordinate(2.2 * Math.cos(t)),
    y: roundCoordinate(1.3 * Math.sin(t)),
    z: roundCoordinate(0.18 * (t - Math.PI * 2))
  }));
}

export function sampleSaddleSurface(
  surface: Surface3DObject
): readonly (readonly GraphPoint3D[])[] {
  return sampleDomain(surface.yDomain, surface.ySampleCount).map((y) =>
    sampleDomain(surface.xDomain, surface.xSampleCount).map((x) => ({
      x: roundCoordinate(x),
      y: roundCoordinate(y),
      z: roundCoordinate((x * x - y * y) / 4)
    }))
  );
}

export function renderGraphToSvg(
  objects: readonly KpSemanticObject[],
  graph: Graph2DObject
): string {
  const axes = objects.filter(
    (object): object is Axis2DObject =>
      object.type === "axis-2d" && object.graphId === graph.id
  );
  const curves = objects.filter(
    (object): object is Curve2DObject =>
      object.type === "curve-2d" && object.graphId === graph.id
  );

  return `
    <svg class="graph-svg" data-kp-object="${escapeHtml(graph.id)}" data-kp-render-node="rn-${escapeHtml(graph.id)}-svg" data-kp-type="graph-2d" viewBox="0 0 ${graph.width} ${graph.height}" role="img" aria-label="${escapeHtml(graph.label)}">
      <rect class="graph-svg__background" x="0" y="0" width="${graph.width}" height="${graph.height}" rx="8" />
      ${axes.map((axis) => renderAxis(axis, graph)).join("")}
      ${curves.map((curve) => renderCurve(curve, graph)).join("")}
    </svg>
  `;
}

export function renderGraph3DToSvg(
  objects: readonly KpSemanticObject[],
  graph: Graph3DObject
): string {
  const axes = objects.filter(
    (object): object is Axis3DObject =>
      object.type === "axis-3d" && object.graphId === graph.id
  );
  const curves = objects.filter(
    (object): object is Curve3DObject =>
      object.type === "curve-3d" && object.graphId === graph.id
  );
  const surfaces = objects.filter(
    (object): object is Surface3DObject =>
      object.type === "surface-3d" && object.graphId === graph.id
  );
  const basePlaneAxes = axes.filter((axis) => axis.orientation !== "z");
  const verticalAxes = axes.filter((axis) => axis.orientation === "z");

  // Surface quads sit between the base plane and z-axis so SVG export gets
  // useful occlusion cues without needing a WebGL depth buffer.
  return `
    <svg class="graph-svg graph-svg--3d" data-kp-object="${escapeHtml(graph.id)}" data-kp-render-node="rn-${escapeHtml(graph.id)}-svg" data-kp-type="graph-3d" viewBox="0 0 ${graph.width} ${graph.height}" role="img" aria-label="${escapeHtml(graph.label)}">
      <rect class="graph-svg__background" x="0" y="0" width="${graph.width}" height="${graph.height}" rx="8" />
      ${renderBaseGrid3D(graph)}
      ${basePlaneAxes.map((axis) => renderAxis3D(axis, graph)).join("")}
      ${surfaces.map((surface) => renderSurface3D(surface, graph)).join("")}
      ${verticalAxes.map((axis) => renderAxis3D(axis, graph)).join("")}
      ${curves.map((curve) => renderCurve3D(curve, graph)).join("")}
    </svg>
  `;
}

function renderAxis(axis: Axis2DObject, graph: Graph2DObject): string {
  const line =
    axis.orientation === "x"
      ? {
          from: projectGraphPoint(graph, { x: graph.xDomain[0], y: 0 }),
          to: projectGraphPoint(graph, { x: graph.xDomain[1], y: 0 })
        }
      : {
          from: projectGraphPoint(graph, { x: 0, y: graph.yDomain[0] }),
          to: projectGraphPoint(graph, { x: 0, y: graph.yDomain[1] })
        };
  const labelPoint =
    axis.orientation === "x"
      ? projectGraphPoint(graph, { x: graph.xDomain[1], y: 0 })
      : projectGraphPoint(graph, { x: 0, y: graph.yDomain[1] });

  return `
    <g class="graph-axis graph-axis--${axis.orientation}" data-kp-object="${escapeHtml(axis.id)}" data-kp-render-node="rn-${escapeHtml(axis.id)}-svg-line" data-kp-type="axis-2d">
      <line x1="${formatNumber(line.from.x)}" y1="${formatNumber(line.from.y)}" x2="${formatNumber(line.to.x)}" y2="${formatNumber(line.to.y)}" />
      <text x="${formatNumber(labelPoint.x)}" y="${formatNumber(labelPoint.y)}">${escapeHtml(axis.label)}</text>
    </g>
  `;
}

function renderAxis3D(axis: Axis3DObject, graph: Graph3DObject): string {
  const line = projectLine3D(graph, axisLine3D(axis, graph));
  const segments = axisSegments3D(axis).map((segment) =>
    projectLine3D(graph, segment)
  );
  const axisRole =
    axis.orientation === "z" ? "graph-axis--subtle" : "graph-axis--base-plane";

  return `
    <g class="graph-axis graph-axis--3d graph-axis--${axis.orientation} ${axisRole}" data-kp-object="${escapeHtml(axis.id)}" data-kp-render-node="rn-${escapeHtml(axis.id)}-svg-line" data-kp-type="axis-3d">
      ${segments.map((segment) => renderLine3D(segment, graph, "graph-axis__segment")).join("")}
      <text x="${formatNumber(line.to.x)}" y="${formatNumber(line.to.y)}">${escapeHtml(axis.label)}</text>
    </g>
  `;
}

function renderBaseGrid3D(graph: Graph3DObject): string {
  const gridLines = [
    ...axisBreakpoints(graph.yDomain, 1).map((y) =>
      projectLine3D(graph, {
        from: { x: graph.xDomain[0], y, z: 0 },
        to: { x: graph.xDomain[1], y, z: 0 }
      })
    ),
    ...axisBreakpoints(graph.xDomain, 1).map((x) =>
      projectLine3D(graph, {
        from: { x, y: graph.yDomain[0], z: 0 },
        to: { x, y: graph.yDomain[1], z: 0 }
      })
    )
  ];

  return `
    <g class="graph-base-grid" data-kp-object="${escapeHtml(graph.id)}" data-kp-render-node="rn-${escapeHtml(graph.id)}-svg-base-grid" data-kp-type="graph-3d">
      ${gridLines.map((line) => renderLine3D(line, graph, "graph-base-grid__line")).join("")}
    </g>
  `;
}

function renderLine3D(
  line: ProjectedLine3D,
  graph: Graph3DObject,
  className: string
): string {
  const depthWeight = lineDepthWeight(graph, line.averageDepth);
  const strokeWidth = 0.55 + depthWeight * 1.35;
  const opacity = 0.2 + depthWeight * 0.5;

  return `<line class="${escapeHtml(className)}" x1="${formatNumber(line.from.x)}" y1="${formatNumber(line.from.y)}" x2="${formatNumber(line.to.x)}" y2="${formatNumber(line.to.y)}" data-kp-depth="${formatNumber(line.averageDepth)}" data-kp-depth-weight="${formatNumber(depthWeight)}" style="stroke-width: ${formatNumber(strokeWidth)}; opacity: ${formatNumber(opacity)};" />`;
}

function renderCurve(curve: Curve2DObject, graph: Graph2DObject): string {
  const points = sampleParabolaCurve(curve).map((point) =>
    projectGraphPoint(graph, point)
  );
  const [firstPoint, ...remainingPoints] = points;

  if (firstPoint === undefined) {
    return "";
  }

  const pathData = [
    `M ${formatNumber(firstPoint.x)} ${formatNumber(firstPoint.y)}`,
    ...remainingPoints.map(
      (point) => `L ${formatNumber(point.x)} ${formatNumber(point.y)}`
    )
  ].join(" ");

  return `
    <g class="graph-curve" data-kp-object="${escapeHtml(curve.id)}" data-kp-render-node="rn-${escapeHtml(curve.id)}-svg-path" data-kp-type="curve-2d">
      <path d="${pathData}" />
      <text x="18" y="26">${escapeHtml(curve.label)}</text>
    </g>
  `;
}

function renderCurve3D(curve: Curve3DObject, graph: Graph3DObject): string {
  const points = sampleTimeSpiralCurve(curve).map((point) =>
    projectGraphPoint3D(graph, point)
  );
  const pathData = pointsToPathData(points);

  if (pathData.length === 0) {
    return "";
  }

  return `
    <g class="graph-curve graph-curve--3d" data-kp-object="${escapeHtml(curve.id)}" data-kp-render-node="rn-${escapeHtml(curve.id)}-svg-path" data-kp-type="curve-3d">
      <path d="${pathData}" />
      <text x="18" y="54">${escapeHtml(curve.label)}</text>
    </g>
  `;
}

function renderSurface3D(surface: Surface3DObject, graph: Graph3DObject): string {
  const grid = sampleSaddleSurface(surface);
  const quads = createSaddleSurfaceQuads(surface, graph, grid);
  const rowPaths = grid.map((row) =>
    renderSurfacePath(row, graph, "graph-surface__line--row")
  );
  const columnPaths = transposeGrid(grid).map((column) =>
    renderSurfacePath(column, graph, "graph-surface__line--column")
  );

  return `
    <g class="graph-surface" data-kp-object="${escapeHtml(surface.id)}" data-kp-render-node="rn-${escapeHtml(surface.id)}-svg" data-kp-type="surface-3d">
      <g class="graph-surface__quads" data-kp-object="${escapeHtml(surface.id)}" data-kp-render-node="rn-${escapeHtml(surface.id)}-svg-quads" data-kp-type="surface-3d">
        ${quads.map((quad) => renderSurfaceQuad(surface, quad)).join("")}
      </g>
      <g class="graph-surface__wireframe" data-kp-object="${escapeHtml(surface.id)}" data-kp-render-node="rn-${escapeHtml(surface.id)}-svg-wireframe" data-kp-type="surface-3d">
        ${rowPaths.join("")}
        ${columnPaths.join("")}
      </g>
      <text x="18" y="26">${escapeHtml(surface.label)}</text>
    </g>
  `;
}

function renderSurfaceQuad(surface: Surface3DObject, quad: SurfaceQuad3D): string {
  const points = quad.projectedCorners
    .map((point) => `${formatNumber(point.x)},${formatNumber(point.y)}`)
    .join(" ");

  return `<polygon class="graph-surface__quad" points="${points}" data-kp-object="${escapeHtml(surface.id)}" data-kp-cell="${quad.rowIndex},${quad.columnIndex}" data-kp-facing="${quad.facing}" data-kp-type="surface-3d" fill="${quad.fill}" />`;
}

function renderSurfacePath(
  points: readonly GraphPoint3D[],
  graph: Graph3DObject,
  className: string
): string {
  const projectedPoints = points.map((point) => projectGraphPoint3D(graph, point));
  const pathData = pointsToPathData(projectedPoints);

  if (pathData.length === 0) {
    return "";
  }

  return `<path class="graph-surface__line ${className}" d="${pathData}" />`;
}

function createSaddleSurfaceQuads(
  surface: Surface3DObject,
  graph: Graph3DObject,
  grid: readonly (readonly GraphPoint3D[])[]
): readonly SurfaceQuad3D[] {
  const quads: SurfaceQuad3D[] = [];

  for (let rowIndex = 0; rowIndex < grid.length - 1; rowIndex += 1) {
    const row = grid[rowIndex];
    const nextRow = grid[rowIndex + 1];

    if (row === undefined || nextRow === undefined) {
      continue;
    }

    for (let columnIndex = 0; columnIndex < row.length - 1; columnIndex += 1) {
      const topLeft = row[columnIndex];
      const topRight = row[columnIndex + 1];
      const bottomRight = nextRow[columnIndex + 1];
      const bottomLeft = nextRow[columnIndex];

      if (
        topLeft === undefined ||
        topRight === undefined ||
        bottomRight === undefined ||
        bottomLeft === undefined
      ) {
        continue;
      }

      const corners = [
        topLeft,
        topRight,
        bottomRight,
        bottomLeft
      ] as const;
      const projectedCorners = [
        projectGraphPoint3D(graph, topLeft),
        projectGraphPoint3D(graph, topRight),
        projectGraphPoint3D(graph, bottomRight),
        projectGraphPoint3D(graph, bottomLeft)
      ] as const;
      const center = averageGraphPoint3D(corners);
      const normal = saddleSurfaceNormalAt(center);
      const facing = classifySurfaceFacing(graph, normal);

      quads.push({
        rowIndex,
        columnIndex,
        corners,
        projectedCorners,
        averageDepth:
          projectedCorners.reduce((sum, point) => sum + point.depth, 0) /
          projectedCorners.length,
        facing,
        fill: surfaceQuadFill(surface, center, normal, facing)
      });
    }
  }

  return quads.sort((left, right) => right.averageDepth - left.averageDepth);
}

function saddleSurfaceNormalAt(point: GraphPoint): GraphPoint3D {
  const dzDx = point.x / 2;
  const dzDy = -point.y / 2;

  return normalizePoint3D({
    x: -dzDx,
    y: -dzDy,
    z: 1
  });
}

function classifySurfaceFacing(
  graph: Graph3DObject,
  normal: GraphPoint3D
): "back" | "front" {
  const cameraDirection = graphCameraDirection(graph);

  return dotPoint3D(normal, cameraDirection) >= 0 ? "front" : "back";
}

function surfaceQuadFill(
  surface: Surface3DObject,
  center: GraphPoint3D,
  normal: GraphPoint3D,
  facing: "back" | "front"
): string {
  const maxX = Math.max(Math.abs(surface.xDomain[0]), Math.abs(surface.xDomain[1]));
  const maxY = Math.max(Math.abs(surface.yDomain[0]), Math.abs(surface.yDomain[1]));
  const zSpan = Math.max((Math.max(maxX, maxY) ** 2) / 4, 1);
  const normalizedHeight = clamp((center.z + zSpan) / (zSpan * 2), 0, 1);
  const light = normalizePoint3D({ x: -0.35, y: -0.45, z: 0.82 });
  const brightness = clamp(0.45 + Math.max(0, dotPoint3D(normal, light)) * 0.4, 0.35, 0.9);
  const hue = facing === "front"
    ? 184 + Math.round(normalizedHeight * 18)
    : 24 + Math.round(normalizedHeight * 14);
  const saturation = facing === "front" ? 54 : 62;
  const lightness = Math.round((facing === "front" ? 42 : 48) + brightness * 20);

  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

function graphCameraDirection(graph: Graph3DObject): GraphPoint3D {
  const azimuth = degreesToRadians(graph.camera.azimuthDegrees);
  const elevation = degreesToRadians(graph.camera.elevationDegrees);

  return normalizePoint3D({
    x: Math.sin(azimuth) * Math.cos(elevation),
    y: Math.cos(azimuth) * Math.cos(elevation),
    z: Math.sin(elevation)
  });
}

function averageGraphPoint3D(
  points: readonly [GraphPoint3D, GraphPoint3D, GraphPoint3D, GraphPoint3D]
): GraphPoint3D {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    z: points.reduce((sum, point) => sum + point.z, 0) / points.length
  };
}

function dotPoint3D(left: GraphPoint3D, right: GraphPoint3D): number {
  return left.x * right.x + left.y * right.y + left.z * right.z;
}

function normalizePoint3D(point: GraphPoint3D): GraphPoint3D {
  const length = Math.hypot(point.x, point.y, point.z);

  if (length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  return {
    x: point.x / length,
    y: point.y / length,
    z: point.z / length
  };
}

function projectLine3D(graph: Graph3DObject, line: GraphLine3D): ProjectedLine3D {
  const from = projectGraphPoint3D(graph, line.from);
  const to = projectGraphPoint3D(graph, line.to);

  return {
    from,
    to,
    averageDepth: (from.depth + to.depth) / 2
  };
}

function axisSegments3D(axis: Axis3DObject): readonly GraphLine3D[] {
  const breakpoints = axisBreakpoints(axis.domain, axis.tickStep);

  return breakpoints.flatMap((start, index) => {
    const end = breakpoints[index + 1];

    if (end === undefined) {
      return [];
    }

    switch (axis.orientation) {
      case "x":
        return [
          {
            from: { x: start, y: 0, z: 0 },
            to: { x: end, y: 0, z: 0 }
          }
        ];
      case "y":
        return [
          {
            from: { x: 0, y: start, z: 0 },
            to: { x: 0, y: end, z: 0 }
          }
        ];
      case "z":
        return [
          {
            from: { x: 0, y: 0, z: start },
            to: { x: 0, y: 0, z: end }
          }
        ];
    }
  });
}

function axisBreakpoints(
  domain: NumericDomain,
  tickStep: number
): readonly number[] {
  const [min, max] = domain;
  const step = Math.abs(tickStep) > 0 ? Math.abs(tickStep) : 1;
  const breakpoints = [roundCoordinate(min), roundCoordinate(max)];
  let value = Math.ceil(min / step) * step;
  let guard = 0;

  while (value < max && guard < 1_000) {
    if (value > min) {
      breakpoints.push(roundCoordinate(value));
    }

    value += step;
    guard += 1;
  }

  return Array.from(new Set(breakpoints)).sort((left, right) => left - right);
}

function lineDepthWeight(graph: Graph3DObject, depth: number): number {
  const [minDepth, maxDepth] = graphDepthRange(graph);

  if (minDepth === maxDepth) {
    return 0.5;
  }

  const normalizedDepth = (depth - minDepth) / (maxDepth - minDepth);

  return clamp(1 - normalizedDepth, 0, 1);
}

function graphDepthRange(graph: Graph3DObject): NumericDomain {
  const depths = [
    ...graph.xDomain.flatMap((x) =>
      graph.yDomain.flatMap((y) =>
        graph.zDomain.map((z) => projectGraphPoint3D(graph, { x, y, z }).depth)
      )
    )
  ];

  return [Math.min(...depths), Math.max(...depths)];
}

function axisLine3D(
  axis: Axis3DObject,
  graph: Graph3DObject
): GraphLine3D {
  switch (axis.orientation) {
    case "x":
      return {
        from: { x: graph.xDomain[0], y: 0, z: 0 },
        to: { x: graph.xDomain[1], y: 0, z: 0 }
      };
    case "y":
      return {
        from: { x: 0, y: graph.yDomain[0], z: 0 },
        to: { x: 0, y: graph.yDomain[1], z: 0 }
      };
    case "z":
      return {
        from: { x: 0, y: 0, z: graph.zDomain[0] },
        to: { x: 0, y: 0, z: graph.zDomain[1] }
      };
  }
}

function pointsToPathData(points: readonly GraphPoint[]): string {
  const [firstPoint, ...remainingPoints] = points;

  if (firstPoint === undefined) {
    return "";
  }

  return [
    `M ${formatNumber(firstPoint.x)} ${formatNumber(firstPoint.y)}`,
    ...remainingPoints.map(
      (point) => `L ${formatNumber(point.x)} ${formatNumber(point.y)}`
    )
  ].join(" ");
}

function sampleDomain(
  domain: NumericDomain,
  sampleCount: number
): readonly number[] {
  const [min, max] = domain;
  const step = (max - min) / (sampleCount - 1);

  return Array.from({ length: sampleCount }, (_, index) => min + step * index);
}

function transposeGrid(
  grid: readonly (readonly GraphPoint3D[])[]
): readonly (readonly GraphPoint3D[])[] {
  const firstRow = grid[0];

  if (firstRow === undefined) {
    return [];
  }

  return firstRow.map((_, columnIndex) =>
    grid.map((row) => row[columnIndex]).filter((point) => point !== undefined)
  );
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function roundCoordinate(value: number): number {
  const rounded = Number(value.toFixed(3));

  return Object.is(rounded, -0) ? 0 : rounded;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
    ">",
    "&gt;"
  ).replaceAll('"', "&quot;");
}
