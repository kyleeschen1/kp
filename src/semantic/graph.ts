import {
  power,
  variable,
  type MathExpression
} from "../math/expression.ts";
import { saddleSurfaceExpression } from "../math/surface-examples.ts";

export type NumericDomain = readonly [number, number];

export const DEFAULT_OCCLUDED_AXIS_LIGHTNESS = 44;

export interface GraphPoint2D {
  x: number;
  y: number;
}

export interface GraphPoint3D extends GraphPoint2D {
  z: number;
}

export interface Graph2DObject {
  id: string;
  type: "graph-2d";
  label: string;
  xAxisId: string;
  yAxisId: string;
  xDomain: NumericDomain;
  yDomain: NumericDomain;
  width: number;
  height: number;
}

export interface Axis2DObject {
  id: string;
  type: "axis-2d";
  graphId: string;
  label: string;
  orientation: "x" | "y";
  domain: NumericDomain;
  tickStep: number;
}

export interface Curve2DObject {
  id: string;
  type: "curve-2d";
  graphId: string;
  label: string;
  equation: string;
  expression: MathExpression;
  xDomain: NumericDomain;
  sampleCount: number;
}

export interface Graph3DCamera {
  azimuthDegrees: number;
  elevationDegrees: number;
  scale: number;
  origin: readonly [number, number];
}

export interface Graph3DDebugSettings {
  depthOverlay: boolean;
  surfaceMesh: boolean;
}

export interface Graph3DObject {
  id: string;
  type: "graph-3d";
  label: string;
  xAxisId: string;
  yAxisId: string;
  zAxisId: string;
  xDomain: NumericDomain;
  yDomain: NumericDomain;
  zDomain: NumericDomain;
  width: number;
  height: number;
  occludedAxisLightness: number;
  debug: Graph3DDebugSettings;
  camera: Graph3DCamera;
}

export interface Axis3DObject {
  id: string;
  type: "axis-3d";
  graphId: string;
  label: string;
  orientation: "x" | "y" | "z";
  domain: NumericDomain;
  tickStep: number;
}

export interface Curve3DObject {
  id: string;
  type: "curve-3d";
  graphId: string;
  label: string;
  equation: {
    x: "2.2 cos(t)";
    y: "1.3 sin(t)";
    z: "0.18 (t - 2 pi)";
  };
  tDomain: NumericDomain;
  sampleCount: number;
}

export interface Surface3DObject {
  id: string;
  type: "surface-3d";
  graphId: string;
  label: string;
  equation: string;
  expression: MathExpression;
  xDomain: NumericDomain;
  yDomain: NumericDomain;
  xSampleCount: number;
  ySampleCount: number;
}

export type GraphSceneObject =
  | Axis2DObject
  | Axis3DObject
  | Curve2DObject
  | Curve3DObject
  | Graph2DObject
  | Graph3DObject
  | Surface3DObject;

type CreateGraph2DObjectInput = Omit<Graph2DObject, "type">;
type CreateAxis2DObjectInput = Omit<Axis2DObject, "type">;
type CreateGraph3DObjectInput =
  Omit<Graph3DObject, "debug" | "occludedAxisLightness" | "type"> &
  Partial<Pick<Graph3DObject, "occludedAxisLightness">> & {
    debug?: Partial<Graph3DDebugSettings>;
  };
type CreateAxis3DObjectInput = Omit<Axis3DObject, "type">;

interface CreateParabolaCurveInput {
  id: string;
  graphId: string;
  xDomain: NumericDomain;
  sampleCount: number;
}

interface CreateTimeSpiralCurveInput {
  id: string;
  graphId: string;
  tDomain: NumericDomain;
  sampleCount: number;
}

interface CreateSaddleSurfaceInput {
  id: string;
  graphId: string;
  xDomain: NumericDomain;
  yDomain: NumericDomain;
  xSampleCount: number;
  ySampleCount: number;
}

export function createGraph2DObject(
  input: CreateGraph2DObjectInput
): Graph2DObject {
  return {
    ...input,
    type: "graph-2d"
  };
}

export function createAxis2DObject(
  input: CreateAxis2DObjectInput
): Axis2DObject {
  return {
    ...input,
    type: "axis-2d"
  };
}

