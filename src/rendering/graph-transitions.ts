import {
  createKpAnimationMotionPlan,
  normalizeAnimationProgress,
  type KpAnimationMotionPlan,
  type KpAnimationSampler,
  type KpSampledAnimationFrame
} from "../animation/kernel.ts";
import {
  createSemanticObjectRef,
  createSemanticTransformationRef
} from "../semantic/animation.ts";
import type { KpSemanticObject } from "../semantic/document.ts";
import type {
  Axis3DObject,
  Graph3DObject,
  Graph3DSurfaceMode,
  Graph3DSurfaceResolution,
  GraphPoint3D,
  Surface3DObject
} from "../semantic/graph.ts";
import { graph3DSurfaceResolution } from "../semantic/graph.ts";
import type { LinearMapObject } from "../semantic/linear-map.ts";
import {
  sampleHyperplaneSurfaceGrid,
  sampleSaddleSurface,
  sampleTorusSurfaceGrid
} from "./graph-svg.ts";

export type GraphSurfaceMorphRole =
  | "donut"
  | "hyperplane-negative"
  | "hyperplane-positive"
  | "mesh";

export interface GraphSurfaceUvPoint {
  readonly u: number;
  readonly v: number;
}

export interface GraphSurfaceMorphTarget {
  readonly mode: Graph3DSurfaceMode;
  readonly role: GraphSurfaceMorphRole;
  readonly surfaceId: string;
  readonly uSampleCount: number;
  readonly uv: readonly GraphSurfaceUvPoint[];
  readonly vertices: readonly GraphPoint3D[];
  readonly vSampleCount: number;
}

export interface GraphSurfaceMaterialTransition {
  readonly crossfade: boolean;
  readonly reason: "same-semantic-surface" | "surface-mode-change";
  readonly sourceRole: GraphSurfaceMorphRole;
  readonly targetRole: GraphSurfaceMorphRole;
}

export interface GraphSurfaceMorphChannel {
  readonly channelIndex: number;
  readonly material: GraphSurfaceMaterialTransition;
  readonly source: GraphSurfaceMorphTarget;
  readonly target: GraphSurfaceMorphTarget;
}

export interface GraphSurfaceModeTransition {
  readonly channels: readonly GraphSurfaceMorphChannel[];
  readonly materialCrossfade: boolean;
  readonly sourceMode: Graph3DSurfaceMode;
  readonly targetMode: Graph3DSurfaceMode;
  readonly uSampleCount: number;
  readonly vSampleCount: number;
}

export interface GraphSurfaceMorphFrame extends KpSampledAnimationFrame {
  readonly planId?: string | undefined;
  readonly channels: readonly GraphSurfaceMorphFrameChannel[];
  readonly progress: number;
  readonly sourceMode: Graph3DSurfaceMode;
  readonly targetMode: Graph3DSurfaceMode;
  readonly timelineId?: string | undefined;
}

export interface GraphSurfaceMorphFrameOptions {
  readonly planId?: string | undefined;
  readonly timelineId?: string | undefined;
}

export interface GraphSurfaceMorphFrameChannel {
  readonly channelIndex: number;
  readonly mode: Graph3DSurfaceMode;
  readonly role: GraphSurfaceMorphRole;
  readonly surfaceId: string;
  readonly uSampleCount: number;
  readonly vertices: readonly GraphPoint3D[];
  readonly vSampleCount: number;
}

export interface Graph3DTo2DAxisTransition {
  readonly axisId: string;
  readonly orientation: Axis3DObject["orientation"];
  readonly sourceOpacity: number;
  readonly targetOpacity: number;
  readonly targetVisibility: "hidden" | "visible";
}

export interface Graph3DTo2DTransitionDescriptor {
  readonly axes: readonly Graph3DTo2DAxisTransition[];
  readonly camera: {
    readonly from: Graph3DObject["camera"];
    readonly target: Graph3DObject["camera"];
    readonly targetPlane: "xy";
  };
  readonly flatten: {
    readonly fromZScale: number;
    readonly targetZ: number;
    readonly toZScale: number;
  };
  readonly graphId: string;
  readonly kind: "graph-3d-to-2d";
}

export interface GraphVectorMotionFrame extends KpSampledAnimationFrame {
  readonly kind: "graph-vector-motion";
  readonly diagnostics: GraphVectorMotionDiagnostics;
  readonly displacement: readonly number[];
  readonly graphId?: string | undefined;
  readonly linearMapId: string;
  readonly sampledVector: readonly number[];
  readonly sourceVector: readonly number[];
  readonly targetVector: readonly number[];
  readonly vectorId: string;
}

export interface GraphVectorMotionDiagnostics {
  readonly componentCount: number;
  readonly displacementMagnitude: number;
  readonly sourceDimension: number;
  readonly targetDimension: number;
}

