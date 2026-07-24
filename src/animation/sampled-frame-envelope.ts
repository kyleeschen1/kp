import type {
  KpAnimationAssetTransformationTreeDirection
} from "./asset.ts";

export const kpSampledFrameEnvelopeSchemaVersion =
  "kp.sampled-frame-envelope.v1" as const;
export const kpSampledFrameClockPrecision = 3;

export interface KpSampledFramePayloadAttachment<
  TDomain extends string = string,
  TSchemaVersion extends string = string
> {
  readonly domain: TDomain;
  readonly schemaVersion: TSchemaVersion;
}

export interface KpSampledFrameEnvelope<
  TPayload extends KpSampledFramePayloadAttachment = never
> {
  readonly schemaVersion: typeof kpSampledFrameEnvelopeSchemaVersion;
  readonly id: string;
  readonly kind: "sampled-frame-envelope";
  readonly source: {
    readonly animationId: string;
    readonly planId: string;
    readonly timelineId?: string | undefined;
  };
  readonly clock: {
    readonly direction: KpAnimationAssetTransformationTreeDirection;
    readonly progress: number;
    readonly durationMs?: number | undefined;
    readonly elapsedMs?: number | undefined;
    readonly beatCount?: number | undefined;
    readonly beat?: number | undefined;
  };
  readonly activity: {
    readonly phaseId: string;
    readonly phaseIndex: number;
    readonly semanticObjectIds: readonly string[];
    readonly transformationIds: readonly string[];
    readonly annotationIds: readonly string[];
    readonly focusSelectorIds: readonly string[];
    readonly childFrameIds: readonly string[];
  };
  readonly diagnostics: readonly KpSampledFrameEnvelopeDiagnostic[];
  readonly payload?: TPayload | undefined;
}

