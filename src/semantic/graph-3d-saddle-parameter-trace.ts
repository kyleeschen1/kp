import {
  expressionToLatex,
  type MathExpression
} from "../math/expression.ts";
import { createSaddleSurfaceExpression } from
  "../math/surface-examples.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
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
  KP_GRAPH_3D_FLATTEN_SADDLE_OPERATION,
  KP_GRAPH_3D_SADDLE_SURFACE_FAMILY,
  type KpGraph3DSceneGenerationRequest,
  type KpGraph3DSceneGenerationRequestDiagnostic,
  validateKpGraph3DSceneGenerationRequest
} from "../domain-ir/graph-3d-scene-generation-request.ts";

export const KP_GRAPH_3D_SADDLE_PARAMETER_TRACE_SCHEMA =
  "kp.graph-3d-saddle-parameter-trace.v1" as const;
export const KP_GRAPH_3D_SADDLE_PARAMETER_TRACE_ID =
  "trace.graph-3d.saddle-denominator-four-to-eight.v1" as const;
export const KP_GRAPH_3D_SADDLE_PARAMETER_RECIPE_ID =
  "recipe.graph-3d.saddle-denominator-transition.v1" as const;
export const KP_GRAPH_3D_SADDLE_PARAMETER_TRANSFORMATION_ID =
  "transform.graph-3d.saddle-denominator-four-to-eight.v1" as const;

export type KpGraph3DSaddleParameterStateRole = "source" | "target";
export type KpGraph3DSaddleWitnessRole =
  | "x-ridge"
  | "saddle-origin"
  | "y-valley";

