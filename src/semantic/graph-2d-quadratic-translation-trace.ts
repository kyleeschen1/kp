import {
  add,
  constant,
  expressionToLatex,
  power,
  variable,
  type MathExpression
} from "../math/expression.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type CreateKpAssetSelectorInput,
  type KpAssetBundle
} from "./asset.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import type {
  CorrespondenceMap,
  SelectorCorrespondenceRecord
} from "./correspondence.ts";
import {
  KP_GRAPH_2D_HORIZONTAL_TRANSLATION_OPERATION,
  KP_GRAPH_2D_MONIC_QUADRATIC_FAMILY,
  type KpGraph2DFunctionGenerationRequest,
  type KpGraph2DFunctionGenerationRequestDiagnostic,
  validateKpGraph2DFunctionGenerationRequest
} from "../domain-ir/graph-2d-function-generation-request.ts";

export const KP_GRAPH_2D_QUADRATIC_TRANSLATION_TRACE_SCHEMA =
  "kp.graph-2d-quadratic-translation-trace.v1" as const;
export const KP_GRAPH_2D_QUADRATIC_TRANSLATION_TRACE_ID =
  "trace.graph-2d.quadratic-translate-right-two.v1" as const;
export const KP_GRAPH_2D_QUADRATIC_TRANSLATION_RECIPE_ID =
  "recipe.graph-2d.quadratic-horizontal-translation.v1" as const;
export const KP_GRAPH_2D_QUADRATIC_TRANSLATION_TRANSFORMATION_ID =
  "transform.graph-2d.quadratic-translate-right-two.v1" as const;

export type KpGraph2DQuadraticTranslationStateRole = "source" | "target";
export type KpGraph2DQuadraticTranslationPointRole =
  | "left-sample"
  | "vertex"
  | "right-sample";

export interface KpGraph2DQuadraticTranslationPoint {
  readonly id: string;
  readonly role: KpGraph2DQuadraticTranslationPointRole;
  // u identifies a material point on the parabola; x changes as h changes.
  readonly parameter: number;
  readonly x: number;
  readonly y: number;
}

export interface KpGraph2DQuadraticTranslationFunctionState {
  readonly id: string;
  readonly role: KpGraph2DQuadraticTranslationStateRole;
  readonly familyId: typeof KP_GRAPH_2D_MONIC_QUADRATIC_FAMILY;
  readonly curveIdentityId: "curve.graph-2d.quadratic-translation.primary";
  readonly horizontalShift: 0 | 2;
  readonly verticalShift: 0;
  readonly domain: "real-line";
  readonly expression: MathExpression;
  readonly normalizedLatex: string;
  readonly points: readonly KpGraph2DQuadraticTranslationPoint[];
}

export interface KpGraph2DQuadraticTranslationContext {
  readonly id: "context.graph-2d.quadratic-translation";
  readonly xAxisId: "axis.graph-2d.quadratic-translation.x";
  readonly yAxisId: "axis.graph-2d.quadratic-translation.y";
  readonly xDomain: readonly [-3, 5];
  readonly yDomain: readonly [-1, 5];
  readonly independentVariable: "x";
  readonly dependentVariable: "y";
}

export interface KpGraph2DQuadraticTranslationClaim {
  readonly id: string;
  readonly statement: string;
  readonly authorityIds: readonly string[];
}

export interface KpGraph2DQuadraticTranslationTrace {
  readonly schemaVersion:
    typeof KP_GRAPH_2D_QUADRATIC_TRANSLATION_TRACE_SCHEMA;
  readonly id: typeof KP_GRAPH_2D_QUADRATIC_TRANSLATION_TRACE_ID;
  readonly requestId: string;
  readonly operationId: typeof KP_GRAPH_2D_HORIZONTAL_TRANSLATION_OPERATION;
  readonly recipeId: typeof KP_GRAPH_2D_QUADRATIC_TRANSLATION_RECIPE_ID;
  readonly context: KpGraph2DQuadraticTranslationContext;
  readonly source: KpGraph2DQuadraticTranslationFunctionState;
  readonly target: KpGraph2DQuadraticTranslationFunctionState;
  readonly bundle: KpAssetBundle;
  readonly transformation: KpSemanticTransformation;
  readonly correspondenceMap: CorrespondenceMap;
  readonly claims: readonly KpGraph2DQuadraticTranslationClaim[];
}

export type KpGraph2DQuadraticTranslationCompilation =
  | Readonly<{
      status: "accepted";
      request: KpGraph2DFunctionGenerationRequest;
      trace: KpGraph2DQuadraticTranslationTrace;
      diagnostics: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      requestId?: string;
      diagnostics:
        readonly KpGraph2DFunctionGenerationRequestDiagnostic[];
    }>;

