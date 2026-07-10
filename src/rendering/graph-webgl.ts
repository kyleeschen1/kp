import type { KpSemanticObject } from "../semantic/document.ts";
import type {
  Axis3DObject,
  Graph3DObject,
  Graph3DSurfaceMode,
  Graph3DViewMode,
  GraphPoint3D,
  Surface3DObject
} from "../semantic/graph.ts";
import { graph3DSurfaceResolution } from "../semantic/graph.ts";
import {
  renderGraph3DToSvg,
  sampleHyperplaneSurfaceGrid,
  sampleSaddleSurface,
  sampleTorusSurfaceGrid
} from "./graph-svg.ts";
import {
  createGraph3DTo2DTransitionDescriptor,
  createGraphSurfaceModeSampler,
  createGraphSurfaceModeTransition,
  graphSurfaceMorphTargetFromGrid,
  type Graph3DTo2DTransitionDescriptor,
  type GraphSurfaceModeTransition,
  type GraphSurfaceMorphRole,
  type GraphSurfaceMorphTarget
} from "./graph-transitions.ts";

export const GRAPH_3D_WEBGL_RENDERER_KIND = "graph-3d-webgl";

export interface Graph3DWebGLRendererDescriptor {
  backend: "three";
  kind: typeof GRAPH_3D_WEBGL_RENDERER_KIND;
  status: "available";
}

export function createGraph3DWebGLRendererDescriptor(): Graph3DWebGLRendererDescriptor {
  return {
    backend: "three",
    kind: GRAPH_3D_WEBGL_RENDERER_KIND,
    status: "available"
  };
}

export function canReuseGraph3DWebGLShell(
  status: string | undefined
): boolean {
  return status === "ready";
}

export interface Graph3DWebGLSceneModel {
  axes: readonly Axis3DObject[];
  camera: Graph3DObject["camera"];
  graph: Graph3DObject;
  surfaceMode: Graph3DSurfaceMode;
  surfaceTransition?: GraphSurfaceModeTransition | undefined;
  surfaceTransitions: readonly GraphSurfaceModeTransition[];
  surfaces: readonly Graph3DWebGLSurfaceModel[];
  viewMode: Graph3DViewMode;
  viewTransition?: Graph3DTo2DTransitionDescriptor | undefined;
}

export interface Graph3DWebGLSceneModelOptions {
  previousObjects?: readonly KpSemanticObject[] | undefined;
  transitionProgress?: number;
}

export interface Graph3DWebGLSurfaceModel {
  drawBorder: boolean;
  grid: readonly (readonly GraphPoint3D[])[];
  id: string;
  label: string;
  morphTarget: GraphSurfaceMorphTarget;
  quads: readonly Graph3DWebGLSurfaceQuad[];
}

export interface Graph3DWebGLSurfaceQuad {
  corners: readonly [GraphPoint3D, GraphPoint3D, GraphPoint3D, GraphPoint3D];
  gridCell: {
    columnIndex: number;
    rowIndex: number;
  };
}