export interface KpGraph3DSaddleWitness {
  readonly id: string;
  readonly role: KpGraph3DSaddleWitnessRole;
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface KpGraph3DSaddleParameterState {
  readonly id: string;
  readonly role: KpGraph3DSaddleParameterStateRole;
  readonly familyId: typeof KP_GRAPH_3D_SADDLE_SURFACE_FAMILY;
  readonly surfaceIdentityId:
    "surface.graph-3d.saddle-parameter.primary";
  readonly denominator: 4 | 8;
  readonly domain: Readonly<{
    x: readonly [-3, 3];
    y: readonly [-3, 3];
  }>;
  readonly topology: "height-field-over-rectangle";
  readonly expression: MathExpression;
  readonly normalizedLatex: string;
  readonly witnesses: readonly KpGraph3DSaddleWitness[];
}

export interface KpGraph3DSaddleParameterContext {
  readonly id: "context.graph-3d.saddle-parameter";
  readonly graphIdentityId: "graph.graph-3d.saddle-parameter.primary";
  readonly xAxisId: "axis.graph-3d.saddle-parameter.x";
  readonly yAxisId: "axis.graph-3d.saddle-parameter.y";
  readonly zAxisId: "axis.graph-3d.saddle-parameter.z";
  readonly xDomain: readonly [-3, 3];
  readonly yDomain: readonly [-3, 3];
  readonly zDomain: readonly [-2.5, 2.5];
  readonly camera: Readonly<{
    id: "camera.graph-3d.saddle-parameter.fixed";
    policy: "fixed";
    projection: "orthographic";
    azimuthDegrees: 35;
    elevationDegrees: 24;
  }>;
}

export interface KpGraph3DSaddleParameterClaim {
  readonly id: string;
  readonly statement: string;
  readonly authorityIds: readonly string[];
}

export interface KpGraph3DSaddleParameterTrace {
  readonly schemaVersion: typeof KP_GRAPH_3D_SADDLE_PARAMETER_TRACE_SCHEMA;
  readonly id: typeof KP_GRAPH_3D_SADDLE_PARAMETER_TRACE_ID;
  readonly requestId: string;
  readonly operationId: typeof KP_GRAPH_3D_FLATTEN_SADDLE_OPERATION;
  readonly recipeId: typeof KP_GRAPH_3D_SADDLE_PARAMETER_RECIPE_ID;
  readonly context: KpGraph3DSaddleParameterContext;
  readonly source: KpGraph3DSaddleParameterState;
  readonly target: KpGraph3DSaddleParameterState;
  readonly bundle: KpAssetBundle;
  readonly transformation: KpSemanticTransformation;
  readonly correspondenceMap: CorrespondenceMap;
  readonly claims: readonly KpGraph3DSaddleParameterClaim[];
}

export type KpGraph3DSaddleParameterCompilation =
  | Readonly<{
      status: "accepted";
      request: KpGraph3DSceneGenerationRequest;
      trace: KpGraph3DSaddleParameterTrace;
      diagnostics: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      requestId?: string;
      diagnostics: readonly KpGraph3DSceneGenerationRequestDiagnostic[];
    }>;

const context: KpGraph3DSaddleParameterContext = deepFreeze({
  id: "context.graph-3d.saddle-parameter",
  graphIdentityId: "graph.graph-3d.saddle-parameter.primary",
  xAxisId: "axis.graph-3d.saddle-parameter.x",
  yAxisId: "axis.graph-3d.saddle-parameter.y",
  zAxisId: "axis.graph-3d.saddle-parameter.z",
  xDomain: [-3, 3],
  yDomain: [-3, 3],
  zDomain: [-2.5, 2.5],
  camera: {
    id: "camera.graph-3d.saddle-parameter.fixed",
    policy: "fixed",
    projection: "orthographic",
    azimuthDegrees: 35,
    elevationDegrees: 24
  }
});

export function compileKpGraph3DSaddleParameterTrace(
  value: unknown
): KpGraph3DSaddleParameterCompilation {
  const validation = validateKpGraph3DSceneGenerationRequest(value);
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
  request: KpGraph3DSceneGenerationRequest
): KpGraph3DSaddleParameterTrace {
  const source = surfaceState("source", 4);
  const target = surfaceState("target", 8);
  const contextObject = createKpSemanticAssetObject({
    id: context.id,
    objectType: "graph-3d",
    title: "Fixed Graph3D coordinate and camera context",
    value: context,
    selectors: [{
      id: `${context.id}.x-axis`,
      kind: "axis",
      label: "x-axis"
    }, {
      id: `${context.id}.y-axis`,
      kind: "axis",
      label: "y-axis"
    }, {
      id: `${context.id}.z-axis`,
      kind: "axis",
      label: "z-axis"
    }, {
      id: `${context.id}.camera`,
      kind: "camera-state",
      label: "fixed orthographic camera"
    }]
  });
  const sourceObject = surfaceStateObject(source);
  const targetObject = surfaceStateObject(target);
  const bundle = createKpAssetBundle({
    id: "asset.graph-3d.saddle-denominator-four-to-eight.v1",
    title: "Saddle denominator semantic assets",
    objects: [contextObject, sourceObject, targetObject]
  });
  const correspondenceMap = createCorrespondenceMap(source, target);
  const transformation = createKpSemanticTransformation({
    id: KP_GRAPH_3D_SADDLE_PARAMETER_TRANSFORMATION_ID,
    definitionId: KP_GRAPH_3D_FLATTEN_SADDLE_OPERATION,
    transformType: "increaseGraph3DSaddleDenominator",
    title: "Increase the saddle denominator from four to eight",
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
      "The surface remains a height field over the fixed square [-3, 3] × [-3, 3].",
      "The surface topology, axes, and orthographic camera state remain fixed."
    ],
    lawRefs: [{
      id: "law.graph-3d.saddle-denominator.height-field",
      level: "strict",
      summary:
        "At each persistent (x, y), z equals (x squared minus y squared) divided by the current denominator."
    }, {
      id: "law.graph-3d.saddle-denominator.fixed-context",
      level: "strict",
      summary:
        "Surface identity, x/y domain, topology, axes, and camera state do not change."
    }]
  });

  return deepFreeze({
    schemaVersion: KP_GRAPH_3D_SADDLE_PARAMETER_TRACE_SCHEMA,
    id: KP_GRAPH_3D_SADDLE_PARAMETER_TRACE_ID,
    requestId: request.requestId,
    operationId: KP_GRAPH_3D_FLATTEN_SADDLE_OPERATION,
    recipeId: KP_GRAPH_3D_SADDLE_PARAMETER_RECIPE_ID,
    context,
    source,
    target,
    bundle,
    transformation,
    correspondenceMap,
    claims: [{
      id: "claim.graph-3d.saddle-denominator.parameter",
      statement:
        "Increasing the positive denominator from four to eight halves every z-value while preserving each (x, y) coordinate.",
      authorityIds: [
        KP_GRAPH_3D_FLATTEN_SADDLE_OPERATION,
        "law.graph-3d.saddle-denominator.height-field"
      ]
    }, {
      id: "claim.graph-3d.saddle-denominator.camera",
      statement:
        "The saddle flattens because the surface parameter changes, not because the camera moves.",
      authorityIds: [
        KP_GRAPH_3D_FLATTEN_SADDLE_OPERATION,
        "law.graph-3d.saddle-denominator.fixed-context"
      ]
    }]
  });
}

