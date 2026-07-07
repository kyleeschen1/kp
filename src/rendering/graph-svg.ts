import type { KpSemanticObject } from "../semantic/document.ts";
import {
  compileExpression,
  compileGradient,
  type CompiledExpression
} from "../math/expression.ts";
import {
  buildDepthScene,
  depthSceneDiagnostics,
  detectDepthSurfaceOverlaps,
  projectedQuadsToDepthTriangles,
  segmentProjectedLineByVisibility,
  type DepthScene,
  type DepthSceneDiagnostics,
  type ProjectedDepthSurface
} from "./depth-scene.ts";
import type { ProjectedQuad } from "./geometry.ts";
import {
  graphCameraDirection,
  projectGraphLine3D,
  projectGraphPoint3D,
  type GraphLine3D,
  type ProjectedGraphLine3D,
  type ProjectedGraphPoint3D
} from "./projection.ts";
import {
  DEFAULT_OCCLUDED_AXIS_LIGHTNESS,
  type Axis2DObject,
  type Axis3DObject,
  type Curve2DObject,
  type Curve3DObject,
  type Graph2DObject,
  type Graph3DObject,
  type GraphPoint3D,
  type NumericDomain,
  type Surface3DObject
} from "../semantic/graph.ts";

export { projectGraphPoint3D } from "./projection.ts";

export interface GraphPoint {
  x: number;
  y: number;
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
  depthHaze: number;
}

interface RenderedSurface3D {
  surface: Surface3DObject;
  grid: readonly (readonly GraphPoint3D[])[];
  quads: readonly SurfaceQuad3D[];
}

interface SurfaceEdgeSegment3D extends ProjectedLine3D {
  visibility: AxisVisibility;
}

interface CurveSegment3D extends ProjectedLine3D {
  visibility: AxisVisibility;
}

interface ProjectedStrip3D {
  points: readonly [GraphPoint, GraphPoint, GraphPoint, GraphPoint];
  fromWidth: number;
  toWidth: number;
}

type ProjectedLine3D = ProjectedGraphLine3D;

interface ProjectedAxisSegment3D extends ProjectedLine3D {
  isNegativeEnd: boolean;
  isPositiveEnd: boolean;
  visibility: AxisVisibility;
}

interface SurfaceGradientEvaluators {
  dx: CompiledExpression;
  dy: CompiledExpression;
}

type AxisVisibility = "hidden" | "visible";

const AXIS_EXTENSION_RATIO = 0.15;
const AXIS_OCCLUSION_SEGMENT_COUNT = 96;
const SURFACE_MESH_STROKE_WIDTH = 1.25;
const AXIS_TO_MESH_STROKE_RATIO = 2;
const AXIS_STROKE_EXTRA_PX = 1;
const VISIBLE_AXIS_STROKE_COLOR = "#000000";
const OCCLUDED_AXIS_HUE_DEGREES = 202;
const OCCLUDED_AXIS_SATURATION_PERCENT = 17;
const SURFACE_EDGE_OUTLINE_WIDTH = 2.6;
const SURFACE_EDGE_OUTLINE_COLOR = "#0f3d5e";
const SURFACE_EDGE_SEGMENT_SUBDIVISIONS = 4;
const THIN_QUAD_MIN_DEPTH_WIDTH_RATIO = 0.5;
const AXIS_ARROW_BASE_WIDTH_RATIO = 6;
const SURFACE_EDGE_VISIBLE_OPACITY = 0.95;
const SURFACE_EDGE_OCCLUDED_OPACITY = 0.5;
const CURVE_VISIBLE_OPACITY = 0.88;
const CURVE_OCCLUDED_OPACITY = 0.38;
const SURFACE_DEPTH_BUFFER_SCALE = 1;
const DEPTH_DEBUG_OVERLAY_CELL_SIZE = 20;

type AxisArrowEnd = "negative-end" | "positive-end";

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

