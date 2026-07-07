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

export function sampleTiltedOrbitCurve(
  curve: Curve3DObject
): readonly GraphPoint3D[] {
  return sampleDomain(curve.tDomain, curve.sampleCount).map((t) => ({
    x: roundCoordinate(2.4 * Math.cos(t)),
    y: roundCoordinate(1.3 * Math.sin(t)),
    z: roundCoordinate(0.9 * Math.sin(t + Math.PI / 6))
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

  return `
    <svg class="graph-svg graph-svg--3d" data-kp-object="${escapeHtml(graph.id)}" data-kp-render-node="rn-${escapeHtml(graph.id)}-svg" data-kp-type="graph-3d" viewBox="0 0 ${graph.width} ${graph.height}" role="img" aria-label="${escapeHtml(graph.label)}">
      <rect class="graph-svg__background" x="0" y="0" width="${graph.width}" height="${graph.height}" rx="8" />
      ${surfaces.map((surface) => renderSurface3D(surface, graph)).join("")}
      ${axes.map((axis) => renderAxis3D(axis, graph)).join("")}
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
  const line = axisLine3D(axis, graph);
  const from = projectGraphPoint3D(graph, line.from);
  const to = projectGraphPoint3D(graph, line.to);

  return `
    <g class="graph-axis graph-axis--3d graph-axis--${axis.orientation}" data-kp-object="${escapeHtml(axis.id)}" data-kp-render-node="rn-${escapeHtml(axis.id)}-svg-line" data-kp-type="axis-3d">
      <line x1="${formatNumber(from.x)}" y1="${formatNumber(from.y)}" x2="${formatNumber(to.x)}" y2="${formatNumber(to.y)}" />
      <text x="${formatNumber(to.x)}" y="${formatNumber(to.y)}">${escapeHtml(axis.label)}</text>
    </g>
  `;
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
  const points = sampleTiltedOrbitCurve(curve).map((point) =>
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
  const rowPaths = grid.map((row) =>
    renderSurfacePath(row, graph, "graph-surface__line--row")
  );
  const columnPaths = transposeGrid(grid).map((column) =>
    renderSurfacePath(column, graph, "graph-surface__line--column")
  );

  return `
    <g class="graph-surface" data-kp-object="${escapeHtml(surface.id)}" data-kp-render-node="rn-${escapeHtml(surface.id)}-svg-wireframe" data-kp-type="surface-3d">
      ${rowPaths.join("")}
      ${columnPaths.join("")}
      <text x="18" y="26">${escapeHtml(surface.label)}</text>
    </g>
  `;
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

function axisLine3D(
  axis: Axis3DObject,
  graph: Graph3DObject
): { from: GraphPoint3D; to: GraphPoint3D } {
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
  return Number(value.toFixed(12));
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
    ">",
    "&gt;"
  ).replaceAll('"', "&quot;");
}
