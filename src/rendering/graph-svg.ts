import type { KpSemanticObject } from "../semantic/document.ts";
import {
  constant,
  compileExpression,
  compileGradient,
  type CompiledExpression
} from "../math/expression.ts";
import { createSaddleSurfaceExpression } from "../math/surface-examples.ts";
import {
  buildDepthScene,
  classifyProjectedPointDepth,
  depthSceneDiagnostics,
  detectDepthSurfaceOverlaps,
  projectedQuadsToDepthTriangles,
  segmentProjectedLineByVisibility,
  type DepthScene,
  type DepthSceneDiagnostics,
  type ProjectedDepthSurface
} from "./depth-scene.ts";
import {
  interpolateProjectedPoint,
  type ProjectedQuad
} from "./geometry.ts";
import {
  graphCameraDirection,
  projectGraphLine3D,
  projectGraphPoint3D,
  type GraphLine3D,
  type ProjectedGraphLine3D,
  type ProjectedGraphPoint3D
} from "./projection.ts";
import {
  estimateGraph3DLightingOperationCount,
  evaluateGraph3DRenderBudget,
  type Graph3DRenderBudgetResult
} from "./performance-budget.ts";
import {
  surfaceQuadFill as surfaceQuadLightingFill
} from "./surface-lighting.ts";
import {
  DEFAULT_OCCLUDED_AXIS_LIGHTNESS,
  type Axis2DObject,
  type Axis3DObject,
  type Curve2DObject,
  type Curve3DObject,
  type Graph2DObject,
  type Graph3DObject,
  type Graph3DSurfaceMode,
  type GraphPoint3D,
  type NumericDomain,
  type Surface3DObject
} from "../semantic/graph.ts";
import { findLineSurfaceIntersections } from "./graph-space-intersections.ts";
import {
  projectQuadToShadowPlane,
  type GraphQuad3D
} from "./surface-shadow.ts";

export { projectGraphPoint3D } from "./projection.ts";

export interface GraphPoint {
  x: number;
  y: number;
}

export interface SaddleSurfaceMorphInput {
  targetDenominator: number;
  progress: number;
}

export interface SaddleSurfaceMorphSample {
  denominator: number;
  progress: number;
  grid: readonly (readonly GraphPoint3D[])[];
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

interface SurfaceShadowQuad3D {
  rowIndex: number;
  columnIndex: number;
  projectedCorners: readonly [
    ProjectedGraphPoint3D,
    ProjectedGraphPoint3D,
    ProjectedGraphPoint3D,
    ProjectedGraphPoint3D
  ];
}

interface SurfaceShadowDebugSample {
  surface: Surface3DObject;
  quad: SurfaceShadowQuad3D;
}

interface RenderedSurface3D {
  surface: Surface3DObject;
  drawBorder: boolean;
  evaluateSurface?: CompiledExpression;
  generatedSurface?: GeneratedSurface3DKind;
  gradient?: SurfaceGradientEvaluators;
  grid: readonly (readonly GraphPoint3D[])[];
  quads: readonly SurfaceQuad3D[];
  shadowQuads: readonly SurfaceShadowQuad3D[];
}

type GeneratedSurface3DKind =
  | "hyperplane-negative"
  | "hyperplane-positive"
  | "torus";
type SurfaceLineDirection = "x" | "y";
type SurfaceVisualBoundary = "mesh-edge";

interface SurfaceEdgeSegment3D extends ProjectedLine3D {
  direction: SurfaceLineDirection | undefined;
  graphFrom: GraphPoint3D;
  graphTo: GraphPoint3D;
  visualBoundary: SurfaceVisualBoundary;
  visibility: AxisVisibility;
}

interface SurfaceEdgeSegments3DResult {
  analyticSplitCount: number;
  segments: readonly SurfaceEdgeSegment3D[];
}

interface SurfaceMeshEdge3D {
  line: GraphLine3D;
  visualBoundary: SurfaceVisualBoundary;
}

interface SurfaceMeshLineSegment3D extends ProjectedLine3D {
  direction: SurfaceLineDirection | undefined;
  graphFrom: GraphPoint3D;
  graphTo: GraphPoint3D;
  lineIndex: number;
  meshAxis: "column" | "row";
  segmentIndex: string;
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

interface ProjectedAxisArrowGeometry3D {
  arrowLength: number;
  depthPoints: readonly [
    ProjectedGraphPoint3D,
    ProjectedGraphPoint3D,
    ProjectedGraphPoint3D
  ];
  points: readonly [GraphPoint, GraphPoint, GraphPoint];
}

type ProjectedLine3D = ProjectedGraphLine3D;

interface ProjectedAxisSegment3D extends ProjectedLine3D {
  isNegativeEnd: boolean;
  isPositiveEnd: boolean;
  visibility: AxisVisibility;
}

type AxisArrowObstruction = "none" | "partial";

interface ProjectedAxisArrow3D extends ProjectedAxisSegment3D {
  obstruction: AxisArrowObstruction;
  segmentVisibility: AxisVisibility;
}

interface SurfaceGradientEvaluators {
  dx: CompiledExpression;
  dy: CompiledExpression;
}

type AxisVisibility = "hidden" | "visible";

const AXIS_EXTENSION_RATIO = 0.15;
const AXIS_OCCLUSION_SEGMENT_COUNT = 256;
const GRAPH_INTERSECTION_VISIBILITY_SPLIT_DEPTH = 10;
const SURFACE_MESH_STROKE_WIDTH = 1.25;
const AXIS_TO_MESH_STROKE_RATIO = 2;
const AXIS_STROKE_EXTRA_PX = 1;
const VISIBLE_AXIS_STROKE_COLOR = "#000000";
const OCCLUDED_AXIS_HUE_DEGREES = 202;
const OCCLUDED_AXIS_SATURATION_PERCENT = 17;
const SURFACE_EDGE_SEGMENT_SUBDIVISIONS = 12;
const AXIS_SURFACE_CONTACT_EPSILON = 0.12;
const AXIS_ARROW_CLEARANCE_EPSILON = 0.12;
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
  const evaluateX = compileExpression(curve.expressions.x);
  const evaluateY = compileExpression(curve.expressions.y);
  const evaluateZ = compileExpression(curve.expressions.z);

