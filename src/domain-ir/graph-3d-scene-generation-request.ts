export const KP_GRAPH_3D_SCENE_GENERATION_REQUEST_SCHEMA =
  "kp.graph-3d-scene-generation-request.v1" as const;

export const KP_GRAPH_3D_SCENE_FRONTEND_ID =
  "frontend.graph-3d.semantic-scene.v1" as const;
export const KP_GRAPH_3D_SCENE_FRONTEND_SOURCE =
  "src/domain-ir/graph-3d-scene-generation-request.ts" as const;
export const KP_GRAPH_3D_SCENE_TRANSFORMATION_CAPABILITY =
  "capability.graph-3d.scene-transformations" as const;
export const KP_GRAPH_3D_SADDLE_SURFACE_FAMILY =
  "family.graph-3d.saddle-surface.v1" as const;
export const KP_GRAPH_3D_FLATTEN_SADDLE_OPERATION =
  "operation.graph-3d.flatten-saddle-denominator.v1" as const;

export interface KpGraph3DSceneGenerationRequest {
  readonly schemaVersion: typeof KP_GRAPH_3D_SCENE_GENERATION_REQUEST_SCHEMA;
  readonly kind: "graph-3d-scene-generation-request";
  readonly requestId: string;
  readonly scene: Readonly<{
    familyId: typeof KP_GRAPH_3D_SADDLE_SURFACE_FAMILY;
    graphId: "graph.graph-3d.saddle-parameter.primary";
    surfaceId: "surface.graph-3d.saddle-parameter.primary";
    domain: Readonly<{
      x: readonly [-3, 3];
      y: readonly [-3, 3];
    }>;
    sourceParameters: KpGraph3DSaddleParameters;
    targetParameters: KpGraph3DSaddleParameters;
  }>;
  readonly operation: Readonly<{
    operationId: typeof KP_GRAPH_3D_FLATTEN_SADDLE_OPERATION;
    kind: "increase-saddle-denominator";
    parameter: "saddle.denominator";
    from: 4;
    to: 8;
  }>;
  readonly preserve: readonly [
    "surface-family",
    "surface-identity",
    "xy-domain",
    "topology",
    "axis-context",
    "camera-state"
  ];
}

export interface KpGraph3DSaddleParameters {
  readonly denominator: 4 | 8;
}

export interface KpGraph3DSceneGenerationRequestDiagnostic {
  readonly code:
    | "graph-3d-scene.request.type"
    | "graph-3d-scene.request.field-unknown"
    | "graph-3d-scene.request.formula-forbidden"
    | "graph-3d-scene.request.presentation-forbidden"
    | "graph-3d-scene.request.value-invalid"
    | "graph-3d-scene.request.exemplar-unsupported";
  readonly path: string;
  readonly message: string;
  readonly repair: string;
}

export type KpGraph3DSceneGenerationRequestValidation =
  | Readonly<{
      status: "accepted";
      request: KpGraph3DSceneGenerationRequest;
      diagnostics: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      requestId?: string;
      diagnostics: readonly KpGraph3DSceneGenerationRequestDiagnostic[];
    }>;

const protocolId = /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/u;
const formulaField = /^(?:equation|expression|formula|latex|ast|tokens?)$/iu;
const presentationField = /^(?:durationMs|delayMs|staggerMs|keyframes?|motionPath|coordinates?|pixelCoordinates?|boundingRect|domNode|htmlElement|svgElement|webglContext|renderer|renderTarget|camera|camera[A-Z].*|azimuthDegrees|elevationDegrees|origin|mesh|geometry|material|lights?|css|className|computedStyle|sampleCount|resolution|width|height)$/u;

export const kpGraph3DSaddleParameterRequest = deepFreeze({
  schemaVersion: KP_GRAPH_3D_SCENE_GENERATION_REQUEST_SCHEMA,
  kind: "graph-3d-scene-generation-request" as const,
  requestId: "request.graph-3d.saddle-denominator-four-to-eight.v1",
  scene: {
    familyId: KP_GRAPH_3D_SADDLE_SURFACE_FAMILY,
    graphId: "graph.graph-3d.saddle-parameter.primary" as const,
    surfaceId: "surface.graph-3d.saddle-parameter.primary" as const,
    domain: {
      x: [-3, 3] as const,
      y: [-3, 3] as const
    },
    sourceParameters: { denominator: 4 as const },
    targetParameters: { denominator: 8 as const }
  },
  operation: {
    operationId: KP_GRAPH_3D_FLATTEN_SADDLE_OPERATION,
    kind: "increase-saddle-denominator" as const,
    parameter: "saddle.denominator" as const,
    from: 4 as const,
    to: 8 as const
  },
  preserve: [
    "surface-family",
    "surface-identity",
    "xy-domain",
    "topology",
    "axis-context",
    "camera-state"
  ] as const
} satisfies KpGraph3DSceneGenerationRequest);

