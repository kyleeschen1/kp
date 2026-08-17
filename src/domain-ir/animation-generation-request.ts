import {
  kpAnimationDomains,
  type KpAnimationDomain
} from "./animation-domain.ts";

export const KP_ANIMATION_GENERATION_REQUEST_SCHEMA =
  "kp.animation-generation-request.v1" as const;

export type KpAnimationGenerationDomain = KpAnimationDomain;

export type KpAnimationGenerationExpectedOutput =
  | "semantic-plan"
  | "animation-artifact"
  | "typed-diagnostics"
  | "coverage-evidence";

export interface KpAnimationGenerationRequest {
  readonly schemaVersion: typeof KP_ANIMATION_GENERATION_REQUEST_SCHEMA;
  readonly kind: "animation-generation-request";
  readonly requestId: string;
  readonly domain: KpAnimationGenerationDomain;
  readonly source: Readonly<{
    kind: string;
    frontendId: string;
    input: unknown;
  }>;
  readonly intent: Readonly<{
    kind: string;
    summary: string;
    parameters: unknown;
  }>;
  readonly expectedOutputs: readonly KpAnimationGenerationExpectedOutput[];
  readonly capabilityPins: readonly string[];
}

export type KpAnimationGenerationRequestResult =
  | Readonly<{
      status: "accepted";
      request: KpAnimationGenerationRequest;
      diagnostics: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      diagnostics: readonly KpAnimationGenerationRequestDiagnostic[];
    }>;

export interface KpAnimationGenerationRequestDiagnostic {
  readonly code:
    | "animation-generation.request.type"
    | "animation-generation.field.unknown"
    | "animation-generation.field.forbidden"
    | "animation-generation.value.invalid"
    | "animation-generation.source.domain-mismatch"
    | "animation-generation.value.duplicate";
  readonly path: string;
  readonly message: string;
  readonly repair: string;
}

const expectedOutputValues = Object.freeze([
  "semantic-plan",
  "animation-artifact",
  "typed-diagnostics",
  "coverage-evidence"
] as const);
const protocolId = /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/u;
const forbiddenField = /^(?:durationMs|delayMs|staggerMs|keyframes?|motionPath|coordinates?|pixelCoordinates?|boundingRect|domNode|htmlElement|svgElement|webglContext|renderer|renderTarget|css|className|computedStyle)$/i;

/**
 * This envelope routes opaque domain requests; it never interprets their AST,
 * scene, equation, or program semantics. Domain frontends own that work.
 */
