export const KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA =
  "kp.code-refactor-generation-request.v1" as const;

export const kpCodeRefactorLanguages = Object.freeze([
  "typescript",
  "python"
] as const);

export type KpCodeRefactorLanguage =
  (typeof kpCodeRefactorLanguages)[number];

export interface KpCodeRefactorSourceRevision {
  readonly revisionId: string;
  readonly role: "before" | "after";
  readonly path: string;
  readonly sourceText: string;
}

export interface KpCodeRefactorGenerationRequest {
  readonly schemaVersion:
    typeof KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA;
  readonly kind: "code-refactor-generation-request";
  readonly requestId: string;
  readonly language: KpCodeRefactorLanguage;
  readonly revisions: readonly [
    KpCodeRefactorSourceRevision & Readonly<{ role: "before" }>,
    KpCodeRefactorSourceRevision & Readonly<{ role: "after" }>
  ];
  readonly intent: Readonly<{
    kind: "extract-helper";
    preserve: readonly ["behavior", "program-identity"];
  }>;
}

export type KpCodeRefactorGenerationResult<TSemanticPlan, TDiagnostic> =
  | Readonly<{
      status: "accepted";
      requestId: string;
      language: KpCodeRefactorLanguage;
      semanticPlan: TSemanticPlan;
      diagnostics: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      requestId?: string;
      language?: KpCodeRefactorLanguage;
      diagnostics: readonly TDiagnostic[];
    }>;

export type KpCodeRefactorGenerationRequestValidation =
  | Readonly<{
      status: "accepted";
      request: KpCodeRefactorGenerationRequest;
      diagnostics: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      requestId?: string;
      language?: KpCodeRefactorLanguage;
      diagnostics: readonly KpCodeRefactorGenerationRequestDiagnostic[];
    }>;

export interface KpCodeRefactorGenerationRequestDiagnostic {
  readonly code:
    | "code-refactor.request.type"
    | "code-refactor.request.field-unknown"
    | "code-refactor.request.field-forbidden"
    | "code-refactor.request.value-invalid"
    | "code-refactor.request.revision-order";
  readonly path: string;
  readonly message: string;
  readonly repair: string;
}

const protocolId = /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/u;
const sourcePath = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[^\0]+$/u;
const forbiddenField = /^(?:durationMs|delayMs|staggerMs|keyframes?|motionPath|coordinates?|pixelCoordinates?|boundingRect|domNode|htmlElement|svgElement|webglContext|renderer|renderTarget|css|className|computedStyle)$/i;

/**
 * This boundary knows the causal edit and revision order, never language ASTs
 * or presentation. Language frontends retain parsing and legality authority.
 */
export function validateKpCodeRefactorGenerationRequest(
  value: unknown
): KpCodeRefactorGenerationRequestValidation {
  const diagnostics: KpCodeRefactorGenerationRequestDiagnostic[] = [];
  if (!isRecord(value)) {
    return repair(undefined, undefined, [issue(
      "code-refactor.request.type",
      "$",
      "Code refactor generation input must be an object.",
      "Provide the versioned code refactor request envelope."
    )]);
  }
  rejectUnknown(value, [
    "schemaVersion",
    "kind",
    "requestId",
    "language",
    "revisions",
    "intent"
  ], "$", diagnostics);
  rejectForbidden(value, "$", diagnostics);

  const requestId = validId(value["requestId"])
    ? value["requestId"]
    : undefined;
  const language = kpCodeRefactorLanguages.includes(value["language"] as never)
    ? value["language"] as KpCodeRefactorLanguage
    : undefined;
  if (
    value["schemaVersion"] !== KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA ||
    value["kind"] !== "code-refactor-generation-request" ||
    requestId === undefined ||
    language === undefined
  ) invalid(
    "$",
    "Schema, kind, requestId, and language must use governed values.",
    diagnostics
  );

  const revisions = validateRevisions(value["revisions"], diagnostics);
  const intent = isRecord(value["intent"]) ? value["intent"] : undefined;
  if (intent === undefined) {
    invalid("$.intent", "Intent must be an object.", diagnostics);
  } else {
    rejectUnknown(intent, ["kind", "preserve"], "$.intent", diagnostics);
    if (
      intent["kind"] !== "extract-helper" ||
      !equalStrings(intent["preserve"], ["behavior", "program-identity"])
    ) invalid(
      "$.intent",
      "Only extract-helper intent preserving behavior and program identity is supported.",
      diagnostics
    );
  }

  if (
    diagnostics.length > 0 ||
    requestId === undefined ||
    language === undefined ||
    revisions === undefined
  ) return repair(requestId, language, diagnostics);

  const request = deepFreeze({
    schemaVersion: KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA,
    kind: "code-refactor-generation-request" as const,
    requestId,
    language,
    revisions,
    intent: {
      kind: "extract-helper" as const,
      preserve: ["behavior", "program-identity"] as const
    }
  });
  return Object.freeze({
    status: "accepted" as const,
    request,
    diagnostics: Object.freeze([]) as readonly []
  });
}