export function sampleParabolaCurve(curve: Curve2DObject): readonly GraphPoint[] {
  const [minX, maxX] = curve.xDomain;
  const step = (maxX - minX) / (curve.sampleCount - 1);
  const evaluateCurve = compileExpression(curve.expression);

  return Array.from({ length: curve.sampleCount }, (_, index) => {
    const x = minX + step * index;

    return {
      x,
      y: roundCoordinate(evaluateCurve({ x }))
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
  const evaluateSurface = compileExpression(surface.expression);

  return sampleDomain(surface.yDomain, surface.ySampleCount).map((y) =>
    sampleDomain(surface.xDomain, surface.xSampleCount).map((x) => ({
      x: roundCoordinate(x),
      y: roundCoordinate(y),
      z: roundCoordinate(evaluateSurface({ x, y }))
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
  const renderedSurfaces = surfaces.map((surface) =>
    prepareSurface3D(surface, graph)
  );
  const depthScene = buildSurfaceDepthScene3D(graph, renderedSurfaces);
  const depthDiagnostics = depthSceneDiagnostics(depthScene);
  const debugOverlay = graph.debug.depthOverlay
    ? renderDepthDebugOverlay3D(graph, depthScene)
    : "";

  // Axes are drawn in two semantic layers: hidden pieces under the opaque
  // surface, then visible pieces above it. This gives SVG a lightweight
  // substitute for depth-buffered axis occlusion.
  return `
    <svg class="graph-svg graph-svg--3d" data-kp-object="${escapeHtml(graph.id)}" data-kp-render-node="rn-${escapeHtml(graph.id)}-svg" data-kp-type="graph-3d" data-kp-camera-azimuth-degrees="${formatNumber(graph.camera.azimuthDegrees)}" data-kp-occluded-axis-lightness="${formatNumber(graphOccludedAxisLightness(graph))}" data-kp-debug-depth-overlay="${graph.debug.depthOverlay ? "true" : "false"}" ${renderDepthDiagnosticsAttributes(depthDiagnostics)} viewBox="0 0 ${graph.width} ${graph.height}" role="img" aria-label="${escapeHtml(graph.label)}">
      <rect class="graph-svg__background" x="0" y="0" width="${graph.width}" height="${graph.height}" rx="8" />
      ${renderedSurfaces.map((surface) => renderSurface3D(surface, graph, depthScene)).join("")}
      ${axes.map((axis) => renderAxis3D(axis, graph, depthScene, "hidden")).join("")}
      ${axes.map((axis) => renderAxis3D(axis, graph, depthScene, "visible")).join("")}
      ${curves.map((curve) => renderCurve3D(curve, graph, depthScene)).join("")}
      ${debugOverlay}
    </svg>
  `;
}

function renderDepthDiagnosticsAttributes(
  diagnostics: DepthSceneDiagnostics
): string {
  return [
    `data-kp-depth-buffer-scale="${formatNumber(diagnostics.bufferScale)}"`,
    `data-kp-depth-buffer-width="${diagnostics.bufferWidth}"`,
    `data-kp-depth-buffer-height="${diagnostics.bufferHeight}"`,
    `data-kp-depth-cell-count="${diagnostics.depthCellCount}"`,
    `data-kp-depth-surface-count="${diagnostics.surfaceCount}"`,
    `data-kp-depth-triangle-count="${diagnostics.triangleCount}"`,
    `data-kp-depth-overlap-count="${diagnostics.overlapCount}"`
  ].join(" ");
}

function renderDepthDebugOverlay3D(
  graph: Graph3DObject,
  depthScene: DepthScene
): string {
  const sampleColumns = Math.max(
    1,
    Math.ceil(graph.width / DEPTH_DEBUG_OVERLAY_CELL_SIZE)
  );
  const sampleRows = Math.max(
    1,
    Math.ceil(graph.height / DEPTH_DEBUG_OVERLAY_CELL_SIZE)
  );
  const cellWidth = graph.width / sampleColumns;
  const cellHeight = graph.height / sampleRows;
  const cells = Array.from({ length: sampleRows }, (_, rowIndex) =>
    Array.from({ length: sampleColumns }, (_, columnIndex) =>
      renderDepthDebugCell3D(
        graph,
        depthScene,
        rowIndex,
        columnIndex,
        cellWidth,
        cellHeight
      )
    ).join("")
  ).join("");

  return `
    <g class="graph-debug-overlay graph-debug-overlay--depth" data-kp-object="${escapeHtml(graph.id)}" data-kp-render-node="rn-${escapeHtml(graph.id)}-depth-debug-overlay" data-kp-type="graph-3d" data-kp-debug-overlay="depth-buffer" data-kp-debug-sample-columns="${sampleColumns}" data-kp-debug-sample-rows="${sampleRows}" aria-hidden="true">
      ${cells}
    </g>
  `;
}

function renderDepthDebugCell3D(
  graph: Graph3DObject,
  depthScene: DepthScene,
  rowIndex: number,
  columnIndex: number,
  cellWidth: number,
  cellHeight: number
): string {
  const x = columnIndex * cellWidth;
  const y = rowIndex * cellHeight;
  const depth = depthScene.buffer.depthAtPoint({
    x: x + cellWidth / 2,
    y: y + cellHeight / 2
  });

  if (depth === undefined) {
    return "";
  }

  const depthWeight = lineDepthWeight(graph, depth);
  const opacity = 0.1 + depthWeight * 0.22;

  return `<rect class="graph-debug-overlay__cell" x="${formatNumber(x)}" y="${formatNumber(y)}" width="${formatNumber(cellWidth)}" height="${formatNumber(cellHeight)}" data-kp-debug-cell="${rowIndex},${columnIndex}" data-kp-depth="${formatNumber(depth)}" data-kp-depth-weight="${formatNumber(depthWeight)}" fill="#e4572e" opacity="${formatNumber(opacity)}" />`;
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

function renderAxis3D(
  axis: Axis3DObject,
  graph: Graph3DObject,
  depthScene: DepthScene,
  visibilityLayer: AxisVisibility
): string {
  const extendedDomain = extendDomain(axis.domain, AXIS_EXTENSION_RATIO);
  const segments = axisSegments3D(axis, extendedDomain, graph, depthScene).filter(
    (segment) => segment.visibility === visibilityLayer
  );
  const axisRole =
    axis.orientation === "z" ? "graph-axis--subtle" : "graph-axis--base-plane";
  const negativeArrowSegment = segments.find((segment) => segment.isNegativeEnd);
  const positiveArrowSegment = segments.find((segment) => segment.isPositiveEnd);

  return `
    <g class="graph-axis graph-axis--3d graph-axis--${axis.orientation} ${axisRole}" data-kp-object="${escapeHtml(axis.id)}" data-kp-render-node="rn-${escapeHtml(axis.id)}-svg-line-${visibilityLayer}" data-kp-type="axis-3d" data-kp-axis-extended-domain="${formatDomain(extendedDomain)}" data-kp-axis-extension-ratio="${AXIS_EXTENSION_RATIO}" data-kp-axis-visibility-layer="${visibilityLayer}">
      ${segments.map((segment) => renderAxisSegment3D(segment, graph)).join("")}
      ${negativeArrowSegment === undefined ? "" : renderAxisArrow3D(negativeArrowSegment, graph, "negative-end")}
      ${positiveArrowSegment === undefined ? "" : renderAxisArrow3D(positiveArrowSegment, graph, "positive-end")}
    </g>
  `;
}

function renderAxisSegment3D(
  line: ProjectedAxisSegment3D,
  graph: Graph3DObject
): string {
  const depthWeight = lineDepthWeight(graph, line.averageDepth);
  const maxWidth =
    SURFACE_MESH_STROKE_WIDTH * AXIS_TO_MESH_STROKE_RATIO +
    AXIS_STROKE_EXTRA_PX;
  const strip = projectedStrip3D(line, graph, maxWidth);
  const treatment = axisOcclusionTreatment(line.visibility);
  const opacity = axisOpacity(line.visibility, depthWeight);
  const fillColor = axisStrokeColor(line.visibility, graph);

  return `<polygon class="graph-axis__segment" points="${formatPoints(strip.points)}" data-kp-axis-from="${formatPoint(line.from)}" data-kp-axis-to="${formatPoint(line.to)}" data-kp-depth="${formatNumber(line.averageDepth)}" data-kp-depth-weight="${formatNumber(depthWeight)}" data-kp-visibility="${line.visibility}" data-kp-visibility-source="depth-buffer" data-kp-occlusion-treatment="${treatment}" data-kp-stroke-ratio="${AXIS_TO_MESH_STROKE_RATIO}" data-kp-stroke-extra-px="${AXIS_STROKE_EXTRA_PX}" data-kp-max-width="${formatNumber(maxWidth)}" data-kp-width-from="${formatNumber(strip.fromWidth)}" data-kp-width-to="${formatNumber(strip.toWidth)}" data-kp-geometry="screen-space-quad" fill="${fillColor}" opacity="${formatNumber(opacity)}" />`;
}

function renderAxisArrow3D(
  line: ProjectedAxisSegment3D,
  graph: Graph3DObject,
  arrowEnd: AxisArrowEnd
): string {
  const endpoint = arrowEnd === "negative-end" ? line.from : line.to;
  const depthWeight = lineDepthWeight(graph, endpoint.depth);
  const arrowLength = axisArrowLength(line.visibility, depthWeight);
  const endpointWidth = depthScaledWidth(
    graph,
    endpoint.depth,
    SURFACE_MESH_STROKE_WIDTH * AXIS_TO_MESH_STROKE_RATIO +
      AXIS_STROKE_EXTRA_PX
  );
  const points = axisArrowPoints(
    line,
    arrowEnd,
    arrowLength,
    endpointWidth * AXIS_ARROW_BASE_WIDTH_RATIO
  );
  const opacity = axisOpacity(line.visibility, depthWeight);
  const fillColor = axisStrokeColor(line.visibility, graph);

  return `<polygon class="graph-axis__arrow" data-kp-axis-arrow="${arrowEnd}" data-kp-visibility="${line.visibility}" data-kp-visibility-source="depth-buffer" data-kp-depth-weight="${formatNumber(depthWeight)}" data-kp-axis-tip="${formatPoint(endpoint)}" data-kp-axis-endpoint="${formatPoint(endpoint)}" data-kp-arrow-length="${formatNumber(arrowLength)}" fill="${fillColor}" opacity="${formatNumber(opacity)}" points="${formatPoints(points)}" />`;
}

function axisOcclusionTreatment(visibility: AxisVisibility): "muted" | "strong" {
  return visibility === "hidden" ? "muted" : "strong";
}

function axisOpacity(visibility: AxisVisibility, depthWeight: number): number {
  return visibility === "hidden"
    ? 1
    : 0.92 + depthWeight * 0.06;
}

function axisStrokeColor(visibility: AxisVisibility, graph: Graph3DObject): string {
  return visibility === "hidden"
    ? occludedAxisColor(graphOccludedAxisLightness(graph))
    : VISIBLE_AXIS_STROKE_COLOR;
}

export function occludedAxisColor(lightness: number): string {
  return hslToHex(
    OCCLUDED_AXIS_HUE_DEGREES,
    OCCLUDED_AXIS_SATURATION_PERCENT,
    clamp(lightness, 0, 100)
  );
}

function hslToHex(
  hueDegrees: number,
  saturationPercent: number,
  lightnessPercent: number
): string {
  const saturation = clamp(saturationPercent, 0, 100) / 100;
  const lightness = clamp(lightnessPercent, 0, 100) / 100;
  const hue = ((hueDegrees % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const secondary = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
  const match = lightness - chroma / 2;
  const channels = hslHueToRgb(hue, chroma, secondary).map(
    (channel) => Math.round((channel + match) * 255)
  );

  return `#${channels
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function hslHueToRgb(
  hue: number,
  chroma: number,
  secondary: number
): readonly [number, number, number] {
  if (hue < 60) {
    return [chroma, secondary, 0];
  }

  if (hue < 120) {
    return [secondary, chroma, 0];
  }

  if (hue < 180) {
    return [0, chroma, secondary];
  }

  if (hue < 240) {
    return [0, secondary, chroma];
  }

  if (hue < 300) {
    return [secondary, 0, chroma];
  }

  return [chroma, 0, secondary];
}

function graphOccludedAxisLightness(graph: Graph3DObject): number {
  return clamp(
    graph.occludedAxisLightness ?? DEFAULT_OCCLUDED_AXIS_LIGHTNESS,
    0,
    100
  );
}

function axisArrowLength(
  visibility: AxisVisibility,
  depthWeight: number
): number {
  return visibility === "hidden"
    ? 8 + depthWeight * 5
    : 9 + depthWeight * 6;
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

function renderCurve3D(
  curve: Curve3DObject,
  graph: Graph3DObject,
  depthScene: DepthScene
): string {
  const segments = curveSegments3D(curve, graph, depthScene);

  if (segments.length === 0) {
    return "";
  }

  return `
    <g class="graph-curve graph-curve--3d" data-kp-object="${escapeHtml(curve.id)}" data-kp-render-node="rn-${escapeHtml(curve.id)}-svg-path" data-kp-type="curve-3d">
      ${segments.map((segment, index) => renderCurveSegment3D(curve, segment, graph, index)).join("")}
    </g>
  `;
}

function curveSegments3D(
  curve: Curve3DObject,
  graph: Graph3DObject,
  depthScene: DepthScene
): readonly CurveSegment3D[] {
  const points = sampleTimeSpiralCurve(curve);

  return points.flatMap((from, index) => {
    const to = points[index + 1];

    if (to === undefined) {
      return [];
    }

    return segmentProjectedLineByVisibility(
      depthScene,
      projectGraphLine3D(graph, { from, to })
    );
  });
}

function renderCurveSegment3D(
  curve: Curve3DObject,
  segment: CurveSegment3D,
  graph: Graph3DObject,
  index: number
): string {
  const pathData = pointsToPathData([segment.from, segment.to]);
  const depthWeight = lineDepthWeight(graph, segment.averageDepth);
  const opacity = segment.visibility === "hidden"
    ? CURVE_OCCLUDED_OPACITY
    : CURVE_VISIBLE_OPACITY;

  return `<path class="graph-curve__segment" d="${pathData}" data-kp-object="${escapeHtml(curve.id)}" data-kp-curve-segment="${index}" data-kp-visibility="${segment.visibility}" data-kp-visibility-source="depth-buffer" data-kp-depth="${formatNumber(segment.averageDepth)}" data-kp-depth-weight="${formatNumber(depthWeight)}" data-kp-type="curve-3d" opacity="${formatNumber(opacity)}" />`;
}

function prepareSurface3D(
  surface: Surface3DObject,
  graph: Graph3DObject
): RenderedSurface3D {
  const grid = sampleSaddleSurface(surface);
  const quads = createSaddleSurfaceQuads(surface, graph, grid);

  return {
    surface,
    grid,
    quads
  };
}

function buildSurfaceDepthScene3D(
  graph: Graph3DObject,
  surfaces: readonly RenderedSurface3D[]
): DepthScene {
  const depthSurfaces = surfaceDepthSurfaces3D(surfaces);

  return buildDepthScene({
    logicalWidth: graph.width,
    logicalHeight: graph.height,
    scale: SURFACE_DEPTH_BUFFER_SCALE,
    surfaceCount: surfaces.length,
    overlapCount: detectDepthSurfaceOverlaps(depthSurfaces).length,
    triangles: depthSurfaces.flatMap((surface) => surface.triangles)
  });
}

function surfaceDepthSurfaces3D(
  surfaces: readonly RenderedSurface3D[]
): readonly ProjectedDepthSurface[] {
  return surfaces.map((surface) => ({
    surfaceId: surface.surface.id,
    triangles: projectedQuadsToDepthTriangles(surfaceDepthQuads3D(surface))
  }));
}

function surfaceDepthQuads3D(surface: RenderedSurface3D): readonly ProjectedQuad[] {
  return surface.quads.map((quad) => ({
    points: quad.projectedCorners
  }));
}

function renderSurface3D(
  renderedSurface: RenderedSurface3D,
  graph: Graph3DObject,
  depthScene: DepthScene
): string {
  const { surface, grid, quads } = renderedSurface;
  const edgeSegments = surfaceEdgeSegments3D(
    renderedSurface,
    graph,
    depthScene
  );
  const rowPaths = grid.map((row) =>
    renderSurfacePath(row, graph, "graph-surface__line--row")
  );
  const columnPaths = transposeGrid(grid).map((column) =>
    renderSurfacePath(column, graph, "graph-surface__line--column")
  );

  return `
    <g class="graph-surface" data-kp-object="${escapeHtml(surface.id)}" data-kp-render-node="rn-${escapeHtml(surface.id)}-svg" data-kp-type="surface-3d">
      ${renderSurfaceEdgeOutline(surface, edgeSegments, graph, "hidden")}
      <g class="graph-surface__quads" data-kp-object="${escapeHtml(surface.id)}" data-kp-render-node="rn-${escapeHtml(surface.id)}-svg-quads" data-kp-type="surface-3d">
        ${quads.map((quad) => renderSurfaceQuad(surface, quad)).join("")}
      </g>
      <g class="graph-surface__wireframe" data-kp-object="${escapeHtml(surface.id)}" data-kp-render-node="rn-${escapeHtml(surface.id)}-svg-wireframe" data-kp-type="surface-3d">
        ${rowPaths.join("")}
        ${columnPaths.join("")}
      </g>
      ${renderSurfaceEdgeOutline(surface, edgeSegments, graph, "visible")}
    </g>
  `;
}

function renderSurfaceQuad(surface: Surface3DObject, quad: SurfaceQuad3D): string {
  const points = quad.projectedCorners
    .map((point) => `${formatNumber(point.x)},${formatNumber(point.y)}`)
    .join(" ");

  return `<polygon class="graph-surface__quad" points="${points}" data-kp-object="${escapeHtml(surface.id)}" data-kp-cell="${quad.rowIndex},${quad.columnIndex}" data-kp-facing="${quad.facing}" data-kp-surface-depth="${formatNumber(quad.averageDepth)}" data-kp-depth-haze="${formatNumber(quad.depthHaze)}" data-kp-lighting-model="ambient-diffuse-depth-haze" data-kp-type="surface-3d" fill="${quad.fill}" fill-opacity="1" opacity="1" />`;
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

function renderSurfaceEdgeOutline(
  surface: Surface3DObject,
  edgeSegments: readonly SurfaceEdgeSegment3D[],
  graph: Graph3DObject,
  visibility: AxisVisibility
): string {
  const matchingSegments = edgeSegments.filter(
    (segment) => segment.visibility === visibility
  );

  if (matchingSegments.length === 0) {
    return "";
  }

  return `<g class="graph-surface__edge-outline-layer" data-kp-object="${escapeHtml(surface.id)}" data-kp-render-node="rn-${escapeHtml(surface.id)}-svg-edge-outline-${visibility}" data-kp-type="surface-3d" data-kp-edge-visibility="${visibility}">
    ${matchingSegments.map((segment, index) => renderSurfaceEdgeSegment(surface, segment, graph, index)).join("")}
  </g>`;
}

function renderSurfaceEdgeSegment(
  surface: Surface3DObject,
  segment: SurfaceEdgeSegment3D,
  graph: Graph3DObject,
  index: number
): string {
  const depthWeight = lineDepthWeight(graph, segment.averageDepth);
  const strip = projectedStrip3D(segment, graph, SURFACE_EDGE_OUTLINE_WIDTH);
  const opacity = segment.visibility === "hidden"
    ? SURFACE_EDGE_OCCLUDED_OPACITY
    : SURFACE_EDGE_VISIBLE_OPACITY;

  return `<polygon class="graph-surface__edge-outline" points="${formatPoints(strip.points)}" data-kp-object="${escapeHtml(surface.id)}" data-kp-edge-segment="${index}" data-kp-edge-visibility="${segment.visibility}" data-kp-visibility-source="depth-buffer" data-kp-depth="${formatNumber(segment.averageDepth)}" data-kp-depth-weight="${formatNumber(depthWeight)}" data-kp-max-width="${formatNumber(SURFACE_EDGE_OUTLINE_WIDTH)}" data-kp-width-from="${formatNumber(strip.fromWidth)}" data-kp-width-to="${formatNumber(strip.toWidth)}" data-kp-geometry="screen-space-quad" data-kp-type="surface-3d" fill="${SURFACE_EDGE_OUTLINE_COLOR}" opacity="${formatNumber(opacity)}" />`;
}

function surfaceEdgeSegments3D(
  renderedSurface: RenderedSurface3D,
  graph: Graph3DObject,
  depthScene: DepthScene
): readonly SurfaceEdgeSegment3D[] {
  const perimeter = surfacePerimeterPoints(renderedSurface.grid);

  if (perimeter.length < 2) {
    return [];
  }

  return perimeter.flatMap((from, index) => {
    const to = perimeter[(index + 1) % perimeter.length];

    if (to === undefined) {
      return [];
    }

    const breakpoints = sampleDomain([0, 1], SURFACE_EDGE_SEGMENT_SUBDIVISIONS + 1);

    return breakpoints.flatMap((start, breakpointIndex) => {
      const end = breakpoints[breakpointIndex + 1];

      if (end === undefined) {
        return [];
      }

      const segmentStart = interpolateGraphPoint3D(from, to, start);
      const segmentEnd = interpolateGraphPoint3D(from, to, end);
      const projectedLine = projectGraphLine3D(graph, {
        from: segmentStart,
        to: segmentEnd
      });

      return segmentProjectedLineByVisibility(depthScene, projectedLine);
    });
  });
}

function surfacePerimeterPoints(
  grid: readonly (readonly GraphPoint3D[])[]
): readonly GraphPoint3D[] {
  const firstRow = grid[0];
  const lastRow = grid[grid.length - 1];

  if (firstRow === undefined || lastRow === undefined) {
    return [];
  }

  const rightColumn = grid
    .slice(1)
    .map((row) => row[row.length - 1])
    .filter((point) => point !== undefined);
  const bottomRow = [...lastRow.slice(0, -1)].reverse();
  const leftColumn = grid
    .slice(1, -1)
    .reverse()
    .map((row) => row[0])
    .filter((point) => point !== undefined);

  return [...firstRow, ...rightColumn, ...bottomRow, ...leftColumn];
}

function createSaddleSurfaceQuads(
  surface: Surface3DObject,
  graph: Graph3DObject,
  grid: readonly (readonly GraphPoint3D[])[]
): readonly SurfaceQuad3D[] {
  const quads: SurfaceQuad3D[] = [];
  const gradient = compileSurfaceGradient(surface);

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
      const normal = saddleSurfaceNormalAt(center, gradient);
      const facing = classifySurfaceFacing(graph, normal);
      const depthHaze = 1 - lineDepthWeight(
        graph,
        projectGraphPoint3D(graph, center).depth
      );

      quads.push({
        rowIndex,
        columnIndex,
        corners,
        projectedCorners,
        averageDepth:
          projectedCorners.reduce((sum, point) => sum + point.depth, 0) /
          projectedCorners.length,
        facing,
        fill: surfaceQuadFill(surface, center, normal, facing, depthHaze),
        depthHaze
      });
    }
  }

  return quads.sort((left, right) => left.averageDepth - right.averageDepth);
}

function saddleSurfaceNormalAt(
  point: GraphPoint,
  gradient: SurfaceGradientEvaluators
): GraphPoint3D {
  const scope = { x: point.x, y: point.y };
  const dx = gradient.dx(scope);
  const dy = gradient.dy(scope);

  return normalizePoint3D({
    x: -dx,
    y: -dy,
    z: 1
  });
}

function compileSurfaceGradient(
  surface: Surface3DObject
): SurfaceGradientEvaluators {
  const [dx, dy] = compileGradient(surface.expression, ["x", "y"]);

  if (dx === undefined || dy === undefined) {
    throw new Error(`Expected ${surface.id} gradient to contain dx and dy.`);
  }

  return { dx, dy };
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
  facing: "back" | "front",
  depthHaze: number
): string {
  const maxX = Math.max(Math.abs(surface.xDomain[0]), Math.abs(surface.xDomain[1]));
  const maxY = Math.max(Math.abs(surface.yDomain[0]), Math.abs(surface.yDomain[1]));
  const zSpan = Math.max((Math.max(maxX, maxY) ** 2) / 4, 1);
  const normalizedHeight = clamp((center.z + zSpan) / (zSpan * 2), 0, 1);
  const light = normalizePoint3D({ x: -0.35, y: -0.45, z: 0.82 });
  const brightness = clamp(0.45 + Math.max(0, dotPoint3D(normal, light)) * 0.4, 0.35, 0.9);
  const hue = facing === "front"
    ? 188 + Math.round(normalizedHeight * 18)
    : 206 + Math.round(normalizedHeight * 18);
  const baseSaturation = facing === "front" ? 58 : 48;
  const baseLightness = facing === "front"
    ? 42 + brightness * 20
    : 62 + brightness * 10;
  const saturation = Math.round(
    clamp(baseSaturation - depthHaze * 8, 34, 64)
  );
  const lightness = Math.round(
    clamp(baseLightness + depthHaze * 6, 35, 78)
  );

  return `hsl(${hue} ${saturation}% ${lightness}%)`;
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

function interpolateGraphPoint3D(
  from: GraphPoint3D,
  to: GraphPoint3D,
  t: number
): GraphPoint3D {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t
  };
}

function projectedStrip3D(
  line: ProjectedLine3D,
  graph: Graph3DObject,
  maxWidth: number
): ProjectedStrip3D {
  const fromWidth = depthScaledWidth(graph, line.from.depth, maxWidth);
  const toWidth = depthScaledWidth(graph, line.to.depth, maxWidth);
  const dx = line.to.x - line.from.x;
  const dy = line.to.y - line.from.y;
  const length = Math.hypot(dx, dy);

  if (length === 0) {
    const fromHalfWidth = fromWidth / 2;
    const toHalfWidth = toWidth / 2;

    return {
      points: [
        { x: line.from.x, y: line.from.y - fromHalfWidth },
        { x: line.to.x, y: line.to.y - toHalfWidth },
        { x: line.to.x, y: line.to.y + toHalfWidth },
        { x: line.from.x, y: line.from.y + fromHalfWidth }
      ],
      fromWidth,
      toWidth
    };
  }

  const normalX = -dy / length;
  const normalY = dx / length;
  const fromHalfWidth = fromWidth / 2;
  const toHalfWidth = toWidth / 2;

  return {
    points: [
      {
        x: line.from.x + normalX * fromHalfWidth,
        y: line.from.y + normalY * fromHalfWidth
      },
      {
        x: line.to.x + normalX * toHalfWidth,
        y: line.to.y + normalY * toHalfWidth
      },
      {
        x: line.to.x - normalX * toHalfWidth,
        y: line.to.y - normalY * toHalfWidth
      },
      {
        x: line.from.x - normalX * fromHalfWidth,
        y: line.from.y - normalY * fromHalfWidth
      }
    ],
    fromWidth,
    toWidth
  };
}

function axisArrowPoints(
  line: ProjectedAxisSegment3D,
  arrowEnd: AxisArrowEnd,
  arrowLength: number,
  baseWidth: number
): readonly [GraphPoint, GraphPoint, GraphPoint] {
  const tip = arrowEnd === "negative-end" ? line.from : line.to;
  const innerPoint = arrowEnd === "negative-end" ? line.to : line.from;
  const dx = tip.x - innerPoint.x;
  const dy = tip.y - innerPoint.y;
  const length = Math.hypot(dx, dy);
  const directionX = length === 0 ? 1 : dx / length;
  const directionY = length === 0 ? 0 : dy / length;
  const normalX = -directionY;
  const normalY = directionX;
  const halfBaseWidth = baseWidth / 2;
  const baseCenter = {
    x: tip.x - directionX * arrowLength,
    y: tip.y - directionY * arrowLength
  };

  return [
    tip,
    {
      x: baseCenter.x + normalX * halfBaseWidth,
      y: baseCenter.y + normalY * halfBaseWidth
    },
    {
      x: baseCenter.x - normalX * halfBaseWidth,
      y: baseCenter.y - normalY * halfBaseWidth
    }
  ];
}

function depthScaledWidth(
  graph: Graph3DObject,
  depth: number,
  maxWidth: number
): number {
  const depthWeight = lineDepthWeight(graph, depth);

  return maxWidth * (
    THIN_QUAD_MIN_DEPTH_WIDTH_RATIO +
    depthWeight * (1 - THIN_QUAD_MIN_DEPTH_WIDTH_RATIO)
  );
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

function axisSegments3D(
  axis: Axis3DObject,
  domain: NumericDomain,
  graph: Graph3DObject,
  depthScene: DepthScene
): readonly ProjectedAxisSegment3D[] {
  const breakpoints = sampleDomain(domain, AXIS_OCCLUSION_SEGMENT_COUNT + 1);

  return breakpoints.flatMap((start, index) => {
    const end = breakpoints[index + 1];

    if (end === undefined) {
      return [];
    }

    const line = axisLine3D(axis, [start, end]);
    const projectedLine = projectGraphLine3D(graph, line);
    const visibilitySegments = segmentProjectedLineByVisibility(
      depthScene,
      projectedLine
    );

    return visibilitySegments.map((segment, segmentIndex) => ({
      ...segment,
      isNegativeEnd: index === 0 && segmentIndex === 0,
      isPositiveEnd:
        index === breakpoints.length - 2 &&
        segmentIndex === visibilitySegments.length - 1
    }));
  });
}

function extendDomain(
  domain: NumericDomain,
  extensionRatio: number
): NumericDomain {
  const [min, max] = domain;
  const extension = (max - min) * extensionRatio;

  return [roundCoordinate(min - extension), roundCoordinate(max + extension)];
}

function lineDepthWeight(graph: Graph3DObject, depth: number): number {
  const [minDepth, maxDepth] = graphDepthRange(graph);

  if (minDepth === maxDepth) {
    return 0.5;
  }

  const normalizedDepth = (depth - minDepth) / (maxDepth - minDepth);

  return clamp(normalizedDepth, 0, 1);
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
  domain: NumericDomain
): GraphLine3D {
  switch (axis.orientation) {
    case "x":
      return {
        from: { x: domain[0], y: 0, z: 0 },
        to: { x: domain[1], y: 0, z: 0 }
      };
    case "y":
      return {
        from: { x: 0, y: domain[0], z: 0 },
        to: { x: 0, y: domain[1], z: 0 }
      };
    case "z":
      return {
        from: { x: 0, y: 0, z: domain[0] },
        to: { x: 0, y: 0, z: domain[1] }
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

function formatPoints(points: readonly GraphPoint[]): string {
  return points.map(formatPoint).join(" ");
}

function formatPoint(point: GraphPoint): string {
  return `${formatNumber(point.x)},${formatNumber(point.y)}`;
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

function roundCoordinate(value: number): number {
  const rounded = Number(value.toFixed(3));

  return Object.is(rounded, -0) ? 0 : rounded;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function formatDomain(domain: NumericDomain): string {
  return `${formatNumber(domain[0])},${formatNumber(domain[1])}`;
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
