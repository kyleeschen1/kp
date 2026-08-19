import {
  kpEquationSeriesOperationRegistry
} from "./equation-series-operation-declarations.ts";
import { normalizeKpEquationSeriesOperationId } from
  "./equation-series-operation-alias-registry.ts";
import type { KpEquationSeriesIntentProposal } from
  "./equation-series-intent-resolver.ts";
import type { KpEquationTransformSeriesRequest } from
  "./equation-transform-series-request.ts";

export interface KpEquationSeriesPlannerPrompt {
  readonly schemaVersion: "kp.equation-series-planner-prompt.v1";
  readonly kind: "equation-series-planner-prompt";
  readonly requestId: string;
  readonly naturalLanguageIntent: string;
  readonly authorityRule:
    "models-propose-operations-kp-verifies-math-presentation-and-motion";
  readonly states: readonly Readonly<{
    id: string;
    latex: string;
    narration?: string | undefined;
  }>[];
  readonly adjacencies: readonly Readonly<{
    id: string;
    fromStateId: string;
    toStateId: string;
    instruction?: string | undefined;
  }>[];
  readonly operations: readonly Readonly<{
    operationId: string;
    summary: string;
    source:
      | "canonical-operation"
      | "equation-extension"
      | "both-sides-operation"
      | "governed-operation";
    familyId: string;
    roleIds: readonly string[];
    governedRequirements?: Readonly<{
      authoringAuthorityId: string;
      operationPin: Readonly<{ packId: string; version: string }>;
      requiredEvidenceIds: readonly string[];
    }> | undefined;
  }>[];
}

export interface KpEquationSeriesNaturalLanguagePlannerPort {
  readonly id: string;
  readonly propose: (prompt: KpEquationSeriesPlannerPrompt) => Promise<unknown>;
}

export interface KpEquationSeriesPlannerDiagnostic {
  readonly code:
    | "equation-series.planner.record.type"
    | "equation-series.planner.record.schema"
    | "equation-series.planner.field.unknown"
    | "equation-series.planner.field.forbidden"
    | "equation-series.planner.request.mismatch"
    | "equation-series.planner.id.invalid"
    | "equation-series.planner.status.invalid"
    | "equation-series.planner.unsupported.invalid"
    | "equation-series.planner.proposal.invalid"
    | "equation-series.planner.adjacency.coverage"
    | "equation-series.planner.operation.unknown"
    | "equation-series.planner.operation.normalization.invalid"
    | "equation-series.planner.port.error";
  readonly path: string;
  readonly message: string;
  readonly repair: string;
}

export interface KpEquationSeriesPlannerRecord {
  readonly schemaVersion: "kp.equation-series-planner-record.v1";
  readonly kind: "equation-series-planner-record";
  readonly requestId: string;
  readonly plannerId: string;
  readonly status: "proposed";
  readonly proposals: readonly KpEquationSeriesIntentProposal[];
  readonly operationNormalizations:
    readonly KpEquationSeriesPlannerOperationNormalization[];
  readonly diagnostics: readonly [];
}

export interface KpEquationSeriesPlannerUnsupportedRecord {
  readonly schemaVersion: "kp.equation-series-planner-record.v1";
  readonly kind: "equation-series-planner-record";
  readonly requestId: string;
  readonly plannerId: string;
  readonly status: "unsupported";
  readonly reason: string;
  readonly unsupportedAdjacencyIds: readonly string[];
  readonly diagnostics: readonly [];
}

export interface KpEquationSeriesPlannerOperationNormalization {
  readonly operationLocation: string;
  readonly requestedOperationId: string;
  readonly canonicalOperationId: string;
  readonly resolution: "canonical" | "alias";
}

export type KpEquationSeriesPlannerRecordResult =
  | Readonly<{
      status: "proposed";
      record: KpEquationSeriesPlannerRecord;
      diagnostics: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      diagnostics: readonly KpEquationSeriesPlannerDiagnostic[];
    }>
  | Readonly<{
      status: "unsupported";
      record: KpEquationSeriesPlannerUnsupportedRecord;
      diagnostics: readonly [];
    }>;

const protocolId = /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/u;
const forbiddenField = /^(?:css|className|computedStyle|coordinates?|durationMs|delayMs|easing|font|geometry|html|keyframes?|lawId|mathAuthority|motifId|motionPath|opacity|paint|path|pixels?|recipeId|renderer|renderTarget|rotate|scale|semanticArguments|styles?|timing|timingTable|trajectory|transform|translate|truth|typography|x|y|z|latex)$/i;

