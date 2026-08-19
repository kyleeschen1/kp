import {
  KP_LOGARITHM_BASE_HANDOFF_MOTIF_AUTHORITY,
  KP_LOGARITHM_CHANGE_OF_BASE_RECIPE_AUTHORITY
} from "../animation/logarithm-change-of-base-presentation-plan.ts";
import type { ParsedLatexExpression } from "../math/latex-parser.ts";
import {
  isKpVerifiedLogarithmChangeOfBase,
  KP_LOGARITHM_CHANGE_OF_BASE_OPERATION_AUTHORITY,
  type KpLogarithmChangeOfBaseAtom,
  type KpVerifiedLogarithmChangeOfBase
} from "../semantic/logarithm-change-of-base.ts";
import type { KpNormalizedEquationTransformSeriesState } from
  "./equation-latex-endpoint-normalizer.ts";
import type { KpEquationSeriesVerifiedSemanticSource } from
  "./equation-series-governed-source.ts";
import type { KpEquationSeriesIntentResolutionResult } from
  "./equation-series-intent-resolver.ts";
import type { KpEquationSeriesExternalDiagnostic } from
  "./equation-series-repair-taxonomy.ts";
import type { KpEquationTransformSeriesRequest } from
  "./equation-transform-series-request.ts";

export const KP_LOGARITHM_BASE_EQUATION_SERIES_AUTHORING_AUTHORITY =
  "authoring.equation.logarithm-base.v1" as const;

export const KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID =
  "kp.algebra.change-logarithm-base" as const;

export const KP_LOGARITHM_BASE_AUTHORING_PACK_PIN = Object.freeze({
  packId: "kp.logarithm-change-of-base",
  version: "1.0.0"
} as const);

export const KP_LOGARITHM_BASE_AUTHORING_CONTRACT_KIND =
  "kp.semantic-contract.logarithm-change-of-base.v1" as const;

export const KP_LOGARITHM_BASE_AUTHORING_ROLE_IDS = Object.freeze([
  "source-base",
  "source-argument",
  "target-numerator",
  "target-denominator"
] as const);

export const KP_LOGARITHM_BASE_AUTHORING_EVIDENCE_FIELDS = Object.freeze([
  "sourceBasePositiveEvidenceId",
  "sourceBaseNotOneEvidenceId",
  "sourceArgumentPositiveEvidenceId",
  "naturalLogarithmTargetEvidenceId"
] as const);

export interface KpEquationSeriesLogarithmBaseSemanticArguments {
  readonly schemaVersion: "kp.equation-series.logarithm-base-intent.v1";
  readonly sourcePin: Readonly<{
    sourceId: string;
    revisionId: string;
  }>;
  readonly operationPin: Readonly<{
    packId: string;
    version: string;
  }>;
  readonly semanticBindings: Readonly<{
    sourceBaseSemanticId: string;
    sourceArgumentSemanticId: string;
    targetLogarithmFunction: "natural-logarithm";
  }>;
  readonly domainEvidenceIds: Readonly<{
    sourceBasePositiveEvidenceId: string;
    sourceBaseNotOneEvidenceId: string;
    sourceArgumentPositiveEvidenceId: string;
    naturalLogarithmTargetEvidenceId: string;
  }>;
}

export const kpEquationSeriesLogarithmBaseAuthoringDeclaration = deepFreeze({
  operationId: KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID,
  authoringSummary:
    "Rewrite a logarithm in a verified alternative base as a quotient of natural logarithms.",
  authoringAuthorityId:
    KP_LOGARITHM_BASE_EQUATION_SERIES_AUTHORING_AUTHORITY,
  familyId: "family.equation.logarithm-base.v1",
  operationPin: KP_LOGARITHM_BASE_AUTHORING_PACK_PIN,
  roleIds: KP_LOGARITHM_BASE_AUTHORING_ROLE_IDS,
  requiredEvidenceIds: KP_LOGARITHM_BASE_AUTHORING_EVIDENCE_FIELDS,
  semanticAuthorityId: KP_LOGARITHM_CHANGE_OF_BASE_OPERATION_AUTHORITY,
  lawId: "law.logarithm.change-of-base",
  recipeIds: [KP_LOGARITHM_CHANGE_OF_BASE_RECIPE_AUTHORITY],
  motifIds: [KP_LOGARITHM_BASE_HANDOFF_MOTIF_AUTHORITY]
} as const);

