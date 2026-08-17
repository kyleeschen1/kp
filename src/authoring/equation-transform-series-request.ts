export const KP_EQUATION_TRANSFORM_SERIES_REQUEST_SCHEMA =
  "kp.equation-transform-series-request.v1" as const;

export interface KpEquationTransformSeriesState {
  readonly id: string;
  readonly latex: string;
  readonly narration?: string | undefined;
}

export type KpEquationTransformSeriesAdjacencyIntent =
  | Readonly<{
      mode: "explicit";
      operationId: string;
      semanticArguments: unknown;
    }>
  | Readonly<{
      mode: "proposed";
      instruction?: string | undefined;
    }>;

export interface KpEquationTransformSeriesAdjacency {
  readonly id: string;
  readonly fromStateId: string;
  readonly toStateId: string;
  readonly intent: KpEquationTransformSeriesAdjacencyIntent;
}

export interface KpEquationTransformSeriesRequest {
  readonly schemaVersion: typeof KP_EQUATION_TRANSFORM_SERIES_REQUEST_SCHEMA;
  readonly kind: "equation-transform-series-request";
  readonly id: string;
  readonly states: readonly [
    KpEquationTransformSeriesState,
    KpEquationTransformSeriesState,
    ...KpEquationTransformSeriesState[]
  ];
  readonly adjacencies: readonly KpEquationTransformSeriesAdjacency[];
}

export interface KpEquationTransformSeriesRequestDiagnostic {
  readonly code:
    | "equation-series.request.type"
    | "equation-series.field.unknown"
    | "equation-series.field.forbidden"
    | "equation-series.value.invalid"
    | "equation-series.id.duplicate"
    | "equation-series.adjacency.count"
    | "equation-series.adjacency.order";
  readonly path: string;
  readonly message: string;
  readonly repair: string;
}

export type KpEquationTransformSeriesRequestResult =
  | Readonly<{
      status: "accepted";
      request: KpEquationTransformSeriesRequest;
      diagnostics: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      diagnostics: readonly KpEquationTransformSeriesRequestDiagnostic[];
    }>;

const protocolId = /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/u;
const forbiddenField = /^(?:durationMs|delayMs|staggerMs|keyframes?|motionPath|coordinates?|geometry|renderer|renderTarget|css|className|computedStyle|opacity|translate|rotate|scale)$/i;