function surfaceState(
  role: KpGraph3DSaddleParameterStateRole,
  denominator: 4 | 8
): KpGraph3DSaddleParameterState {
  const expression = createSaddleSurfaceExpression(denominator);
  return deepFreeze({
    id: `surface-state.graph-3d.saddle-parameter.${role}`,
    role,
    familyId: KP_GRAPH_3D_SADDLE_SURFACE_FAMILY,
    surfaceIdentityId: "surface.graph-3d.saddle-parameter.primary",
    denominator,
    domain: { x: [-3, 3], y: [-3, 3] },
    topology: "height-field-over-rectangle",
    expression,
    normalizedLatex: `z = ${expressionToLatex(expression)}`,
    witnesses: [
      witness("x-ridge", 2, 0, denominator),
      witness("saddle-origin", 0, 0, denominator),
      witness("y-valley", 0, 2, denominator)
    ]
  });
}

function witness(
  role: KpGraph3DSaddleWitnessRole,
  x: number,
  y: number,
  denominator: number
): KpGraph3DSaddleWitness {
  return {
    id: `witness.graph-3d.saddle-parameter.${role}`,
    role,
    x,
    y,
    z: (x ** 2 - y ** 2) / denominator
  };
}

function surfaceStateObject(state: KpGraph3DSaddleParameterState) {
  return createKpSemanticAssetObject({
    id: state.id,
    objectType: "graph-3d-surface-state",
    title: state.role === "source"
      ? "Source saddle surface"
      : "Flattened saddle surface",
    value: state,
    selectors: [{
      id: `${state.id}.surface`,
      kind: "surface",
      label: "persistent saddle surface"
    }, {
      id: `${state.id}.equation`,
      kind: "equation",
      label: state.normalizedLatex
    }, {
      id: `${state.id}.denominator`,
      kind: "surface-parameter",
      label: `denominator ${state.denominator}`
    }, ...state.witnesses.map((point) => ({
      id: `${state.id}.witness.${point.role}`,
      kind: "surface-witness",
      label: `${point.role} (${point.x}, ${point.y}, ${point.z})`
    }))]
  });
}

function createCorrespondenceMap(
  source: KpGraph3DSaddleParameterState,
  target: KpGraph3DSaddleParameterState
): CorrespondenceMap {
  const records: SelectorCorrespondenceRecord[] = [
    record("x-axis-persists", "identity",
      `${context.id}.x-axis`, `${context.id}.x-axis`,
      "The x-axis stays fixed as contextual structure."),
    record("y-axis-persists", "identity",
      `${context.id}.y-axis`, `${context.id}.y-axis`,
      "The y-axis stays fixed as contextual structure."),
    record("z-axis-persists", "identity",
      `${context.id}.z-axis`, `${context.id}.z-axis`,
      "The z-axis stays fixed as contextual structure."),
    record("camera-persists", "identity",
      `${context.id}.camera`, `${context.id}.camera`,
      "The orthographic camera state stays fixed."),
    record("surface-persists", "identity",
      `${source.id}.surface`, `${target.id}.surface`,
      "The same saddle surface flattens without changing topology."),
    record("equation-persists", "role-change",
      `${source.id}.equation`, `${target.id}.equation`,
      "The equation remains the symbolic account of the surface."),
    record("denominator-changes", "role-change",
      `${source.id}.denominator`, `${target.id}.denominator`,
      "The governed denominator changes from four to eight."),
    ...source.witnesses.map((point) => record(
      `${point.role}-persists`,
      "identity",
      `${source.id}.witness.${point.role}`,
      `${target.id}.witness.${point.role}`,
      `${point.role} keeps its (x, y) identity while z changes.`
    ))
  ];
  return deepFreeze({
    id: "correspondence.graph-3d.saddle-denominator-four-to-eight.v1",
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

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
