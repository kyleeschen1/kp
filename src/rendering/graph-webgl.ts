import type { KpSemanticObject } from "../semantic/document.ts";
import type {
  Axis3DObject,
  Graph3DObject,
  Graph3DSurfaceMode,
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
  surfaces: readonly Graph3DWebGLSurfaceModel[];
}

export interface Graph3DWebGLSurfaceModel {
  drawBorder: boolean;
  grid: readonly (readonly GraphPoint3D[])[];
  id: string;
  label: string;
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
  graph: Graph3DObject
): Graph3DWebGLSceneModel {
  const axes = objects.filter(
    (object): object is Axis3DObject =>
      object.type === "axis-3d" && object.graphId === graph.id
  );
  const surfaces = objects.filter(
    (object): object is Surface3DObject =>
      object.type === "surface-3d" && object.graphId === graph.id
  );
  const surfaceMode = graph.surfaceMode ?? "mesh";

  return {
    axes,
    camera: graph.camera,
    graph,
    surfaceMode,
    surfaces: createSurfaceModels(surfaces, graph, surfaceMode)
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
        ${renderGraph3DToSvg(objects, graph)}
      </div>
    </div>
  `;
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

  return createGridSurfaceModel(surface.id, surface.label, grid, true);
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
          false
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
          true
        ),
        createGridSurfaceModel(
          `${graph.id}-hyperplane-negative`,
          "z = -x / 2",
          sampleHyperplaneSurfaceGrid(
            -0.5,
            graph3DSurfaceResolution(graph.surfaceQuality)
          ),
          true
        )
      ];
  }
}

function createGridSurfaceModel(
  id: string,
  label: string,
  grid: readonly (readonly GraphPoint3D[])[],
  drawBorder: boolean
): Graph3DWebGLSurfaceModel {
  return {
    drawBorder,
    grid,
    id,
    label,
    quads: surfaceQuadsFromGrid(grid)
  };
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