/**
 * Parameter selection is the semantic boundary: formula text and scene-paint
 * instructions would make the generator, rather than the Graph3D frontend,
 * the authority for surface truth and fixed-camera continuity.
 */
export function validateKpGraph3DSceneGenerationRequest(
  value: unknown
): KpGraph3DSceneGenerationRequestValidation {
  const diagnostics: KpGraph3DSceneGenerationRequestDiagnostic[] = [];
  if (!isRecord(value)) return repair(undefined, [issue(
    "graph-3d-scene.request.type",
    "$",
    "Graph3D scene generation input must be an object.",
    "Provide the versioned bounded Graph3D scene request."
  )]);

  rejectFields(value, "$", diagnostics);
  const requestId = validId(value["requestId"])
    ? value["requestId"]
    : undefined;
  if (
    value["schemaVersion"] !== KP_GRAPH_3D_SCENE_GENERATION_REQUEST_SCHEMA ||
    value["kind"] !== "graph-3d-scene-generation-request" ||
    requestId === undefined
  ) diagnostics.push(issue(
    "graph-3d-scene.request.value-invalid",
    "$",
    "Schema, kind, and requestId must use governed values.",
    "Begin with the checked-in Graph3D saddle-parameter request."
  ));

  if (diagnostics.length === 0 &&
      !equal(value, kpGraph3DSaddleParameterRequest)) {
    diagnostics.push(issue(
      "graph-3d-scene.request.exemplar-unsupported",
      "$",
      "This frontend supports only the fixed-camera saddle denominator change from 4 to 8.",
      "Use the pinned saddle-parameter request or retain a typed gap until another Graph3D transformation is reviewed."
    ));
  }

  if (diagnostics.length > 0) return repair(requestId, diagnostics);
  return Object.freeze({
    status: "accepted" as const,
    request: deepFreeze(clone(kpGraph3DSaddleParameterRequest)),
    diagnostics: Object.freeze([]) as readonly []
  });
}

function rejectFields(
  value: unknown,
  path: string,
  diagnostics: KpGraph3DSceneGenerationRequestDiagnostic[]
): void {
  if (Array.isArray(value)) {
    value.forEach((child, index) =>
      rejectFields(child, `${path}[${index}]`, diagnostics)
    );
    return;
  }
  if (!isRecord(value)) return;

  const allowed = allowedFields(path);
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (formulaField.test(key)) diagnostics.push(issue(
      "graph-3d-scene.request.formula-forbidden",
      childPath,
      `${key} cannot supply Graph3D surface truth at this boundary.`,
      "Choose the registered surface family and numeric parameters; the frontend owns the expression."
    ));
    if (presentationField.test(key)) diagnostics.push(issue(
      "graph-3d-scene.request.presentation-forbidden",
      childPath,
      `${key} belongs to a Graph3D renderer or host, not the request.`,
      "Remove camera, rendering, geometry, and sampling policy from the semantic request."
    ));
    if (!allowed.includes(key)) diagnostics.push(issue(
      "graph-3d-scene.request.field-unknown",
      childPath,
      `${key} is not part of the bounded Graph3D request protocol.`,
      "Use only fields in the generated request type."
    ));
    rejectFields(child, childPath, diagnostics);
  }
}

function allowedFields(path: string): readonly string[] {
  if (path === "$") return [
    "schemaVersion",
    "kind",
    "requestId",
    "scene",
    "operation",
    "preserve"
  ];
  if (path === "$.scene") return [
    "familyId",
    "graphId",
    "surfaceId",
    "domain",
    "sourceParameters",
    "targetParameters"
  ];
  if (path === "$.scene.domain") return ["x", "y"];
  if (
    path === "$.scene.sourceParameters" ||
    path === "$.scene.targetParameters"
  ) return ["denominator"];
  if (path === "$.operation") return [
    "operationId",
    "kind",
    "parameter",
    "from",
    "to"
  ];
  return [];
}

function issue(
  code: KpGraph3DSceneGenerationRequestDiagnostic["code"],
  path: string,
  message: string,
  repairInstruction: string
): KpGraph3DSceneGenerationRequestDiagnostic {
  return Object.freeze({ code, path, message, repair: repairInstruction });
}

function repair(
  requestId: string | undefined,
  diagnostics: readonly KpGraph3DSceneGenerationRequestDiagnostic[]
): KpGraph3DSceneGenerationRequestValidation {
  return Object.freeze({
    status: "repair-required" as const,
    ...(requestId === undefined ? {} : { requestId }),
    diagnostics: Object.freeze([...diagnostics])
  });
}

function validId(value: unknown): value is string {
  return typeof value === "string" && protocolId.test(value);
}

function equal(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) &&
      left.length === right.length &&
      left.every((candidate, index) => equal(candidate, right[index]));
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length &&
    leftKeys.every((key, index) =>
      key === rightKeys[index] && equal(left[key], right[key])
    );
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