export interface KpSampledFrameEnvelopeDiagnostic {
  readonly severity: "info" | "warning" | "error";
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface KpSampledFrameEnvelopeIssue {
  readonly path: string;
  readonly code:
    | "envelope.required"
    | "envelope.clock"
    | "envelope.activity"
    | "envelope.payload";
  readonly message: string;
}

export function createKpSampledFrameEnvelope<
  TPayload extends KpSampledFramePayloadAttachment = never
>(
  input: KpSampledFrameEnvelope<TPayload>
): KpSampledFrameEnvelope<TPayload> {
  const issues = validateKpSampledFrameEnvelope(input);
  if (issues.length > 0) {
    throw new Error(issues.map(({ message }) => message).join(" "));
  }
  return Object.freeze({
    schemaVersion: kpSampledFrameEnvelopeSchemaVersion,
    id: input.id,
    kind: "sampled-frame-envelope",
    source: Object.freeze({ ...input.source }),
    clock: Object.freeze({ ...input.clock }),
    activity: Object.freeze({
      ...input.activity,
      semanticObjectIds: Object.freeze([...input.activity.semanticObjectIds]),
      transformationIds: Object.freeze([...input.activity.transformationIds]),
      annotationIds: Object.freeze([...input.activity.annotationIds]),
      focusSelectorIds: Object.freeze([...input.activity.focusSelectorIds]),
      childFrameIds: Object.freeze([...input.activity.childFrameIds])
    }),
    diagnostics: Object.freeze(
      input.diagnostics.map((diagnostic) => Object.freeze({ ...diagnostic }))
    ),
    ...(input.payload === undefined
      ? {}
      : { payload: Object.freeze({ ...input.payload }) })
  });
}

export function validateKpSampledFrameEnvelope(
  value: unknown
): readonly KpSampledFrameEnvelopeIssue[] {
  if (!isRecord(value)) {
    return [issue("$", "envelope.required", "Sampled frame envelope must be an object.")];
  }
  const issues: KpSampledFrameEnvelopeIssue[] = [];
  requiredLiteral(
    value["schemaVersion"],
    kpSampledFrameEnvelopeSchemaVersion,
    "$.schemaVersion",
    issues
  );
  requiredLiteral(
    value["kind"],
    "sampled-frame-envelope",
    "$.kind",
    issues
  );
  requiredString(value["id"], "$.id", issues);
  validateSource(value["source"], issues);
  validateClock(value["clock"], issues);
  validateActivity(value["activity"], issues);
  validateDiagnostics(value["diagnostics"], issues);
  if (value["payload"] !== undefined) {
    const payload = value["payload"];
    if (
      !isRecord(payload) ||
      typeof payload["domain"] !== "string" ||
      payload["domain"].length === 0 ||
      typeof payload["schemaVersion"] !== "string" ||
      payload["schemaVersion"].length === 0
    ) {
      issues.push(issue(
        "$.payload",
        "envelope.payload",
        "Frame payload attachments require typed domain and schemaVersion discriminants."
      ));
    }
  }
  return Object.freeze(issues);
}

function validateSource(
  value: unknown,
  issues: KpSampledFrameEnvelopeIssue[]
): void {
  if (!isRecord(value)) {
    issues.push(issue("$.source", "envelope.required", "Frame source is required."));
    return;
  }
  requiredString(value["animationId"], "$.source.animationId", issues);
  requiredString(value["planId"], "$.source.planId", issues);
  optionalString(value["timelineId"], "$.source.timelineId", issues);
}

function validateClock(
  value: unknown,
  issues: KpSampledFrameEnvelopeIssue[]
): void {
  if (!isRecord(value)) {
    issues.push(issue("$.clock", "envelope.required", "Frame clock is required."));
    return;
  }
  if (value["direction"] !== "forward" && value["direction"] !== "rewind") {
    issues.push(issue(
      "$.clock.direction",
      "envelope.clock",
      "Frame direction must be forward or rewind."
    ));
  }
  const progress = value["progress"];
  if (
    typeof progress !== "number" ||
    !Number.isFinite(progress) ||
    progress < 0 ||
    progress > 1
  ) {
    issues.push(issue(
      "$.clock.progress",
      "envelope.clock",
      "Frame progress must be finite and within [0, 1]."
    ));
    return;
  }
  clockPair(value, "durationMs", "elapsedMs", progress, issues);
  clockPair(value, "beatCount", "beat", progress, issues);
}

function clockPair(
  clock: Readonly<Record<string, unknown>>,
  totalKey: "durationMs" | "beatCount",
  valueKey: "elapsedMs" | "beat",
  progress: number,
  issues: KpSampledFrameEnvelopeIssue[]
): void {
  const total = clock[totalKey];
  const current = clock[valueKey];
  const expected =
    typeof total === "number"
      ? roundKpSampledFrameClockValue(total * progress)
      : undefined;
  if (total === undefined && current === undefined) return;
  if (
    typeof total !== "number" ||
    !Number.isFinite(total) ||
    total < 0 ||
    typeof current !== "number" ||
    !Number.isFinite(current) ||
    current < 0 ||
    current !== expected
  ) {
    issues.push(issue(
      `$.clock.${valueKey}`,
      "envelope.clock",
      `${valueKey} must equal ${totalKey} multiplied by progress.`
    ));
  }
}

export function roundKpSampledFrameClockValue(value: number): number {
  const rounded = Number(value.toFixed(kpSampledFrameClockPrecision));

  return Object.is(rounded, -0) ? 0 : rounded;
}

function validateActivity(
  value: unknown,
  issues: KpSampledFrameEnvelopeIssue[]
): void {
  if (!isRecord(value)) {
    issues.push(issue(
      "$.activity",
      "envelope.required",
      "Frame semantic activity is required."
    ));
    return;
  }
  requiredString(value["phaseId"], "$.activity.phaseId", issues);
  if (
    typeof value["phaseIndex"] !== "number" ||
    !Number.isInteger(value["phaseIndex"]) ||
    value["phaseIndex"] < 0
  ) {
    issues.push(issue(
      "$.activity.phaseIndex",
      "envelope.activity",
      "Frame phaseIndex must be a non-negative integer."
    ));
  }
  for (const key of [
    "semanticObjectIds",
    "transformationIds",
    "annotationIds",
    "focusSelectorIds",
    "childFrameIds"
  ] as const) {
    const ids = value[key];
    if (
      !Array.isArray(ids) ||
      ids.some((id) => typeof id !== "string" || id.length === 0) ||
      new Set(ids).size !== ids.length
    ) {
      issues.push(issue(
        `$.activity.${key}`,
        "envelope.activity",
        `${key} must contain unique non-empty ids.`
      ));
    }
  }
}

function validateDiagnostics(
  value: unknown,
  issues: KpSampledFrameEnvelopeIssue[]
): void {
  if (
    !Array.isArray(value) ||
    value.some((diagnostic) =>
      !isRecord(diagnostic) ||
      !["info", "warning", "error"].includes(String(diagnostic["severity"])) ||
      typeof diagnostic["code"] !== "string" ||
      typeof diagnostic["path"] !== "string" ||
      typeof diagnostic["message"] !== "string"
    )
  ) {
    issues.push(issue(
      "$.diagnostics",
      "envelope.required",
      "Frame diagnostics must use the typed severity, code, path, and message shape."
    ));
  }
}

function requiredLiteral(
  value: unknown,
  expected: string,
  path: string,
  issues: KpSampledFrameEnvelopeIssue[]
): void {
  if (value !== expected) {
    issues.push(issue(
      path,
      "envelope.required",
      `Expected ${expected}.`
    ));
  }
}

function requiredString(
  value: unknown,
  path: string,
  issues: KpSampledFrameEnvelopeIssue[]
): void {
  if (typeof value !== "string" || value.length === 0) {
    issues.push(issue(path, "envelope.required", `${path} must be non-empty.`));
  }
}

function optionalString(
  value: unknown,
  path: string,
  issues: KpSampledFrameEnvelopeIssue[]
): void {
  if (value !== undefined) requiredString(value, path, issues);
}

function issue(
  path: string,
  code: KpSampledFrameEnvelopeIssue["code"],
  message: string
): KpSampledFrameEnvelopeIssue {
  return Object.freeze({ path, code, message });
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
