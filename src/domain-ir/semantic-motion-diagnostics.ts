import {
  createKpSemanticMotionCompilerRequestV1,
  kpSemanticMotionCompilerRequestSchemaVersion,
  type KpSemanticMotionCompilerIssueV1,
  type KpSemanticMotionCompilerRequestV1,
  type KpSemanticMotionRepairTargetV1
} from "./semantic-motion-compiler-contract.ts";

export const kpSemanticMotionCompilerTraceSchemaVersion =
  "kp.semantic-motion-compiler-trace.v1" as const;
export const kpSemanticMotionRepairPlanSchemaVersion =
  "kp.semantic-motion-repair-plan.v1" as const;
export const kpSemanticMotionCompilerRequestLegacySchemaVersion =
  "kp.semantic-motion-compiler-request.v0" as const;
export const kpSemanticMotionCompilerRequestMigrationPatchSchemaVersion =
  "kp.semantic-motion-compiler-request-migration-patch.v1" as const;
export const kpSemanticMotionCompilerRequestMigrationResultSchemaVersion =
  "kp.semantic-motion-compiler-request-migration-result.v1" as const;

export const kpSemanticMotionCompilerPhaseValues = Object.freeze([
  "request",
  "endpoint-frontier",
  "correspondence-provenance",
  "lifecycle-ownership",
  "role-cohort",
  "semantic-precedence",
  "recipe-resolution",
  "choreography"
] as const);

export type KpSemanticMotionCompilerPhase =
  typeof kpSemanticMotionCompilerPhaseValues[number];

export interface KpSemanticMotionCompilerTraceStepInputV1 {
  readonly phase: KpSemanticMotionCompilerPhase;
  readonly status: "passed" | "failed";
  readonly issues?: readonly KpSemanticMotionCompilerIssueV1[] | undefined;
  readonly repairTargets?: readonly KpSemanticMotionRepairTargetV1[] | undefined;
}

export interface KpSemanticMotionCompilerTraceStepV1 {
  readonly phase: KpSemanticMotionCompilerPhase;
  readonly status: "passed" | "failed" | "deferred";
  readonly issueCodes:
    readonly KpSemanticMotionCompilerIssueV1["code"][];
  readonly repairTargets: readonly KpSemanticMotionRepairTargetV1[];
}

export interface KpSemanticMotionCompilerTraceV1 {
  readonly schemaVersion: typeof kpSemanticMotionCompilerTraceSchemaVersion;
  readonly requestId: string;
  readonly steps: readonly KpSemanticMotionCompilerTraceStepV1[];
  readonly terminalStatus: "ready" | "repair-required" | "incomplete";
}

export class KpSemanticMotionCompilerTraceError extends Error {
  override readonly name = "KpSemanticMotionCompilerTraceError";
}

export function createKpSemanticMotionCompilerTraceV1(input: {
  readonly requestId: string;
  readonly steps: readonly KpSemanticMotionCompilerTraceStepInputV1[];
}): KpSemanticMotionCompilerTraceV1 {
  if (input.requestId.trim().length === 0) {
    throw new KpSemanticMotionCompilerTraceError(
      "Compiler trace requires a stable request id."
    );
  }
  let failed = false;
  input.steps.forEach((step, index) => {
    if (step.phase !== kpSemanticMotionCompilerPhaseValues[index]) {
      throw new KpSemanticMotionCompilerTraceError(
        "Compiler trace steps must be an exact phase prefix."
      );
    }
    if (failed) {
      throw new KpSemanticMotionCompilerTraceError(
        "Compiler trace cannot execute a phase after a failed phase."
      );
    }
    const issues = step.issues ?? [];
    const targets = step.repairTargets ?? [];
    if (step.status === "passed" &&
        (issues.length > 0 || targets.length > 0)) {
      throw new KpSemanticMotionCompilerTraceError(
        "A passed compiler phase cannot carry issues or repair targets."
      );
    }
    if (step.status === "failed" && issues.length === 0) {
      throw new KpSemanticMotionCompilerTraceError(
        "A failed compiler phase requires at least one typed issue."
      );
    }
    failed = step.status === "failed";
  });

  const completed = input.steps.map((step) => traceStep({
    phase: step.phase,
    status: step.status,
    issueCodes: uniqueSorted((step.issues ?? []).map(({ code }) => code)),
    repairTargets: sortedTargets(step.repairTargets ?? [])
  }));
  const deferred = kpSemanticMotionCompilerPhaseValues
    .slice(input.steps.length)
    .map((phase) => traceStep({
      phase,
      status: "deferred",
      issueCodes: [],
      repairTargets: []
    }));
  return Object.freeze({
    schemaVersion: kpSemanticMotionCompilerTraceSchemaVersion,
    requestId: input.requestId,
    steps: Object.freeze([...completed, ...deferred]),
    terminalStatus: failed
      ? "repair-required" as const
      : input.steps.length === kpSemanticMotionCompilerPhaseValues.length
        ? "ready" as const
        : "incomplete" as const
  });
}