export function createParabolaCurve2D(
  input: CreateParabolaCurveInput
): Curve2DObject {
  return {
    ...input,
    type: "curve-2d",
    label: "x^2 = y",
    equation: "y = x^2",
    expression: power(variable("x"), 2)
  };
}

export function createGraph3DObject(
  input: CreateGraph3DObjectInput
): Graph3DObject {
  return {
    ...input,
    type: "graph-3d",
    occludedAxisLightness: clamp(
      input.occludedAxisLightness ?? DEFAULT_OCCLUDED_AXIS_LIGHTNESS,
      0,
      100
    ),
    debug: {
      depthOverlay: input.debug?.depthOverlay ?? false,
      surfaceMesh: input.debug?.surfaceMesh ?? false
    }
  };
}

export function createAxis3DObject(
  input: CreateAxis3DObjectInput
): Axis3DObject {
  return {
    ...input,
    type: "axis-3d"
  };
}

export function createTimeSpiralCurve3D(
  input: CreateTimeSpiralCurveInput
): Curve3DObject {
  return {
    ...input,
    type: "curve-3d",
    label: "time spiral",
    equation: {
      x: "2.2 cos(t)",
      y: "1.3 sin(t)",
      z: "0.18 (t - 2 pi)"
    }
  };
}

export function createSaddleSurface3D(
  input: CreateSaddleSurfaceInput
): Surface3DObject {
  return {
    ...input,
    type: "surface-3d",
    label: "z = (x^2 - y^2) / 4",
    equation: "z = (x^2 - y^2) / 4",
    expression: saddleSurfaceExpression
  };
}

export function createDefaultGraphScene(): readonly GraphSceneObject[] {
  const graph = createGraph2DObject({
    id: "parabola-graph",
    label: "Parabola graph",
    xAxisId: "parabola-x-axis",
    yAxisId: "parabola-y-axis",
    xDomain: [-3, 3],
    yDomain: [-1, 9],
    width: 520,
    height: 360
  });
  const xAxis = createAxis2DObject({
    id: "parabola-x-axis",
    graphId: graph.id,
    label: "x",
    orientation: "x",
    domain: graph.xDomain,
    tickStep: 1
  });
  const yAxis = createAxis2DObject({
    id: "parabola-y-axis",
    graphId: graph.id,
    label: "y",
    orientation: "y",
    domain: graph.yDomain,
    tickStep: 1
  });
  const curve = createParabolaCurve2D({
    id: "curve-y-equals-x-squared",
    graphId: graph.id,
    xDomain: graph.xDomain,
    sampleCount: 121
  });

  return [graph, xAxis, yAxis, curve];
}

export function createDefaultGraph3DScene(): readonly GraphSceneObject[] {
  const graph = createGraph3DObject({
    id: "saddle-orbit-graph",
    label: "Saddle surface",
    xAxisId: "saddle-orbit-x-axis",
    yAxisId: "saddle-orbit-y-axis",
    zAxisId: "saddle-orbit-z-axis",
    xDomain: [-3, 3],
    yDomain: [-3, 3],
    zDomain: [-2.5, 2.5],
    width: 560,
    height: 420,
    occludedAxisLightness: DEFAULT_OCCLUDED_AXIS_LIGHTNESS,
    camera: {
      azimuthDegrees: 35,
      elevationDegrees: 30,
      scale: 58,
      origin: [280, 244]
    }
  });
  const xAxis = createAxis3DObject({
    id: "saddle-orbit-x-axis",
    graphId: graph.id,
    label: "x",
    orientation: "x",
    domain: graph.xDomain,
    tickStep: 1
  });
  const yAxis = createAxis3DObject({
    id: "saddle-orbit-y-axis",
    graphId: graph.id,
    label: "y",
    orientation: "y",
    domain: graph.yDomain,
    tickStep: 1
  });
  const zAxis = createAxis3DObject({
    id: "saddle-orbit-z-axis",
    graphId: graph.id,
    label: "z",
    orientation: "z",
    domain: graph.zDomain,
    tickStep: 1
  });
  const surface = createSaddleSurface3D({
    id: "saddle-surface",
    graphId: graph.id,
    xDomain: graph.xDomain,
    yDomain: graph.yDomain,
    xSampleCount: 13,
    ySampleCount: 13
  });
  return [graph, xAxis, yAxis, zAxis, surface];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