function validateRevisions(
  value: unknown,
  diagnostics: KpCodeRefactorGenerationRequestDiagnostic[]
): KpCodeRefactorGenerationRequest["revisions"] | undefined {
  if (!Array.isArray(value) || value.length !== 2) {
    invalid(
      "$.revisions",
      "Extract-helper input requires exactly two ordered revisions.",
      diagnostics
    );
    return undefined;
  }
  const projected = value.map((candidate, index) => {
    const path = `$.revisions[${index}]`;
    if (!isRecord(candidate)) {
      invalid(path, "Revision must be an object.", diagnostics);
      return undefined;
    }
    rejectUnknown(candidate, [
      "revisionId",
      "role",
      "path",
      "sourceText"
    ], path, diagnostics);
    if (
      !validId(candidate["revisionId"]) ||
      (candidate["role"] !== "before" && candidate["role"] !== "after") ||
      typeof candidate["path"] !== "string" ||
      !sourcePath.test(candidate["path"]) ||
      typeof candidate["sourceText"] !== "string" ||
      candidate["sourceText"].trim().length === 0
    ) {
      invalid(
        path,
        "Revision requires a namespaced ID, before/after role, relative path, and non-empty source text.",
        diagnostics
      );
      return undefined;
    }
    return {
      revisionId: candidate["revisionId"],
      role: candidate["role"],
      path: candidate["path"],
      sourceText: candidate["sourceText"]
    } as KpCodeRefactorSourceRevision;
  });
  if (projected.some((candidate) => candidate === undefined)) return undefined;
  if (projected[0]?.role !== "before" || projected[1]?.role !== "after") {
    diagnostics.push(issue(
      "code-refactor.request.revision-order",
      "$.revisions",
      "Revisions must be ordered before, then after.",
      "Place the source revision first and the proposed successor second."
    ));
    return undefined;
  }
  return deepFreeze([
    { ...projected[0], role: "before" as const },
    { ...projected[1], role: "after" as const }
  ]);
}

function rejectUnknown(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  diagnostics: KpCodeRefactorGenerationRequestDiagnostic[]
): void {
  Object.keys(value).filter((key) => !allowed.includes(key)).forEach((key) =>
    diagnostics.push(issue(
      "code-refactor.request.field-unknown",
      `${path}.${key}`,
      `${key} is not part of the code refactor request protocol.`,
      "Remove the field or place language syntax in revision source text."
    ))
  );
}

function rejectForbidden(
  value: unknown,
  path: string,
  diagnostics: KpCodeRefactorGenerationRequestDiagnostic[]
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
      "code-refactor.request.field-forbidden",
      `${path}.${key}`,
      `${key} is presentation policy, not refactor semantics.`,
      "Remove presentation policy; canonical artifacts own choreography."
    ));
    rejectForbidden(child, `${path}.${key}`, diagnostics);
  });
}

function invalid(
  path: string,
  message: string,
  diagnostics: KpCodeRefactorGenerationRequestDiagnostic[]
): void {
  diagnostics.push(issue(
    "code-refactor.request.value-invalid",
    path,
    message,
    "Use the generated code refactor request schema."
  ));
}

function issue(
  code: KpCodeRefactorGenerationRequestDiagnostic["code"],
  path: string,
  message: string,
  repairInstruction: string
): KpCodeRefactorGenerationRequestDiagnostic {
  return Object.freeze({ code, path, message, repair: repairInstruction });
}

function repair(
  requestId: string | undefined,
  language: KpCodeRefactorLanguage | undefined,
  diagnostics: readonly KpCodeRefactorGenerationRequestDiagnostic[]
): KpCodeRefactorGenerationRequestValidation {
  return Object.freeze({
    status: "repair-required" as const,
    ...(requestId === undefined ? {} : { requestId }),
    ...(language === undefined ? {} : { language }),
    diagnostics: Object.freeze([...diagnostics])
  });
}

function validId(value: unknown): value is string {
  return typeof value === "string" && protocolId.test(value);
}

function equalStrings(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) &&
    value.length === expected.length &&
    value.every((candidate, index) => candidate === expected[index]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