/** States carry native notation; later slices normalize syntax and resolve laws. */
export function validateKpEquationTransformSeriesRequest(
  value: unknown
): KpEquationTransformSeriesRequestResult {
  const diagnostics: KpEquationTransformSeriesRequestDiagnostic[] = [];
  if (!isRecord(value)) return repair([issue(
    "equation-series.request.type",
    "$",
    "Equation transform series input must be an object.",
    "Provide a versioned request with ordered states and adjacencies."
  )]);
  rejectUnknown(value, [
    "schemaVersion",
    "kind",
    "id",
    "states",
    "adjacencies"
  ], "$", diagnostics);
  rejectForbidden(value, "$", diagnostics);
  if (
    value["schemaVersion"] !== KP_EQUATION_TRANSFORM_SERIES_REQUEST_SCHEMA ||
    value["kind"] !== "equation-transform-series-request" ||
    !validId(value["id"])
  ) invalid("$", "Schema, kind, and request ID must use governed values.", diagnostics);

  const rawStates = Array.isArray(value["states"]) ? value["states"] : [];
  if (rawStates.length < 2) invalid(
    "$.states",
    "A transform series requires at least two ordered native-LaTeX states.",
    diagnostics
  );
  const states = rawStates.map((state, index) =>
    parseState(state, `$.states[${index}]`, diagnostics)
  ).filter((state): state is KpEquationTransformSeriesState =>
    state !== undefined
  );
  duplicateIds(states.map(({ id }) => id), "$.states", diagnostics);

  const rawAdjacencies = Array.isArray(value["adjacencies"])
    ? value["adjacencies"]
    : [];
  const adjacencies = rawAdjacencies.map((adjacency, index) =>
    parseAdjacency(adjacency, `$.adjacencies[${index}]`, diagnostics)
  ).filter((adjacency): adjacency is KpEquationTransformSeriesAdjacency =>
    adjacency !== undefined
  );
  duplicateIds(adjacencies.map(({ id }) => id), "$.adjacencies", diagnostics);
  if (rawAdjacencies.length !== Math.max(0, rawStates.length - 1)) {
    diagnostics.push(issue(
      "equation-series.adjacency.count",
      "$.adjacencies",
      "Every neighboring state pair requires exactly one adjacency intent.",
      "Provide states.length - 1 adjacencies in the same order as the states."
    ));
  }
  adjacencies.forEach((adjacency, index) => {
    const from = states[index];
    const to = states[index + 1];
    if (
      from === undefined || to === undefined ||
      adjacency.fromStateId !== from.id || adjacency.toStateId !== to.id
    ) diagnostics.push(issue(
      "equation-series.adjacency.order",
      `$.adjacencies[${index}]`,
      `${adjacency.id} does not connect the neighboring states at index ${index}.`,
      "Connect each adjacency from states[i] to states[i + 1]."
    ));
  });

  if (
    diagnostics.length > 0 || states.length < 2 ||
    adjacencies.length !== states.length - 1
  ) return repair(diagnostics);
  return Object.freeze({
    status: "accepted" as const,
    request: deepFreeze({
      schemaVersion: KP_EQUATION_TRANSFORM_SERIES_REQUEST_SCHEMA,
      kind: "equation-transform-series-request" as const,
      id: value["id"] as string,
      states: states.map((state) => ({ ...state })) as unknown as
        KpEquationTransformSeriesRequest["states"],
      adjacencies: adjacencies.map((adjacency) => ({
        ...adjacency,
        intent: adjacency.intent.mode === "explicit"
          ? {
              ...adjacency.intent,
              semanticArguments: immutableCopy(
                adjacency.intent.semanticArguments
              )
            }
          : { ...adjacency.intent }
      }))
    }),
    diagnostics: Object.freeze([]) as readonly []
  });
}

function parseState(
  value: unknown,
  path: string,
  diagnostics: KpEquationTransformSeriesRequestDiagnostic[]
): KpEquationTransformSeriesState | undefined {
  if (!isRecord(value)) {
    invalid(path, "State must be an object.", diagnostics);
    return undefined;
  }
  rejectUnknown(value, ["id", "latex", "narration"], path, diagnostics);
  const narration = value["narration"];
  if (
    !validId(value["id"]) || !nonBlank(value["latex"]) ||
    !(narration === undefined || nonBlank(narration))
  ) {
    invalid(path, "State requires an ID, nonblank native LaTeX, and optional narration.", diagnostics);
    return undefined;
  }
  return Object.freeze({
    id: value["id"],
    latex: value["latex"],
    ...(narration === undefined ? {} : { narration })
  });
}

function parseAdjacency(
  value: unknown,
  path: string,
  diagnostics: KpEquationTransformSeriesRequestDiagnostic[]
): KpEquationTransformSeriesAdjacency | undefined {
  if (!isRecord(value)) {
    invalid(path, "Adjacency must be an object.", diagnostics);
    return undefined;
  }
  rejectUnknown(value, ["id", "fromStateId", "toStateId", "intent"], path, diagnostics);
  const intent = parseIntent(value["intent"], `${path}.intent`, diagnostics);
  if (
    !validId(value["id"]) || !validId(value["fromStateId"]) ||
    !validId(value["toStateId"]) || intent === undefined
  ) {
    invalid(path, "Adjacency requires IDs, neighboring endpoints, and one intent.", diagnostics);
    return undefined;
  }
  return Object.freeze({
    id: value["id"],
    fromStateId: value["fromStateId"],
    toStateId: value["toStateId"],
    intent
  });
}