export function createKpEquationSeriesPlannerPrompt(input: {
  readonly request: KpEquationTransformSeriesRequest;
  readonly naturalLanguageIntent: string;
}): KpEquationSeriesPlannerPrompt {
  return deepFreeze({
    schemaVersion: "kp.equation-series-planner-prompt.v1" as const,
    kind: "equation-series-planner-prompt" as const,
    requestId: input.request.id,
    naturalLanguageIntent: input.naturalLanguageIntent,
    authorityRule:
      "models-propose-operations-kp-verifies-math-presentation-and-motion" as const,
    states: input.request.states.map(({ id, latex, narration }) => ({
      id,
      latex,
      ...(narration === undefined ? {} : { narration })
    })),
    adjacencies: input.request.adjacencies.flatMap((adjacency) =>
      adjacency.intent.mode === "proposed"
        ? [{
            id: adjacency.id,
            fromStateId: adjacency.fromStateId,
            toStateId: adjacency.toStateId,
            ...(adjacency.intent.instruction === undefined
              ? {}
              : { instruction: adjacency.intent.instruction })
          }]
        : []
    ),
    operations: kpEquationSeriesOperationRegistry.plannerIds.map(
      (operationId) => kpEquationSeriesOperationRegistry.plannerById[
        operationId
      ]!
    ).map(
      ({ operationId, plannerExposure, source, familyId, roleIds, governed }) => ({
        operationId,
        summary: plannerExposure.kind === "exposed"
          ? plannerExposure.summary
          : unreachablePlannerAlias(operationId),
        source,
        familyId,
        roleIds,
        ...(governed === undefined ? {} : {
          governedRequirements: {
            authoringAuthorityId: governed.authoringAuthorityId,
            operationPin: { ...governed.operationPin },
            requiredEvidenceIds: [...governed.requiredEvidenceIds]
          }
        })
      })
    )
  });
}

function unreachablePlannerAlias(operationId: string): never {
  throw new Error(
    `Planner projection selected alias declaration ${operationId}.`
  );
}

export async function runKpEquationSeriesNaturalLanguagePlanner(input: {
  readonly request: KpEquationTransformSeriesRequest;
  readonly naturalLanguageIntent: string;
  readonly port: KpEquationSeriesNaturalLanguagePlannerPort;
}): Promise<KpEquationSeriesPlannerRecordResult> {
  let candidate: unknown;
  try {
    candidate = await input.port.propose(createKpEquationSeriesPlannerPrompt({
      request: input.request,
      naturalLanguageIntent: input.naturalLanguageIntent
    }));
  } catch (error) {
    return repair([diagnostic(
      "equation-series.planner.port.error",
      "$",
      `Planner port ${input.port.id} failed: ${errorMessage(error)}.`,
      "Retry the port or provide an explicit semantic operation intent."
    )]);
  }
  return validateKpEquationSeriesPlannerRecord(
    candidate,
    input.request,
    input.port.id
  );
}