export function createGraph3DWebGLSceneModel(
  objects: readonly KpSemanticObject[],
  graph: Graph3DObject,
  options: Graph3DWebGLSceneModelOptions = {}
): Graph3DWebGLSceneModel {
  const allAxes = objects.filter(
    (object): object is Axis3DObject =>
      object.type === "axis-3d" && object.graphId === graph.id
  );
  const surfaces = objects.filter(
    (object): object is Surface3DObject =>
      object.type === "surface-3d" && object.graphId === graph.id
  );
  const surfaceMode = graph.surfaceMode ?? "mesh";
  const viewMode = graph.viewMode ?? "3d";
  const previousGraph = options.previousObjects?.find(
    (object): object is Graph3DObject =>
      object.type === "graph-3d" && object.id === graph.id
  );
  const progress = clamp(options.transitionProgress ?? 1, 0, 1);
  const surfaceTransition =
    previousGraph !== undefined && previousGraph.surfaceMode !== surfaceMode
      ? createGraphSurfaceModeTransition(
          objects,
          graph,
          previousGraph.surfaceMode,
          surfaceMode
        )
      : undefined;
  const viewTransition =
    viewMode === "xy"
      ? createGraph3DTo2DTransitionDescriptor(objects, graph)
      : undefined;
  const viewProgress =
    viewMode === "xy"
      ? previousGraph?.viewMode === "3d"
        ? progress
        : 1
      : 0;
  const axes =
    viewProgress >= 1
      ? allAxes.filter((axis) => axis.orientation !== "z")
      : allAxes;
  const surfaceModels =
    surfaceTransition === undefined
      ? createSurfaceModels(surfaces, graph, surfaceMode)
      : createSurfaceModelsFromMorphTransition(surfaceTransition, progress);

  return {
    axes,
    camera:
      viewTransition === undefined
        ? graph.camera
        : interpolateCamera(
            graph.camera,
            viewTransition.camera.target,
            viewProgress
          ),
    graph,
    surfaceMode,
    surfaceTransition,
    surfaceTransitions: graphSurfaceTransitionModes(surfaceMode).map(
      (targetMode) =>
        createGraphSurfaceModeTransition(objects, graph, surfaceMode, targetMode)
    ),
    surfaces: applyViewProgressToSurfaceModels(surfaceModels, viewProgress),
    viewMode,
    viewTransition
  };
}

export function renderGraph3DWebGLShell(
  objects: readonly KpSemanticObject[],
  graph: Graph3DObject
): string {
  const descriptor = createGraph3DWebGLRendererDescriptor();
  const width = graph.width;
  const height = graph.height;

  return `
    <div class="graph-webgl" data-kp-object="${escapeHtml(graph.id)}" data-kp-render-node="rn-${escapeHtml(graph.id)}-webgl-shell" data-kp-type="graph-3d" data-kp-renderer="webgl" data-kp-webgl-backend="${descriptor.backend}" data-kp-webgl-status="pending">
      <canvas class="graph-webgl__canvas" width="${width}" height="${height}" data-kp-object="${escapeHtml(graph.id)}" data-kp-render-node="rn-${escapeHtml(graph.id)}-webgl-canvas" data-kp-type="graph-3d" aria-hidden="true"></canvas>
      <div class="graph-webgl__fallback" data-kp-renderer-fallback="svg">
        ${renderGraph3DWebGLFallback(objects, graph)}
      </div>
    </div>
  `;
}

export function renderGraph3DWebGLFallback(
  objects: readonly KpSemanticObject[],
  graph: Graph3DObject
): string {
  return renderGraph3DToSvg(objects, graph);
}

function createMeshSurfaceModel(
  surface: Surface3DObject,
  graph: Graph3DObject
): Graph3DWebGLSurfaceModel {
  const resolution = graph3DSurfaceResolution(graph.surfaceQuality);
  const grid = sampleSaddleSurface({
    ...surface,
    xSampleCount: resolution.xSampleCount,
    ySampleCount: resolution.ySampleCount
  });

  return createGridSurfaceModel(surface.id, surface.label, grid, true, "mesh", "mesh");
}

function createSurfaceModels(
  surfaces: readonly Surface3DObject[],
  graph: Graph3DObject,
  surfaceMode: Graph3DSurfaceMode
): readonly Graph3DWebGLSurfaceModel[] {
  switch (surfaceMode) {
    case "mesh":
      return surfaces.map((surface) => createMeshSurfaceModel(surface, graph));
    case "donut":
      return [
        createGridSurfaceModel(
          `${graph.id}-donut`,
          "donut",
          sampleTorusSurfaceGrid(graph3DSurfaceResolution(graph.surfaceQuality)),
          false,
          "donut",
          "donut"
        )
      ];
    case "hyperplanes":
      return [
        createGridSurfaceModel(
          `${graph.id}-hyperplane-positive`,
          "z = x / 2",
          sampleHyperplaneSurfaceGrid(
            0.5,
            graph3DSurfaceResolution(graph.surfaceQuality)
          ),
          true,
          "hyperplanes",
          "hyperplane-positive"
        ),
        createGridSurfaceModel(
          `${graph.id}-hyperplane-negative`,
          "z = -x / 2",
          sampleHyperplaneSurfaceGrid(
            -0.5,
            graph3DSurfaceResolution(graph.surfaceQuality)
          ),
          true,
          "hyperplanes",
          "hyperplane-negative"
        )
      ];
  }
}

