import {
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  Vector3,
  WebGLRenderer
} from "three";
import type { KpSemanticObject } from "../semantic/document.ts";
import type {
  Axis3DObject,
  Graph3DObject,
  GraphPoint3D
} from "../semantic/graph.ts";
import {
  GRAPH_3D_WEBGL_RENDERER_KIND,
  createGraph3DWebGLSceneModel,
  type Graph3DWebGLSceneModel,
  type Graph3DWebGLSurfaceModel
} from "./graph-webgl.ts";
import {
  acquireKpWebglContextLease,
  cancelKpWebglContextLeaseWait,
  type KpWebglContextLease
} from "./webgl-context-lease-pool.ts";

export interface Graph3DWebGLThreeScene {
  axisObjects: readonly Group[];
  root: Group;
  scene: Scene;
  surfaceBorderObjects: readonly Group[];
  surfaceMeshLines: readonly LineSegments[];
  surfaceMeshes: readonly Mesh[];
}

const AXIS_ARROW_LENGTH = 0.24;
const AXIS_ARROW_RADIUS = 0.075;
const AXIS_HALO_ARROW_RADIUS = 0.115;
const AXIS_HALO_RADIUS = 0.032;
const AXIS_RADIUS = 0.018;
const GRAPH_BACKGROUND_COLOR = 0xfffdf8;
const SURFACE_BORDER_COLOR = 0x315e6d;
const SURFACE_BORDER_RADIUS = 0.012;
const THREE_Y_AXIS = new Vector3(0, 1, 0);
interface ActiveGraph3DWebGLRenderer {
  animationFrameId?: number;
  lease: KpWebglContextLease;
  renderer: WebGLRenderer;
  scene?: Scene;
}

export type Graph3DWebGLHydrationOutcome =
  | { readonly status: "ready" }
  | { readonly status: "capacity" }
  | { readonly status: "unavailable" }
  | { readonly status: "invalid" }
  | { readonly status: "fallback"; readonly reason: string };

export interface Graph3DWebGLHydrationOptions {
  previousObjects?: readonly KpSemanticObject[] | undefined;
  transitionDurationMs?: number;
}

const GRAPH_3D_WEBGL_TRANSITION_DURATION_MS = 650;
const activeGraph3DWebGLRenderers = new WeakMap<
  HTMLElement,
  ActiveGraph3DWebGLRenderer
>();

export function createGraph3DWebGLThreeScene(
  model: Graph3DWebGLSceneModel
): Graph3DWebGLThreeScene {
  const scene = new Scene();
  const root = new Group();
  const surfaceBorderObjects: Group[] = [];
  const surfaceMeshes: Mesh[] = [];
  const surfaceMeshLines: LineSegments[] = [];
  const axisObjects: Group[] = [];

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

    if (surface.drawBorder) {
      const borderObject = createSurfaceBorderObject(surface);

      surfaceBorderObjects.push(borderObject);
      root.add(borderObject);
    }
  }

  for (const axis of model.axes) {
    const axisObject = createAxisObject(axis);

    axisObjects.push(axisObject);
    root.add(axisObject);
  }

  return {
    axisObjects,
    root,
    scene,
    surfaceBorderObjects,
    surfaceMeshLines,
    surfaceMeshes
  };
}

export function createGraph3DWebGLCamera(
  graph: Graph3DObject,
  cameraSettings: Graph3DObject["camera"] = graph.camera
): OrthographicCamera {
  const scale = Math.max(cameraSettings.scale, 1);
  const viewWidth = graph.width / scale;
  const viewHeight = graph.height / scale;
  const domainRadius =
    Math.max(
      graph.xDomain[1] - graph.xDomain[0],
      graph.yDomain[1] - graph.yDomain[0],
      graph.zDomain[1] - graph.zDomain[0]
    ) * 4;
  const radius = Math.max(domainRadius, 16);
  const azimuth = degreesToRadians(cameraSettings.azimuthDegrees);
  const elevation = degreesToRadians(cameraSettings.elevationDegrees);
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
  objects: readonly KpSemanticObject[],
  options: Graph3DWebGLHydrationOptions = {}
): void {
  root
    .querySelectorAll<HTMLElement>(".graph-webgl")
    .forEach((shell) => hydrateGraph3DWebGLShell(shell, objects, options));
}

