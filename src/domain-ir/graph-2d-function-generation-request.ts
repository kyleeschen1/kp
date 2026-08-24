export const KP_GRAPH_2D_FUNCTION_GENERATION_REQUEST_SCHEMA =
  "kp.graph-2d-function-generation-request.v1" as const;

export const KP_GRAPH_2D_FUNCTION_FRONTEND_ID =
  "frontend.graph-2d.function-model.v1" as const;
export const KP_GRAPH_2D_FUNCTION_FRONTEND_SOURCE =
  "src/domain-ir/graph-2d-function-generation-request.ts" as const;
export const KP_GRAPH_2D_FUNCTION_TRANSFORMATION_CAPABILITY =
  "capability.graph-2d.function-transformations" as const;
export const KP_GRAPH_2D_MONIC_QUADRATIC_FAMILY =
  "family.graph-2d.monic-quadratic-vertex-form.v1" as const;
export const KP_GRAPH_2D_HORIZONTAL_TRANSLATION_OPERATION =
  "operation.graph-2d.translate-horizontal.v1" as const;

export interface KpGraph2DFunctionGenerationRequest {
  readonly schemaVersion:
    typeof KP_GRAPH_2D_FUNCTION_GENERATION_REQUEST_SCHEMA;
  readonly kind: "graph-2d-function-generation-request";
  readonly requestId: string;
  readonly function: Readonly<{
    familyId: typeof KP_GRAPH_2D_MONIC_QUADRATIC_FAMILY;
    curveId: "curve.graph-2d.quadratic-translation.primary";
    independentVariable: "x";
    dependentVariable: "y";
    domain: Readonly<{
      kind: "real-line";
    }>;
    sourceParameters: KpGraph2DQuadraticVertexParameters;
    targetParameters: KpGraph2DQuadraticVertexParameters;
  }>;
  readonly operation: Readonly<{
    operationId: typeof KP_GRAPH_2D_HORIZONTAL_TRANSLATION_OPERATION;
    kind: "horizontal-translation";
    displacement: 2;
  }>;
  readonly preserve: readonly [
    "function-family",
    "curve-identity",
    "axis-context"
  ];
}

export interface KpGraph2DQuadraticVertexParameters {
  readonly horizontalShift: 0 | 2;
  readonly verticalShift: 0;
}

export interface KpGraph2DFunctionGenerationRequestDiagnostic {
  readonly code:
    | "graph-2d-function.request.type"
    | "graph-2d-function.request.field-unknown"
    | "graph-2d-function.request.formula-forbidden"
    | "graph-2d-function.request.presentation-forbidden"
    | "graph-2d-function.request.value-invalid"
    | "graph-2d-function.request.exemplar-unsupported";
  readonly path: string;
  readonly message: string;
  readonly repair: string;
}

export type KpGraph2DFunctionGenerationRequestValidation =
  | Readonly<{
      status: "accepted";
      request: KpGraph2DFunctionGenerationRequest;
      diagnostics: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      requestId?: string;
      diagnostics:
        readonly KpGraph2DFunctionGenerationRequestDiagnostic[];
    }>;

const protocolId = /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/u;
const formulaField = /^(?:equation|expression|formula|latex|ast|tokens?)$/iu;
const presentationField = /^(?:durationMs|delayMs|staggerMs|keyframes?|motionPath|coordinates?|pixelCoordinates?|boundingRect|domNode|htmlElement|svgElement|webglContext|renderer|renderTarget|css|className|computedStyle|sampleCount|width|height)$/iu;

export const kpGraph2DQuadraticTranslationRequest = deepFreeze({
  schemaVersion: KP_GRAPH_2D_FUNCTION_GENERATION_REQUEST_SCHEMA,
  kind: "graph-2d-function-generation-request" as const,
  requestId: "request.graph-2d.quadratic-translate-right-two.v1",
  function: {
    familyId: KP_GRAPH_2D_MONIC_QUADRATIC_FAMILY,
    curveId: "curve.graph-2d.quadratic-translation.primary" as const,
    independentVariable: "x" as const,
    dependentVariable: "y" as const,
    domain: { kind: "real-line" as const },
    sourceParameters: {
      horizontalShift: 0 as const,
      verticalShift: 0 as const
    },
    targetParameters: {
      horizontalShift: 2 as const,
      verticalShift: 0 as const
    }
  },
  operation: {
    operationId: KP_GRAPH_2D_HORIZONTAL_TRANSLATION_OPERATION,
    kind: "horizontal-translation" as const,
    displacement: 2 as const
  },
  preserve: [
    "function-family",
    "curve-identity",
    "axis-context"
  ] as const
} satisfies KpGraph2DFunctionGenerationRequest);