export interface KpSemanticMotionRepairActionV1 {
  readonly target: KpSemanticMotionRepairTargetV1;
  readonly audiences: readonly ["human", "governed-draft"];
  readonly patchAuthority: "semantic-document-only";
  readonly allowedRoots: readonly string[];
  readonly issueCodes:
    readonly KpSemanticMotionCompilerIssueV1["code"][];
}

export interface KpSemanticMotionRepairPlanV1 {
  readonly schemaVersion: typeof kpSemanticMotionRepairPlanSchemaVersion;
  readonly requestId: string;
  readonly actions: readonly KpSemanticMotionRepairActionV1[];
}

export function createKpSemanticMotionRepairPlanV1(input: {
  readonly requestId: string;
  readonly issues: readonly KpSemanticMotionCompilerIssueV1[];
  readonly repairTargets: readonly KpSemanticMotionRepairTargetV1[];
}): KpSemanticMotionRepairPlanV1 {
  const issueCodes = uniqueSorted(input.issues.map(({ code }) => code));
  return Object.freeze({
    schemaVersion: kpSemanticMotionRepairPlanSchemaVersion,
    requestId: input.requestId,
    actions: Object.freeze(sortedTargets(input.repairTargets).map((target) =>
      Object.freeze({
        target,
        audiences: Object.freeze([
          "human",
          "governed-draft"
        ]) as readonly ["human", "governed-draft"],
        patchAuthority: "semantic-document-only" as const,
        allowedRoots: allowedRoots(target.kind),
        issueCodes
      })
    ))
  });
}

export type KpSemanticMotionCompilerRequestLegacyV0 = Readonly<
  Omit<KpSemanticMotionCompilerRequestV1, "schemaVersion" | "teachingIntent"> & {
    readonly schemaVersion:
      typeof kpSemanticMotionCompilerRequestLegacySchemaVersion;
    readonly teachingIntent: {
      readonly focusEntityIds: readonly string[];
      readonly summary: string;
    };
  }
>;

export interface KpSemanticMotionCompilerRequestMigrationPatchV1 {
  readonly schemaVersion:
    typeof kpSemanticMotionCompilerRequestMigrationPatchSchemaVersion;
  readonly id: string;
  readonly fromSchemaVersion:
    typeof kpSemanticMotionCompilerRequestLegacySchemaVersion;
  readonly toSchemaVersion:
    typeof kpSemanticMotionCompilerRequestSchemaVersion;
  readonly requestId: string;
  readonly operation: {
    readonly kind: "complete-teaching-intent";
    readonly teachingKind: "notice" | "compare" | "transmit" | "cause";
    readonly secondaryEntityIds: readonly string[];
  };
}

export type KpSemanticMotionCompilerRequestMigrationResultV1 =
  | {
      readonly schemaVersion:
        typeof kpSemanticMotionCompilerRequestMigrationResultSchemaVersion;
      readonly status: "current";
      readonly request: KpSemanticMotionCompilerRequestV1;
    }
  | {
      readonly schemaVersion:
        typeof kpSemanticMotionCompilerRequestMigrationResultSchemaVersion;
      readonly status: "migrated";
      readonly migrationId: string;
      readonly request: KpSemanticMotionCompilerRequestV1;
    }
  | {
      readonly schemaVersion:
        typeof kpSemanticMotionCompilerRequestMigrationResultSchemaVersion;
      readonly status: "rejected";
      readonly issue: KpSemanticMotionCompilerIssueV1;
      readonly repairTarget: KpSemanticMotionRepairTargetV1;
    };

