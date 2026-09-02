import type {
  Graph3DCamera,
  Graph3DObject,
  GraphPoint3D
} from "../semantic/graph.ts";
import { projectGraphPoint3DToWebGLScreen } from "./graph-webgl.ts";
import {
  insetKpStageFitRect,
  kpStageFitRectContains,
  unionKpStageFitRects,
  type KpStageFitContractV1,
  type KpStageFitRect,
  type KpStageFitRepairGap
} from "./stage-fit-contract.ts";

export interface KpGraph3DSweptFitPlan {
  readonly schemaVersion: "kp.graph-3d-swept-fit.v1";
  readonly id: string;
  readonly status: "fitted" | "repair-gap";
  readonly sourceCamera: Graph3DCamera;
  readonly targetCamera: Graph3DCamera;
  readonly safeRect: KpStageFitRect;
  readonly sweptBounds: KpStageFitRect;
  readonly progressSamples: readonly number[];
  readonly gap?: KpStageFitRepairGap | undefined;
}

export function planKpGraph3DSweptFit(input: {
  readonly id: string;
  readonly graph: Graph3DObject;
  readonly contract: KpStageFitContractV1;
  readonly sourceCamera: Graph3DCamera;
  readonly targetCamera: Graph3DCamera;
  readonly pointsAtProgress: (progress: number) => readonly GraphPoint3D[];
  readonly progressSampleCount?: number | undefined;
  readonly minimumCameraScale?: number | undefined;
}): KpGraph3DSweptFitPlan {
  if (input.id.trim() === "") throw new Error("Graph3D swept fit requires an id.");
  const sampleCount = Math.max(5, Math.floor(input.progressSampleCount ?? 17));
  const progressSamples = Object.freeze(Array.from(
    { length: sampleCount },
    (_, index) => index / (sampleCount - 1)
  ));
  const stageRect = Object.freeze({
    left: 0,
    top: 0,
    width: input.graph.width,
    height: input.graph.height
  });
  const safeRect = insetKpStageFitRect(stageRect, input.contract.safeInsets);
  let sourceCamera = fitEndpointCamera({
    graph: input.graph,
    camera: input.sourceCamera,
    points: input.pointsAtProgress(0),
    safeRect
  });
  let targetCamera = fitEndpointCamera({
    graph: input.graph,
    camera: input.targetCamera,
    points: input.pointsAtProgress(1),
    safeRect
  });
  let sweptBounds = sweptCameraBounds({
    graph: input.graph,
    sourceCamera,
    targetCamera,
    progressSamples,
    pointsAtProgress: input.pointsAtProgress
  });

  for (let attempt = 0;
    attempt < 6 && !kpStageFitRectContains(safeRect, sweptBounds, 0.25);
    attempt += 1) {
    const scaleFactor = Math.min(
      0.985,
      safeRect.width / sweptBounds.width,
      safeRect.height / sweptBounds.height
    );
    sourceCamera = fitEndpointCamera({
      graph: input.graph,
      camera: {
        ...sourceCamera,
        scale: sourceCamera.scale * scaleFactor
      },
      points: input.pointsAtProgress(0),
      safeRect
    });
    targetCamera = fitEndpointCamera({
      graph: input.graph,
      camera: {
        ...targetCamera,
        scale: targetCamera.scale * scaleFactor
      },
      points: input.pointsAtProgress(1),
      safeRect
    });
    sweptBounds = sweptCameraBounds({
      graph: input.graph,
      sourceCamera,
      targetCamera,
      progressSamples,
      pointsAtProgress: input.pointsAtProgress
    });
  }

  const minimumScale = input.minimumCameraScale ?? 20;
  const contained = kpStageFitRectContains(safeRect, sweptBounds, 0.75);
  const readable = sourceCamera.scale >= minimumScale &&
    targetCamera.scale >= minimumScale;
  const gap = contained && readable
    ? undefined
    : Object.freeze({
        kind: "stage-fit-repair-gap" as const,
        code: "stage-fit.geometry-outside-safe-frame" as const,
        contractId: input.contract.id,
        subjectId: input.id,
        message: contained
          ? "Graph3D swept fit falls below its camera readability floor."
          : "Graph3D required geometry cannot remain inside the swept safe frame.",
        preservationBoundary: "semantic-content-and-playhead" as const
      });
  return Object.freeze({
    schemaVersion: "kp.graph-3d-swept-fit.v1" as const,
    id: input.id,
    status: gap === undefined ? "fitted" as const : "repair-gap" as const,
    sourceCamera,
    targetCamera,
    safeRect,
    sweptBounds,
    progressSamples,
    ...(gap === undefined ? {} : { gap })
  });
}

