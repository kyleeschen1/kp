import {
  compileExpression,
  differentiate,
  expressionToLatex,
  type MathExpression,
  type NumericScope
} from "../math/expression.ts";
import type { KpSemanticObject } from "./document.ts";
import {
  createExpressionObject,
  expressionObjectToLatex,
  expressionVariables,
  type ExpressionObject
} from "./expression-object.ts";
import {
  createAxis2DObject,
  createAxis3DObject,
  createGraph2DObject,
  createGraph3DObject,
  graph3DSurfaceResolution,
  type Curve2DObject,
  type Curve3DObject,
  type GraphPoint2D,
  type GraphPoint3D,
  type GraphSceneObject,
  type NumericDomain,
  type Surface3DObject
} from "./graph.ts";
import { latexFormObjectToLatex } from "./latex-form.ts";
import { matrixObjectToLatex, type MatrixObject } from "./matrix.ts";

export const SEMANTIC_COMPUTATION_PROTOCOL_IDS = [
  "toLatex",
  "evaluate",
  "differentiate",
  "matrixForm",
  "graphForm",
  "numericSample",
  "solveStep",
  "explainTransform"
] as const;

export type SemanticComputationProtocolId =
  typeof SEMANTIC_COMPUTATION_PROTOCOL_IDS[number];
export type SemanticComputationProtocolStatus = "active" | "planned";

export interface SemanticComputationProtocolDescriptor {
  readonly id: SemanticComputationProtocolId;
  readonly title: string;
  readonly status: SemanticComputationProtocolStatus;
  readonly summary: string;
}

export type SemanticComputationTarget = KpSemanticObject | MathExpression;

export interface SemanticEvaluationOptions {
  readonly scope?: NumericScope;
}

export type SemanticEvaluationResult =
  | SemanticExpressionEvaluationResult
  | SemanticMatrixEvaluationResult;

export interface SemanticExpressionEvaluationResult {
  readonly kind: "scalar";
  readonly value: number;
}

export interface SemanticMatrixEvaluationResult {
  readonly kind: "matrix";
  readonly rowCount: number;
  readonly columnCount: number;
  readonly isSquare: boolean;
  readonly determinant?: number;
}

export interface SemanticGraphFormOptions {
  readonly idPrefix?: string;
  readonly xDomain?: NumericDomain;
  readonly yDomain?: NumericDomain;
  readonly zDomain?: NumericDomain;
  readonly width?: number;
  readonly height?: number;
  readonly sampleCount?: number;
  readonly xSampleCount?: number;
  readonly ySampleCount?: number;
}

export interface SemanticNumericSampleOptions {
  readonly scope?: NumericScope;
  readonly variableName?: string;
  readonly xDomain?: NumericDomain;
  readonly yDomain?: NumericDomain;
  readonly tDomain?: NumericDomain;
  readonly sampleCount?: number;
  readonly xSampleCount?: number;
  readonly ySampleCount?: number;
}

export type SemanticNumericSampleResult =
  | SemanticScalarSample
  | SemanticCurve2DSample
  | SemanticCurve3DSample
  | SemanticSurface3DSample;

export interface SemanticScalarSample {
  readonly kind: "scalar-sample";
  readonly value: number;
}

export interface SemanticCurve2DSample {
  readonly kind: "curve-2d-sample";
  readonly points: readonly GraphPoint2D[];
}

export interface SemanticCurve3DSample {
  readonly kind: "curve-3d-sample";
  readonly points: readonly GraphPoint3D[];
}

export interface SemanticSurface3DSample {
  readonly kind: "surface-3d-sample";
  readonly grid: readonly (readonly GraphPoint3D[])[];
}

export const semanticComputationProtocolDescriptors:
  readonly SemanticComputationProtocolDescriptor[] = [
    {
      id: "toLatex",
      title: "toLatex",
      status: "active",
      summary: "Return a semantic object's canonical LaTeX representation."
    },
    {
      id: "evaluate",
      title: "evaluate",
      status: "active",
      summary: "Run a numeric computation for objects with executable values."
    },
    {
      id: "differentiate",
      title: "differentiate",
      status: "active",
      summary: "Derive a new expression object with provenance-ready identity."
    },
    {
      id: "matrixForm",
      title: "matrixForm",
      status: "active",
      summary: "Expose a matrix object without confusing templates with types."
    },
    {
      id: "graphForm",
      title: "graphForm",
      status: "active",
      summary: "Create or expose graph scene objects for renderable functions."
    },
    {
      id: "numericSample",
      title: "numericSample",
      status: "active",
      summary: "Sample expression-backed curves, surfaces, and parametric curves."
    },
    {
      id: "solveStep",
      title: "solveStep",
      status: "planned",
      summary: "Return a verified semantic transformation step for equations."
    },
    {
      id: "explainTransform",
      title: "explainTransform",
      status: "planned",
      summary: "Explain what identity a semantic transformation preserves."
    }
  ];