export function validateKpEquationSeriesPlannerRecord(
  value: unknown,
  request: KpEquationTransformSeriesRequest,
  expectedPlannerId?: string | undefined
): KpEquationSeriesPlannerRecordResult {
  const diagnostics: KpEquationSeriesPlannerDiagnostic[] = [];
  if (!isRecord(value)) return repair([diagnostic(
    "equation-series.planner.record.type",
    "$",
    "Planner output must be one versioned proposal record.",
    "Return a JSON object matching kp.equation-series-planner-record.v1."
  )]);
  const proposedFields = [
    "schemaVersion",
    "kind",
    "requestId",
    "plannerId",
    "status",
    "proposals",
    "operationNormalizations",
    "diagnostics"
  ];
  const unsupportedFields = [
    "schemaVersion",
    "kind",
    "requestId",
    "plannerId",
    "status",
    "reason",
    "unsupportedAdjacencyIds",
    "diagnostics"
  ];
  rejectUnknown(
    value,
    value["status"] === "unsupported"
      ? unsupportedFields
      : proposedFields,
    "$",
    diagnostics
  );
  rejectForbidden(value, "$", diagnostics);
  if (
    value["schemaVersion"] !== "kp.equation-series-planner-record.v1" ||
    value["kind"] !== "equation-series-planner-record"
  ) diagnostics.push(diagnostic(
    "equation-series.planner.record.schema",
    "$",
    "Planner record schema and kind are invalid.",
    "Use kp.equation-series-planner-record.v1."
  ));
  if (value["requestId"] !== request.id) diagnostics.push(diagnostic(
    "equation-series.planner.request.mismatch",
    "$.requestId",
    "Planner output does not belong to the requested series.",
    `Use requestId ${request.id}.`
  ));
  if (
    !validId(value["plannerId"]) ||
    (expectedPlannerId !== undefined && value["plannerId"] !== expectedPlannerId)
  ) diagnostics.push(diagnostic(
    "equation-series.planner.id.invalid",
    "$.plannerId",
    "Planner identity is missing, invalid, or does not match the invoked port.",
    expectedPlannerId === undefined
      ? "Provide a stable planner protocol ID."
      : `Use the invoked port ID ${expectedPlannerId}.`
  ));
  if (value["status"] !== "proposed" && value["status"] !== "unsupported") {
    diagnostics.push(diagnostic(
    "equation-series.planner.status.invalid",
    "$.status",
    "A planner record must propose semantic operations or explicitly abstain.",
    "Use proposed or unsupported; KP alone creates repair-required results."
    ));
  }
  if (!Array.isArray(value["diagnostics"]) || value["diagnostics"].length > 0) {
    diagnostics.push(diagnostic(
      "equation-series.planner.status.invalid",
      "$.diagnostics",
      "Accepted proposal records cannot author their own diagnostics.",
      "Return an empty diagnostics array; KP owns validation diagnostics."
    ));
  }

  if (value["status"] === "unsupported") {
    return validateUnsupportedPlannerRecord(
      value,
      request,
      diagnostics
    );
  }

  const rawProposals = Array.isArray(value["proposals"])
    ? value["proposals"]
    : [];
  if (!Array.isArray(value["proposals"])) diagnostics.push(diagnostic(
    "equation-series.planner.proposal.invalid",
    "$.proposals",
    "Planner proposals must be an ordered array.",
    "Return one proposal for every proposed adjacency."
  ));
  const operationNormalizations:
    KpEquationSeriesPlannerOperationNormalization[] = [];
  const proposals = rawProposals.map((proposal, index) => parseProposal(
    proposal,
    `$.proposals[${index}]`,
    diagnostics,
    operationNormalizations
  )).filter((proposal): proposal is KpEquationSeriesIntentProposal =>
    proposal !== undefined
  );
  validateOperationNormalizations(
    value["operationNormalizations"],
    operationNormalizations,
    diagnostics
  );
  validateCoverage(proposals, request, diagnostics);

  if (diagnostics.length > 0) return repair(diagnostics);
  return deepFreeze({
    status: "proposed" as const,
    record: {
      schemaVersion: "kp.equation-series-planner-record.v1" as const,
      kind: "equation-series-planner-record" as const,
      requestId: request.id,
      plannerId: value["plannerId"] as string,
      status: "proposed" as const,
      proposals,
      operationNormalizations,
      diagnostics: [] as []
    },
    diagnostics: [] as []
  });
}

function validateUnsupportedPlannerRecord(
  value: Record<string, unknown>,
  request: KpEquationTransformSeriesRequest,
  diagnostics: KpEquationSeriesPlannerDiagnostic[]
): KpEquationSeriesPlannerRecordResult {
  const expectedAdjacencyIds = request.adjacencies.filter(({ intent }) =>
    intent.mode === "proposed"
  ).map(({ id }) => id);
  const reason = value["reason"];
  const unsupportedAdjacencyIds = value["unsupportedAdjacencyIds"];
  if (typeof reason !== "string" || reason.trim().length === 0) {
    diagnostics.push(diagnostic(
      "equation-series.planner.unsupported.invalid",
      "$.reason",
      "Unsupported results require a concise reason.",
      "Explain which requested semantic transformation is not represented."
    ));
  }
  if (
    !Array.isArray(unsupportedAdjacencyIds) ||
    unsupportedAdjacencyIds.length !== expectedAdjacencyIds.length ||
    unsupportedAdjacencyIds.some((id, index) =>
      id !== expectedAdjacencyIds[index]
    )
  ) diagnostics.push(diagnostic(
    "equation-series.planner.unsupported.invalid",
    "$.unsupportedAdjacencyIds",
    "Unsupported results must identify every proposed adjacency in order.",
    `Use: ${expectedAdjacencyIds.join(", ") || "no proposed adjacencies"}.`
  ));
  if (diagnostics.length > 0) return repair(diagnostics);
  return deepFreeze({
    status: "unsupported" as const,
    record: {
      schemaVersion: "kp.equation-series-planner-record.v1" as const,
      kind: "equation-series-planner-record" as const,
      requestId: request.id,
      plannerId: value["plannerId"] as string,
      status: "unsupported" as const,
      reason: reason as string,
      unsupportedAdjacencyIds: [
        ...(unsupportedAdjacencyIds as string[])
      ],
      diagnostics: [] as []
    },
    diagnostics: [] as []
  });
}