function createGridSurfaceModel(
  id: string,
  label: string,
  grid: readonly (readonly GraphPoint3D[])[],
  drawBorder: boolean,
  mode: Graph3DSurfaceMode,
  role: GraphSurfaceMorphRole
): Graph3DWebGLSurfaceModel {
  return {
    drawBorder,
    grid,
    id,
    label,
    morphTarget: graphSurfaceMorphTargetFromGrid(id, mode, role, grid),
    quads: surfaceQuadsFromGrid(grid)
  };
}

function createSurfaceModelsFromMorphTransition(
  transition: GraphSurfaceModeTransition,
  progress: number
): readonly Graph3DWebGLSurfaceModel[] {
  const frame = createGraphSurfaceModeSampler(transition).sample(progress);

  return frame.channels.map((channel) =>
    createGridSurfaceModel(
      channel.surfaceId,
      channel.role,
      gridFromVertices(
        channel.vertices,
        channel.uSampleCount,
        channel.vSampleCount
      ),
      channel.role !== "donut",
      channel.mode,
      channel.role
    )
  );
}

function applyViewProgressToSurfaceModels(
  surfaces: readonly Graph3DWebGLSurfaceModel[],
  viewProgress: number
): readonly Graph3DWebGLSurfaceModel[] {
  if (viewProgress <= 0) {
    return surfaces;
  }

  const zScale = 1 - viewProgress;

  return surfaces.map((surface) =>
    createGridSurfaceModel(
      surface.id,
      surface.label,
      surface.grid.map((row) =>
        row.map((point) => ({
          ...point,
          z: point.z * zScale
        }))
      ),
      surface.drawBorder,
      surface.morphTarget.mode,
      surface.morphTarget.role
    )
  );
}

function gridFromVertices(
  vertices: readonly GraphPoint3D[],
  uSampleCount: number,
  vSampleCount: number
): readonly (readonly GraphPoint3D[])[] {
  return Array.from({ length: vSampleCount }, (_, rowIndex) =>
    vertices.slice(rowIndex * uSampleCount, (rowIndex + 1) * uSampleCount)
  );
}

function interpolateCamera(
  source: Graph3DObject["camera"],
  target: Graph3DObject["camera"],
  progress: number
): Graph3DObject["camera"] {
  return {
    azimuthDegrees: interpolateNumber(
      source.azimuthDegrees,
      target.azimuthDegrees,
      progress
    ),
    elevationDegrees: interpolateNumber(
      source.elevationDegrees,
      target.elevationDegrees,
      progress
    ),
    origin: [
      interpolateNumber(source.origin[0], target.origin[0], progress),
      interpolateNumber(source.origin[1], target.origin[1], progress)
    ],
    scale: interpolateNumber(source.scale, target.scale, progress)
  };
}

function interpolateNumber(
  source: number,
  target: number,
  progress: number
): number {
  return source + (target - source) * progress;
}

function graphSurfaceTransitionModes(
  surfaceMode: Graph3DSurfaceMode
): readonly Graph3DSurfaceMode[] {
  return (["mesh", "donut", "hyperplanes"] as const).filter(
    (mode) => mode !== surfaceMode
  );
}

function surfaceQuadsFromGrid(
  grid: readonly (readonly GraphPoint3D[])[]
): readonly Graph3DWebGLSurfaceQuad[] {
  const quads: Graph3DWebGLSurfaceQuad[] = [];

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

      quads.push({
        corners: [topLeft, topRight, bottomRight, bottomLeft],
        gridCell: {
          columnIndex,
          rowIndex
        }
      });
    }
  }

  return quads;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
