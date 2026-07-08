import { compileExpression } from "../math/expression.ts";
import type { KpSemanticObject } from "../semantic/document.ts";
import type {
  Axis2DObject,
  Curve2DObject,
  Graph2DObject,
  GraphPoint2D
} from "../semantic/graph.ts";

export interface Graph2DLineSegment {
  readonly from: GraphPoint2D;
  readonly to: GraphPoint2D;
}

export interface Graph2DSceneAxis {
  readonly axis: Axis2DObject;
  readonly labelPoint: GraphPoint2D;
  readonly line: Graph2DLineSegment;
  readonly renderNodeId: string;
  readonly role: "axis-line";
}

export interface Graph2DSceneCurve {
  readonly curve: Curve2DObject;
  readonly graphPoints: readonly GraphPoint2D[];
  readonly projectedPoints: readonly GraphPoint2D[];
  readonly renderNodeId: string;
  readonly role: "curve-path";
}

export interface Graph2DSceneModel {
  readonly axes: readonly Graph2DSceneAxis[];
  readonly curves: readonly Graph2DSceneCurve[];
  readonly graph: Graph2DObject;
}

export function createGraph2DSceneModel(
  objects: readonly KpSemanticObject[],
  graph: Graph2DObject
): Graph2DSceneModel {
  const axes = objects
    .filter(
      (object): object is Axis2DObject =>
        object.type === "axis-2d" && object.graphId === graph.id
    )
    .map((axis) => createGraph2DSceneAxis(graph, axis));
  const curves = objects
    .filter(
      (object): object is Curve2DObject =>
        object.type === "curve-2d" && object.graphId === graph.id
    )
    .map((curve) => createGraph2DSceneCurve(graph, curve));

  return {
    axes,
    curves,
    graph
  };
}

export function projectGraphPoint(
  graph: Graph2DObject,
  point: GraphPoint2D
): GraphPoint2D {
  const [minX, maxX] = graph.xDomain;
  const [minY, maxY] = graph.yDomain;

  return {
    x: ((point.x - minX) / (maxX - minX)) * graph.width,
    y: graph.height - ((point.y - minY) / (maxY - minY)) * graph.height
  };
}

export function sampleParabolaCurve(
  curve: Curve2DObject
): readonly GraphPoint2D[] {
  const [minX, maxX] = curve.xDomain;
  const step = (maxX - minX) / (curve.sampleCount - 1);
  const evaluateCurve = compileExpression(curve.expression);

  return Array.from({ length: curve.sampleCount }, (_, index) => {
    const x = minX + step * index;

    return {
      x,
      y: roundCoordinate(evaluateCurve({ x }))
    };
  });
}

function createGraph2DSceneAxis(
  graph: Graph2DObject,
  axis: Axis2DObject
): Graph2DSceneAxis {
  const line =
    axis.orientation === "x"
      ? {
          from: projectGraphPoint(graph, { x: graph.xDomain[0], y: 0 }),
          to: projectGraphPoint(graph, { x: graph.xDomain[1], y: 0 })
        }
      : {
          from: projectGraphPoint(graph, { x: 0, y: graph.yDomain[0] }),
          to: projectGraphPoint(graph, { x: 0, y: graph.yDomain[1] })
        };
  const labelPoint =
    axis.orientation === "x"
      ? projectGraphPoint(graph, { x: graph.xDomain[1], y: 0 })
      : projectGraphPoint(graph, { x: 0, y: graph.yDomain[1] });

  return {
    axis,
    labelPoint,
    line,
    renderNodeId: `rn-${axis.id}-svg-line`,
    role: "axis-line"
  };
}

function createGraph2DSceneCurve(
  graph: Graph2DObject,
  curve: Curve2DObject
): Graph2DSceneCurve {
  const graphPoints = sampleParabolaCurve(curve);

  return {
    curve,
    graphPoints,
    projectedPoints: graphPoints.map((point) => projectGraphPoint(graph, point)),
    renderNodeId: `rn-${curve.id}-svg-path`,
    role: "curve-path"
  };
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(3));
}