export interface GraphVectorMotionFrameOptions {
  readonly graphId?: string | undefined;
  readonly planId?: string | undefined;
  readonly timelineId?: string | undefined;
  readonly vectorId?: string | undefined;
}

export interface GraphVectorMotionSampler
  extends KpAnimationSampler<GraphVectorMotionFrame> {
  readonly linearMap: LinearMapObject;
  readonly sourceVector: readonly number[];
  readonly targetVector: readonly number[];
}

export interface GraphSurfaceModeSampler
  extends KpAnimationSampler<GraphSurfaceMorphFrame> {
  readonly transition: GraphSurfaceModeTransition;
}

export function createGraph3DTo2DTransitionDescriptor(
  objects: readonly KpSemanticObject[],
  graph: Graph3DObject
): Graph3DTo2DTransitionDescriptor {
  const axes = objects
    .filter(
      (object): object is Axis3DObject =>
        object.type === "axis-3d" && object.graphId === graph.id
    )
    .map((axis): Graph3DTo2DAxisTransition => {
      const targetVisibility = axis.orientation === "z" ? "hidden" : "visible";

      return {
        axisId: axis.id,
        orientation: axis.orientation,
        sourceOpacity: 1,
        targetOpacity: targetVisibility === "hidden" ? 0 : 1,
        targetVisibility
      };
    });

  return {
    axes,
    camera: {
      from: graph.camera,
      target: {
        ...graph.camera,
        azimuthDegrees: 0,
        elevationDegrees: -90
      },
      targetPlane: "xy"
    },
    flatten: {
      fromZScale: 1,
      targetZ: 0,
      toZScale: 0
    },
    graphId: graph.id,
    kind: "graph-3d-to-2d"
  };
}

export function createGraphSurfaceModeTransition(
  objects: readonly KpSemanticObject[],
  graph: Graph3DObject,
  sourceMode: Graph3DSurfaceMode,
  targetMode: Graph3DSurfaceMode
): GraphSurfaceModeTransition {
  const resolution = transitionResolution(graph, sourceMode, targetMode);
  const sourceTargets = createGraphSurfaceMorphTargets(
    objects,
    graph,
    sourceMode,
    resolution
  );
  const targetTargets = createGraphSurfaceMorphTargets(
    objects,
    graph,
    targetMode,
    resolution
  );
  const channelCount = Math.max(sourceTargets.length, targetTargets.length);
  const channels = Array.from({ length: channelCount }, (_, channelIndex) => {
    const source = sourceTargets[channelIndex] ?? sourceTargets[0];
    const target = targetTargets[channelIndex] ?? targetTargets[0];

    if (source === undefined || target === undefined) {
      return undefined;
    }

    return createGraphSurfaceMorphChannel(channelIndex, source, target);
  }).filter(
    (channel): channel is GraphSurfaceMorphChannel => channel !== undefined
  );

  return {
    channels,
    materialCrossfade: channels.some((channel) => channel.material.crossfade),
    sourceMode,
    targetMode,
    uSampleCount: resolution.torusUSampleCount,
    vSampleCount: resolution.torusVSampleCount
  };
}

export function createGraphSurfaceMorphTargets(
  objects: readonly KpSemanticObject[],
  graph: Graph3DObject,
  surfaceMode: Graph3DSurfaceMode,
  resolution = graph3DSurfaceResolution(graph.surfaceQuality)
): readonly GraphSurfaceMorphTarget[] {
  const surfaces = objects.filter(
    (object): object is Surface3DObject =>
      object.type === "surface-3d" && object.graphId === graph.id
  );

  switch (surfaceMode) {
    case "mesh":
      return surfaces.map((surface) =>
        graphSurfaceMorphTargetFromGrid(
          surface.id,
          surfaceMode,
          "mesh",
          sampleSaddleSurface({
            ...surface,
            xSampleCount: resolution.xSampleCount,
            ySampleCount: resolution.ySampleCount
          })
        )
      );
    case "donut":
      return [
        graphSurfaceMorphTargetFromGrid(
          `${graph.id}-donut`,
          surfaceMode,
          "donut",
          sampleTorusSurfaceGrid(resolution)
        )
      ];
    case "hyperplanes":
      return [
        graphSurfaceMorphTargetFromGrid(
          `${graph.id}-hyperplane-positive`,
          surfaceMode,
          "hyperplane-positive",
          sampleHyperplaneSurfaceGrid(0.5, resolution)
        ),
        graphSurfaceMorphTargetFromGrid(
          `${graph.id}-hyperplane-negative`,
          surfaceMode,
          "hyperplane-negative",
          sampleHyperplaneSurfaceGrid(-0.5, resolution)
        )
      ];
  }
}