function parseIntent(
  value: unknown,
  path: string,
  diagnostics: KpEquationTransformSeriesRequestDiagnostic[]
): KpEquationTransformSeriesAdjacencyIntent | undefined {
  if (!isRecord(value)) {
    invalid(path, "Adjacency intent must be an object.", diagnostics);
    return undefined;
  }
  if (value["mode"] === "explicit") {
    rejectUnknown(value, ["mode", "operationId", "semanticArguments"], path, diagnostics);
    if (!validId(value["operationId"]) || !("semanticArguments" in value)) {
      invalid(path, "Explicit intent requires operationId and semanticArguments.", diagnostics);
      return undefined;
    }
    return Object.freeze({
      mode: "explicit" as const,
      operationId: value["operationId"],
      semanticArguments: value["semanticArguments"]
    });
  }
  if (value["mode"] === "proposed") {
    rejectUnknown(value, ["mode", "instruction"], path, diagnostics);
    if (!(value["instruction"] === undefined || nonBlank(value["instruction"]))) {
      invalid(path, "Proposed intent instruction must be nonblank when present.", diagnostics);
      return undefined;
    }
    return Object.freeze({
      mode: "proposed" as const,
      ...(value["instruction"] === undefined
        ? {}
        : { instruction: value["instruction"] as string })
    });
  }
  invalid(path, "Intent mode must be explicit or proposed.", diagnostics);
  return undefined;
}

function rejectForbidden(
  value: unknown,
  path: string,
  diagnostics: KpEquationTransformSeriesRequestDiagnostic[]
): void {
  if (Array.isArray(value)) {
    value.forEach((child, index) =>
      rejectForbidden(child, `${path}[${index}]`, diagnostics)
    );
    return;
  }
  if (!isRecord(value)) return;
  Object.entries(value).forEach(([key, child]) => {
    if (forbiddenField.test(key)) diagnostics.push(issue(
      "equation-series.field.forbidden",
      `${path}.${key}`,
      `${key} is compiler or renderer authority.`,
      "Remove presentation policy and keep only semantic adjacency intent."
    ));
    rejectForbidden(child, `${path}.${key}`, diagnostics);
  });
}

function rejectUnknown(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  diagnostics: KpEquationTransformSeriesRequestDiagnostic[]
): void {
  Object.keys(value).filter((key) => !allowed.includes(key)).forEach((key) =>
    diagnostics.push(issue(
      "equation-series.field.unknown",
      `${path}.${key}`,
      `${key} is not part of this request shape.`,
      "Use only ordered notation, narration, and semantic adjacency intent."
    ))
  );
}

function duplicateIds(
  ids: readonly string[],
  path: string,
  diagnostics: KpEquationTransformSeriesRequestDiagnostic[]
): void {
  ids.forEach((id, index) => {
    if (ids.indexOf(id) !== index) diagnostics.push(issue(
      "equation-series.id.duplicate",
      `${path}[${index}].id`,
      `${id} is duplicated.`,
      "Give every state and adjacency a stable unique ID."
    ));
  });
}

function issue(
  code: KpEquationTransformSeriesRequestDiagnostic["code"],
  path: string,
  message: string,
  repairInstruction: string
): KpEquationTransformSeriesRequestDiagnostic {
  return Object.freeze({ code, path, message, repair: repairInstruction });
}

function invalid(
  path: string,
  message: string,
  diagnostics: KpEquationTransformSeriesRequestDiagnostic[]
): void {
  diagnostics.push(issue(
    "equation-series.value.invalid",
    path,
    message,
    "Use the versioned transform-series request schema."
  ));
}

function repair(
  diagnostics: readonly KpEquationTransformSeriesRequestDiagnostic[]
): KpEquationTransformSeriesRequestResult {
  return Object.freeze({
    status: "repair-required" as const,
    diagnostics: Object.freeze([...diagnostics])
  });
}

function validId(value: unknown): value is string {
  return typeof value === "string" && protocolId.test(value);
}

function nonBlank(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function immutableCopy(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(immutableCopy);
  if (isRecord(value)) return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, immutableCopy(child)])
  );
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