export function validateKpAnimationGenerationRequest(
  value: unknown
): KpAnimationGenerationRequestResult {
  const diagnostics: KpAnimationGenerationRequestDiagnostic[] = [];
  if (!isRecord(value)) {
    return repair([issue(
      "animation-generation.request.type",
      "$",
      "Animation generation input must be an object.",
      "Provide the versioned cross-domain request envelope."
    )]);
  }
  rejectUnknown(value, [
    "schemaVersion",
    "kind",
    "requestId",
    "domain",
    "source",
    "intent",
    "expectedOutputs",
    "capabilityPins"
  ], "$", diagnostics);
  rejectForbidden(value, "$", diagnostics);

  const domain = kpAnimationDomains.includes(value["domain"] as never)
    ? value["domain"] as KpAnimationGenerationDomain
    : undefined;
  if (
    value["schemaVersion"] !== KP_ANIMATION_GENERATION_REQUEST_SCHEMA ||
    value["kind"] !== "animation-generation-request" ||
    !validId(value["requestId"]) ||
    domain === undefined
  ) invalid("$", "Schema, kind, requestId, and domain must use governed values.", diagnostics);

  const source = isRecord(value["source"]) ? value["source"] : undefined;
  if (source === undefined) {
    invalid("$.source", "Source must be an object.", diagnostics);
  } else {
    rejectUnknown(source, ["kind", "frontendId", "input"], "$.source", diagnostics);
    if (!validId(source["kind"]) || !validId(source["frontendId"]) ||
        !("input" in source)) {
      invalid("$.source", "Source requires a namespaced kind, frontendId, and opaque input.", diagnostics);
    } else if (domain !== undefined &&
        !(source["kind"] as string).startsWith(`${domain}.`)) {
      diagnostics.push(issue(
        "animation-generation.source.domain-mismatch",
        "$.source.kind",
        `${String(source["kind"])} does not belong to ${domain}.`,
        `Choose a source kind namespaced under ${domain}.`
      ));
    }
  }

  const intent = isRecord(value["intent"]) ? value["intent"] : undefined;
  if (intent === undefined) {
    invalid("$.intent", "Intent must be an object.", diagnostics);
  } else {
    rejectUnknown(intent, ["kind", "summary", "parameters"], "$.intent", diagnostics);
    if (!validId(intent["kind"]) || !nonBlank(intent["summary"]) ||
        !("parameters" in intent)) {
      invalid("$.intent", "Intent requires a namespaced kind, summary, and opaque parameters.", diagnostics);
    }
  }

  const expectedOutputs = stringArray(value["expectedOutputs"]);
  const capabilityPins = stringArray(value["capabilityPins"]);
  if (
    expectedOutputs.length === 0 ||
    expectedOutputs.some((output) =>
      !expectedOutputValues.includes(output as KpAnimationGenerationExpectedOutput)
    )
  ) invalid("$.expectedOutputs", "Choose one or more governed expected outputs.", diagnostics);
  if (capabilityPins.length === 0 || capabilityPins.some((id) => !validId(id))) {
    invalid("$.capabilityPins", "Pin one or more namespaced capability IDs.", diagnostics);
  }
  duplicateIssues(expectedOutputs, "$.expectedOutputs", diagnostics);
  duplicateIssues(capabilityPins, "$.capabilityPins", diagnostics);

  if (
    diagnostics.length > 0 || domain === undefined ||
    source === undefined || intent === undefined
  ) return repair(diagnostics);
  return Object.freeze({
    status: "accepted" as const,
    request: deepFreeze({
      schemaVersion: KP_ANIMATION_GENERATION_REQUEST_SCHEMA,
      kind: "animation-generation-request" as const,
      requestId: value["requestId"] as string,
      domain,
      source: {
        kind: source["kind"] as string,
        frontendId: source["frontendId"] as string,
        input: immutableCopy(source["input"])
      },
      intent: {
        kind: intent["kind"] as string,
        summary: intent["summary"] as string,
        parameters: immutableCopy(intent["parameters"])
      },
      expectedOutputs: expectedOutputs as KpAnimationGenerationExpectedOutput[],
      capabilityPins
    }),
    diagnostics: Object.freeze([]) as readonly []
  });
}

function rejectForbidden(
  value: unknown,
  path: string,
  diagnostics: KpAnimationGenerationRequestDiagnostic[]
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
      "animation-generation.field.forbidden",
      `${path}.${key}`,
      `${key} belongs to a compiler or renderer, not this request.`,
      "Remove presentation policy and express domain semantic intent instead."
    ));
    rejectForbidden(child, `${path}.${key}`, diagnostics);
  });
}

function rejectUnknown(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  diagnostics: KpAnimationGenerationRequestDiagnostic[]
): void {
  Object.keys(value).filter((key) => !allowed.includes(key)).forEach((key) =>
    diagnostics.push(issue(
      "animation-generation.field.unknown",
      `${path}.${key}`,
      `${key} is not part of the cross-domain envelope.`,
      "Move domain-specific data into source.input or intent.parameters."
    ))
  );
}

function duplicateIssues(
  values: readonly string[],
  path: string,
  diagnostics: KpAnimationGenerationRequestDiagnostic[]
): void {
  values.forEach((value, index) => {
    if (values.indexOf(value) !== index) diagnostics.push(issue(
      "animation-generation.value.duplicate",
      `${path}[${index}]`,
      `${value} is duplicated.`,
      "Keep each value once."
    ));
  });
}

function invalid(
  path: string,
  message: string,
  diagnostics: KpAnimationGenerationRequestDiagnostic[]
): void {
  diagnostics.push(issue(
    "animation-generation.value.invalid",
    path,
    message,
    "Use the generated request schema and a domain-owned frontend payload."
  ));
}

function issue(
  code: KpAnimationGenerationRequestDiagnostic["code"],
  path: string,
  message: string,
  repairInstruction: string
): KpAnimationGenerationRequestDiagnostic {
  return Object.freeze({ code, path, message, repair: repairInstruction });
}

function repair(
  diagnostics: readonly KpAnimationGenerationRequestDiagnostic[]
): KpAnimationGenerationRequestResult {
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

function stringArray(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? [...value]
    : [];
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

function immutableCopy(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(immutableCopy);
  if (isRecord(value)) return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, immutableCopy(child)])
  );
  return value;
}
