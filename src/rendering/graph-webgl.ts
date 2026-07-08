import type { KpSemanticObject } from "../semantic/document.ts";
import type {
  Axis3DObject,
  Graph3DObject,
  Graph3DSurfaceMode,
  GraphPoint3D,
  Surface3DObject
} from "../semantic/graph.ts";
import { sampleSaddleSurface } from "./graph-svg.ts";

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

export interface Graph3DWebGLSceneModel {
  axes: readonly Axis3DObject[];
  camera: Graph3DObject["camera"];
  graph: Graph3DObject;
  surfaceMode: Graph3DSurfaceMode;
  surfaces: readonly Graph3DWebGLSurfaceModel[];
}

export interface Graph3DWebGLSurfaceModel {
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
    surfaces:
      surfaceMode === "mesh"
        ? surfaces.map(createMeshSurfaceModel)
        : []
  };
}

function createMeshSurfaceModel(
  surface: Surface3DObject
): Graph3DWebGLSurfaceModel {
  const grid = sampleSaddleSurface(surface);

  return {
    grid,
    id: surface.id,
    label: surface.label,
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