export function createKpEquationSeriesLogarithmBaseSemanticSource(input: {
  readonly sourceId: string;
  readonly revisionId: string;
  readonly transformation: KpVerifiedLogarithmChangeOfBase;
}): KpEquationSeriesVerifiedSemanticSource {
  if (!isKpVerifiedLogarithmChangeOfBase(input.transformation)) {
    throw new TypeError("Change-of-base authoring requires verified authority.");
  }
  return deepFreeze({
    sourceId: input.sourceId,
    revisionId: input.revisionId,
    operationIds: [KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID],
    entityIds: transformationEntityIds(input.transformation),
    assumptionEvidenceIds: Object.values(input.transformation.domainEvidence),
    semanticContracts: [{
      kind: KP_LOGARITHM_BASE_AUTHORING_CONTRACT_KIND,
      authority: input.transformation
    }]
  });
}

/**
 * Pins authored notation to verified change-of-base truth. Native LaTeX is
 * checked against the branded contract, but never becomes the source of the
 * law, identity correspondence, or domain assumptions.
 */
export function validateKpEquationSeriesLogarithmBaseAuthoring(input: {
  readonly request: KpEquationTransformSeriesRequest;
  readonly normalizedStates:
    readonly KpNormalizedEquationTransformSeriesState[];
  readonly resolution: KpEquationSeriesIntentResolutionResult;
  readonly sourceAuthorities?:
    readonly KpEquationSeriesVerifiedSemanticSource[] | undefined;
}): readonly KpEquationSeriesExternalDiagnostic[] {
  if (input.resolution.status !== "resolved") return Object.freeze([]);
  const diagnostics: KpEquationSeriesExternalDiagnostic[] = [];
  input.resolution.plans.forEach((plan, index) => {
    if (plan.operationId !== KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID) return;
    const path = `$.adjacencies[${index}].intent.semanticArguments`;
    const value = plan.intent.mode === "explicit"
      ? plan.intent.semanticArguments
      : undefined;
    validateArguments({
      value,
      path,
      plan,
      normalizedStates: input.normalizedStates,
      diagnostics,
      sourceAuthorities: input.sourceAuthorities ?? []
    });
  });
  return deepFreeze(diagnostics);
}

function validateArguments(input: {
  readonly value: unknown;
  readonly path: string;
  readonly plan: Extract<
    KpEquationSeriesIntentResolutionResult,
    { readonly status: "resolved" }
  >["plans"][number];
  readonly normalizedStates:
    readonly KpNormalizedEquationTransformSeriesState[];
  readonly diagnostics: KpEquationSeriesExternalDiagnostic[];
  readonly sourceAuthorities:
    readonly KpEquationSeriesVerifiedSemanticSource[];
}): void {
  if (!isRecord(input.value)) {
    input.diagnostics.push(diagnostic(
      "equation-series.governance.arguments.invalid",
      input.path,
      "Change of base requires governed semantic arguments.",
      "Provide an exact verified source pin, operation pin, semantic bindings, and domain evidence."
    ));
    return;
  }
  rejectUnknown(input.value, [
    "schemaVersion",
    "sourcePin",
    "operationPin",
    "semanticBindings",
    "domainEvidenceIds"
  ], input.path, input.diagnostics);
  if (input.value["schemaVersion"] !==
      "kp.equation-series.logarithm-base-intent.v1") {
    input.diagnostics.push(diagnostic(
      "equation-series.governance.arguments.invalid",
      `${input.path}.schemaVersion`,
      "The change-of-base semantic argument schema is unsupported.",
      "Use kp.equation-series.logarithm-base-intent.v1."
    ));
  }
  validatePin(input.value["operationPin"], input.path, input.diagnostics);
  const resolved = resolveSource(
    input.value["sourcePin"],
    input.path,
    input.sourceAuthorities,
    input.diagnostics
  );
  if (resolved === undefined) return;
  validateBindings(
    input.value["semanticBindings"],
    resolved.transformation,
    input.path,
    input.diagnostics
  );
  validateEvidence(
    input.value["domainEvidenceIds"],
    resolved,
    input.path,
    input.diagnostics
  );
  validateEndpoints(input, resolved.transformation);
}

