type NumericDomain = readonly [number, number];

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
  equation: "y = x^2";
  xDomain: NumericDomain;
  sampleCount: number;
}

export type GraphSceneObject = Axis2DObject | Curve2DObject | Graph2DObject;

type CreateGraph2DObjectInput = Omit<Graph2DObject, "type">;
type CreateAxis2DObjectInput = Omit<Axis2DObject, "type">;

interface CreateParabolaCurveInput {
  id: string;
  graphId: string;
  xDomain: NumericDomain;
  sampleCount: number;
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
    equation: "y = x^2"
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