function parseProposal(
  value: unknown,
  path: string,
  diagnostics: KpEquationSeriesPlannerDiagnostic[],
  operationNormalizations: KpEquationSeriesPlannerOperationNormalization[]
): KpEquationSeriesIntentProposal | undefined {
  if (!isRecord(value)) {
    diagnostics.push(diagnostic(
      "equation-series.planner.proposal.invalid",
      path,
      "Each proposal must be an object.",
      "Provide an adjacency ID, proposal kind, and registered operation ID."
    ));
    return undefined;
  }
  const kind = value["kind"];
  const allowed = kind === "single"
    ? ["adjacencyId", "kind", "operationId"]
    : ["adjacencyId", "kind", "operationIds"];
  rejectUnknown(value, allowed, path, diagnostics);
  if (!validId(value["adjacencyId"])) return invalidProposal(path, diagnostics);
  if (kind === "single") {
    const operationId = canonicalOperationId(
      value["operationId"],
      `${path}.operationId`,
      diagnostics,
      operationNormalizations
    );
    if (operationId === undefined) return undefined;
    return Object.freeze({
      adjacencyId: value["adjacencyId"] as string,
      kind,
      operationId
    });
  }
  if (kind !== "sequence" && kind !== "alternatives") {
    return invalidProposal(path, diagnostics);
  }
  const requestedOperationIds = Array.isArray(value["operationIds"])
    ? value["operationIds"]
    : [];
  if (requestedOperationIds.length < 2) {
    diagnostics.push(diagnostic(
      "equation-series.planner.operation.unknown",
      `${path}.operationIds`,
      "Sequence and alternative proposals require at least two registered operations.",
      "Choose registered operation IDs from the supplied prompt catalogue."
    ));
    return undefined;
  }
  const operationIds = requestedOperationIds.map((operationId, index) =>
    canonicalOperationId(
      operationId,
      `${path}.operationIds[${index}]`,
      diagnostics,
      operationNormalizations
    )
  );
  if (operationIds.some((operationId) => operationId === undefined)) {
    return undefined;
  }
  return Object.freeze({
    adjacencyId: value["adjacencyId"] as string,
    kind,
    operationIds: Object.freeze([...operationIds]) as
      readonly [string, string, ...string[]]
  });
}

function canonicalOperationId(
  value: unknown,
  path: string,
  diagnostics: KpEquationSeriesPlannerDiagnostic[],
  operationNormalizations: KpEquationSeriesPlannerOperationNormalization[]
): string | undefined {
  if (typeof value !== "string") {
    diagnostics.push(unknownOperationDiagnostic(path, value));
    return undefined;
  }
  const normalization = normalizeKpEquationSeriesOperationId({
    operationId: value
  });
  if (normalization.status === "unknown") {
    diagnostics.push(unknownOperationDiagnostic(path, value));
    return undefined;
  }
  operationNormalizations.push(Object.freeze({
    operationLocation: path,
    requestedOperationId: normalization.requestedOperationId,
    canonicalOperationId: normalization.canonicalOperationId,
    resolution: normalization.status
  }));
  return normalization.canonicalOperationId;
}

function unknownOperationDiagnostic(
  path: string,
  value: unknown
): KpEquationSeriesPlannerDiagnostic {
  return diagnostic(
    "equation-series.planner.operation.unknown",
    path,
    `No canonical operation or registered alias owns ${String(value)}.`,
    "Choose a canonical operation ID from the supplied prompt catalogue."
  );
}

