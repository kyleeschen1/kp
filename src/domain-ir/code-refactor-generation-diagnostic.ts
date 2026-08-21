import type {
  KpCodeRefactorGenerationResult,
  KpCodeRefactorLanguage
} from "./code-refactor-generation-request.ts";

export const KP_CODE_REFACTOR_GENERATION_DIAGNOSTIC_SCHEMA =
  "kp.code-refactor-generation-diagnostic.v1" as const;

export const kpCodeRefactorGenerationDiagnosticDefinitions = Object.freeze({
  "code-refactor.parse-rejected": definition(
    "parse",
    "fix-syntax",
    "The language parser rejected one source revision."
  ),
  "code-refactor.unsupported-operation": definition(
    "recognize",
    "choose-supported-operation",
    "The requested edit is outside the bounded extract-helper operation."
  ),
  "code-refactor.non-equivalent-duplicates": definition(
    "legality",
    "make-duplicates-equivalent",
    "The candidate contributors do not encode the same decision."
  ),
  "code-refactor.unsafe-capture": definition(
    "legality",
    "move-or-rename-binding",
    "Extraction would capture or lose a required binding."
  ),
  "code-refactor.ambiguous-ownership": definition(
    "bind",
    "disambiguate-owner",
    "The frontend cannot prove one semantic owner for a required role."
  ),
  "code-refactor.unsupported-source-shape": definition(
    "recognize",
    "simplify-source-shape",
    "The source is valid but does not match the bounded causal shape."
  )
} as const);

export type KpCodeRefactorGenerationDiagnosticCode =
  keyof typeof kpCodeRefactorGenerationDiagnosticDefinitions;

export type KpCodeRefactorGenerationDiagnosticPhase =
  (typeof kpCodeRefactorGenerationDiagnosticDefinitions)[
    KpCodeRefactorGenerationDiagnosticCode
  ]["phase"];

export type KpCodeRefactorGenerationRepairKind =
  (typeof kpCodeRefactorGenerationDiagnosticDefinitions)[
    KpCodeRefactorGenerationDiagnosticCode
  ]["repairKind"];

export interface KpCodeRefactorGenerationDiagnostic {
  readonly schemaVersion:
    typeof KP_CODE_REFACTOR_GENERATION_DIAGNOSTIC_SCHEMA;
  readonly kind: "code-refactor-generation-diagnostic";
  readonly diagnosticId: string;
  readonly code: KpCodeRefactorGenerationDiagnosticCode;
  readonly phase: KpCodeRefactorGenerationDiagnosticPhase;
  readonly severity: "error";
  readonly language: KpCodeRefactorLanguage;
  readonly message: string;
  readonly evidence: Readonly<{
    revisionIds: readonly string[];
    roleIds: readonly string[];
  }>;
  readonly repair: Readonly<{
    kind: KpCodeRefactorGenerationRepairKind;
    summary: string;
  }>;
}

export type KpCodeRefactorGenerationRepairResult =
  Extract<
    KpCodeRefactorGenerationResult<
      never,
      KpCodeRefactorGenerationDiagnostic
    >,
    Readonly<{ status: "repair-required" }>
  >;

export function createKpCodeRefactorGenerationDiagnostic<
  TCode extends KpCodeRefactorGenerationDiagnosticCode
>(input: Readonly<{
  diagnosticId: string;
  code: TCode;
  language: KpCodeRefactorLanguage;
  message: string;
  revisionIds?: readonly string[];
  roleIds?: readonly string[];
  repairSummary: string;
}>): KpCodeRefactorGenerationDiagnostic {
  const definition = kpCodeRefactorGenerationDiagnosticDefinitions[input.code];
  if (!validId(input.diagnosticId)) {
    throw new Error(`Invalid diagnostic ID ${input.diagnosticId}.`);
  }
  if (!nonBlank(input.message) || !nonBlank(input.repairSummary)) {
    throw new Error("Diagnostic message and repair summary must be non-empty.");
  }
  const revisionIds = uniqueIds(input.revisionIds ?? [], "revision");
  const roleIds = uniqueIds(input.roleIds ?? [], "role");
  return deepFreeze({
    schemaVersion: KP_CODE_REFACTOR_GENERATION_DIAGNOSTIC_SCHEMA,
    kind: "code-refactor-generation-diagnostic" as const,
    diagnosticId: input.diagnosticId,
    code: input.code,
    phase: definition.phase,
    severity: "error" as const,
    language: input.language,
    message: input.message,
    evidence: { revisionIds, roleIds },
    repair: {
      kind: definition.repairKind,
      summary: input.repairSummary
    }
  });
}

export function repairKpCodeRefactorGeneration(input: Readonly<{
  requestId?: string;
  language: KpCodeRefactorLanguage;
  diagnostics: readonly KpCodeRefactorGenerationDiagnostic[];
}>): KpCodeRefactorGenerationRepairResult {
  if (input.diagnostics.length === 0) {
    throw new Error("Repair-required results need at least one diagnostic.");
  }
  const diagnosticIds = input.diagnostics.map(({ diagnosticId }) =>
    diagnosticId
  );
  if (new Set(diagnosticIds).size !== diagnosticIds.length) {
    throw new Error("Repair-required results cannot duplicate diagnostic IDs.");
  }
  if (input.diagnostics.some(({ language }) => language !== input.language)) {
    throw new Error("Repair diagnostics must match the result language.");
  }
  return deepFreeze({
    status: "repair-required" as const,
    ...(input.requestId === undefined ? {} : { requestId: input.requestId }),
    language: input.language,
    diagnostics: [...input.diagnostics]
  });
}

export function listKpCodeRefactorGenerationDiagnosticDefinitions():
readonly Readonly<{
  code: KpCodeRefactorGenerationDiagnosticCode;
  phase: KpCodeRefactorGenerationDiagnosticPhase;
  repairKind: KpCodeRefactorGenerationRepairKind;
  meaning: string;
}>[] {
  return Object.freeze(Object.entries(
    kpCodeRefactorGenerationDiagnosticDefinitions
  ).map(([code, value]) => Object.freeze({
    code: code as KpCodeRefactorGenerationDiagnosticCode,
    ...value
  })));
}

function definition<
  TPhase extends "parse" | "recognize" | "legality" | "bind",
  TRepairKind extends
    | "fix-syntax"
    | "choose-supported-operation"
    | "make-duplicates-equivalent"
    | "move-or-rename-binding"
    | "disambiguate-owner"
    | "simplify-source-shape"
>(phase: TPhase, repairKind: TRepairKind, meaning: string): Readonly<{
  phase: TPhase;
  repairKind: TRepairKind;
  meaning: string;
}> {
  return Object.freeze({ phase, repairKind, meaning });
}

function uniqueIds(values: readonly string[], label: string): readonly string[] {
  if (values.some((value) => !validId(value))) {
    throw new Error(`Every ${label} evidence ID must be namespaced.`);
  }
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} evidence IDs must be unique.`);
  }
  return Object.freeze([...values]);
}

function validId(value: string): boolean {
  return /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/u.test(value);
}

function nonBlank(value: string): boolean {
  return value.trim().length > 0;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