export function migrateKpSemanticMotionCompilerRequestV1(input: {
  readonly document: unknown;
  readonly patch?: unknown;
}): KpSemanticMotionCompilerRequestMigrationResultV1 {
  if (!isRecord(input.document) ||
      typeof input.document.schemaVersion !== "string") {
    return rejectedMigration(
      "semantic-motion.schema.invalid-document",
      "$.schemaVersion",
      "Semantic-motion request documents require an explicit schema version."
    );
  }
  if (input.document.schemaVersion ===
      kpSemanticMotionCompilerRequestSchemaVersion) {
    if (input.patch !== undefined) {
      return rejectedMigration(
        "semantic-motion.schema.invalid-patch",
        "$.patch",
        "A current request cannot accept a compatibility patch."
      );
    }
    if (!isRequestV1Document(input.document)) {
      return rejectedMigration(
        "semantic-motion.schema.invalid-document",
        "$",
        "The v1 semantic-motion request does not satisfy its schema."
      );
    }
    return Object.freeze({
      schemaVersion:
        kpSemanticMotionCompilerRequestMigrationResultSchemaVersion,
      status: "current" as const,
      request: createKpSemanticMotionCompilerRequestV1(input.document)
    });
  }
  if (input.document.schemaVersion !==
      kpSemanticMotionCompilerRequestLegacySchemaVersion) {
    return rejectedMigration(
      "semantic-motion.schema.unknown-version",
      "$.schemaVersion",
      `Unsupported semantic-motion request schema ${input.document.schemaVersion}.`
    );
  }
  if (!isLegacyRequestV0Document(input.document)) {
    return rejectedMigration(
      "semantic-motion.schema.invalid-document",
      "$",
      "The v0 semantic-motion request does not satisfy its schema."
    );
  }
  if (input.patch === undefined) {
    return rejectedMigration(
      "semantic-motion.schema.missing-patch",
      "$.patch",
      "Migrating v0 teaching intent requires an explicit completion patch."
    );
  }
  if (!isMigrationPatch(input.patch, input.document.id)) {
    return rejectedMigration(
      "semantic-motion.schema.invalid-patch",
      "$.patch",
      "The migration patch does not exactly match this v0 request."
    );
  }
  const { teachingIntent: legacyTeaching, ...legacy } = input.document;
  const request = createKpSemanticMotionCompilerRequestV1({
    ...legacy,
    schemaVersion: kpSemanticMotionCompilerRequestSchemaVersion,
    teachingIntent: {
      kind: input.patch.operation.teachingKind,
      primaryEntityIds: legacyTeaching.focusEntityIds,
      secondaryEntityIds: input.patch.operation.secondaryEntityIds,
      summary: legacyTeaching.summary
    }
  });
  return Object.freeze({
    schemaVersion: kpSemanticMotionCompilerRequestMigrationResultSchemaVersion,
    status: "migrated" as const,
    migrationId: input.patch.id,
    request
  });
}

function rejectedMigration(
  code: Extract<KpSemanticMotionCompilerIssueV1["code"],
    `semantic-motion.schema.${string}`>,
  path: string,
  message: string
): KpSemanticMotionCompilerRequestMigrationResultV1 {
  return Object.freeze({
    schemaVersion: kpSemanticMotionCompilerRequestMigrationResultSchemaVersion,
    status: "rejected" as const,
    issue: Object.freeze({ code, path, message }),
    repairTarget: Object.freeze({
      kind: "schema-document" as const,
      targetId: path
    })
  });
}

function isRequestV1Document(
  value: unknown
): value is KpSemanticMotionCompilerRequestV1 {
  return isRecord(value) && isCommonRequestDocument(value) &&
    isTeachingIntentV1(value.teachingIntent);
}

function isLegacyRequestV0Document(
  value: unknown
): value is KpSemanticMotionCompilerRequestLegacyV0 {
  return isRecord(value) && isCommonRequestDocument(value) &&
    isRecord(value.teachingIntent) &&
    stringArray(value.teachingIntent.focusEntityIds) &&
    typeof value.teachingIntent.summary === "string";
}

function isCommonRequestDocument(value: KpUnknownRecord): boolean {
  return typeof value.id === "string" && typeof value.assetId === "string" &&
    isSemanticSource(value.semanticSource) && isState(value.sourceState) &&
    isState(value.targetState) && isOperation(value.operation) &&
    isFrontier(value.rewriteFrontier);
}

function isSemanticSource(value: unknown): boolean {
  return isRecord(value) && typeof value.sourceId === "string" &&
    typeof value.revisionId === "string" &&
    Array.isArray(value.operationPacks) && value.operationPacks.every((pin) =>
      isRecord(pin) && typeof pin.packId === "string" &&
      typeof pin.version === "string");
}

function isState(value: unknown): boolean {
  return isRecord(value) && typeof value.id === "string" &&
    stringArray(value.objectIds) && stringArray(value.entityIds);
}

function isOperation(value: unknown): boolean {
  if (!isRecord(value) || typeof value.stepId !== "string" ||
      typeof value.transformationId !== "string" ||
      typeof value.operationId !== "string" ||
      !isRecord(value.roleBindings) ||
      !Object.values(value.roleBindings).every(stringArray) ||
      !isRecord(value.correspondenceMap) ||
      typeof value.correspondenceMap.id !== "string" ||
      !Array.isArray(value.correspondenceMap.records)) return false;
  return value.correspondenceMap.records.every((record) =>
    isRecord(record) && typeof record.id === "string" &&
    typeof record.relation === "string" &&
    stringArray(record.sourceSelectorIds) &&
    stringArray(record.targetSelectorIds) && typeof record.summary === "string");
}

function isFrontier(value: unknown): boolean {
  return isRecord(value) && stringArray(value.sourceEntityIds) &&
    stringArray(value.targetEntityIds) && stringArray(value.contextEntityIds);
}