export function explainSemanticComputationProtocol(
  id: SemanticComputationProtocolId
): SemanticComputationProtocolDescriptor {
  const descriptor = semanticComputationProtocolDescriptors.find(
    (candidate) => candidate.id === id
  );

  if (descriptor === undefined) {
    throw new Error(`Unknown semantic computation protocol ${id}.`);
  }

  return descriptor;
}

export function listSemanticComputationProtocols(
  target: SemanticComputationTarget
): readonly SemanticComputationProtocolId[] {
  if (isMathExpression(target)) {
    return ["toLatex", "evaluate", "differentiate", "graphForm", "numericSample"];
  }

  switch (target.type) {
    case "expression":
      return ["toLatex", "evaluate", "differentiate", "graphForm", "numericSample"];
    case "matrix":
      return ["toLatex", "evaluate", "matrixForm"];
    case "latex-form":
      return ["toLatex"];
    case "curve-2d":
    case "surface-3d":
      return ["toLatex", "differentiate", "graphForm", "numericSample"];
    case "curve-3d":
      return ["toLatex", "graphForm", "numericSample"];
    case "graph-2d":
    case "graph-3d":
      return ["graphForm"];
    case "animation-intent":
    case "axis-2d":
    case "axis-3d":
    case "latex-comparison":
      return [];
  }
}

export function semanticToLatex(
  target: SemanticComputationTarget
): string | undefined {
  if (isMathExpression(target)) {
    return expressionToLatex(target);
  }

  switch (target.type) {
    case "expression":
      return expressionObjectToLatex(target);
    case "matrix":
      return matrixObjectToLatex(target);
    case "latex-form":
      return latexFormObjectToLatex(target);
    case "curve-2d":
      return `y = ${expressionToLatex(target.expression)}`;
    case "surface-3d":
      return `z = ${expressionToLatex(target.expression)}`;
    case "curve-3d":
      return String.raw`\begin{aligned}x &= ${expressionToLatex(target.expressions.x)} \\ y &= ${expressionToLatex(target.expressions.y)} \\ z &= ${expressionToLatex(target.expressions.z)}\end{aligned}`;
    case "animation-intent":
    case "axis-2d":
    case "axis-3d":
    case "graph-2d":
    case "graph-3d":
    case "latex-comparison":
      return undefined;
  }
}

export function semanticEvaluate(
  target: SemanticComputationTarget,
  options: SemanticEvaluationOptions = {}
): SemanticEvaluationResult | undefined {
  const expression = expressionFromTarget(target);

  if (expression !== undefined) {
    return {
      kind: "scalar",
      value: compileExpression(expression)(options.scope ?? {})
    };
  }

  if (!isMathExpression(target) && target.type === "matrix") {
    return evaluateMatrix(target);
  }

  return undefined;
}

export function semanticDifferentiate(
  target: SemanticComputationTarget,
  variableName: string
): ExpressionObject | undefined {
  const expression = expressionFromTarget(target);

  if (expression === undefined) {
    return undefined;
  }

  const targetId = semanticTargetId(target);

  return createExpressionObject({
    id: `${targetId}.d-${variableName}`,
    label: `d/d${variableName} ${semanticTargetLabel(target)}`,
    expression: differentiate(expression, variableName)
  });
}

export function semanticMatrixForm(
  target: SemanticComputationTarget
): MatrixObject | undefined {
  return !isMathExpression(target) && target.type === "matrix"
    ? target
    : undefined;
}

export function semanticGraphForm(
  target: SemanticComputationTarget,
  options: SemanticGraphFormOptions = {}
): readonly GraphSceneObject[] | undefined {
  if (!isMathExpression(target)) {
    switch (target.type) {
      case "graph-2d":
      case "graph-3d":
      case "curve-2d":
      case "curve-3d":
      case "surface-3d":
        return [target];
    }
  }

  const expression = expressionFromTarget(target);

  return expression === undefined
    ? undefined
    : createExpressionGraphScene(target, expression, options);
}

export function semanticNumericSample(
  target: SemanticComputationTarget,
  options: SemanticNumericSampleOptions = {}
): SemanticNumericSampleResult | undefined {
  if (!isMathExpression(target)) {
    switch (target.type) {
      case "curve-2d":
        return {
          kind: "curve-2d-sample",
          points: sampleCurve2D(target)
        };
      case "curve-3d":
        return {
          kind: "curve-3d-sample",
          points: sampleCurve3D(target)
        };
      case "surface-3d":
        return {
          kind: "surface-3d-sample",
          grid: sampleSurface3D(target)
        };
    }
  }

  const expression = expressionFromTarget(target);

  return expression === undefined
    ? undefined
    : sampleExpression(expression, options);
}