export function hydrateGraph3DWebGLShell(
  shell: HTMLElement,
  objects: readonly KpSemanticObject[],
  options: Graph3DWebGLHydrationOptions = {}
): Graph3DWebGLHydrationOutcome {
  const graphId = shell.dataset["kpObject"];
  const canvas = shell.querySelector<HTMLCanvasElement>(".graph-webgl__canvas");
  const graph = objects.find(
    (object): object is Graph3DObject =>
      object.type === "graph-3d" && object.id === graphId
  );

  if (graphId === undefined || canvas === null || graph === undefined) {
    return { status: "invalid" };
  }

  disposeGraph3DWebGLShell(shell);

  const acquisition = acquireKpWebglContextLease({
    canvas,
    attributes: { antialias: true },
    onAvailable: () => {
      if (shell.isConnected) hydrateGraph3DWebGLShell(shell, objects, options);
    },
    onContextLost: () => {
      disposeActiveGraph3DWebGLRenderer(shell);
      markGraph3DWebGLFallback(shell, "WebGL context lost.");
    }
  });
  if (acquisition.status !== "acquired") {
    shell.dataset["kpWebglStatus"] = acquisition.status === "capacity"
      ? "waiting"
      : "fallback";
    setAccessibleStatus(
      shell,
      acquisition.status === "capacity"
        ? "Static graph available. Waiting for 3D rendering capacity."
        : "Static graph shown because WebGL is unavailable."
    );
    return acquisition;
  }

  try {
    const shouldAnimate = shouldAnimateGraph3DTransition(
      graph,
      options.previousObjects
    );
    const model = createGraph3DWebGLSceneModel(objects, graph, {
      previousObjects: options.previousObjects,
      transitionProgress: shouldAnimate ? 0 : 1
    });
    const renderer = new WebGLRenderer({
      antialias: true,
      canvas,
      context: acquisition.lease.context
    });
    const activeRenderer: ActiveGraph3DWebGLRenderer = {
      lease: acquisition.lease,
      renderer
    };

    renderer.setClearColor(0xfffdf8, 1);
    renderer.setPixelRatio(graph3DWebGLPixelRatio());
    renderer.setSize(graph.width, graph.height, false);

    activeGraph3DWebGLRenderers.set(shell, activeRenderer);
    shell.dataset["kpWebglStatus"] = "ready";
    shell.dataset["kpWebglError"] = "";
    setAccessibleStatus(shell, "Interactive 3D graph ready.");
    renderGraph3DWebGLFrame(activeRenderer, graph, model);

    if (shouldAnimate) {
      shell.dataset["kpWebglTransition"] = "running";
      activeRenderer.animationFrameId = animateGraph3DWebGLTransition(
        shell,
        activeRenderer,
        objects,
        graph,
        options
      );
    } else {
      shell.dataset["kpWebglTransition"] = "static";
    }

    return { status: "ready" };
  } catch (error: unknown) {
    acquisition.lease.release();
    const reason = error instanceof Error
      ? error.message
      : "WebGL render failed.";
    markGraph3DWebGLFallback(shell, reason);

    return { status: "fallback", reason };
  }
}

function shouldAnimateGraph3DTransition(
  graph: Graph3DObject,
  previousObjects: readonly KpSemanticObject[] | undefined
): boolean {
  const previousGraph = previousObjects?.find(
    (object): object is Graph3DObject =>
      object.type === "graph-3d" && object.id === graph.id
  );

  return (
    previousGraph !== undefined &&
    (previousGraph.surfaceMode !== graph.surfaceMode ||
      previousGraph.viewMode !== graph.viewMode)
  );
}

