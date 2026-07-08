import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  WebGLRenderer
} from "three";
import type { KpSemanticObject } from "../semantic/document.ts";
import type {
  Axis3DObject,
  Graph3DObject,
  Graph3DSurfaceMode,
  GraphPoint3D,
  Surface3DObject
} from "../semantic/graph.ts";
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

export interface Graph3DWebGLThreeScene {
  axisLines: readonly LineSegments[];
  root: Group;
  scene: Scene;
  surfaceMeshLines: readonly LineSegments[];
  surfaceMeshes: readonly Mesh[];
}

const activeGraph3DWebGLRenderers = new WeakMap<HTMLElement, WebGLRenderer>();

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

export function createGraph3DWebGLThreeScene(
  model: Graph3DWebGLSceneModel
): Graph3DWebGLThreeScene {
  const scene = new Scene();
  const root = new Group();
  const surfaceMeshes: Mesh[] = [];
  const surfaceMeshLines: LineSegments[] = [];
  const axisLines: LineSegments[] = [];

  root.name = `${model.graph.id}-webgl-root`;
  root.position.set(
    (model.graph.camera.origin[0] - model.graph.width / 2) /
      model.graph.camera.scale,
    (model.graph.height / 2 - model.graph.camera.origin[1]) /
      model.graph.camera.scale,
    0
  );
  root.userData = {
    kpObject: model.graph.id,
    kpRenderer: GRAPH_3D_WEBGL_RENDERER_KIND
  };
  scene.add(root);

  for (const surface of model.surfaces) {
    const mesh = createSurfaceMesh(surface);
    const meshLines = createSurfaceMeshLines(surface);

    surfaceMeshes.push(mesh);
    surfaceMeshLines.push(meshLines);
    root.add(mesh, meshLines);
  }

  for (const axis of model.axes) {
    const axisLine = createAxisLine(axis);

    axisLines.push(axisLine);
    root.add(axisLine);
  }

  return {
    axisLines,
    root,
    scene,
    surfaceMeshLines,
    surfaceMeshes
  };
}

export function createGraph3DWebGLCamera(
  graph: Graph3DObject
): OrthographicCamera {
  const scale = Math.max(graph.camera.scale, 1);
  const viewWidth = graph.width / scale;
  const viewHeight = graph.height / scale;
  const domainRadius =
    Math.max(
      graph.xDomain[1] - graph.xDomain[0],
      graph.yDomain[1] - graph.yDomain[0],
      graph.zDomain[1] - graph.zDomain[0]
    ) * 4;
  const radius = Math.max(domainRadius, 16);
  const azimuth = degreesToRadians(graph.camera.azimuthDegrees);
  const elevation = degreesToRadians(graph.camera.elevationDegrees);
  const horizontalRadius = radius * Math.cos(elevation);
  const camera = new OrthographicCamera(
    -viewWidth / 2,
    viewWidth / 2,
    viewHeight / 2,
    -viewHeight / 2,
    0.1,
    radius * 4
  );

  camera.position.set(
    horizontalRadius * Math.cos(azimuth),
    radius * Math.sin(elevation),
    horizontalRadius * Math.sin(azimuth)
  );
  camera.up.set(0, 1, 0);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  return camera;
}

export function hydrateGraph3DWebGLShells(
  root: ParentNode,
  objects: readonly KpSemanticObject[]
): void {
  root
    .querySelectorAll<HTMLElement>(".graph-webgl")
    .forEach((shell) => hydrateGraph3DWebGLShell(shell, objects));
}

export function hydrateGraph3DWebGLShell(
  shell: HTMLElement,
  objects: readonly KpSemanticObject[]
): boolean {
  const graphId = shell.dataset["kpObject"];
  const canvas = shell.querySelector<HTMLCanvasElement>(".graph-webgl__canvas");
  const graph = objects.find(
    (object): object is Graph3DObject =>
      object.type === "graph-3d" && object.id === graphId
  );

  if (graphId === undefined || canvas === null || graph === undefined) {
    return false;
  }

  disposeGraph3DWebGLShell(shell);

  try {
    const model = createGraph3DWebGLSceneModel(objects, graph);
    const threeScene = createGraph3DWebGLThreeScene(model);
    const camera = createGraph3DWebGLCamera(graph);
    const renderer = new WebGLRenderer({
      antialias: true,
      canvas
    });

    renderer.setClearColor(0xfffdf8, 1);
    renderer.setPixelRatio(graph3DWebGLPixelRatio());
    renderer.setSize(graph.width, graph.height, false);
    renderer.render(threeScene.scene, camera);

    activeGraph3DWebGLRenderers.set(shell, renderer);
    canvas.setAttribute("aria-hidden", "false");
    shell.dataset["kpWebglStatus"] = "ready";
    shell.dataset["kpWebglError"] = "";

    return true;
  } catch (error: unknown) {
    shell.dataset["kpWebglStatus"] = "fallback";
    shell.dataset["kpWebglError"] =
      error instanceof Error ? error.message : "WebGL render failed.";

    return false;
  }
}

export function disposeGraph3DWebGLShell(shell: HTMLElement): void {
  const renderer = activeGraph3DWebGLRenderers.get(shell);

  if (renderer === undefined) {
    return;
  }

  renderer.dispose();
  activeGraph3DWebGLRenderers.delete(shell);
}