function fitEndpointCamera(input: {
  readonly graph: Graph3DObject;
  readonly camera: Graph3DCamera;
  readonly points: readonly GraphPoint3D[];
  readonly safeRect: KpStageFitRect;
}): Graph3DCamera {
  if (input.points.length === 0) {
    throw new Error("Graph3D swept fit requires endpoint subject points.");
  }
  let camera: Graph3DCamera = Object.freeze({
    ...input.camera,
    origin: Object.freeze([...input.camera.origin]) as readonly [number, number]
  });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const bounds = cameraBounds(input.graph, camera, input.points);
    const scaleFactor = Math.min(
      1,
      input.safeRect.width / bounds.width,
      input.safeRect.height / bounds.height
    );
    camera = Object.freeze({ ...camera, scale: camera.scale * scaleFactor });
    camera = recenterCamera(input.graph, camera, input.points, input.safeRect);
  }
  return camera;
}

function recenterCamera(
  graph: Graph3DObject,
  camera: Graph3DCamera,
  points: readonly GraphPoint3D[],
  safeRect: KpStageFitRect
): Graph3DCamera {
  const center = rectCenter(cameraBounds(graph, camera, points));
  const target = rectCenter(safeRect);
  const xStep = rectCenter(cameraBounds(graph, {
    ...camera,
    origin: [camera.origin[0] + 1, camera.origin[1]]
  }, points));
  const yStep = rectCenter(cameraBounds(graph, {
    ...camera,
    origin: [camera.origin[0], camera.origin[1] + 1]
  }, points));
  const j00 = xStep.x - center.x;
  const j10 = xStep.y - center.y;
  const j01 = yStep.x - center.x;
  const j11 = yStep.y - center.y;
  const wantedX = target.x - center.x;
  const wantedY = target.y - center.y;
  const regularization = 1e-8;
  const a = j00 * j00 + j10 * j10 + regularization;
  const b = j00 * j01 + j10 * j11;
  const d = j01 * j01 + j11 * j11 + regularization;
  const e = j00 * wantedX + j10 * wantedY;
  const f = j01 * wantedX + j11 * wantedY;
  const determinant = a * d - b * b;
  if (Math.abs(determinant) <= Number.EPSILON) return camera;
  const deltaX = (e * d - b * f) / determinant;
  const deltaY = (a * f - b * e) / determinant;
  return Object.freeze({
    ...camera,
    origin: Object.freeze([
      camera.origin[0] + deltaX,
      camera.origin[1] + deltaY
    ]) as readonly [number, number]
  });
}

function sweptCameraBounds(input: {
  readonly graph: Graph3DObject;
  readonly sourceCamera: Graph3DCamera;
  readonly targetCamera: Graph3DCamera;
  readonly progressSamples: readonly number[];
  readonly pointsAtProgress: (progress: number) => readonly GraphPoint3D[];
}): KpStageFitRect {
  return unionKpStageFitRects(input.progressSamples.map((progress) =>
    cameraBounds(
      input.graph,
      interpolateCamera(input.sourceCamera, input.targetCamera, progress),
      input.pointsAtProgress(progress)
    )
  ));
}

function cameraBounds(
  graph: Graph3DObject,
  camera: Graph3DCamera,
  points: readonly GraphPoint3D[]
): KpStageFitRect {
  const xyGraph: Graph3DObject = { ...graph, viewMode: "xy", camera };
  const projected = points.map((point) =>
    projectGraphPoint3DToWebGLScreen(xyGraph, point, camera));
  const left = Math.min(...projected.map(({ x }) => x));
  const top = Math.min(...projected.map(({ y }) => y));
  const right = Math.max(...projected.map(({ x }) => x));
  const bottom = Math.max(...projected.map(({ y }) => y));
  return Object.freeze({
    left,
    top,
    width: Math.max(Number.EPSILON, right - left),
    height: Math.max(Number.EPSILON, bottom - top)
  });
}

function interpolateCamera(
  source: Graph3DCamera,
  target: Graph3DCamera,
  progress: number
): Graph3DCamera {
  return {
    azimuthDegrees: interpolate(source.azimuthDegrees,
      target.azimuthDegrees, progress),
    elevationDegrees: interpolate(source.elevationDegrees,
      target.elevationDegrees, progress),
    scale: interpolate(source.scale, target.scale, progress),
    origin: [
      interpolate(source.origin[0], target.origin[0], progress),
      interpolate(source.origin[1], target.origin[1], progress)
    ]
  };
}

function rectCenter(rect: KpStageFitRect): { readonly x: number; readonly y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}