function validateOperationNormalizations(
  value: unknown,
  expected: readonly KpEquationSeriesPlannerOperationNormalization[],
  diagnostics: KpEquationSeriesPlannerDiagnostic[]
): void {
  if (value === undefined) return;
  const valid = Array.isArray(value) && value.length === expected.length &&
    value.every((candidate, index) => {
      if (!isRecord(candidate)) return false;
      const expectedEntry = expected[index];
      if (
        expectedEntry === undefined ||
        candidate["operationLocation"] !== expectedEntry.operationLocation ||
        candidate["canonicalOperationId"] !==
          expectedEntry.canonicalOperationId ||
        typeof candidate["requestedOperationId"] !== "string"
      ) return false;
      const normalization = normalizeKpEquationSeriesOperationId({
        operationId: candidate["requestedOperationId"]
      });
      return normalization.status !== "unknown" &&
        normalization.status === candidate["resolution"] &&
        normalization.canonicalOperationId ===
          candidate["canonicalOperationId"];
    });
  if (valid) return;
  diagnostics.push(diagnostic(
    "equation-series.planner.operation.normalization.invalid",
    "$.operationNormalizations",
    "Operation normalization provenance does not match KP's alias registry.",
    "Omit operationNormalizations or return the exact KP-validated provenance."
  ));
}

function validateCoverage(
  proposals: readonly KpEquationSeriesIntentProposal[],
  request: KpEquationTransformSeriesRequest,
  diagnostics: KpEquationSeriesPlannerDiagnostic[]
): void {
  const expected = request.adjacencies.filter(({ intent }) =>
    intent.mode === "proposed"
  ).map(({ id }) => id);
  const actual = proposals.map(({ adjacencyId }) => adjacencyId);
  if (
    actual.length !== expected.length ||
    actual.some((id, index) => id !== expected[index])
  ) diagnostics.push(diagnostic(
    "equation-series.planner.adjacency.coverage",
    "$.proposals",
    "Planner proposals must cover every proposed adjacency exactly once and in order.",
    `Provide proposals for: ${expected.join(", ") || "none"}.`
  ));
}

function rejectUnknown(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  diagnostics: KpEquationSeriesPlannerDiagnostic[]
): void {
  Object.keys(value).filter((key) => !allowed.includes(key)).forEach((key) => {
    diagnostics.push(diagnostic(
      "equation-series.planner.field.unknown",
      `${path}.${key}`,
      `Unknown planner field ${key}.`,
      "Remove fields outside the versioned planner record."
    ));
  });
}

function rejectForbidden(
  value: unknown,
  path: string,
  diagnostics: KpEquationSeriesPlannerDiagnostic[]
): void {
  if (Array.isArray(value)) {
    value.forEach((child, index) => rejectForbidden(
      child,
      `${path}[${index}]`,
      diagnostics
    ));
    return;
  }
  if (!isRecord(value)) return;
  Object.entries(value).forEach(([key, child]) => {
    if (forbiddenField.test(key)) diagnostics.push(diagnostic(
      "equation-series.planner.field.forbidden",
      `${path}.${key}`,
      `Planner output cannot author ${key}.`,
      "Return only semantic operation proposals; KP owns truth and presentation."
    ));
    rejectForbidden(child, `${path}.${key}`, diagnostics);
  });
}

function invalidProposal(
  path: string,
  diagnostics: KpEquationSeriesPlannerDiagnostic[]
): undefined {
  diagnostics.push(diagnostic(
    "equation-series.planner.proposal.invalid",
    path,
    "Proposal shape or identity is invalid.",
    "Use single, sequence, or alternatives with stable semantic IDs."
  ));
  return undefined;
}

function validId(value: unknown): value is string {
  return typeof value === "string" && protocolId.test(value);
}

function diagnostic(
  code: KpEquationSeriesPlannerDiagnostic["code"],
  path: string,
  message: string,
  repair: string
): KpEquationSeriesPlannerDiagnostic {
  return Object.freeze({ code, path, message, repair });
}

function repair(
  diagnostics: readonly KpEquationSeriesPlannerDiagnostic[]
): KpEquationSeriesPlannerRecordResult {
  return deepFreeze({
    status: "repair-required" as const,
    diagnostics: [...diagnostics]
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