function isTeachingIntentV1(value: unknown): boolean {
  return isRecord(value) &&
    ["notice", "compare", "transmit", "cause"].includes(
      String(value.kind)
    ) && stringArray(value.primaryEntityIds) &&
    stringArray(value.secondaryEntityIds) && typeof value.summary === "string";
}

function isMigrationPatch(
  value: unknown,
  requestId: string
): value is KpSemanticMotionCompilerRequestMigrationPatchV1 {
  return isRecord(value) && exactKeys(value, [
    "schemaVersion",
    "id",
    "fromSchemaVersion",
    "toSchemaVersion",
    "requestId",
    "operation"
  ]) && value.schemaVersion ===
    kpSemanticMotionCompilerRequestMigrationPatchSchemaVersion &&
    typeof value.id === "string" && value.fromSchemaVersion ===
    kpSemanticMotionCompilerRequestLegacySchemaVersion &&
    value.toSchemaVersion === kpSemanticMotionCompilerRequestSchemaVersion &&
    value.requestId === requestId && isRecord(value.operation) &&
    exactKeys(value.operation, [
      "kind",
      "teachingKind",
      "secondaryEntityIds"
    ]) && value.operation.kind === "complete-teaching-intent" &&
    ["notice", "compare", "transmit", "cause"].includes(
      String(value.operation.teachingKind)
    ) && stringArray(value.operation.secondaryEntityIds);
}

function traceStep(
  value: KpSemanticMotionCompilerTraceStepV1
): KpSemanticMotionCompilerTraceStepV1 {
  return Object.freeze({
    ...value,
    issueCodes: Object.freeze([...value.issueCodes]),
    repairTargets: Object.freeze(value.repairTargets.map((target) =>
      Object.freeze({ ...target })
    ))
  });
}

function sortedTargets(
  values: readonly KpSemanticMotionRepairTargetV1[]
): readonly KpSemanticMotionRepairTargetV1[] {
  return Object.freeze([...values]
    .sort((left, right) =>
      left.kind.localeCompare(right.kind) ||
      left.targetId.localeCompare(right.targetId))
    .map((target) => Object.freeze({ ...target })));
}

function allowedRoots(
  kind: KpSemanticMotionRepairTargetV1["kind"]
): readonly string[] {
  switch (kind) {
    case "semantic-state":
      return Object.freeze([
        "$.assetId",
        "$.semanticSource",
        "$.sourceState",
        "$.targetState"
      ]);
    case "operation-binding":
      return Object.freeze(["$.operation"]);
    case "correspondence":
      return Object.freeze(["$.operation.correspondenceMap"]);
    case "rewrite-frontier":
      return Object.freeze(["$.rewriteFrontier"]);
    case "teaching-intent":
      return Object.freeze(["$.teachingIntent"]);
    case "schema-document":
      return Object.freeze(["$.schemaVersion"]);
  }
}

function uniqueSorted<T extends string>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)].sort());
}

interface KpUnknownRecord {
  readonly [key: string]: unknown;
  readonly schemaVersion?: unknown;
  readonly id?: unknown;
  readonly assetId?: unknown;
  readonly semanticSource?: unknown;
  readonly sourceState?: unknown;
  readonly targetState?: unknown;
  readonly operation?: unknown;
  readonly rewriteFrontier?: unknown;
  readonly teachingIntent?: unknown;
  readonly sourceId?: unknown;
  readonly revisionId?: unknown;
  readonly operationPacks?: unknown;
  readonly packId?: unknown;
  readonly version?: unknown;
  readonly objectIds?: unknown;
  readonly entityIds?: unknown;
  readonly stepId?: unknown;
  readonly transformationId?: unknown;
  readonly operationId?: unknown;
  readonly roleBindings?: unknown;
  readonly correspondenceMap?: unknown;
  readonly records?: unknown;
  readonly relation?: unknown;
  readonly sourceSelectorIds?: unknown;
  readonly targetSelectorIds?: unknown;
  readonly summary?: unknown;
  readonly sourceEntityIds?: unknown;
  readonly targetEntityIds?: unknown;
  readonly contextEntityIds?: unknown;
  readonly kind?: unknown;
  readonly primaryEntityIds?: unknown;
  readonly secondaryEntityIds?: unknown;
  readonly focusEntityIds?: unknown;
  readonly fromSchemaVersion?: unknown;
  readonly toSchemaVersion?: unknown;
  readonly requestId?: unknown;
  readonly teachingKind?: unknown;
}

function isRecord(value: unknown): value is KpUnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) =>
    typeof entry === "string");
}

function exactKeys(
  value: KpUnknownRecord,
  expected: readonly string[]
): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length && actual.every((key, index) =>
    key === sortedExpected[index]);
}