function createExpressionGraphScene(
  target: SemanticComputationTarget,
  expression: MathExpression,
  options: SemanticGraphFormOptions
): readonly GraphSceneObject[] {
  const variables = expressionVariables(expression);
  const idPrefix = options.idPrefix ?? semanticTargetId(target);

  return variables.includes("x") && variables.includes("y")
    ? createExpressionSurfaceScene(idPrefix, expression, options)
    : createExpressionCurveScene(idPrefix, expression, options);
}

function createExpressionCurveScene(
  idPrefix: string,
  expression: MathExpression,
  options: SemanticGraphFormOptions
): readonly GraphSceneObject[] {
  const graph = createGraph2DObject({
    id: `${idPrefix}-graph`,
    label: `y = ${expressionToLatex(expression)}`,
    xAxisId: `${idPrefix}-x-axis`,
    yAxisId: `${idPrefix}-y-axis`,
    xDomain: options.xDomain ?? [-3, 3],
    yDomain: options.yDomain ?? [-3, 9],
    width: options.width ?? 520,
    height: options.height ?? 360
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
    label: graph.label,
    equation: graph.label,
    expression,
    xDomain: graph.xDomain,
    sampleCount: options.sampleCount ?? 121
  };

  return [graph, xAxis, yAxis, curve];
}

function createExpressionSurfaceScene(
  idPrefix: string,
  expression: MathExpression,
  options: SemanticGraphFormOptions
): readonly GraphSceneObject[] {
  const graph = createGraph3DObject({
    id: `${idPrefix}-graph`,
    label: `z = ${expressionToLatex(expression)}`,
    xAxisId: `${idPrefix}-x-axis`,
    yAxisId: `${idPrefix}-y-axis`,
    zAxisId: `${idPrefix}-z-axis`,
    xDomain: options.xDomain ?? [-3, 3],
    yDomain: options.yDomain ?? [-3, 3],
    zDomain: options.zDomain ?? [-2.5, 2.5],
    width: options.width ?? 560,
    height: options.height ?? 420,
    camera: {
      azimuthDegrees: 35,
      elevationDegrees: 30,
      scale: 58,
      origin: [280, 244]
    }
  });
  const surfaceResolution = graph3DSurfaceResolution(graph.surfaceQuality);
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
    label: graph.label,
    equation: graph.label,
    expression,
    xDomain: graph.xDomain,
    yDomain: graph.yDomain,
    xSampleCount: options.xSampleCount ?? surfaceResolution.xSampleCount,
    ySampleCount: options.ySampleCount ?? surfaceResolution.ySampleCount
  };

  return [graph, xAxis, yAxis, zAxis, surface];
}

function sampleExpression(
  expression: MathExpression,
  options: SemanticNumericSampleOptions
): SemanticNumericSampleResult {
  const variables = expressionVariables(expression);

  if (variables.includes("x") && variables.includes("y")) {
    return {
      kind: "surface-3d-sample",
      grid: sampleSurfaceExpression(
        expression,
        options.xDomain ?? [-1, 1],
        options.yDomain ?? [-1, 1],
        options.xSampleCount ?? 3,
        options.ySampleCount ?? 3,
        options.scope ?? {}
      )
    };
  }

  if (variables.length === 0) {
    return {
      kind: "scalar-sample",
      value: compileExpression(expression)(options.scope ?? {})
    };
  }

  const variableName = options.variableName ?? variables[0] ?? "x";

  return {
    kind: "curve-2d-sample",
    points: sampleExpressionCurve(
      expression,
      variableName,
      options.xDomain ?? [-1, 1],
      options.sampleCount ?? 3,
      options.scope ?? {}
    )
  };
}

function sampleCurve2D(curve: Curve2DObject): readonly GraphPoint2D[] {
  return sampleExpressionCurve(
    curve.expression,
    "x",
    curve.xDomain,
    curve.sampleCount,
    {}
  );
}

function sampleCurve3D(curve: Curve3DObject): readonly GraphPoint3D[] {
  const evaluateX = compileExpression(curve.expressions.x);
  const evaluateY = compileExpression(curve.expressions.y);
  const evaluateZ = compileExpression(curve.expressions.z);

  return sampleDomain(curve.tDomain, curve.sampleCount).map((t) => {
    const scope = { t };

    return {
      x: roundNumber(evaluateX(scope)),
      y: roundNumber(evaluateY(scope)),
      z: roundNumber(evaluateZ(scope))
    };
  });
}