/**
 * This exact parameter boundary prevents formula text from quietly becoming
 * mathematical authority. The Graph2D frontend derives normalized equations,
 * curve correspondence, salient points, and later renderer-owned sampling.
 */
export function validateKpGraph2DFunctionGenerationRequest(
  value: unknown
): KpGraph2DFunctionGenerationRequestValidation {
  const diagnostics: KpGraph2DFunctionGenerationRequestDiagnostic[] = [];
  if (!isRecord(value)) return repair(undefined, [issue(
    "graph-2d-function.request.type",
    "$",
    "Graph2D function generation input must be an object.",
    "Provide the versioned bounded Graph2D function request."
  )]);

  rejectFields(value, "$", diagnostics);
  const requestId = validId(value["requestId"])
    ? value["requestId"]
    : undefined;
  if (
    value["schemaVersion"] !==
      KP_GRAPH_2D_FUNCTION_GENERATION_REQUEST_SCHEMA ||
    value["kind"] !== "graph-2d-function-generation-request" ||
    requestId === undefined
  ) diagnostics.push(issue(
    "graph-2d-function.request.value-invalid",
    "$",
    "Schema, kind, and requestId must use governed values.",
    "Begin with the checked-in Graph2D quadratic-translation request."
  ));

  if (diagnostics.length === 0 &&
      !equal(value, kpGraph2DQuadraticTranslationRequest)) {
    diagnostics.push(issue(
      "graph-2d-function.request.exemplar-unsupported",
      "$",
      "This frontend supports only y = x^2 translated right by two units.",
      "Use the pinned monic-quadratic request or retain a typed gap until another Graph2D operation is reviewed."
    ));
  }

  if (diagnostics.length > 0) return repair(requestId, diagnostics);
  return Object.freeze({
    status: "accepted" as const,
    request: deepFreeze(clone(kpGraph2DQuadraticTranslationRequest)),
    diagnostics: Object.freeze([]) as readonly []
  });
}

function rejectFields(
  value: unknown,
  path: string,
  diagnostics: KpGraph2DFunctionGenerationRequestDiagnostic[]
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
      "graph-2d-function.request.formula-forbidden",
      childPath,
      `${key} cannot supply Graph2D function truth at this boundary.`,
      "Choose the registered function family and numeric parameters; the frontend owns normalization."
    ));
    if (presentationField.test(key)) diagnostics.push(issue(
      "graph-2d-function.request.presentation-forbidden",
      childPath,
      `${key} belongs to the Graph2D asset or SVG adapter, not the request.`,
      "Remove presentation and sampling policy from the semantic request."
    ));
    if (!allowed.includes(key)) diagnostics.push(issue(
      "graph-2d-function.request.field-unknown",
      childPath,
      `${key} is not part of the bounded Graph2D request protocol.`,
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
    "function",
    "operation",
    "preserve"
  ];
  if (path === "$.function") return [
    "familyId",
    "curveId",
    "independentVariable",
    "dependentVariable",
    "domain",
    "sourceParameters",
    "targetParameters"
  ];
  if (path === "$.function.domain") return ["kind"];
  if (
    path === "$.function.sourceParameters" ||
    path === "$.function.targetParameters"
  ) return ["horizontalShift", "verticalShift"];
  if (path === "$.operation") return [
    "operationId",
    "kind",
    "displacement"
  ];
  return [];
}

function issue(
  code: KpGraph2DFunctionGenerationRequestDiagnostic["code"],
  path: string,
  message: string,
  repairInstruction: string
): KpGraph2DFunctionGenerationRequestDiagnostic {
  return Object.freeze({ code, path, message, repair: repairInstruction });
}

function repair(
  requestId: string | undefined,
  diagnostics: readonly KpGraph2DFunctionGenerationRequestDiagnostic[]
): KpGraph2DFunctionGenerationRequestValidation {
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