export function graphSurfaceMorphTargetFromGrid(
  surfaceId: string,
  mode: Graph3DSurfaceMode,
  role: GraphSurfaceMorphRole,
  grid: readonly (readonly GraphPoint3D[])[]
): GraphSurfaceMorphTarget {
  const vSampleCount = grid.length;
  const uSampleCount = grid[0]?.length ?? 0;

  return {
    mode,
    role,
    surfaceId,
    uSampleCount,
    uv: surfaceUvSamples(uSampleCount, vSampleCount),
    vertices: grid.flat(),
    vSampleCount
  };
}

export function interpolateGraphSurfaceModeTransition(
  transition: GraphSurfaceModeTransition,
  progress: number,
  options: GraphSurfaceMorphFrameOptions = {}
): GraphSurfaceMorphFrame {
  const clampedProgress = normalizeAnimationProgress(progress);

  return {
    ...(options.planId === undefined ? {} : { planId: options.planId }),
    channels: transition.channels.map((channel) => ({
      channelIndex: channel.channelIndex,
      mode: transition.targetMode,
      role: channel.target.role,
      surfaceId: channel.target.surfaceId,
      uSampleCount: channel.target.uSampleCount,
      vSampleCount: channel.target.vSampleCount,
      vertices: interpolateSurfaceVertices(
        channel.source.vertices,
        channel.target.vertices,
        clampedProgress
      )
    })),
    progress: clampedProgress,
    sourceMode: transition.sourceMode,
    targetMode: transition.targetMode,
    ...(options.timelineId === undefined ? {} : { timelineId: options.timelineId })
  };
}

export function createGraphSurfaceModeSampler(
  transition: GraphSurfaceModeTransition,
  options: GraphSurfaceMorphFrameOptions = {}
): GraphSurfaceModeSampler {
  return {
    transition,
    sample(progress) {
      return interpolateGraphSurfaceModeTransition(transition, progress, options);
    }
  };
}

export function createLinearMapVectorMotionSampler(
  linearMap: LinearMapObject,
  sourceVector: readonly number[],
  options: GraphVectorMotionFrameOptions = {}
): GraphVectorMotionSampler {
  validateLinearMapVectorDimensions(linearMap, sourceVector);
  const targetVector = applyLinearMapToVector(linearMap, sourceVector);

  return {
    linearMap,
    sourceVector: [...sourceVector],
    targetVector,
    sample(progress) {
      return sampleGraphVectorMotionFrame(
        linearMap,
        sourceVector,
        targetVector,
        progress,
        options
      );
    }
  };
}

export function createGraphSurfaceModeMotionPlan(
  graph: Graph3DObject,
  transition: GraphSurfaceModeTransition
): KpAnimationMotionPlan {
  const sourceRef = createSemanticObjectRef({
    objectId: graph.id,
    objectType: graph.type,
    selectorId: `surfaceMode.${transition.sourceMode}`
  });
  const targetRef = createSemanticObjectRef({
    objectId: graph.id,
    objectType: graph.type,
    selectorId: `surfaceMode.${transition.targetMode}`
  });
  const transformation = createSemanticTransformationRef({
    id: `${graph.id}.surface-mode.${transition.sourceMode}-to-${transition.targetMode}`,
    kind: "changeGraphSurfaceMode",
    sourceObjectIds: [graph.id],
    targetObjectIds: [graph.id],
    preserves: ["identity", "structure"],
    summary:
      "Graph surface mode changes while the graph semantic object identity persists."
  });

  return createKpAnimationMotionPlan({
    id: `${graph.id}.surface-mode.${transition.sourceMode}-to-${transition.targetMode}.plan`,
    kind: "graph-surface-mode-transition",
    sourceObjectRefs: [sourceRef],
    targetObjectRefs: [targetRef],
    transformationRefs: [transformation],
    summary:
      "Renderer-neutral graph surface mode motion plan sampled by SVG or WebGL adapters."
  });
}

function sampleGraphVectorMotionFrame(
  linearMap: LinearMapObject,
  sourceVector: readonly number[],
  targetVector: readonly number[],
  progress: number,
  options: GraphVectorMotionFrameOptions
): GraphVectorMotionFrame {
  const clampedProgress = normalizeAnimationProgress(progress);
  const displacement = subtractVectors(targetVector, sourceVector);

  return {
    ...(options.graphId === undefined ? {} : { graphId: options.graphId }),
    kind: "graph-vector-motion",
    diagnostics: {
      componentCount: targetVector.length,
      displacementMagnitude: vectorMagnitude(displacement),
      sourceDimension: sourceVector.length,
      targetDimension: targetVector.length
    },
    displacement,
    linearMapId: linearMap.id,
    ...(options.planId === undefined ? {} : { planId: options.planId }),
    progress: clampedProgress,
    sampledVector: interpolateVector(
      sourceVector,
      targetVector,
      clampedProgress
    ),
    sourceVector: [...sourceVector],
    targetVector: [...targetVector],
    ...(options.timelineId === undefined
      ? {}
      : { timelineId: options.timelineId }),
    vectorId: options.vectorId ?? `${linearMap.id}.source-vector`
  };
}