function sampleSurface3D(
  surface: Surface3DObject
): readonly (readonly GraphPoint3D[])[] {
  return sampleSurfaceExpression(
    surface.expression,
    surface.xDomain,
    surface.yDomain,
    surface.xSampleCount,
    surface.ySampleCount,
    {}
  );
}

function sampleExpressionCurve(
  expression: MathExpression,
  variableName: string,
  domain: NumericDomain,
  sampleCount: number,
  baseScope: NumericScope
): readonly GraphPoint2D[] {
  const evaluate = compileExpression(expression);

  return sampleDomain(domain, sampleCount).map((value) => ({
    x: roundNumber(value),
    y: roundNumber(evaluate({ ...baseScope, [variableName]: value }))
  }));
}

function sampleSurfaceExpression(
  expression: MathExpression,
  xDomain: NumericDomain,
  yDomain: NumericDomain,
  xSampleCount: number,
  ySampleCount: number,
  baseScope: NumericScope
): readonly (readonly GraphPoint3D[])[] {
  const evaluate = compileExpression(expression);

  return sampleDomain(yDomain, ySampleCount).map((y) =>
    sampleDomain(xDomain, xSampleCount).map((x) => ({
      x: roundNumber(x),
      y: roundNumber(y),
      z: roundNumber(evaluate({ ...baseScope, x, y }))
    }))
  );
}

function sampleDomain(
  [min, max]: NumericDomain,
  sampleCount: number
): readonly number[] {
  if (!Number.isInteger(sampleCount) || sampleCount < 2) {
    throw new Error("Numeric sample count must be an integer of at least 2.");
  }

  const step = (max - min) / (sampleCount - 1);

  return Array.from({ length: sampleCount }, (_, index) => min + step * index);
}

function evaluateMatrix(matrix: MatrixObject): SemanticMatrixEvaluationResult {
  const rowCount = matrix.rows.length;
  const columnCount = matrix.rows[0]?.length ?? 0;
  const isSquare = rowCount === columnCount;
  const determinant = isSquare ? matrixDeterminant(matrix.rows) : undefined;

  return {
    kind: "matrix",
    rowCount,
    columnCount,
    isSquare,
    ...(determinant === undefined ? {} : { determinant })
  };
}

function matrixDeterminant(rows: readonly (readonly number[])[]): number {
  const matrix = rows.map((row) => [...row]);
  let determinant = 1;
  let sign = 1;

  for (let column = 0; column < matrix.length; column += 1) {
    const pivotRow = findPivotRow(matrix, column);
    const pivot = matrix[pivotRow]?.[column] ?? 0;

    if (Math.abs(pivot) < 1e-12) {
      return 0;
    }

    if (pivotRow !== column) {
      [matrix[column], matrix[pivotRow]] = [matrix[pivotRow]!, matrix[column]!];
      sign *= -1;
    }

    const currentRow = matrix[column]!;
    const currentPivot = currentRow[column] ?? 0;
    determinant *= currentPivot;

    for (let row = column + 1; row < matrix.length; row += 1) {
      const targetRow = matrix[row]!;
      const factor = (targetRow[column] ?? 0) / currentPivot;

      for (let innerColumn = column; innerColumn < matrix.length; innerColumn += 1) {
        targetRow[innerColumn] =
          (targetRow[innerColumn] ?? 0) -
          factor * (currentRow[innerColumn] ?? 0);
      }
    }
  }

  return roundNumber(determinant * sign);
}

function findPivotRow(
  matrix: readonly (readonly number[])[],
  column: number
): number {
  let pivotRow = column;
  let pivotAbs = Math.abs(matrix[column]?.[column] ?? 0);

  for (let row = column + 1; row < matrix.length; row += 1) {
    const candidateAbs = Math.abs(matrix[row]?.[column] ?? 0);

    if (candidateAbs > pivotAbs) {
      pivotAbs = candidateAbs;
      pivotRow = row;
    }
  }

  return pivotRow;
}

function expressionFromTarget(
  target: SemanticComputationTarget
): MathExpression | undefined {
  if (isMathExpression(target)) {
    return target;
  }

  switch (target.type) {
    case "expression":
      return target.expression;
    case "curve-2d":
    case "surface-3d":
      return target.expression;
    default:
      return undefined;
  }
}

function semanticTargetId(target: SemanticComputationTarget): string {
  return isMathExpression(target) ? "expression" : target.id;
}

function semanticTargetLabel(target: SemanticComputationTarget): string {
  return isMathExpression(target) ? expressionToLatex(target) : target.label;
}

function isMathExpression(value: SemanticComputationTarget): value is MathExpression {
  return "kind" in value;
}

function roundNumber(value: number): number {
  return Number(value.toFixed(3));
}
