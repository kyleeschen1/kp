import {
  add,
  constant,
  cos,
  divide,
  multiply,
  power,
  sin,
  variable,
  type MathExpression
} from "../math/expression.ts";
import {
  DEFAULT_SADDLE_DENOMINATOR,
  createSaddleSurfaceExpression,
  saddleSurfaceExpression
} from "../math/surface-examples.ts";

export type NumericDomain = readonly [number, number];

export const DEFAULT_OCCLUDED_AXIS_LIGHTNESS = 44;

export const DEFAULT_GRAPH_3D_SHADOW_SETTINGS: Graph3DShadowSettings = {
  enabled: true,
  opacity: 0.16
};

export const DEFAULT_GRAPH_3D_LIGHT_SETTINGS: Graph3DLightSettings = {
  direction: { x: -0.35, y: -0.45, z: 0.82 },
  ambient: 0.45,
  diffuse: 0.4,
  depthHaze: 1,
  specular: 0.12,
  rim: 0.08
};

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

export interface Graph3DShadowSettings {
  enabled: boolean;
  opacity: number;
}

export interface Graph3DLightSettings {
  direction: GraphPoint3D;
  ambient: number;
  diffuse: number;
  depthHaze: number;
  specular: number;
  rim: number;
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
  shadow: Graph3DShadowSettings;
  light: Graph3DLightSettings;
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

export interface ParametricCurve3DExpressions {
  x: MathExpression;
  y: MathExpression;
  z: MathExpression;
}

export interface Curve3DObject {
  id: string;
  type: "curve-3d";
  graphId: string;
  label: string;
  equation: {
    x: string;
    y: string;
    z: string;
  };
  expressions: ParametricCurve3DExpressions;
  tDomain: NumericDomain;
  sampleCount: number;
}

export interface SaddleSurfaceParameterization {
  kind: "saddle";
  denominator: number;
}

export interface Surface3DObject {
  id: string;
  type: "surface-3d";
  graphId: string;
  label: string;
  equation: string;
  parameterization?: SaddleSurfaceParameterization;
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
  Omit<
    Graph3DObject,
    "debug" | "light" | "occludedAxisLightness" | "shadow" | "type"
  > &
  Partial<Pick<Graph3DObject, "occludedAxisLightness">> & {
    debug?: Partial<Graph3DDebugSettings>;
    shadow?: Partial<Graph3DShadowSettings>;
    light?: Partial<Graph3DLightSettings> & {
      direction?: GraphPoint3D;
    };
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
  denominator?: number;
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
    },
    shadow: {
      enabled:
        input.shadow?.enabled ?? DEFAULT_GRAPH_3D_SHADOW_SETTINGS.enabled,
      opacity: clamp(
        input.shadow?.opacity ?? DEFAULT_GRAPH_3D_SHADOW_SETTINGS.opacity,
        0,
        1
      )
    },
    light: {
      direction:
        input.light?.direction ?? DEFAULT_GRAPH_3D_LIGHT_SETTINGS.direction,
      ambient: clamp(
        input.light?.ambient ?? DEFAULT_GRAPH_3D_LIGHT_SETTINGS.ambient,
        0,
        1
      ),
      diffuse: clamp(
        input.light?.diffuse ?? DEFAULT_GRAPH_3D_LIGHT_SETTINGS.diffuse,
        0,
        1
      ),
      depthHaze: clamp(
        input.light?.depthHaze ?? DEFAULT_GRAPH_3D_LIGHT_SETTINGS.depthHaze,
        0,
        1
      ),
      specular: clamp(
        input.light?.specular ?? DEFAULT_GRAPH_3D_LIGHT_SETTINGS.specular,
        0,
        1
      ),
      rim: clamp(
        input.light?.rim ?? DEFAULT_GRAPH_3D_LIGHT_SETTINGS.rim,
        0,
        1
      )
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
    },
    expressions: {
      x: multiply(constant(2.2), cos(variable("t"))),
      y: multiply(constant(1.3), sin(variable("t"))),
      z: multiply(constant(0.18), add(variable("t"), constant(-Math.PI * 2)))
    }
  };
}

export function createSaddleWeaveCurve3D(
  input: CreateTimeSpiralCurveInput
): Curve3DObject {
  return {
    ...input,
    type: "curve-3d",
    label: "saddle weave",
    equation: {
      x: "t",
      y: "0",
      z: "t^2 / 4 + 0.25 sin(2t)"
    },
    expressions: {
      x: variable("t"),
      y: constant(0),
      z: add(
        divide(power(variable("t"), 2), constant(4)),
        multiply(constant(0.25), sin(multiply(constant(2), variable("t"))))
      )
    }
  };
}

export function createSaddleSurface3D(
  input: CreateSaddleSurfaceInput
): Surface3DObject {
  const { denominator: rawDenominator, ...surfaceInput } = input;
  const denominator = rawDenominator ?? DEFAULT_SADDLE_DENOMINATOR;
  const denominatorText = formatNumber(denominator);

  return {
    ...surfaceInput,
    type: "surface-3d",
    label: `z = (x^2 - y^2) / ${denominatorText}`,
    equation: `z = (x^2 - y^2) / ${denominatorText}`,
    parameterization: {
      kind: "saddle",
      denominator
    },
    expression:
      denominator === DEFAULT_SADDLE_DENOMINATOR
        ? saddleSurfaceExpression
        : createSaddleSurfaceExpression(denominator)
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

function formatNumber(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}