function validateLinearMapVectorDimensions(
  linearMap: LinearMapObject,
  sourceVector: readonly number[]
): void {
  if (sourceVector.length !== linearMap.domainDimension) {
    throw new Error(
      `Linear map ${linearMap.id} expects a source vector of dimension ${linearMap.domainDimension}.`
    );
  }
}

function applyLinearMapToVector(
  linearMap: LinearMapObject,
  sourceVector: readonly number[]
): readonly number[] {
  return linearMap.rows.map((row) =>
    row.reduce((sum, value, index) => sum + value * (sourceVector[index] ?? 0), 0)
  );
}

function interpolateVector(
  sourceVector: readonly number[],
  targetVector: readonly number[],
  progress: number
): readonly number[] {
  return targetVector.map((targetValue, index) => {
    const sourceValue = sourceVector[index] ?? 0;
    return interpolate(sourceValue, targetValue, progress);
  });
}

function subtractVectors(
  targetVector: readonly number[],
  sourceVector: readonly number[]
): readonly number[] {
  return targetVector.map(
    (targetValue, index) => targetValue - (sourceVector[index] ?? 0)
  );
}

function vectorMagnitude(vector: readonly number[]): number {
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

function createGraphSurfaceMorphChannel(
  channelIndex: number,
  source: GraphSurfaceMorphTarget,
  target: GraphSurfaceMorphTarget
): GraphSurfaceMorphChannel {
  const crossfade =
    source.mode !== target.mode ||
    source.role !== target.role ||
    source.surfaceId !== target.surfaceId;

  return {
    channelIndex,
    material: {
      crossfade,
      reason: crossfade ? "surface-mode-change" : "same-semantic-surface",
      sourceRole: source.role,
      targetRole: target.role
    },
    source,
    target
  };
}

function interpolateSurfaceVertices(
  source: readonly GraphPoint3D[],
  target: readonly GraphPoint3D[],
  progress: number
): readonly GraphPoint3D[] {
  const vertexCount = Math.min(source.length, target.length);

  return Array.from({ length: vertexCount }, (_, index) => {
    const sourcePoint = source[index];
    const targetPoint = target[index];

    if (sourcePoint === undefined || targetPoint === undefined) {
      return { x: 0, y: 0, z: 0 };
    }

    return {
      x: interpolate(sourcePoint.x, targetPoint.x, progress),
      y: interpolate(sourcePoint.y, targetPoint.y, progress),
      z: interpolate(sourcePoint.z, targetPoint.z, progress)
    };
  });
}

function interpolate(source: number, target: number, progress: number): number {
  return source + (target - source) * progress;
}

function transitionResolution(
  graph: Graph3DObject,
  sourceMode: Graph3DSurfaceMode,
  targetMode: Graph3DSurfaceMode
): Graph3DSurfaceResolution {
  const baseResolution = graph3DSurfaceResolution(graph.surfaceQuality);
  const sourceResolution = modeResolution(sourceMode, baseResolution);
  const targetResolution = modeResolution(targetMode, baseResolution);
  const uSampleCount = Math.max(
    sourceResolution.uSampleCount,
    targetResolution.uSampleCount
  );
  const vSampleCount = Math.max(
    sourceResolution.vSampleCount,
    targetResolution.vSampleCount
  );

  return {
    xSampleCount: uSampleCount,
    ySampleCount: vSampleCount,
    torusUSampleCount: uSampleCount,
    torusVSampleCount: vSampleCount
  };
}

function modeResolution(
  mode: Graph3DSurfaceMode,
  resolution: Graph3DSurfaceResolution
): { readonly uSampleCount: number; readonly vSampleCount: number } {
  return mode === "donut"
    ? {
        uSampleCount: resolution.torusUSampleCount,
        vSampleCount: resolution.torusVSampleCount
      }
    : {
        uSampleCount: resolution.xSampleCount,
        vSampleCount: resolution.ySampleCount
      };
}

function surfaceUvSamples(
  uSampleCount: number,
  vSampleCount: number
): readonly GraphSurfaceUvPoint[] {
  return Array.from({ length: vSampleCount }, (_, rowIndex) =>
    Array.from({ length: uSampleCount }, (_, columnIndex) => ({
      u: normalizedGridCoordinate(columnIndex, uSampleCount),
      v: normalizedGridCoordinate(rowIndex, vSampleCount)
    }))
  ).flat();
}

function normalizedGridCoordinate(index: number, sampleCount: number): number {
  return sampleCount <= 1 ? 0 : index / (sampleCount - 1);
}