function resolveSource(
  value: unknown,
  path: string,
  sources: readonly KpEquationSeriesVerifiedSemanticSource[],
  diagnostics: KpEquationSeriesExternalDiagnostic[]
): Readonly<{
  source: KpEquationSeriesVerifiedSemanticSource;
  transformation: KpVerifiedLogarithmChangeOfBase;
}> | undefined {
  const sourceId = isRecord(value) ? value["sourceId"] : undefined;
  const revisionId = isRecord(value) ? value["revisionId"] : undefined;
  const source = sources.find((candidate) =>
    candidate.sourceId === sourceId && candidate.revisionId === revisionId
  );
  const contract = source?.semanticContracts?.find(({ kind }) =>
    kind === KP_LOGARITHM_BASE_AUTHORING_CONTRACT_KIND
  );
  if (
    !isRecord(value) || Object.keys(value).some((key) =>
      key !== "sourceId" && key !== "revisionId"
    ) || source === undefined ||
    !source.operationIds.includes(KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID) ||
    contract === undefined ||
    !isKpVerifiedLogarithmChangeOfBase(contract.authority)
  ) {
    diagnostics.push(diagnostic(
      "equation-series.governance.source.unresolved",
      `${path}.sourcePin`,
      "The source pin does not resolve to verified change-of-base authority.",
      "Pin an exact source and revision created from a verified change-of-base contract.",
      KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID
    ));
    return undefined;
  }
  return Object.freeze({ source, transformation: contract.authority });
}

function validatePin(
  value: unknown,
  path: string,
  diagnostics: KpEquationSeriesExternalDiagnostic[]
): void {
  if (
    !isRecord(value) ||
    value["packId"] !== KP_LOGARITHM_BASE_AUTHORING_PACK_PIN.packId ||
    value["version"] !== KP_LOGARITHM_BASE_AUTHORING_PACK_PIN.version ||
    Object.keys(value).some((key) => key !== "packId" && key !== "version")
  ) diagnostics.push(diagnostic(
    "equation-series.governance.pin.mismatch",
    `${path}.operationPin`,
    "Change of base requires the exact governed operation pack pin.",
    `Use ${KP_LOGARITHM_BASE_AUTHORING_PACK_PIN.packId}@` +
      `${KP_LOGARITHM_BASE_AUTHORING_PACK_PIN.version}.`,
    KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID
  ));
}

function validateBindings(
  value: unknown,
  transformation: KpVerifiedLogarithmChangeOfBase,
  path: string,
  diagnostics: KpEquationSeriesExternalDiagnostic[]
): void {
  const expected = {
    sourceBaseSemanticId: transformation.source.base.semanticId,
    sourceArgumentSemanticId: transformation.source.argument.semanticId,
    targetLogarithmFunction: "natural-logarithm"
  } as const;
  if (
    !isRecord(value) ||
    Object.keys(value).some((key) => !(key in expected)) ||
    Object.entries(expected).some(([key, expectedValue]) =>
      value[key] !== expectedValue
    )
  ) diagnostics.push(diagnostic(
    "equation-series.governance.source.unresolved",
    `${path}.semanticBindings`,
    "Semantic base, argument, or target-logarithm bindings do not match the verified source.",
    "Use the verified source base and argument identities and the natural-logarithm target.",
    KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID
  ));
}

