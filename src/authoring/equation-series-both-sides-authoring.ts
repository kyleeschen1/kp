import {
  kpBothSidesOperationRegistrationPacks,
  type KpBothSidesOperationRegistration
} from "../semantic/both-sides-operation-registration.ts";
import type { KpEquationSeriesExternalDiagnostic } from
  "./equation-series-repair-taxonomy.ts";
import type { KpEquationSeriesIntentResolutionResult } from
  "./equation-series-intent-resolver.ts";
import type { KpEquationTransformSeriesRequest } from
  "./equation-transform-series-request.ts";
import type { KpEquationSeriesVerifiedSemanticSource } from
  "./equation-series-governed-source.ts";

export type { KpEquationSeriesVerifiedSemanticSource } from
  "./equation-series-governed-source.ts";

/** Stable evidence ID for the governed transform-series authoring surface. */
export const KP_BOTH_SIDES_EQUATION_SERIES_AUTHORING_AUTHORITY =
  "authoring.equation.balanced-operation.v1" as const;

export const KP_BOTH_SIDES_AUTHORING_PACK_PIN = Object.freeze({
  packId: "kp.both-sides",
  version: "1.0.0"
} as const);

export const KP_BOTH_SIDES_AUTHORING_ROLE_IDS = Object.freeze([
  "lhs",
  "rhs",
  "relation",
  "applied-operation"
] as const);

export type KpBothSidesAuthoringRoleId =
  typeof KP_BOTH_SIDES_AUTHORING_ROLE_IDS[number];

export interface KpEquationSeriesBothSidesAuthoringDeclaration {
  readonly operationId: string;
  readonly registrationId: KpBothSidesOperationRegistration["id"];
  readonly registrationPackId: string;
  readonly operationPin: typeof KP_BOTH_SIDES_AUTHORING_PACK_PIN;
  readonly roleIds: typeof KP_BOTH_SIDES_AUTHORING_ROLE_IDS;
  readonly requiredAssumptionEvidenceIds: readonly string[];
  readonly semanticAuthorityId: string;
  readonly lawId: string;
}

export interface KpEquationSeriesBothSidesSemanticArguments {
  readonly schemaVersion: "kp.equation-series.both-sides-intent.v1";
  readonly sourcePin: Readonly<{
    sourceId: string;
    revisionId: string;
  }>;
  readonly operationPin: Readonly<{
    packId: string;
    version: string;
  }>;
  readonly roleBindings: Readonly<Record<KpBothSidesAuthoringRoleId,
    readonly string[]>>;
  readonly assumptionEvidenceIds: readonly string[];
}

interface KpBothSidesArgumentValidationInput {
  readonly declaration: KpEquationSeriesBothSidesAuthoringDeclaration;
  readonly value: Record<string, unknown>;
  readonly path: string;
  readonly diagnostics: KpEquationSeriesExternalDiagnostic[];
  readonly sourceAuthorities:
    readonly KpEquationSeriesVerifiedSemanticSource[];
}

const operationIdsByRegistrationId = Object.freeze({
  addBothSides: "kp.algebra.add-both-sides",
  subtractBothSides: "kp.algebra.subtract-both-sides",
  multiplyBothSides: "kp.algebra.multiply-both-sides",
  divideBothSides: "kp.algebra.divide-both-sides",
  applyNaturalLogBothSides: "kp.algebra.apply-natural-log-both-sides",
  divideBothSidesByLogBase:
    "kp.algebra.divide-both-sides-by-log-base"
} satisfies Readonly<Record<KpBothSidesOperationRegistration["id"], string>>);

export const kpEquationSeriesBothSidesAuthoringDeclarations = Object.freeze(
  kpBothSidesOperationRegistrationPacks.flatMap((pack) =>
    pack.registrations.map((registration) => Object.freeze({
      operationId: operationIdsByRegistrationId[registration.id],
      registrationId: registration.id,
      registrationPackId: pack.id,
      operationPin: KP_BOTH_SIDES_AUTHORING_PACK_PIN,
      roleIds: KP_BOTH_SIDES_AUTHORING_ROLE_IDS,
      requiredAssumptionEvidenceIds: Object.freeze([
        ...registration.authoringAssumptionEvidenceIds
      ]),
      semanticAuthorityId: registration.semanticAuthorityId,
      lawId: registration.lawId
    }))
  )
);

export const kpEquationSeriesBothSidesAuthoringByOperationId = Object.freeze(
  Object.fromEntries(kpEquationSeriesBothSidesAuthoringDeclarations.map(
    (declaration) => [declaration.operationId, declaration]
  )) as Readonly<Record<string, KpEquationSeriesBothSidesAuthoringDeclaration>>
);

