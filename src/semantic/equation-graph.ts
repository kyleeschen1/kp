import {
  classifyLatexEquation
} from "../math/equation-classifier.ts";
import {
  createAxis2DObject,
  createAxis3DObject,
  createGraph2DObject,
  createGraph3DObject,
  DEFAULT_OCCLUDED_AXIS_LIGHTNESS,
  type Curve2DObject,
  type GraphSceneObject,
  type Surface3DObject
} from "./graph.ts";

interface CreateGraphSceneFromLatexEquationInput {
  idPrefix: string;
  latex: string;
}

export function createGraphSceneFromLatexEquation(
  input: CreateGraphSceneFromLatexEquationInput
): readonly GraphSceneObject[] {
  const equation = classifyLatexEquation(input.latex);

  switch (equation.kind) {
    case "explicit-2d-curve":
      return create2DCurveScene(input.idPrefix, input.latex, equation.expression);
    case "explicit-3d-surface":
      return create3DSurfaceScene(input.idPrefix, input.latex, equation.expression);
  }
}

function create2DCurveScene(
  idPrefix: string,
  latex: string,
  expression: Curve2DObject["expression"]
): readonly GraphSceneObject[] {
  const graph = createGraph2DObject({
    id: `${idPrefix}-graph`,
    label: latex,
    xAxisId: `${idPrefix}-x-axis`,
    yAxisId: `${idPrefix}-y-axis`,
    xDomain: [-3, 3],
    yDomain: [-3, 9],
    width: 520,
    height: 360
  });
  const xAxis = createAxis2DObject({
    id: graph.xAxisId,
    graphId: graph.id,
    label: "x",
    orientation: "x",
    domain: graph.xDomain,
    tickStep: 1
  });
  const yAxis = createAxis2DObject({
    id: graph.yAxisId,
    graphId: graph.id,
    label: "y",
    orientation: "y",
    domain: graph.yDomain,
    tickStep: 1
  });
  const curve: Curve2DObject = {
    id: `${idPrefix}-curve`,
    type: "curve-2d",
    graphId: graph.id,
    label: latex,
    equation: latex,
    expression,
    xDomain: graph.xDomain,
    sampleCount: 121
  };

  return [graph, xAxis, yAxis, curve];
}

function create3DSurfaceScene(
  idPrefix: string,
  latex: string,
  expression: Surface3DObject["expression"]
): readonly GraphSceneObject[] {
  const graph = createGraph3DObject({
    id: `${idPrefix}-graph`,
    label: latex,
    xAxisId: `${idPrefix}-x-axis`,
    yAxisId: `${idPrefix}-y-axis`,
    zAxisId: `${idPrefix}-z-axis`,
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
    id: graph.xAxisId,
    graphId: graph.id,
    label: "x",
    orientation: "x",
    domain: graph.xDomain,
    tickStep: 1
  });
  const yAxis = createAxis3DObject({
    id: graph.yAxisId,
    graphId: graph.id,
    label: "y",
    orientation: "y",
    domain: graph.yDomain,
    tickStep: 1
  });
  const zAxis = createAxis3DObject({
    id: graph.zAxisId,
    graphId: graph.id,
    label: "z",
    orientation: "z",
    domain: graph.zDomain,
    tickStep: 1
  });
  const surface: Surface3DObject = {
    id: `${idPrefix}-surface`,
    type: "surface-3d",
    graphId: graph.id,
    label: latex,
    equation: latex,
    expression,
    xDomain: graph.xDomain,
    yDomain: graph.yDomain,
    xSampleCount: 13,
    ySampleCount: 13
  };

  return [graph, xAxis, yAxis, zAxis, surface];
}