const context: KpGraph2DQuadraticTranslationContext = deepFreeze({
  id: "context.graph-2d.quadratic-translation",
  xAxisId: "axis.graph-2d.quadratic-translation.x",
  yAxisId: "axis.graph-2d.quadratic-translation.y",
  xDomain: [-3, 5],
  yDomain: [-1, 5],
  independentVariable: "x",
  dependentVariable: "y"
});

export function compileKpGraph2DQuadraticTranslation(
  value: unknown
): KpGraph2DQuadraticTranslationCompilation {
  const validation = validateKpGraph2DFunctionGenerationRequest(value);
  if (validation.status !== "accepted") return Object.freeze({
    status: "repair-required" as const,
    ...(validation.requestId === undefined
      ? {}
      : { requestId: validation.requestId }),
    diagnostics: validation.diagnostics
  });

  return Object.freeze({
    status: "accepted" as const,
    request: validation.request,
    trace: createTrace(validation.request),
    diagnostics: Object.freeze([]) as readonly []
  });
}

function createTrace(
  request: KpGraph2DFunctionGenerationRequest
): KpGraph2DQuadraticTranslationTrace {
  const source = functionState("source", 0);
  const target = functionState("target", 2);
  const contextObject = createKpSemanticAssetObject({
    id: context.id,
    objectType: "graph-2d",
    title: "Fixed coordinate context",
    value: context,
    selectors: [{
      id: `${context.id}.x-axis`,
      kind: "axis",
      label: "x-axis"
    }, {
      id: `${context.id}.y-axis`,
      kind: "axis",
      label: "y-axis"
    }]
  });
  const sourceObject = functionStateObject(source);
  const targetObject = functionStateObject(target);
  const bundle = createKpAssetBundle({
    id: "asset.graph-2d.quadratic-translate-right-two.v1",
    title: "Quadratic horizontal translation semantic assets",
    objects: [contextObject, sourceObject, targetObject]
  });
  const correspondenceMap = createCorrespondenceMap(source, target);
  const transformation = createKpSemanticTransformation({
    id: KP_GRAPH_2D_QUADRATIC_TRANSLATION_TRANSFORMATION_ID,
    definitionId: KP_GRAPH_2D_HORIZONTAL_TRANSLATION_OPERATION,
    transformType: "translateGraph2DFunctionHorizontally",
    title: "Translate the parabola right by two units",
    sourceObjectIds: [context.id, source.id],
    targetObjectIds: [context.id, target.id],
    preserves: ["identity", "structure", "role"],
    correspondenceMap,
    correspondence: correspondenceMap.records.flatMap((record) =>
      (record.relation === "identity" || record.relation === "role-change") &&
      record.sourceSelectorIds.length === 1 &&
      record.targetSelectorIds.length === 1
        ? [{
            sourceSelectorId: record.sourceSelectorIds[0]!,
            targetSelectorId: record.targetSelectorIds[0]!,
            preserves: record.relation === "identity"
              ? ["identity" as const]
              : ["identity" as const, "role" as const],
            summary: record.summary
          }]
        : []
    ),
    assumptions: [
      "The independent variable ranges over the real numbers.",
      "The monic quadratic family and coordinate axes remain fixed."
    ],
    lawRefs: [{
      id: "law.graph-2d.horizontal-translation.point-correspondence",
      level: "strict",
      summary: "Each material point (u, u^2) moves to (u + 2, u^2)."
    }, {
      id: "law.graph-2d.quadratic-translation.function-normalization",
      level: "strict",
      summary: "The target is the normalized function y = (x - 2)^2."
    }]
  });

  return deepFreeze({
    schemaVersion: KP_GRAPH_2D_QUADRATIC_TRANSLATION_TRACE_SCHEMA,
    id: KP_GRAPH_2D_QUADRATIC_TRANSLATION_TRACE_ID,
    requestId: request.requestId,
    operationId: KP_GRAPH_2D_HORIZONTAL_TRANSLATION_OPERATION,
    recipeId: KP_GRAPH_2D_QUADRATIC_TRANSLATION_RECIPE_ID,
    context,
    source,
    target,
    bundle,
    transformation,
    correspondenceMap,
    claims: [{
      id: "claim.graph-2d.quadratic-translation.parameter",
      statement:
        "Replacing x by x - 2 translates the graph of y = x^2 two units to the right.",
      authorityIds: [
        KP_GRAPH_2D_HORIZONTAL_TRANSLATION_OPERATION,
        "law.graph-2d.quadratic-translation.function-normalization"
      ]
    }, {
      id: "claim.graph-2d.quadratic-translation.points",
      statement:
        "The curve, vertex, and selected points keep their identities while every x-coordinate increases by two.",
      authorityIds: [
        KP_GRAPH_2D_HORIZONTAL_TRANSLATION_OPERATION,
        "law.graph-2d.horizontal-translation.point-correspondence"
      ]
    }]
  });
}