/**
 * The author supplies only exact semantic IDs. Mathematical authority remains
 * in the registered declaration; notation and prose cannot silently replace
 * its law, domain evidence, or equality-branch roles.
 */
export function validateKpEquationSeriesBothSidesAuthoring(input: {
  readonly request: KpEquationTransformSeriesRequest;
  readonly resolution: KpEquationSeriesIntentResolutionResult;
  readonly sourceAuthorities?:
    readonly KpEquationSeriesVerifiedSemanticSource[] | undefined;
}): readonly KpEquationSeriesExternalDiagnostic[] {
  if (input.resolution.status !== "resolved") return Object.freeze([]);
  const diagnostics: KpEquationSeriesExternalDiagnostic[] = [];
  input.resolution.plans.forEach((plan, index) => {
    const declaration =
      kpEquationSeriesBothSidesAuthoringByOperationId[plan.operationId];
    if (declaration === undefined) return;
    const path = `$.adjacencies[${index}].intent.semanticArguments`;
    const value = plan.intent.mode === "explicit"
      ? plan.intent.semanticArguments
      : undefined;
    validateArguments({
      declaration,
      value,
      path,
      diagnostics,
      sourceAuthorities: input.sourceAuthorities ?? []
    });
  });
  return deepFreeze(diagnostics);
}

function validateArguments(input: {
  readonly declaration: KpEquationSeriesBothSidesAuthoringDeclaration;
  readonly value: unknown;
  readonly path: string;
  readonly diagnostics: KpEquationSeriesExternalDiagnostic[];
  readonly sourceAuthorities:
    readonly KpEquationSeriesVerifiedSemanticSource[];
}): void {
  if (!isRecord(input.value)) {
    input.diagnostics.push(diagnostic(
      "equation-series.governance.arguments.invalid",
      input.path,
      "A governed both-sides operation requires semantic arguments.",
      "Provide source and operation pins, total role bindings, and exact assumption evidence."
    ));
    return;
  }
  const validatedInput: KpBothSidesArgumentValidationInput = {
    ...input,
    value: input.value
  };
  const allowed = new Set([
    "schemaVersion",
    "sourcePin",
    "operationPin",
    "roleBindings",
    "assumptionEvidenceIds"
  ]);
  Object.keys(input.value).filter((key) => !allowed.has(key)).forEach((key) =>
    input.diagnostics.push(diagnostic(
      "equation-series.governance.arguments.unknown",
      `${input.path}.${key}`,
      `${key} is not governed both-sides authoring authority.`,
      "Remove the unknown field. Timing, geometry, rendering, and inferred laws remain compiler-owned."
    ))
  );
  if (input.value["schemaVersion"] !==
      "kp.equation-series.both-sides-intent.v1") {
    input.diagnostics.push(diagnostic(
      "equation-series.governance.arguments.invalid",
      `${input.path}.schemaVersion`,
      "The both-sides semantic argument schema is missing or unsupported.",
      "Use kp.equation-series.both-sides-intent.v1."
    ));
  }
  const sourceAuthority = resolveSourceAuthority(validatedInput);
  validatePin(validatedInput);
  validateRoles(validatedInput, sourceAuthority?.entityIds);
  validateAssumptions(validatedInput, sourceAuthority);
}

function resolveSourceAuthority(
  input: KpBothSidesArgumentValidationInput
): KpEquationSeriesVerifiedSemanticSource | undefined {
  const pin = input.value["sourcePin"];
  const sourceId = isRecord(pin) ? pin["sourceId"] : undefined;
  const revisionId = isRecord(pin) ? pin["revisionId"] : undefined;
  const authority = input.sourceAuthorities.find((candidate) =>
    candidate.sourceId === sourceId && candidate.revisionId === revisionId
  );
  if (
    !isRecord(pin) || typeof sourceId !== "string" ||
    typeof revisionId !== "string" || authority === undefined ||
    Object.keys(pin).some((key) => key !== "sourceId" && key !== "revisionId")
  ) input.diagnostics.push(diagnostic(
    "equation-series.governance.source.unresolved",
    `${input.path}.sourcePin`,
    "The semantic source pin does not resolve to compiler-provided authority.",
    "Pin an exact verified source ID and revision available to the compiler.",
    input.declaration.operationId
  ));
  if (
    authority !== undefined &&
    !authority.operationIds.includes(input.declaration.operationId)
  ) input.diagnostics.push(diagnostic(
    "equation-series.governance.source.unresolved",
    `${input.path}.sourcePin`,
    `${authority.sourceId}@${authority.revisionId} does not authorize ` +
      `${input.declaration.operationId}.`,
    "Use a verified semantic source that owns the selected operation.",
    input.declaration.operationId
  ));
  return authority;
}