  return sampleDomain(curve.tDomain, curve.sampleCount).map((t) => {
    const scope = { t };

    return {
      x: roundCoordinate(evaluateX(scope)),
      y: roundCoordinate(evaluateY(scope)),
      z: roundCoordinate(evaluateZ(scope))
    };
  });
}

export function sampleSaddleSurface(
  surface: Surface3DObject
): readonly (readonly GraphPoint3D[])[] {
  const evaluateSurface = compileExpression(surface.expression);

  return sampleSurfaceGrid(surface, evaluateSurface);
}

export function sampleSaddleSurfaceMorph(
  surface: Surface3DObject,
  input: SaddleSurfaceMorphInput
): SaddleSurfaceMorphSample {
  if (surface.parameterization?.kind !== "saddle") {
    throw new Error(`Surface ${surface.id} is not a parameterized saddle.`);
  }

  const progress = clamp(input.progress, 0, 1);
  const denominator = roundCoordinate(
    lerp(
      surface.parameterization.denominator,
      input.targetDenominator,
      progress
    )
  );
  const evaluateSurface = compileExpression(
    createSaddleSurfaceExpression(denominator)
  );

  return {
    denominator,
    progress,
    grid: sampleSurfaceGrid(surface, evaluateSurface)
  };
}

function sampleSurfaceGrid(
  surface: Surface3DObject,
  evaluateSurface: CompiledExpression
): readonly (readonly GraphPoint3D[])[] {
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
  const surfaceMode = graphSurfaceMode(graph);
  const renderedSurfaces = prepareGraphSurfaces3D(surfaces, graph, surfaceMode);
  const depthScene = buildSurfaceDepthScene3D(graph, renderedSurfaces);
  const depthDiagnostics = depthSceneDiagnostics(depthScene);
  const surfaceQuadCount = renderedSurfaces.reduce(
    (count, surface) => count + surface.quads.length,
    0
  );
  const renderBudget = evaluateGraph3DRenderBudget({
    depthCellCount: depthDiagnostics.depthCellCount,
    depthTriangleCount: depthDiagnostics.triangleCount,
    lightingOperationCount: estimateGraph3DLightingOperationCount(
      surfaceQuadCount,
      graph.light
    ),
    overlapCount: depthDiagnostics.overlapCount,
    surfaceCount: depthDiagnostics.surfaceCount
  });
  const debugOverlay = graph.debug.depthOverlay
    ? renderDepthDebugOverlay3D(graph, depthScene)
    : "";
  const shadowDebugOverlay = graph.debug.shadowOverlay
    ? renderShadowDebugOverlay3D(renderedSurfaces)
    : "";

  // Axes are drawn in two semantic layers: hidden pieces under the opaque
  // surface, then visible pieces above it. This gives SVG a lightweight
  // substitute for depth-buffered axis occlusion.
  return `
    <svg class="graph-svg graph-svg--3d" data-kp-object="${escapeHtml(graph.id)}" data-kp-render-node="rn-${escapeHtml(graph.id)}-svg" data-kp-type="graph-3d" data-kp-surface-mode="${surfaceMode}" data-kp-camera-azimuth-degrees="${formatNumber(graph.camera.azimuthDegrees)}" data-kp-occluded-axis-lightness="${formatNumber(graphOccludedAxisLightness(graph))}" ${renderLightAttributes(graph)} data-kp-debug-depth-overlay="${graph.debug.depthOverlay ? "true" : "false"}" data-kp-debug-surface-mesh="${graph.debug.surfaceMesh ? "true" : "false"}" data-kp-debug-shadow-overlay="${graph.debug.shadowOverlay ? "true" : "false"}" ${renderDepthDiagnosticsAttributes(depthDiagnostics)} ${renderShadowAttributes(renderedSurfaces, graph)} ${renderPerformanceBudgetAttributes(renderBudget)} viewBox="0 0 ${graph.width} ${graph.height}" role="img" aria-label="${escapeHtml(graph.label)}">
      <rect class="graph-svg__background" x="0" y="0" width="${graph.width}" height="${graph.height}" rx="8" />
      ${renderedSurfaces.map((surface) => renderSurfaceShadowLayer3D(surface, graph)).join("")}
      ${renderedSurfaces.map((surface) => renderSurface3D(surface, graph, depthScene, renderedSurfaces)).join("")}
      ${axes.map((axis) => renderAxis3D(axis, graph, depthScene, renderedSurfaces, "hidden")).join("")}
      ${axes.map((axis) => renderAxis3D(axis, graph, depthScene, renderedSurfaces, "visible")).join("")}
      ${curves.map((curve) => renderCurve3D(curve, graph, depthScene)).join("")}
      ${debugOverlay}
      ${shadowDebugOverlay}
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

function renderShadowAttributes(
  surfaces: readonly RenderedSurface3D[],
  graph: Graph3DObject
): string {
  const shadowQuadCount = surfaces.reduce(
    (count, surface) => count + surface.shadowQuads.length,
    0
  );

  return [
    `data-kp-shadow-plane-z="${formatNumber(graph.zDomain[0])}"`,
    `data-kp-shadow-quad-count="${shadowQuadCount}"`,
    `data-kp-shadow-enabled="${graph.shadow.enabled ? "true" : "false"}"`,
    `data-kp-shadow-opacity="${formatNumber(graph.shadow.opacity)}"`
  ].join(" ");
}

function renderPerformanceBudgetAttributes(
  result: Graph3DRenderBudgetResult
): string {
  return [
    `data-kp-render-budget-status="${result.status}"`,
    `data-kp-render-budget-depth-cell-count="${result.cost.depthCellCount}"`,
    `data-kp-render-budget-max-depth-cell-count="${result.budget.maxDepthCellCount}"`,
    `data-kp-render-budget-depth-triangle-count="${result.cost.depthTriangleCount}"`,
    `data-kp-render-budget-max-depth-triangle-count="${result.budget.maxDepthTriangleCount}"`,
    `data-kp-render-budget-lighting-operation-count="${result.cost.lightingOperationCount}"`,
    `data-kp-render-budget-max-lighting-operation-count="${result.budget.maxLightingOperationCount}"`,
    `data-kp-render-budget-surface-count="${result.cost.surfaceCount}"`,
    `data-kp-render-budget-max-surface-count="${result.budget.maxSurfaceCount}"`,
    `data-kp-render-budget-overlap-count="${result.cost.overlapCount}"`,
    `data-kp-render-budget-max-overlap-count="${result.budget.maxOverlapCount}"`,
    `data-kp-render-budget-issue-count="${result.issues.length}"`
  ].join(" ");
}

function renderLightAttributes(graph: Graph3DObject): string {
  return [
    `data-kp-light-direction="${formatPoint3D(graph.light.direction)}"`,
    `data-kp-light-ambient="${formatNumber(graph.light.ambient)}"`,
    `data-kp-light-diffuse="${formatNumber(graph.light.diffuse)}"`,
    `data-kp-light-depth-haze="${formatNumber(graph.light.depthHaze)}"`,
    `data-kp-light-specular="${formatNumber(graph.light.specular)}"`,
    `data-kp-light-rim="${formatNumber(graph.light.rim)}"`
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

function renderShadowDebugOverlay3D(
  surfaces: readonly RenderedSurface3D[]
): string {
  const samples = surfaces.flatMap((surface) =>
    surface.shadowQuads.map((quad): SurfaceShadowDebugSample => ({
      surface: surface.surface,
      quad
    }))
  ).slice(0, 12);

  if (samples.length === 0) {
    return "";
  }

  return `
    <g class="graph-debug-overlay graph-debug-overlay--shadow" data-kp-debug-overlay="shadow-projection" data-kp-debug-shadow-sample-count="${samples.length}">
      ${samples.map((sample, index) => renderShadowDebugSample(sample, index)).join("")}
    </g>
  `;
}

function renderShadowDebugSample(
  sample: SurfaceShadowDebugSample,
  index: number
): string {
  const points = sample.quad.projectedCorners
    .map((point) => `${formatNumber(point.x)},${formatNumber(point.y)}`)
    .join(" ");

  return `<polygon class="graph-debug-overlay__shadow-quad" points="${points}" data-kp-object="${escapeHtml(sample.surface.id)}" data-kp-debug-shadow-sample="${index}" data-kp-cell="${sample.quad.rowIndex},${sample.quad.columnIndex}" fill="none" stroke="#be123c" stroke-width="1.200" opacity="0.850" />`;
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
  surfaces: readonly RenderedSurface3D[],
  visibilityLayer: AxisVisibility
): string {
  const extendedDomain = extendDomain(axis.domain, AXIS_EXTENSION_RATIO);
  const analyticSplitValues = axisSurfaceSplitValues3D(
    axis,
    extendedDomain,
    surfaces
  );
  const allSegments = axisSegments3D(
    axis,
    extendedDomain,
    graph,
    depthScene,
    analyticSplitValues
  );
  const segments = allSegments.filter(
    (segment) => segment.visibility === visibilityLayer
  );
  const axisRole =
    axis.orientation === "z" ? "graph-axis--subtle" : "graph-axis--base-plane";
  const negativeArrowSegment = axisArrowSegment3D(
    allSegments,
    graph,
    depthScene,
    "negative-end"
  );
  const positiveArrowSegment = axisArrowSegment3D(
    allSegments,
    graph,
    depthScene,
    "positive-end"
  );

  return `
    <g class="graph-axis graph-axis--3d graph-axis--${axis.orientation} ${axisRole}" data-kp-object="${escapeHtml(axis.id)}" data-kp-render-node="rn-${escapeHtml(axis.id)}-svg-line-${visibilityLayer}" data-kp-type="axis-3d" data-kp-axis-extended-domain="${formatDomain(extendedDomain)}" data-kp-axis-extension-ratio="${AXIS_EXTENSION_RATIO}" data-kp-axis-visibility-layer="${visibilityLayer}" data-kp-axis-split-source="analytic-surface+depth-buffer" data-kp-axis-analytic-split-count="${analyticSplitValues.length}" data-kp-axis-occlusion-segment-count="${AXIS_OCCLUSION_SEGMENT_COUNT}" data-kp-axis-visibility-split-depth="${GRAPH_INTERSECTION_VISIBILITY_SPLIT_DEPTH}">
      ${segments.map((segment) => renderAxisSegment3D(segment, graph)).join("")}
      ${negativeArrowSegment === undefined || negativeArrowSegment.visibility !== visibilityLayer ? "" : renderAxisArrow3D(negativeArrowSegment, graph, "negative-end")}
      ${positiveArrowSegment === undefined || positiveArrowSegment.visibility !== visibilityLayer ? "" : renderAxisArrow3D(positiveArrowSegment, graph, "positive-end")}
    </g>
  `;
}

function axisArrowSegment3D(
  segments: readonly ProjectedAxisSegment3D[],
  graph: Graph3DObject,
  depthScene: DepthScene,
  arrowEnd: AxisArrowEnd
): ProjectedAxisArrow3D | undefined {
  const segment = segments.find((candidate) =>
    arrowEnd === "negative-end"
      ? candidate.isNegativeEnd
      : candidate.isPositiveEnd
  );

  if (segment === undefined) {
    return undefined;
  }

  const obstruction = axisArrowObstruction(
    segment,
    graph,
    depthScene,
    arrowEnd
  );
  const visibility = segment.visibility === "visible" && obstruction === "none"
    ? "visible"
    : "hidden";

  return {
    ...segment,
    obstruction,
    segmentVisibility: segment.visibility,
    visibility
  };
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
  line: ProjectedAxisArrow3D,
  graph: Graph3DObject,
  arrowEnd: AxisArrowEnd
): string {
  const endpoint = arrowEnd === "negative-end" ? line.from : line.to;
  const depthWeight = lineDepthWeight(graph, endpoint.depth);
  const geometry = axisArrowGeometry3D(line, graph, arrowEnd, line.visibility);
  const opacity = axisOpacity(line.visibility, depthWeight);
  const fillColor = axisStrokeColor(line.visibility, graph);

  return `<polygon class="graph-axis__arrow" data-kp-axis-arrow="${arrowEnd}" data-kp-visibility="${line.visibility}" data-kp-visibility-source="depth-buffer" data-kp-axis-arrow-visibility-source="arrow-footprint-depth-buffer" data-kp-axis-arrow-occlusion-policy="fully-unobstructed-or-muted" data-kp-axis-arrow-obstruction="${line.obstruction}" data-kp-axis-arrow-end-segment-visibility="${line.segmentVisibility}" data-kp-depth-weight="${formatNumber(depthWeight)}" data-kp-axis-tip="${formatPoint(endpoint)}" data-kp-axis-endpoint="${formatPoint(endpoint)}" data-kp-arrow-length="${formatNumber(geometry.arrowLength)}" fill="${fillColor}" opacity="${formatNumber(opacity)}" points="${formatPoints(geometry.points)}" />`;
}

function axisOcclusionTreatment(visibility: AxisVisibility): "muted" | "strong" {
  return visibility === "hidden" ? "muted" : "strong";
}

function axisOpacity(visibility: AxisVisibility, depthWeight: number): number {
  return visibility === "hidden"
    ? 0.62
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
      projectGraphLine3D(graph, { from, to }),
      { maxDepth: GRAPH_INTERSECTION_VISIBILITY_SPLIT_DEPTH }
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

  return `<path class="graph-curve__segment" d="${pathData}" data-kp-object="${escapeHtml(curve.id)}" data-kp-curve-segment="${index}" data-kp-visibility="${segment.visibility}" data-kp-visibility-source="depth-buffer" data-kp-visibility-split-depth="${GRAPH_INTERSECTION_VISIBILITY_SPLIT_DEPTH}" data-kp-depth="${formatNumber(segment.averageDepth)}" data-kp-depth-weight="${formatNumber(depthWeight)}" data-kp-type="curve-3d" opacity="${formatNumber(opacity)}" />`;
}

function graphSurfaceMode(graph: Graph3DObject): Graph3DSurfaceMode {
  return graph.surfaceMode ?? "mesh";
}

function prepareGraphSurfaces3D(
  surfaces: readonly Surface3DObject[],
  graph: Graph3DObject,
  surfaceMode: Graph3DSurfaceMode
): readonly RenderedSurface3D[] {
  switch (surfaceMode) {
    case "mesh":
      return surfaces.map((surface) => prepareSurface3D(surface, graph));
    case "donut":
      return [prepareGeneratedSurface3D(
        graph,
        "torus",
        `${graph.id}-donut`,
        "donut",
        "parametric torus",
        sampleTorusSurfaceGrid()
      )];
    case "hyperplanes":
      return [
        prepareGeneratedSurface3D(
          graph,
          "hyperplane-positive",
          `${graph.id}-hyperplane-positive`,
          "z = x / 2",
          "z = x / 2",
          sampleHyperplaneSurfaceGrid(0.5)
        ),
        prepareGeneratedSurface3D(
          graph,
          "hyperplane-negative",
          `${graph.id}-hyperplane-negative`,
          "z = -x / 2",
          "z = -x / 2",
          sampleHyperplaneSurfaceGrid(-0.5)
        )
      ];
  }
}

function prepareSurface3D(
  surface: Surface3DObject,
  graph: Graph3DObject
): RenderedSurface3D {
  const evaluateSurface = compileExpression(surface.expression);
  const gradient = compileSurfaceGradient(surface);
  const grid = sampleSurfaceGrid(surface, evaluateSurface);
  const quads = createSurfaceQuads(surface, graph, grid, (center) =>
    saddleSurfaceNormalAt(center, gradient)
  );

  return {
    surface,
    drawBorder: true,
    evaluateSurface,
    gradient,
    grid,
    quads,
    shadowQuads: createSurfaceShadowQuads(graph, quads)
  };
}

function prepareGeneratedSurface3D(
  graph: Graph3DObject,
  generatedSurface: GeneratedSurface3DKind,
  id: string,
  label: string,
  equation: string,
  grid: readonly (readonly GraphPoint3D[])[]
): RenderedSurface3D {
  const firstRow = grid[0] ?? [];
  const surface: Surface3DObject = {
    id,
    type: "surface-3d",
    graphId: graph.id,
    label,
    equation,
    expression: constant(0),
    xDomain: graph.xDomain,
    yDomain: graph.yDomain,
    xSampleCount: firstRow.length,
    ySampleCount: grid.length
  };
  const quads = createSurfaceQuads(surface, graph, grid, (_center, corners) =>
    surfaceQuadNormal(corners)
  );

  return {
    surface,
    drawBorder: generatedSurface !== "torus",
    generatedSurface,
    grid,
    quads,
    shadowQuads: createSurfaceShadowQuads(graph, quads)
  };
}

function sampleTorusSurfaceGrid(): readonly (readonly GraphPoint3D[])[] {
  const majorRadius = 1.55;
  const minorRadius = 0.62;
  const uValues = sampleDomain([0, Math.PI * 2], 25);
  const vValues = sampleDomain([0, Math.PI * 2], 13);

  return vValues.map((v) =>
    uValues.map((u) => {
      const tubeRadius = majorRadius + minorRadius * Math.cos(v);

      return {
        x: roundCoordinate(tubeRadius * Math.cos(u)),
        y: roundCoordinate(tubeRadius * Math.sin(u)),
        z: roundCoordinate(minorRadius * Math.sin(v))
      };
    })
  );
}

function sampleHyperplaneSurfaceGrid(
  slope: number
): readonly (readonly GraphPoint3D[])[] {
  const domain: NumericDomain = [-2.4, 2.4];

  return sampleDomain(domain, 13).map((y) =>
    sampleDomain(domain, 13).map((x) => ({
      x: roundCoordinate(x),
      y: roundCoordinate(y),
      z: roundCoordinate(slope * x)
    }))
  );
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
  depthScene: DepthScene,
  surfaces: readonly RenderedSurface3D[]
): string {
  const { surface, grid, quads } = renderedSurface;
  const edgeResult = surfaceEdgeSegments3D(
    renderedSurface,
    graph,
    depthScene,
    surfaces
  );
  const edgeSegments = edgeResult.segments;
  const meshSegments = surfaceMeshLineSegments3D(
    renderedSurface,
    graph,
    depthScene
  );
  const rowPaths = grid.map((row) =>
    renderSurfaceDebugPath(row, graph, "graph-surface__line--row")
  );
  const columnPaths = transposeGrid(grid).map((column) =>
    renderSurfaceDebugPath(column, graph, "graph-surface__line--column")
  );
  const wireframe = graph.debug.surfaceMesh
    ? renderSurfaceWireframe(surface, rowPaths, columnPaths)
    : "";

  return `
    <g class="graph-surface" data-kp-object="${escapeHtml(surface.id)}" data-kp-render-node="rn-${escapeHtml(surface.id)}-svg" data-kp-type="surface-3d"${renderGeneratedSurfaceAttribute(renderedSurface)}>
      <g class="graph-surface__quads" data-kp-object="${escapeHtml(surface.id)}" data-kp-render-node="rn-${escapeHtml(surface.id)}-svg-quads" data-kp-type="surface-3d" data-kp-depth-order="back-to-front">
        ${surfaceQuadsBackToFront(quads).map((quad) => renderSurfaceQuad(surface, quad, graph)).join("")}
      </g>
      ${renderSurfaceMesh(renderedSurface, meshSegments, graph)}
      ${wireframe}
      ${renderSurfaceEdgeOutline(renderedSurface, edgeSegments, graph, "visible", edgeResult.analyticSplitCount)}
    </g>
  `;
}

function renderGeneratedSurfaceAttribute(surface: RenderedSurface3D): string {
  return surface.generatedSurface === undefined
    ? ""
    : ` data-kp-generated-surface="${surface.generatedSurface}"`;
}

function renderSurfaceShadowLayer3D(
  renderedSurface: RenderedSurface3D,
  graph: Graph3DObject
): string {
  const { surface, shadowQuads } = renderedSurface;

  if (shadowQuads.length === 0) {
    return "";
  }

  return `
    <g class="graph-surface-shadow-layer" data-kp-object="${escapeHtml(surface.id)}" data-kp-render-node="rn-${escapeHtml(surface.id)}-svg-shadow-layer" data-kp-type="surface-3d" data-kp-shadow-plane-z="${formatNumber(graph.zDomain[0])}" data-kp-shadow-quad-count="${shadowQuads.length}" data-kp-shadow-projection="light-to-z-plane">
      ${shadowQuads.map((quad) => renderSurfaceShadowQuad(surface, quad, graph)).join("")}
    </g>
  `;
}

function renderSurfaceShadowQuad(
  surface: Surface3DObject,
  quad: SurfaceShadowQuad3D,
  graph: Graph3DObject
): string {
  const points = quad.projectedCorners
    .map((point) => `${formatNumber(point.x)},${formatNumber(point.y)}`)
    .join(" ");

  return `<polygon class="graph-surface__shadow" points="${points}" data-kp-object="${escapeHtml(surface.id)}" data-kp-shadow-caster="${escapeHtml(surface.id)}" data-kp-cell="${quad.rowIndex},${quad.columnIndex}" data-kp-shadow-projection="light-to-z-plane" data-kp-type="surface-3d" fill="#0f172a" opacity="${formatNumber(graph.shadow.opacity)}" />`;
}

function renderSurfaceWireframe(
  surface: Surface3DObject,
  rowPaths: readonly string[],
  columnPaths: readonly string[]
): string {
  return `
    <g class="graph-surface__wireframe" data-kp-object="${escapeHtml(surface.id)}" data-kp-render-node="rn-${escapeHtml(surface.id)}-svg-wireframe" data-kp-type="surface-3d" data-kp-surface-mesh="debug">
      ${rowPaths.join("")}
      ${columnPaths.join("")}
    </g>
  `;
}

function createSurfaceShadowQuads(
  graph: Graph3DObject,
  quads: readonly SurfaceQuad3D[]
): readonly SurfaceShadowQuad3D[] {
  if (!graph.shadow.enabled) {
    return [];
  }

  const planeZ = graph.zDomain[0];

  return quads.flatMap((quad) => {
    const projectedQuad = projectQuadToShadowPlane({
      corners: quad.corners,
      lightDirection: graph.light.direction,
      planeZ
    });

    if (projectedQuad === undefined) {
      return [];
    }

    return [{
      rowIndex: quad.rowIndex,
      columnIndex: quad.columnIndex,
      projectedCorners: projectGraphQuad3D(graph, projectedQuad)
    }];
  });
}

function projectGraphQuad3D(
  graph: Graph3DObject,
  quad: GraphQuad3D
): SurfaceShadowQuad3D["projectedCorners"] {
  return [
    projectGraphPoint3D(graph, quad[0]),
    projectGraphPoint3D(graph, quad[1]),
    projectGraphPoint3D(graph, quad[2]),
    projectGraphPoint3D(graph, quad[3])
  ];
}

function surfaceQuadsBackToFront(
  quads: readonly SurfaceQuad3D[]
): readonly SurfaceQuad3D[] {
  return [...quads].sort(
    (left, right) => left.averageDepth - right.averageDepth
  );
}

function renderSurfaceQuad(
  surface: Surface3DObject,
  quad: SurfaceQuad3D,
  graph: Graph3DObject
): string {
  const points = quad.projectedCorners
    .map((point) => `${formatNumber(point.x)},${formatNumber(point.y)}`)
    .join(" ");

  return `<polygon class="graph-surface__quad" points="${points}" data-kp-object="${escapeHtml(surface.id)}" data-kp-cell="${quad.rowIndex},${quad.columnIndex}" data-kp-facing="${quad.facing}" data-kp-surface-depth="${formatNumber(quad.averageDepth)}" data-kp-depth-haze="${formatNumber(quad.depthHaze)}" data-kp-lighting-model="ambient-diffuse-specular-rim-depth-haze" ${renderLightAttributes(graph)} data-kp-type="surface-3d" fill="${quad.fill}" fill-opacity="1" opacity="1" />`;
}

function renderSurfaceDebugPath(
  points: readonly GraphPoint3D[],
  graph: Graph3DObject,
  className: string
): string {
  const projectedPoints = points.map((point) => projectGraphPoint3D(graph, point));
  const pathData = pointsToSmoothPathData(projectedPoints);

  if (pathData.length === 0) {
    return "";
  }

  return `<path class="graph-surface__line ${className}" d="${pathData}" data-kp-smoothing="catmull-rom" />`;
}

function renderSurfaceMesh(
  renderedSurface: RenderedSurface3D,
  segments: readonly SurfaceMeshLineSegment3D[],
  graph: Graph3DObject
): string {
  if (segments.length === 0) {
    return "";
  }

  const { surface } = renderedSurface;
  const smoothingAttributes = renderedSurface.gradient === undefined
    ? ' data-kp-smoothing="projected-line"'
    : ' data-kp-smoothing="ad-gradient-bezier" data-kp-derivative-source="automatic-differentiation"';

  return `<g class="graph-surface__mesh" data-kp-object="${escapeHtml(surface.id)}" data-kp-render-node="rn-${escapeHtml(surface.id)}-svg-mesh" data-kp-type="surface-3d" data-kp-surface-mesh="visible" data-kp-mesh-visibility-split-depth="${GRAPH_INTERSECTION_VISIBILITY_SPLIT_DEPTH}"${smoothingAttributes}>
    ${segments.map((segment, index) => renderSurfaceMeshSegment(renderedSurface, segment, graph, index)).join("")}
  </g>`;
}

function renderSurfaceMeshSegment(
  renderedSurface: RenderedSurface3D,
  segment: SurfaceMeshLineSegment3D,
  graph: Graph3DObject,
  index: number
): string {
  const { pathData, geometry, smoothingAttributes } = surfaceSegmentPathData(
    renderedSurface,
    segment.graphFrom,
    segment.graphTo,
    graph,
    segment.direction
  );
  const { surface } = renderedSurface;

  if (pathData.length === 0) {
    return "";
  }

  return `<path class="graph-surface__mesh-line graph-surface__mesh-line--${segment.meshAxis}" d="${pathData}" data-kp-object="${escapeHtml(surface.id)}" data-kp-mesh-segment="${index}" data-kp-mesh-line="${segment.meshAxis}-${segment.lineIndex}" data-kp-mesh-line-segment="${segment.segmentIndex}"${segment.direction === undefined ? "" : ` data-kp-line-direction="${segment.direction}"`} data-kp-visibility="${segment.visibility}" data-kp-visibility-source="depth-buffer" data-kp-visibility-split-depth="${GRAPH_INTERSECTION_VISIBILITY_SPLIT_DEPTH}"${smoothingAttributes} data-kp-geometry="${geometry}" data-kp-type="surface-3d" />`;
}

function renderSurfaceEdgeOutline(
  renderedSurface: RenderedSurface3D,
  edgeSegments: readonly SurfaceEdgeSegment3D[],
  graph: Graph3DObject,
  visibility: AxisVisibility,
  analyticSplitCount: number
): string {
  const { surface } = renderedSurface;
  const matchingSegments = edgeSegments.filter(
    (segment) => segment.visibility === visibility
  );

  if (matchingSegments.length === 0) {
    return "";
  }

  return `<g class="graph-surface__edge-outline-layer" data-kp-object="${escapeHtml(surface.id)}" data-kp-render-node="rn-${escapeHtml(surface.id)}-svg-edge-outline-${visibility}" data-kp-type="surface-3d" data-kp-edge-visibility="${visibility}" data-kp-edge-candidate-source="surface-mesh" data-kp-edge-split-source="analytic-surface+depth-buffer" data-kp-edge-boundary-source="mesh-edge" data-kp-edge-analytic-split-count="${analyticSplitCount}" data-kp-edge-subdivisions="${SURFACE_EDGE_SEGMENT_SUBDIVISIONS}" data-kp-edge-visibility-split-depth="${GRAPH_INTERSECTION_VISIBILITY_SPLIT_DEPTH}">
    ${renderSurfaceEdgePathBatch(renderedSurface, matchingSegments, graph, visibility)}
  </g>`;
}

function renderSurfaceEdgePathBatch(
  renderedSurface: RenderedSurface3D,
  segments: readonly SurfaceEdgeSegment3D[],
  graph: Graph3DObject,
  visibility: AxisVisibility
): string {
  const pathParts = segments
    .map((segment) => ({
      segment,
      path: surfaceSegmentPathData(
        renderedSurface,
        segment.graphFrom,
        segment.graphTo,
        graph,
        segment.direction
      )
    }))
    .filter(({ path }) => path.pathData.length > 0);

  if (pathParts.length === 0) {
    return "";
  }

  const { surface } = renderedSurface;
  const depths = pathParts.map(({ segment }) => segment.averageDepth);
  const averageDepth =
    depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
  const minDepth = Math.min(...depths);
  const maxDepth = Math.max(...depths);
  const depthWeight = lineDepthWeight(graph, averageDepth);
  const opacity = visibility === "hidden"
    ? SURFACE_EDGE_OCCLUDED_OPACITY
    : SURFACE_EDGE_VISIBLE_OPACITY;
  const geometries = uniqueStrings(pathParts.map(({ path }) => path.geometry));
  const geometry = geometries.length === 1 ? geometries[0] : "mixed";
  const smoothingValues = uniqueStrings(
    pathParts.map(({ path }) => path.smoothingAttributes)
  );
  const smoothingAttributes =
    smoothingValues.length === 1 ? smoothingValues[0] : "";
  const visualEdgeSources = uniqueStrings(
    pathParts.map(({ segment }) => segment.visualBoundary)
  );
  const visualEdgeSource = visualEdgeSources.join(",");
  const pathData = pathParts.map(({ path }) => path.pathData).join(" ");

  return `<path class="graph-surface__edge-outline" d="${pathData}" data-kp-object="${escapeHtml(surface.id)}" data-kp-edge-batch="compound-path" data-kp-edge-segment-count="${pathParts.length}" data-kp-edge-visibility="${visibility}" data-kp-visibility-source="depth-buffer" data-kp-visibility-split-depth="${GRAPH_INTERSECTION_VISIBILITY_SPLIT_DEPTH}" data-kp-visual-edge="true" data-kp-visual-edge-source="${escapeHtml(visualEdgeSource)}" data-kp-depth="${formatNumber(averageDepth)}" data-kp-depth-range="${formatNumber(minDepth)},${formatNumber(maxDepth)}" data-kp-depth-weight="${formatNumber(depthWeight)}" data-kp-geometry="${geometry}"${smoothingAttributes} data-kp-type="surface-3d" opacity="${formatNumber(opacity)}" />`;
}

function surfaceEdgeSegments3D(
  renderedSurface: RenderedSurface3D,
  graph: Graph3DObject,
  depthScene: DepthScene,
  surfaces: readonly RenderedSurface3D[]
): SurfaceEdgeSegments3DResult {
  if (!renderedSurface.drawBorder) {
    return {
      analyticSplitCount: 0,
      segments: []
    };
  }

  const meshEdges = surfaceMeshEdges3D(renderedSurface.quads);

  if (meshEdges.length === 0) {
    return {
      analyticSplitCount: 0,
      segments: []
    };
  }

  let analyticSplitCount = 0;
  const segments = meshEdges.flatMap((edge) => {
    const analyticBreakpoints = surfaceEdgeAnalyticSplitTs3D(
      renderedSurface,
      surfaces,
      edge.line
    );
    const breakpoints = sortedUniqueNumbers([
      ...sampleDomain([0, 1], SURFACE_EDGE_SEGMENT_SUBDIVISIONS + 1),
      ...analyticBreakpoints
    ]);

    analyticSplitCount += analyticBreakpoints.length;

    return breakpoints.flatMap((start, breakpointIndex) => {
      const end = breakpoints[breakpointIndex + 1];

      if (end === undefined) {
        return [];
      }

      const segmentStart = interpolateGraphPoint3D(edge.line.from, edge.line.to, start);
      const segmentEnd = interpolateGraphPoint3D(edge.line.from, edge.line.to, end);
      const projectedLine = projectGraphLine3D(graph, {
        from: segmentStart,
        to: segmentEnd
      });

      return segmentProjectedLineByVisibility(
        depthScene,
        projectedLine,
        { maxDepth: GRAPH_INTERSECTION_VISIBILITY_SPLIT_DEPTH }
      )
        .filter((segment) =>
          segment.visibility === "visible"
        )
        .map((segment) => {
          const graphFrom = graphPointAtProjectedLinePoint(
            renderedSurface,
            segmentStart,
            segmentEnd,
            projectedLine,
            segment.from
          );
          const graphTo = graphPointAtProjectedLinePoint(
            renderedSurface,
            segmentStart,
            segmentEnd,
            projectedLine,
            segment.to
          );

          return {
            ...segment,
            direction:
              renderedSurface.gradient === undefined
                ? undefined
                : surfaceLineDirection(graphFrom, graphTo),
            graphFrom,
            graphTo,
            visualBoundary: edge.visualBoundary
          };
        });
    });
  });

  return {
    analyticSplitCount,
    segments
  };
}

function surfaceMeshLineSegments3D(
  renderedSurface: RenderedSurface3D,
  graph: Graph3DObject,
  depthScene: DepthScene
): readonly SurfaceMeshLineSegment3D[] {
  const rowSegments = renderedSurface.grid.flatMap((row, rowIndex) =>
    surfaceMeshPolylineSegments3D(
      renderedSurface,
      graph,
      depthScene,
      row,
      "x",
      "row",
      rowIndex
    )
  );
  const columnSegments = transposeGrid(renderedSurface.grid).flatMap(
    (column, columnIndex) =>
      surfaceMeshPolylineSegments3D(
        renderedSurface,
        graph,
        depthScene,
        column,
        "y",
        "column",
        columnIndex
      )
  );

  return [...rowSegments, ...columnSegments];
}

function surfaceMeshPolylineSegments3D(
  renderedSurface: RenderedSurface3D,
  graph: Graph3DObject,
  depthScene: DepthScene,
  points: readonly GraphPoint3D[],
  direction: SurfaceLineDirection,
  meshAxis: SurfaceMeshLineSegment3D["meshAxis"],
  lineIndex: number
): readonly SurfaceMeshLineSegment3D[] {
  return points.flatMap((from, pointIndex) => {
    const to = points[pointIndex + 1];

    if (to === undefined) {
      return [];
    }

    const projectedLine = projectGraphLine3D(graph, { from, to });

    return segmentProjectedLineByVisibility(
      depthScene,
      projectedLine,
      { maxDepth: GRAPH_INTERSECTION_VISIBILITY_SPLIT_DEPTH }
    )
      .filter((segment) => segment.visibility === "visible")
      .map((segment, visibilitySegmentIndex) => ({
        ...segment,
        direction:
          renderedSurface.gradient === undefined
            ? undefined
            : direction,
        graphFrom: graphPointAtProjectedLinePoint(
          renderedSurface,
          from,
          to,
          projectedLine,
          segment.from
        ),
        graphTo: graphPointAtProjectedLinePoint(
          renderedSurface,
          from,
          to,
          projectedLine,
          segment.to
        ),
        lineIndex,
        meshAxis,
        segmentIndex: `${pointIndex}-${visibilitySegmentIndex}`
      }));
  });
}

function surfaceMeshEdges3D(
  quads: readonly SurfaceQuad3D[]
): readonly SurfaceMeshEdge3D[] {
  const edges = new Map<string, { count: number; line: GraphLine3D }>();

  for (const quad of quads) {
    for (const line of surfaceQuadEdges3D(quad)) {
      const key = graphLineKey3D(line);
      const existingEdge = edges.get(key);

      if (existingEdge === undefined) {
        edges.set(key, { count: 1, line });
      } else {
        existingEdge.count += 1;
      }
    }
  }

  return [...edges.values()]
    .filter((edge) => edge.count === 1)
    .map((edge) => ({
      line: edge.line,
      visualBoundary: "mesh-edge" as const
    }));
}

function surfaceQuadEdges3D(quad: SurfaceQuad3D): readonly GraphLine3D[] {
  const [topLeft, topRight, bottomRight, bottomLeft] = quad.corners;

  return [
    { from: topLeft, to: topRight },
    { from: topRight, to: bottomRight },
    { from: bottomRight, to: bottomLeft },
    { from: bottomLeft, to: topLeft }
  ];
}

function graphLineKey3D(line: GraphLine3D): string {
  return [graphPointKey3D(line.from), graphPointKey3D(line.to)]
    .sort()
    .join("|");
}

function graphPointKey3D(point: GraphPoint3D): string {
  return [
    roundCoordinate(point.x),
    roundCoordinate(point.y),
    roundCoordinate(point.z)
  ].join(",");
}

function surfaceEdgeAnalyticSplitTs3D(
  renderedSurface: RenderedSurface3D,
  surfaces: readonly RenderedSurface3D[],
  line: GraphLine3D
): readonly number[] {
  if (renderedSurface.evaluateSurface === undefined) {
    return [];
  }

  return sortedUniqueNumbers(
    surfaces.flatMap((surface) =>
      surface.surface.id === renderedSurface.surface.id ||
      surface.evaluateSurface === undefined
        ? []
        : findLineSurfaceIntersections(
            line,
            surface.surface.expression
          ).flatMap((intersection) =>
            intersection.t > 0 && intersection.t < 1 ? [intersection.t] : []
          )
    )
  );
}

function createSurfaceQuads(
  surface: Surface3DObject,
  graph: Graph3DObject,
  grid: readonly (readonly GraphPoint3D[])[],
  normalAt: (
    center: GraphPoint3D,
    corners: readonly [
      GraphPoint3D,
      GraphPoint3D,
      GraphPoint3D,
      GraphPoint3D
    ]
  ) => GraphPoint3D
): readonly SurfaceQuad3D[] {
  const quads: SurfaceQuad3D[] = [];
  const viewDirection = graphCameraDirection(graph);

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
      const normal = normalAt(center, corners);
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
        fill: surfaceQuadLightingFill({
          center,
          depthHaze,
          facing,
          light: graph.light,
          normal,
          viewDirection,
          xDomain: surface.xDomain,
          yDomain: surface.yDomain
        }),
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

function surfaceQuadNormal(
  corners: readonly [
    GraphPoint3D,
    GraphPoint3D,
    GraphPoint3D,
    GraphPoint3D
  ]
): GraphPoint3D {
  const [topLeft, topRight, _bottomRight, bottomLeft] = corners;

  return normalizePoint3D(
    crossPoint3D(
      subtractPoint3D(topRight, topLeft),
      subtractPoint3D(bottomLeft, topLeft)
    )
  );
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

function surfaceBezierSegmentPathData(
  from: GraphPoint3D,
  to: GraphPoint3D,
  graph: Graph3DObject,
  gradient: SurfaceGradientEvaluators,
  direction: SurfaceLineDirection
): string {
  const projectedFrom = projectGraphPoint3D(graph, from);

  return [
    `M ${formatNumber(projectedFrom.x)} ${formatNumber(projectedFrom.y)}`,
    surfaceBezierSegmentCommand(from, to, graph, gradient, direction)
  ].join(" ");
}

function surfaceSegmentPathData(
  renderedSurface: RenderedSurface3D,
  from: GraphPoint3D,
  to: GraphPoint3D,
  graph: Graph3DObject,
  direction: SurfaceLineDirection | undefined
): {
  geometry: "screen-space-bezier" | "screen-space-line";
  pathData: string;
  smoothingAttributes: string;
} {
  if (renderedSurface.gradient !== undefined && direction !== undefined) {
    return {
      geometry: "screen-space-bezier",
      pathData: surfaceBezierSegmentPathData(
        from,
        to,
        graph,
        renderedSurface.gradient,
        direction
      ),
      smoothingAttributes:
        ' data-kp-smoothing="ad-gradient-bezier" data-kp-derivative-source="automatic-differentiation"'
    };
  }

  return {
    geometry: "screen-space-line",
    pathData: pointsToPathData([
      projectGraphPoint3D(graph, from),
      projectGraphPoint3D(graph, to)
    ]),
    smoothingAttributes: ""
  };
}

function surfaceBezierSegmentCommand(
  from: GraphPoint3D,
  to: GraphPoint3D,
  graph: Graph3DObject,
  gradient: SurfaceGradientEvaluators,
  direction: SurfaceLineDirection
): string {
  const [control1, control2] = surfaceBezierControlPoints(
    from,
    to,
    gradient,
    direction
  );
  const projectedControl1 = projectGraphPoint3D(graph, control1);
  const projectedControl2 = projectGraphPoint3D(graph, control2);
  const projectedTo = projectGraphPoint3D(graph, to);

  return `C ${formatNumber(projectedControl1.x)} ${formatNumber(projectedControl1.y)} ${formatNumber(projectedControl2.x)} ${formatNumber(projectedControl2.y)} ${formatNumber(projectedTo.x)} ${formatNumber(projectedTo.y)}`;
}

function surfaceBezierControlPoints(
  from: GraphPoint3D,
  to: GraphPoint3D,
  gradient: SurfaceGradientEvaluators,
  direction: SurfaceLineDirection
): readonly [GraphPoint3D, GraphPoint3D] {
  const parameterDelta = direction === "x" ? to.x - from.x : to.y - from.y;
  const fromTangent = surfaceLineTangentAt(from, gradient, direction);
  const toTangent = surfaceLineTangentAt(to, gradient, direction);

  return [
    addScaledGraphPoint3D(from, fromTangent, parameterDelta / 3),
    addScaledGraphPoint3D(to, toTangent, -parameterDelta / 3)
  ];
}

function surfaceLineTangentAt(
  point: GraphPoint3D,
  gradient: SurfaceGradientEvaluators,
  direction: SurfaceLineDirection
): GraphPoint3D {
  const scope = { x: point.x, y: point.y };
  const dz = direction === "x" ? gradient.dx(scope) : gradient.dy(scope);
  const safeDz = Number.isFinite(dz) ? dz : 0;

  return direction === "x"
    ? { x: 1, y: 0, z: safeDz }
    : { x: 0, y: 1, z: safeDz };
}

function addScaledGraphPoint3D(
  point: GraphPoint3D,
  direction: GraphPoint3D,
  scale: number
): GraphPoint3D {
  return {
    x: point.x + direction.x * scale,
    y: point.y + direction.y * scale,
    z: point.z + direction.z * scale
  };
}

function surfaceLineDirection(
  from: GraphPoint3D,
  to: GraphPoint3D
): SurfaceLineDirection {
  return Math.abs(to.x - from.x) >= Math.abs(to.y - from.y) ? "x" : "y";
}

// Depth segmentation happens in projected space; rebuild graph-space endpoints
// so Bezier handles still follow the analytic surface instead of the split line.
function graphPointAtProjectedLinePoint(
  renderedSurface: RenderedSurface3D,
  from: GraphPoint3D,
  to: GraphPoint3D,
  projectedLine: ProjectedLine3D,
  projectedPoint: ProjectedGraphPoint3D
): GraphPoint3D {
  const t = projectedLineT(projectedLine, projectedPoint);

  return renderedSurface.evaluateSurface === undefined
    ? interpolateGraphPoint3D(from, to, t)
    : surfacePointAtLineT(renderedSurface.evaluateSurface, from, to, t);
}

function surfacePointAtLineT(
  evaluateSurface: CompiledExpression,
  from: GraphPoint3D,
  to: GraphPoint3D,
  t: number
): GraphPoint3D {
  const x = from.x + (to.x - from.x) * t;
  const y = from.y + (to.y - from.y) * t;

  return {
    x,
    y,
    z: evaluateSurface({ x, y })
  };
}

function projectedLineT(
  line: ProjectedLine3D,
  point: ProjectedGraphPoint3D
): number {
  const dx = line.to.x - line.from.x;
  const dy = line.to.y - line.from.y;
  const dz = line.to.depth - line.from.depth;
  const denominator = dx * dx + dy * dy + dz * dz;

  if (denominator === 0) {
    return 0;
  }

  return clamp(
    ((point.x - line.from.x) * dx +
      (point.y - line.from.y) * dy +
      (point.depth - line.from.depth) * dz) /
      denominator,
    0,
    1
  );
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

function axisArrowObstruction(
  line: ProjectedAxisSegment3D,
  graph: Graph3DObject,
  depthScene: DepthScene,
  arrowEnd: AxisArrowEnd
): AxisArrowObstruction {
  if (line.visibility === "hidden") {
    return "partial";
  }

  const geometry = axisArrowGeometry3D(line, graph, arrowEnd, "visible");

  return axisArrowFootprintSamples(geometry.depthPoints).every((point) =>
    axisArrowSampleIsUnobstructed(depthScene, point)
  )
    ? "none"
    : "partial";
}

function axisArrowGeometry3D(
  line: ProjectedAxisSegment3D,
  graph: Graph3DObject,
  arrowEnd: AxisArrowEnd,
  visibility: AxisVisibility
): ProjectedAxisArrowGeometry3D {
  const tip = arrowEnd === "negative-end" ? line.from : line.to;
  const innerPoint = arrowEnd === "negative-end" ? line.to : line.from;
  const depthWeight = lineDepthWeight(graph, tip.depth);
  const arrowLength = axisArrowLength(visibility, depthWeight);
  const endpointWidth = depthScaledWidth(
    graph,
    tip.depth,
    SURFACE_MESH_STROKE_WIDTH * AXIS_TO_MESH_STROKE_RATIO +
      AXIS_STROKE_EXTRA_PX
  );
  const baseWidth = endpointWidth * AXIS_ARROW_BASE_WIDTH_RATIO;
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
  const baseDepth = length === 0
    ? tip.depth
    : tip.depth + (innerPoint.depth - tip.depth) * (arrowLength / length);
  const depthPoints = [
    tip,
    {
      x: baseCenter.x + normalX * halfBaseWidth,
      y: baseCenter.y + normalY * halfBaseWidth,
      depth: baseDepth
    },
    {
      x: baseCenter.x - normalX * halfBaseWidth,
      y: baseCenter.y - normalY * halfBaseWidth,
      depth: baseDepth
    }
  ] as const;

  return {
    arrowLength,
    depthPoints,
    points: [
      { x: depthPoints[0].x, y: depthPoints[0].y },
      { x: depthPoints[1].x, y: depthPoints[1].y },
      { x: depthPoints[2].x, y: depthPoints[2].y }
    ]
  };
}

function axisArrowFootprintSamples(
  points: ProjectedAxisArrowGeometry3D["depthPoints"]
): readonly ProjectedGraphPoint3D[] {
  const weights: readonly (readonly [number, number, number])[] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [0.5, 0.5, 0],
    [0.5, 0, 0.5],
    [0, 0.5, 0.5],
    [1 / 3, 1 / 3, 1 / 3]
  ];

  return weights.map(([a, b, c]) => ({
    x: points[0].x * a + points[1].x * b + points[2].x * c,
    y: points[0].y * a + points[1].y * b + points[2].y * c,
    depth: points[0].depth * a + points[1].depth * b + points[2].depth * c
  }));
}

function axisArrowSampleIsUnobstructed(
  depthScene: DepthScene,
  point: ProjectedGraphPoint3D
): boolean {
  const depth = classifyProjectedPointDepth(depthScene, point);

  return (
    depth.delta === undefined ||
    depth.delta > AXIS_ARROW_CLEARANCE_EPSILON
  );
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

function crossPoint3D(left: GraphPoint3D, right: GraphPoint3D): GraphPoint3D {
  return {
    x: left.y * right.z - left.z * right.y,
    y: left.z * right.x - left.x * right.z,
    z: left.x * right.y - left.y * right.x
  };
}

function subtractPoint3D(left: GraphPoint3D, right: GraphPoint3D): GraphPoint3D {
  return {
    x: left.x - right.x,
    y: left.y - right.y,
    z: left.z - right.z
  };
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
  depthScene: DepthScene,
  analyticSplitValues: readonly number[]
): readonly ProjectedAxisSegment3D[] {
  const breakpoints = sortedUniqueNumbers([
    ...sampleDomain(domain, AXIS_OCCLUSION_SEGMENT_COUNT + 1),
    ...analyticSplitValues
  ]);

  const segments = breakpoints.flatMap((start, index) => {
    const end = breakpoints[index + 1];

    if (end === undefined) {
      return [];
    }

    const line = axisLine3D(axis, [start, end]);
    const projectedLine = projectGraphLine3D(graph, line);
    const visibilitySegments = segmentProjectedLineByVisibility(
      depthScene,
      projectedLine,
      { maxDepth: GRAPH_INTERSECTION_VISIBILITY_SPLIT_DEPTH }
    );

    return visibilitySegments.map((segment, segmentIndex) => ({
      ...segment,
      isNegativeEnd: index === 0 && segmentIndex === 0,
      isPositiveEnd:
        index === breakpoints.length - 2 &&
        segmentIndex === visibilitySegments.length - 1
    }));
  });

  return axisSegmentsWithSurfaceContactOcclusion(segments, depthScene);
}

function axisSegmentsWithSurfaceContactOcclusion(
  segments: readonly ProjectedAxisSegment3D[],
  depthScene: DepthScene
): readonly ProjectedAxisSegment3D[] {
  return segments.map((segment, index) => {
    const previousSegment = segments[index - 1];
    const nextSegment = segments[index + 1];

    // A contact segment sitting exactly on the surface should not flash black
    // when both sides of the same axis are already behind the surface.
    if (
      segment.visibility === "visible" &&
      previousSegment?.visibility === "hidden" &&
      nextSegment?.visibility === "hidden" &&
      axisSegmentTouchesSurface(segment, depthScene)
    ) {
      return {
        ...segment,
        visibility: "hidden"
      };
    }

    return segment;
  });
}

function axisSegmentTouchesSurface(
  segment: ProjectedAxisSegment3D,
  depthScene: DepthScene
): boolean {
  return [0, 0.5, 1].some((t) => {
    const point = interpolateProjectedPoint(segment.from, segment.to, t);
    const depth = classifyProjectedPointDepth(depthScene, point);

    return (
      depth.delta !== undefined &&
      Math.abs(depth.delta) <= AXIS_SURFACE_CONTACT_EPSILON
    );
  });
}

function axisSurfaceSplitValues3D(
  axis: Axis3DObject,
  domain: NumericDomain,
  surfaces: readonly RenderedSurface3D[]
): readonly number[] {
  const line = axisLine3D(axis, domain);
  const [min, max] = domain;

  return sortedUniqueNumbers(
    surfaces.flatMap((surface) =>
      findLineSurfaceIntersections(line, surface.surface.expression).flatMap(
        (intersection) =>
          intersection.t > 0 && intersection.t < 1
            ? [min + (max - min) * intersection.t]
            : []
      )
    )
  );
}

function sortedUniqueNumbers(values: readonly number[]): readonly number[] {
  const tolerance = 0.000_001;

  return [...values]
    .sort((left, right) => left - right)
    .reduce<number[]>((uniqueValues, value) => {
      const previous = uniqueValues[uniqueValues.length - 1];

      if (previous === undefined || Math.abs(previous - value) > tolerance) {
        uniqueValues.push(value);
      }

      return uniqueValues;
    }, []);
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
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

function pointsToSmoothPathData(points: readonly GraphPoint[]): string {
  const firstPoint = points[0];

  if (firstPoint === undefined) {
    return "";
  }

  if (points.length < 3) {
    return pointsToPathData(points);
  }

  const commands = [
    `M ${formatNumber(firstPoint.x)} ${formatNumber(firstPoint.y)}`
  ];

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;

    if (
      p0 === undefined ||
      p1 === undefined ||
      p2 === undefined ||
      p3 === undefined
    ) {
      continue;
    }

    const control1 = {
      x: p1.x + (p2.x - p0.x) / 6,
      y: p1.y + (p2.y - p0.y) / 6
    };
    const control2 = {
      x: p2.x - (p3.x - p1.x) / 6,
      y: p2.y - (p3.y - p1.y) / 6
    };

    commands.push(
      `C ${formatNumber(control1.x)} ${formatNumber(control1.y)} ${formatNumber(control2.x)} ${formatNumber(control2.y)} ${formatNumber(p2.x)} ${formatNumber(p2.y)}`
    );
  }

  return commands.join(" ");
}

function formatPoints(points: readonly GraphPoint[]): string {
  return points.map(formatPoint).join(" ");
}

function formatPoint(point: GraphPoint): string {
  return `${formatNumber(point.x)},${formatNumber(point.y)}`;
}

function formatPoint3D(point: GraphPoint3D): string {
  return `${formatNumber(point.x)},${formatNumber(point.y)},${formatNumber(point.z)}`;
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

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
    ">",
    "&gt;"
  ).replaceAll('"', "&quot;");
}