function validateEvidence(
  value: unknown,
  resolved: Readonly<{
    source: KpEquationSeriesVerifiedSemanticSource;
    transformation: KpVerifiedLogarithmChangeOfBase;
  }>,
  path: string,
  diagnostics: KpEquationSeriesExternalDiagnostic[]
): void {
  const expected = resolved.transformation.domainEvidence;
  if (
    !isRecord(value) ||
    Object.keys(value).some((key) => !(key in expected)) ||
    Object.entries(expected).some(([key, expectedValue]) =>
      value[key] !== expectedValue ||
      !resolved.source.assumptionEvidenceIds.includes(expectedValue)
    )
  ) diagnostics.push(diagnostic(
    "equation-series.governance.assumption.mismatch",
    `${path}.domainEvidenceIds`,
    "Change-of-base domain evidence must exactly match the verified source.",
    "Provide the source-base, source-argument, and natural-logarithm evidence without omission or invention.",
    KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID
  ));
}

function validateEndpoints(
  input: Parameters<typeof validateArguments>[0],
  transformation: KpVerifiedLogarithmChangeOfBase
): void {
  const source = input.normalizedStates.find(({ id }) =>
    id === input.plan.fromStateId
  );
  const target = input.normalizedStates.find(({ id }) =>
    id === input.plan.toStateId
  );
  const matches =
    transformation.source.stateId === input.plan.fromStateId &&
    transformation.target.stateId === input.plan.toStateId &&
    source?.endpoint.kind === "expression" &&
    target?.endpoint.kind === "expression" &&
    matchesSource(source.endpoint.expression, transformation) &&
    matchesTarget(target.endpoint.expression, transformation);
  if (!matches) input.diagnostics.push(diagnostic(
    "equation-series.governance.source.unresolved",
    input.path,
    "The ordered LaTeX endpoints do not represent the pinned change-of-base contract.",
    "Use the pinned source log and its exact natural-logarithm quotient endpoint, or provide another verified source.",
    KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID
  ));
}

function matchesSource(
  expression: ParsedLatexExpression,
  transformation: KpVerifiedLogarithmChangeOfBase
): boolean {
  return expression.kind === "call" && expression.name === "log" &&
    matchesAtom(expression.base, transformation.source.base) &&
    matchesAtom(expression.argument, transformation.source.argument);
}

function matchesTarget(
  expression: ParsedLatexExpression,
  transformation: KpVerifiedLogarithmChangeOfBase
): boolean {
  return expression.kind === "binary" && expression.operator === "/" &&
    expression.left.kind === "call" && expression.left.name === "ln" &&
    expression.right.kind === "call" && expression.right.name === "ln" &&
    matchesAtom(expression.left.argument,
      transformation.target.numerator.argument) &&
    matchesAtom(expression.right.argument,
      transformation.target.denominator.argument);
}

function matchesAtom(
  expression: ParsedLatexExpression,
  atom: KpLogarithmChangeOfBaseAtom
): boolean {
  return atom.kind === "number"
    ? expression.kind === "number" && Object.is(expression.value, atom.value)
    : expression.kind === "identifier" && expression.name === atom.symbol;
}

function transformationEntityIds(
  transformation: KpVerifiedLogarithmChangeOfBase
): readonly string[] {
  return Object.freeze([
    transformation.source.applicationEntityId,
    transformation.source.operatorEntityId,
    transformation.source.base.entityId,
    transformation.source.argument.entityId,
    transformation.target.quotientEntityId,
    transformation.target.divisionEntityId,
    transformation.target.numerator.applicationEntityId,
    transformation.target.numerator.operatorEntityId,
    transformation.target.numerator.argument.entityId,
    transformation.target.denominator.applicationEntityId,
    transformation.target.denominator.operatorEntityId,
    transformation.target.denominator.argument.entityId
  ]);
}

function rejectUnknown(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  diagnostics: KpEquationSeriesExternalDiagnostic[]
): void {
  Object.keys(value).filter((key) => !allowed.includes(key)).forEach((key) =>
    diagnostics.push(diagnostic(
      "equation-series.governance.arguments.unknown",
      `${path}.${key}`,
      `${key} is not governed change-of-base authoring authority.`,
      "Remove geometry, timing, rendering, and other unrecognized fields."
    ))
  );
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