function validatePin(input: KpBothSidesArgumentValidationInput): void {
  const pin = input.value["operationPin"];
  if (
    !isRecord(pin) ||
    pin["packId"] !== input.declaration.operationPin.packId ||
    pin["version"] !== input.declaration.operationPin.version ||
    Object.keys(pin).some((key) => key !== "packId" && key !== "version")
  ) input.diagnostics.push(diagnostic(
    "equation-series.governance.pin.mismatch",
    `${input.path}.operationPin`,
    `${input.declaration.operationId} requires the exact ` +
      `${input.declaration.operationPin.packId}@` +
      `${input.declaration.operationPin.version} pin.`,
    "Pin the registered both-sides authoring pack exactly.",
    input.declaration.operationId
  ));
}

function validateRoles(
  input: KpBothSidesArgumentValidationInput,
  approvedEntityIds: readonly string[] | undefined
): void {
  const bindings = input.value["roleBindings"];
  if (!isRecord(bindings)) {
    input.diagnostics.push(roleDiagnostic(
      `${input.path}.roleBindings`,
      "All both-sides semantic roles require explicit bindings."
    ));
    return;
  }
  Object.keys(bindings).filter((roleId) =>
    !input.declaration.roleIds.includes(roleId as KpBothSidesAuthoringRoleId)
  ).forEach((roleId) => input.diagnostics.push(roleDiagnostic(
    `${input.path}.roleBindings.${roleId}`,
    `Unknown both-sides role ${roleId}.`,
    roleId
  )));
  input.declaration.roleIds.forEach((roleId) => {
    const ids = stringIds(bindings[roleId]);
    if (ids === undefined || ids.length === 0) {
      input.diagnostics.push(roleDiagnostic(
        `${input.path}.roleBindings.${roleId}`,
        `Both-sides role ${roleId} requires at least one semantic entity.`,
        roleId
      ));
      return;
    }
    ids.filter((entityId) =>
      approvedEntityIds !== undefined && !approvedEntityIds.includes(entityId)
    ).forEach(
      (entityId) => input.diagnostics.push({
        ...diagnostic(
          "equation-series.governance.entity.unresolved",
          `${input.path}.roleBindings.${roleId}`,
          `${entityId} is outside the approved semantic entity set.`,
          "Bind an entity admitted by approvedEntityIds."
        ),
        entityId,
        roleId
      })
    );
  });
}

function validateAssumptions(
  input: KpBothSidesArgumentValidationInput,
  sourceAuthority: KpEquationSeriesVerifiedSemanticSource | undefined
): void {
  const actual = stringIds(input.value["assumptionEvidenceIds"]);
  if (actual === undefined) {
    input.diagnostics.push(diagnostic(
      "equation-series.governance.assumption.invalid",
      `${input.path}.assumptionEvidenceIds`,
      "Assumption evidence must be an explicit list of semantic IDs.",
      "Provide the declaration's exact assumption evidence IDs.",
      input.declaration.operationId
    ));
    return;
  }
  const required = input.declaration.requiredAssumptionEvidenceIds;
  const missing = required.filter((id) => !actual.includes(id));
  const unexpected = actual.filter((id) => !required.includes(id));
  const unavailable = sourceAuthority === undefined
    ? []
    : actual.filter((id) => !sourceAuthority.assumptionEvidenceIds.includes(id));
  if (missing.length > 0 || unexpected.length > 0 ||
      unavailable.length > 0 || new Set(actual).size !== actual.length) {
    input.diagnostics.push(diagnostic(
      "equation-series.governance.assumption.mismatch",
      `${input.path}.assumptionEvidenceIds`,
      `${input.declaration.operationId} requires exact assumption evidence: ` +
        `${required.join(", ") || "none"}.`,
      "Use the registered declaration's assumptions without omission, duplication, or invention.",
      input.declaration.operationId
    ));
  }
}

function roleDiagnostic(
  path: string,
  message: string,
  roleId?: string
): KpEquationSeriesExternalDiagnostic {
  return {
    ...diagnostic(
      "equation-series.governance.role.invalid",
      path,
      message,
      "Bind every declared role to approved semantic entities."
    ),
    ...(roleId === undefined ? {} : { roleId })
  };
}

function diagnostic(
  code: string,
  path: string,
  message: string,
  repair: string,
  operationId?: string
): KpEquationSeriesExternalDiagnostic {
  return Object.freeze({
    code,
    path,
    message,
    repair,
    ...(operationId === undefined ? {} : { operationId })
  });
}

function stringIds(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value) || value.some((id) =>
    typeof id !== "string" || id.trim() === ""
  )) return undefined;
  return Object.freeze([...value]);
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