function animateGraph3DWebGLTransition(
  shell: HTMLElement,
  activeRenderer: ActiveGraph3DWebGLRenderer,
  objects: readonly KpSemanticObject[],
  graph: Graph3DObject,
  options: Graph3DWebGLHydrationOptions
): number {
  const durationMs =
    options.transitionDurationMs ?? GRAPH_3D_WEBGL_TRANSITION_DURATION_MS;
  const startedAt = performance.now();

  const tick = (timestamp: number): void => {
    if (!shell.isConnected) {
      return;
    }

    const progress = clamp((timestamp - startedAt) / durationMs, 0, 1);
    const easedProgress = easeInOutCubic(progress);
    const model = createGraph3DWebGLSceneModel(objects, graph, {
      previousObjects: options.previousObjects,
      transitionProgress: easedProgress
    });

    renderGraph3DWebGLFrame(activeRenderer, graph, model);

    if (progress < 1) {
      const activeRenderer = activeGraph3DWebGLRenderers.get(shell);

      if (activeRenderer !== undefined) {
        activeRenderer.animationFrameId = requestAnimationFrame(tick);
      }

      return;
    }

    shell.dataset["kpWebglTransition"] = "complete";
  };

  return requestAnimationFrame(tick);
}

function renderGraph3DWebGLFrame(
  activeRenderer: ActiveGraph3DWebGLRenderer,
  graph: Graph3DObject,
  model: Graph3DWebGLSceneModel
): void {
  const threeScene = createGraph3DWebGLThreeScene(model);
  const camera = createGraph3DWebGLCamera(graph, model.camera);

  if (activeRenderer.scene !== undefined) {
    disposeGraph3DWebGLThreeScene(activeRenderer.scene);
  }

  activeRenderer.renderer.render(threeScene.scene, camera);
  activeRenderer.scene = threeScene.scene;
}

function disposeGraph3DWebGLThreeScene(scene: Scene): void {
  const disposedMaterials = new WeakSet<{ dispose: () => void }>();
  const disposedGeometries = new WeakSet<{ dispose: () => void }>();

  scene.traverse((object) => {
    const candidate = object as {
      geometry?: { dispose: () => void };
      material?: { dispose: () => void } | readonly { dispose: () => void }[];
    };

    if (
      candidate.geometry !== undefined &&
      !disposedGeometries.has(candidate.geometry)
    ) {
      candidate.geometry.dispose();
      disposedGeometries.add(candidate.geometry);
    }

    const materials =
      candidate.material === undefined
        ? []
        : Array.isArray(candidate.material)
          ? candidate.material
          : [candidate.material];

    for (const material of materials) {
      if (!disposedMaterials.has(material)) {
        material.dispose();
        disposedMaterials.add(material);
      }
    }
  });
}

export function disposeGraph3DWebGLShell(shell: HTMLElement): void {
  const canvas = shell.querySelector<HTMLCanvasElement>(".graph-webgl__canvas");
  if (canvas !== null) cancelKpWebglContextLeaseWait(canvas);
  disposeActiveGraph3DWebGLRenderer(shell);
}

function disposeActiveGraph3DWebGLRenderer(shell: HTMLElement): void {
  const activeRenderer = activeGraph3DWebGLRenderers.get(shell);

  if (activeRenderer === undefined) {
    return;
  }

  if (activeRenderer.animationFrameId !== undefined) {
    cancelAnimationFrame(activeRenderer.animationFrameId);
  }

  if (activeRenderer.scene !== undefined) {
    disposeGraph3DWebGLThreeScene(activeRenderer.scene);
  }

  activeRenderer.renderer.dispose();
  activeRenderer.lease.release();
  activeGraph3DWebGLRenderers.delete(shell);
}

export function disposeGraph3DWebGLShells(root: ParentNode): void {
  root
    .querySelectorAll<HTMLElement>(".graph-webgl")
    .forEach((shell) => disposeGraph3DWebGLShell(shell));
}