function functionState(
  role: KpGraph2DQuadraticTranslationStateRole,
  horizontalShift: 0 | 2
): KpGraph2DQuadraticTranslationFunctionState {
  const expression = horizontalShift === 0
    ? power(variable("x"), 2)
    : power(add(variable("x"), constant(-horizontalShift)), 2);
  return deepFreeze({
    id: `function-state.graph-2d.quadratic-translation.${role}`,
    role,
    familyId: KP_GRAPH_2D_MONIC_QUADRATIC_FAMILY,
    curveIdentityId: "curve.graph-2d.quadratic-translation.primary",
    horizontalShift,
    verticalShift: 0,
    domain: "real-line",
    expression,
    normalizedLatex: `y = ${expressionToLatex(expression)}`,
    points: [-1, 0, 1].map((parameter) => ({
      id: pointId(parameter),
      role: pointRole(parameter),
      parameter,
      x: parameter + horizontalShift,
      y: parameter ** 2
    }))
  });
}

function functionStateObject(
  state: KpGraph2DQuadraticTranslationFunctionState
) {
  const selectors: CreateKpAssetSelectorInput[] = [{
    id: `${state.id}.curve`,
    kind: "curve",
    label: "persistent parabola"
  }, {
    id: `${state.id}.equation`,
    kind: "equation",
    label: state.normalizedLatex
  }, {
    id: `${state.id}.equation.y`,
    kind: "dependent-variable",
    label: "y"
  }, {
    id: `${state.id}.equation.x`,
    kind: "independent-variable",
    label: "x"
  }, {
    id: `${state.id}.equation.exponent-two`,
    kind: "exponent",
    label: "2"
  }, ...state.points.map((point) => ({
    id: `${state.id}.point.${point.role}`,
    kind: point.role === "vertex" ? "vertex" : "sample-point",
    label: `${point.role} (${point.x}, ${point.y})`
  }))];
  if (state.role === "target") selectors.push({
    id: `${state.id}.equation.horizontal-shift`,
    kind: "translation-parameter",
    label: "horizontal shift 2"
  });

  return createKpSemanticAssetObject({
    id: state.id,
    objectType: "graph-2d-function-state",
    title: state.role === "source"
      ? "Source quadratic function"
      : "Translated quadratic function",
    value: state,
    selectors
  });
}

function createCorrespondenceMap(
  source: KpGraph2DQuadraticTranslationFunctionState,
  target: KpGraph2DQuadraticTranslationFunctionState
): CorrespondenceMap {
  const records: SelectorCorrespondenceRecord[] = [
    record("x-axis-persists", "identity",
      `${context.id}.x-axis`, `${context.id}.x-axis`,
      "The x-axis stays fixed as contextual structure."),
    record("y-axis-persists", "identity",
      `${context.id}.y-axis`, `${context.id}.y-axis`,
      "The y-axis stays fixed as contextual structure."),
    record("curve-persists", "identity",
      `${source.id}.curve`, `${target.id}.curve`,
      "The same parabola moves right without changing shape."),
    record("equation-changes-role", "role-change",
      `${source.id}.equation`, `${target.id}.equation`,
      "The equation remains the symbolic account of the moving curve."),
    record("dependent-variable-persists", "identity",
      `${source.id}.equation.y`, `${target.id}.equation.y`,
      "The dependent variable y persists."),
    record("independent-variable-persists", "role-change",
      `${source.id}.equation.x`, `${target.id}.equation.x`,
      "The same x enters the translated input x - 2."),
    record("exponent-persists", "identity",
      `${source.id}.equation.exponent-two`,
      `${target.id}.equation.exponent-two`,
      "The quadratic exponent persists."),
    ...source.points.map((point) => record(
      `${point.role}-persists`,
      "identity",
      `${source.id}.point.${point.role}`,
      `${target.id}.point.${point.role}`,
      `${point.role} keeps its curve identity while moving right.`
    )),
    {
      id: "horizontal-shift-enters",
      relation: "introduction",
      sourceSelectorIds: [],
      targetSelectorIds: [`${target.id}.equation.horizontal-shift`],
      summary: "The target equation introduces the horizontal shift parameter 2."
    }
  ];
  return deepFreeze({
    id: "correspondence.graph-2d.quadratic-translate-right-two.v1",
    records
  });
}

function record(
  id: string,
  relation: "identity" | "role-change",
  sourceSelectorId: string,
  targetSelectorId: string,
  summary: string
): SelectorCorrespondenceRecord {
  return {
    id,
    relation,
    sourceSelectorIds: [sourceSelectorId],
    targetSelectorIds: [targetSelectorId],
    summary
  };
}

function pointId(parameter: number): string {
  if (parameter === -1) return "point.graph-2d.quadratic-translation.left";
  if (parameter === 0) return "point.graph-2d.quadratic-translation.vertex";
  return "point.graph-2d.quadratic-translation.right";
}

function pointRole(parameter: number): KpGraph2DQuadraticTranslationPointRole {
  if (parameter === -1) return "left-sample";
  if (parameter === 0) return "vertex";
  return "right-sample";
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