export function disposeGraph3DWebGLShells(root: ParentNode): void {
  root
    .querySelectorAll<HTMLElement>(".graph-webgl")
    .forEach((shell) => disposeGraph3DWebGLShell(shell));
}

function createMeshSurfaceModel(
  surface: Surface3DObject
): Graph3DWebGLSurfaceModel {
  const grid = sampleSaddleSurface(surface);

  return createGridSurfaceModel(surface.id, surface.label, grid);
}

function createSurfaceModels(
  surfaces: readonly Surface3DObject[],
  graph: Graph3DObject,
  surfaceMode: Graph3DSurfaceMode
): readonly Graph3DWebGLSurfaceModel[] {
  switch (surfaceMode) {
    case "mesh":
      return surfaces.map(createMeshSurfaceModel);
    case "donut":
      return [
        createGridSurfaceModel(
          `${graph.id}-donut`,
          "donut",
          sampleTorusSurfaceGrid()
        )
      ];
    case "hyperplanes":
      return [
        createGridSurfaceModel(
          `${graph.id}-hyperplane-positive`,
          "z = x / 2",
          sampleHyperplaneSurfaceGrid(0.5)
        ),
        createGridSurfaceModel(
          `${graph.id}-hyperplane-negative`,
          "z = -x / 2",
          sampleHyperplaneSurfaceGrid(-0.5)
        )
      ];
  }
}

function createGridSurfaceModel(
  id: string,
  label: string,
  grid: readonly (readonly GraphPoint3D[])[]
): Graph3DWebGLSurfaceModel {
  return {
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

function createSurfaceMesh(surface: Graph3DWebGLSurfaceModel): Mesh {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const indices: number[] = [];

  for (const quad of surface.quads) {
    const vertexStart = positions.length / 3;

    for (const corner of quad.corners) {
      positions.push(...graphPointToThreePosition(corner));
    }

    indices.push(
      vertexStart,
      vertexStart + 1,
      vertexStart + 2,
      vertexStart,
      vertexStart + 2,
      vertexStart + 3
    );
  }

  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new MeshBasicMaterial({
    color: 0x7faabd,
    depthTest: true,
    depthWrite: true,
    opacity: 0.76,
    side: DoubleSide,
    transparent: true
  });
  const mesh = new Mesh(geometry, material);

  mesh.name = `${surface.id}-surface`;
  mesh.userData = {
    kpObject: surface.id,
    kpRendererRole: "surface"
  };

  return mesh;
}

function createSurfaceMeshLines(
  surface: Graph3DWebGLSurfaceModel
): LineSegments {
  const positions: number[] = [];

  for (const row of surface.grid) {
    for (let columnIndex = 0; columnIndex < row.length - 1; columnIndex += 1) {
      const start = row[columnIndex];
      const end = row[columnIndex + 1];

      if (start === undefined || end === undefined) {
        continue;
      }

      positions.push(
        ...graphPointToThreePosition(start),
        ...graphPointToThreePosition(end)
      );
    }
  }

  const columnCount = surface.grid[0]?.length ?? 0;

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    for (let rowIndex = 0; rowIndex < surface.grid.length - 1; rowIndex += 1) {
      const start = surface.grid[rowIndex]?.[columnIndex];
      const end = surface.grid[rowIndex + 1]?.[columnIndex];

      if (start === undefined || end === undefined) {
        continue;
      }

      positions.push(
        ...graphPointToThreePosition(start),
        ...graphPointToThreePosition(end)
      );
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));

  const material = new LineBasicMaterial({
    color: 0x53798a,
    depthTest: true,
    opacity: 0.64,
    transparent: true
  });
  const lines = new LineSegments(geometry, material);

  lines.name = `${surface.id}-mesh-lines`;
  lines.userData = {
    kpObject: surface.id,
    kpRendererRole: "mesh-lines"
  };

  return lines;
}

function createAxisLine(axis: Axis3DObject): LineSegments {
  const [min, max] = axis.domain;
  const geometry = new BufferGeometry();
  const positions = [
    ...graphPointToThreePosition(axisPoint(axis, min)),
    ...graphPointToThreePosition(axisPoint(axis, max))
  ];

  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));

  const material = new LineBasicMaterial({
    color: axis.orientation === "z" ? 0x2b6f59 : 0x394756,
    depthTest: true,
    transparent: false
  });
  const line = new LineSegments(geometry, material);

  line.name = `${axis.id}-axis`;
  line.userData = {
    kpAxis: axis.orientation,
    kpObject: axis.id,
    kpRendererRole: "axis"
  };

  return line;
}

function axisPoint(axis: Axis3DObject, value: number): GraphPoint3D {
  switch (axis.orientation) {
    case "x":
      return { x: value, y: 0, z: 0 };
    case "y":
      return { x: 0, y: value, z: 0 };
    case "z":
      return { x: 0, y: 0, z: value };
  }
}

function graphPointToThreePosition(
  point: GraphPoint3D
): readonly [number, number, number] {
  return [point.x, point.z, point.y];
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function graph3DWebGLPixelRatio(): number {
  return Math.min(window.devicePixelRatio || 1, 2);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