function markGraph3DWebGLFallback(
  shell: HTMLElement,
  reason: string
): void {
  shell.dataset["kpWebglStatus"] = "fallback";
  shell.dataset["kpWebglError"] = reason;
  setAccessibleStatus(shell, "Static graph shown because the 3D view is unavailable.");
}

function setAccessibleStatus(shell: HTMLElement, status: string): void {
  const output = shell.querySelector<HTMLElement>(
    "[data-kp-webgl-accessible-status]"
  );
  if (output !== null) output.textContent = status;
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
    kpMorphRole: surface.morphTarget.role,
    kpMorphUSampleCount: surface.morphTarget.uSampleCount,
    kpMorphVSampleCount: surface.morphTarget.vSampleCount,
    kpMorphVertexCount: surface.morphTarget.vertices.length,
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

function createSurfaceBorderObject(surface: Graph3DWebGLSurfaceModel): Group {
  const group = new Group();
  const material = new MeshBasicMaterial({
    color: SURFACE_BORDER_COLOR,
    depthTest: true,
    depthWrite: true
  });

  group.name = `${surface.id}-border`;
  group.userData = {
    kpObject: surface.id,
    kpRendererRole: "surface-border"
  };

  for (const [start, end] of surfaceBorderSegments(surface.grid)) {
    group.add(createSurfaceBorderSegmentMesh(start, end, material));
  }

  return group;
}

function surfaceBorderSegments(
  grid: readonly (readonly GraphPoint3D[])[]
): readonly (readonly [GraphPoint3D, GraphPoint3D])[] {
  const segments: [GraphPoint3D, GraphPoint3D][] = [];
  const firstRow = grid[0];
  const lastRow = grid[grid.length - 1];
  const columnCount = firstRow?.length ?? 0;

  if (firstRow !== undefined) {
    pushRowSegments(segments, firstRow);
  }

  if (lastRow !== undefined && lastRow !== firstRow) {
    pushRowSegments(segments, lastRow);
  }

  for (let rowIndex = 0; rowIndex < grid.length - 1; rowIndex += 1) {
    const row = grid[rowIndex];
    const nextRow = grid[rowIndex + 1];

    if (row === undefined || nextRow === undefined) {
      continue;
    }

    const first = row[0];
    const nextFirst = nextRow[0];
    const last = row[columnCount - 1];
    const nextLast = nextRow[columnCount - 1];

    if (first !== undefined && nextFirst !== undefined) {
      segments.push([first, nextFirst]);
    }

    if (last !== undefined && nextLast !== undefined) {
      segments.push([last, nextLast]);
    }
  }

  return segments;
}

function pushRowSegments(
  segments: [GraphPoint3D, GraphPoint3D][],
  row: readonly GraphPoint3D[]
): void {
  for (let columnIndex = 0; columnIndex < row.length - 1; columnIndex += 1) {
    const start = row[columnIndex];
    const end = row[columnIndex + 1];

    if (start !== undefined && end !== undefined) {
      segments.push([start, end]);
    }
  }
}

function createSurfaceBorderSegmentMesh(
  startPoint: GraphPoint3D,
  endPoint: GraphPoint3D,
  material: MeshBasicMaterial
): Mesh {
  const start = vectorFromGraphPoint(startPoint);
  const end = vectorFromGraphPoint(endPoint);
  const direction = end.clone().sub(start);
  const geometry = new CylinderGeometry(
    SURFACE_BORDER_RADIUS,
    SURFACE_BORDER_RADIUS,
    direction.length(),
    10
  );
  const mesh = new Mesh(geometry, material);

  orientMeshAlongDirection(
    mesh,
    start.clone().lerp(end, 0.5),
    direction.normalize()
  );
  mesh.userData = {
    kpRendererRole: "surface-border-segment"
  };

  return mesh;
}

function createAxisObject(axis: Axis3DObject): Group {
  const [min, max] = axis.domain;
  const start = vectorFromGraphPoint(axisPoint(axis, min));
  const end = vectorFromGraphPoint(axisPoint(axis, max));
  const direction = end.clone().sub(start).normalize();
  const minDirection = direction.clone().multiplyScalar(-1);
  const foregroundColor = axis.orientation === "z" ? 0x2b6f59 : 0x394756;
  const shaftStart = start
    .clone()
    .add(direction.clone().multiplyScalar(AXIS_ARROW_LENGTH));
  const shaftEnd = end
    .clone()
    .sub(direction.clone().multiplyScalar(AXIS_ARROW_LENGTH));
  const group = new Group();

  group.name = `${axis.id}-axis`;
  group.userData = {
    kpAxis: axis.orientation,
    kpObject: axis.id,
    kpRendererRole: "axis"
  };
  group.add(
    createAxisShaftMesh(
      shaftStart,
      shaftEnd,
      AXIS_HALO_RADIUS,
      GRAPH_BACKGROUND_COLOR,
      "halo-shaft"
    ),
    createAxisArrowMesh(
      start,
      minDirection,
      AXIS_HALO_ARROW_RADIUS,
      GRAPH_BACKGROUND_COLOR,
      "halo-min-arrow"
    ),
    createAxisArrowMesh(
      end,
      direction,
      AXIS_HALO_ARROW_RADIUS,
      GRAPH_BACKGROUND_COLOR,
      "halo-max-arrow"
    ),
    createAxisShaftMesh(
      shaftStart,
      shaftEnd,
      AXIS_RADIUS,
      foregroundColor,
      "axis-shaft"
    ),
    createAxisArrowMesh(
      start,
      minDirection,
      AXIS_ARROW_RADIUS,
      foregroundColor,
      "axis-min-arrow"
    ),
    createAxisArrowMesh(
      end,
      direction,
      AXIS_ARROW_RADIUS,
      foregroundColor,
      "axis-max-arrow"
    )
  );

  return group;
}

function createAxisShaftMesh(
  start: Vector3,
  end: Vector3,
  radius: number,
  color: number,
  layer: string
): Mesh {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const geometry = new CylinderGeometry(radius, radius, length, 16);
  const mesh = new Mesh(
    geometry,
    createAxisMaterial(color, !layer.startsWith("halo"))
  );

  orientMeshAlongDirection(
    mesh,
    start.clone().lerp(end, 0.5),
    direction.normalize()
  );
  mesh.userData = {
    kpAxisLayer: layer
  };

  return mesh;
}

function createAxisArrowMesh(
  tip: Vector3,
  direction: Vector3,
  radius: number,
  color: number,
  layer: string
): Mesh {
  const unitDirection = direction.clone().normalize();
  const geometry = new ConeGeometry(radius, AXIS_ARROW_LENGTH, 24);
  const mesh = new Mesh(
    geometry,
    createAxisMaterial(color, !layer.startsWith("halo"))
  );

  orientMeshAlongDirection(
    mesh,
    tip.clone().sub(unitDirection.clone().multiplyScalar(AXIS_ARROW_LENGTH / 2)),
    unitDirection
  );
  mesh.userData = {
    kpAxisLayer: layer
  };

  return mesh;
}

function createAxisMaterial(
  color: number,
  depthWrite: boolean
): MeshBasicMaterial {
  return new MeshBasicMaterial({
    color,
    depthTest: true,
    depthWrite
  });
}

function orientMeshAlongDirection(
  mesh: Mesh,
  center: Vector3,
  direction: Vector3
): void {
  mesh.position.copy(center);
  mesh.quaternion.setFromUnitVectors(THREE_Y_AXIS, direction);
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

function vectorFromGraphPoint(point: GraphPoint3D): Vector3 {
  return new Vector3(...graphPointToThreePosition(point));
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function easeInOutCubic(progress: number): number {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function graph3DWebGLPixelRatio(): number {
  return Math.min(window.devicePixelRatio || 1, 2);
}
