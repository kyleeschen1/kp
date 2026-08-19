import type { ParsedLatexExpression } from "../math/latex-parser.ts";
import {
  KP_FRACTION_EQUIVALENCE_PAIRED_APPLICATION_MOTIF_AUTHORITY,
  KP_FRACTION_EQUIVALENCE_PRESENTATION_RECIPE_AUTHORITY,
  KP_FRACTION_EQUIVALENCE_UNIT_FACTOR_JOIN_MOTIF_AUTHORITY
} from "../animation/fraction-equivalence-presentation-plan.ts";
import {
  isKpVerifiedFractionEquivalence,
  KP_FRACTION_EQUIVALENCE_OPERATION_AUTHORITY,
  type KpFractionEquivalenceScalar,
  type KpVerifiedFractionEquivalence
} from "../semantic/fraction-equivalence.ts";
import type { KpNormalizedEquationTransformSeriesState } from
  "./equation-latex-endpoint-normalizer.ts";
import {
  resolveKpEquationSeriesGovernedSource,
  type KpEquationSeriesVerifiedSemanticSource
} from "./equation-series-governed-source.ts";
import type { KpEquationSeriesIntentResolutionResult } from
  "./equation-series-intent-resolver.ts";
import type { KpEquationSeriesExternalDiagnostic } from
  "./equation-series-repair-taxonomy.ts";
import type { KpEquationTransformSeriesRequest } from
  "./equation-transform-series-request.ts";

export const KP_FRACTION_EQUIVALENCE_EQUATION_SERIES_AUTHORING_AUTHORITY =
  "authoring.equation.fraction-equivalence.v1" as const;

export const KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID =
  "kp.algebra.scale-fraction-equivalently" as const;

export const KP_FRACTION_EQUIVALENCE_AUTHORING_PACK_PIN = Object.freeze({
  packId: "kp.fraction-equivalence",
  version: "1.0.0"
} as const);

export const KP_FRACTION_EQUIVALENCE_AUTHORING_CONTRACT_KIND =
  "kp.semantic-contract.fraction-equivalence.v1" as const;

export const KP_FRACTION_EQUIVALENCE_AUTHORING_ROLE_IDS = Object.freeze([
  "source-numerator",
  "source-denominator",
  "scale-factor",
  "target-numerator-factor",
  "target-denominator-factor"
] as const);

export const KP_FRACTION_EQUIVALENCE_AUTHORING_EVIDENCE_FIELDS = Object.freeze([
  "sourceDenominatorNonzeroEvidenceId",
  "scaleFactorNonzeroEvidenceId"
] as const);

export interface KpEquationSeriesFractionEquivalenceSemanticArguments {
  readonly schemaVersion: "kp.equation-series.fraction-equivalence-intent.v1";
  readonly sourcePin: Readonly<{
    readonly sourceId: string;
    readonly revisionId: string;
  }>;
  readonly operationPin: Readonly<{
    readonly packId: string;
    readonly version: string;
  }>;
  readonly roleBindings: Readonly<{
    readonly "source-numerator": readonly [string];
    readonly "source-denominator": readonly [string];
    readonly "scale-factor": readonly [string];
    readonly "target-numerator-factor": readonly [string];
    readonly "target-denominator-factor": readonly [string];
  }>;
  readonly nonzeroEvidenceIds: Readonly<{
    readonly sourceDenominatorNonzeroEvidenceId: string;
    readonly scaleFactorNonzeroEvidenceId: string;
  }>;
  readonly correspondenceIds: readonly string[];
}

export const kpEquationSeriesFractionEquivalenceAuthoringDeclaration =
  deepFreeze({
    operationId: KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID,
    authoringSummary:
      "Create an equivalent fraction by scaling its numerator and denominator by the same verified nonzero factor.",
    authoringAuthorityId:
      KP_FRACTION_EQUIVALENCE_EQUATION_SERIES_AUTHORING_AUTHORITY,
    familyId: "family.equation.fraction-equivalence.v1",
    operationPin: KP_FRACTION_EQUIVALENCE_AUTHORING_PACK_PIN,
    roleIds: KP_FRACTION_EQUIVALENCE_AUTHORING_ROLE_IDS,
    requiredEvidenceIds:
      KP_FRACTION_EQUIVALENCE_AUTHORING_EVIDENCE_FIELDS,
    semanticAuthorityId: KP_FRACTION_EQUIVALENCE_OPERATION_AUTHORITY,
    lawId: "law.fraction.scale-by-nonzero-unity",
    recipeIds: [
      KP_FRACTION_EQUIVALENCE_PRESENTATION_RECIPE_AUTHORITY
    ] as const,
    motifIds: [
      KP_FRACTION_EQUIVALENCE_UNIT_FACTOR_JOIN_MOTIF_AUTHORITY,
      KP_FRACTION_EQUIVALENCE_PAIRED_APPLICATION_MOTIF_AUTHORITY
    ] as const
  } as const);

export function createKpEquationSeriesFractionEquivalenceSemanticSource(input: {
  readonly sourceId: string;
  readonly revisionId: string;
  readonly adjacencyId: string;
  readonly transformation: KpVerifiedFractionEquivalence;
}): KpEquationSeriesVerifiedSemanticSource {
  if (!isKpVerifiedFractionEquivalence(input.transformation)) {
    throw new TypeError("Fraction-equivalence authoring requires verified authority.");
  }
  const transformation = input.transformation;
  return deepFreeze({
    sourceId: input.sourceId,
    revisionId: input.revisionId,
    operationIds: [KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID],
    entityIds: transformationEntityIds(transformation),
    assumptionEvidenceIds: Object.values(transformation.nonzeroEvidence),
    semanticContracts: [{
      kind: KP_FRACTION_EQUIVALENCE_AUTHORING_CONTRACT_KIND,
      authority: transformation
    }],
    adjacencyEvidence: [{
      adjacencyId: input.adjacencyId,
      fromStateId: transformation.source.stateId,
      toStateId: transformation.target.stateId,
      correspondenceIds: transformation.correspondence.map(({ id }) => id),
      roleBindings: roleBindings(transformation)
    }]
  });
}

/** Native notation is checked against branded truth, never used to infer it. */
export function validateKpEquationSeriesFractionEquivalenceAuthoring(input: {
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
    if (plan.operationId !== KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID) {
      return;
    }
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
  readonly plan: Extract<KpEquationSeriesIntentResolutionResult,
    { readonly status: "resolved" }>["plans"][number];
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
      "Fraction equivalence requires governed semantic arguments.",
      "Provide an exact source, operation pin, role bindings, nonzero evidence, and correspondences."
    ));
    return;
  }
  rejectUnknown(input.value, [
    "schemaVersion",
    "sourcePin",
    "operationPin",
    "roleBindings",
    "nonzeroEvidenceIds",
    "correspondenceIds"
  ], input.path, input.diagnostics);
  if (input.value["schemaVersion"] !==
      "kp.equation-series.fraction-equivalence-intent.v1") {
    input.diagnostics.push(diagnostic(
      "equation-series.governance.arguments.invalid",
      `${input.path}.schemaVersion`,
      "The fraction-equivalence semantic argument schema is unsupported.",
      "Use kp.equation-series.fraction-equivalence-intent.v1."
    ));
  }
  validatePin(input.value["operationPin"], input.path, input.diagnostics);
  const resolved = resolveSource(
    input.value["sourcePin"],
    input.value["correspondenceIds"],
    input.path,
    input.plan,
    input.sourceAuthorities,
    input.diagnostics
  );
  if (resolved === undefined) return;
  validateBindings(input.value["roleBindings"], resolved.transformation,
    input.path, input.diagnostics);
  validateEvidence(input.value["nonzeroEvidenceIds"], resolved,
    input.path, input.diagnostics);
  validateEndpoints(input, resolved.transformation);
}

function resolveSource(
  value: unknown,
  correspondenceValue: unknown,
  path: string,
  plan: Parameters<typeof validateArguments>[0]["plan"],
  sources: readonly KpEquationSeriesVerifiedSemanticSource[],
  diagnostics: KpEquationSeriesExternalDiagnostic[]
): Readonly<{
  source: KpEquationSeriesVerifiedSemanticSource;
  transformation: KpVerifiedFractionEquivalence;
}> | undefined {
  const sourceId = isRecord(value) ? value["sourceId"] : undefined;
  const revisionId = isRecord(value) ? value["revisionId"] : undefined;
  if (!isExactRecord(value, ["sourceId", "revisionId"]) ||
      typeof sourceId !== "string" || typeof revisionId !== "string") {
    diagnostics.push(sourceDiagnostic(`${path}.sourcePin`));
    return undefined;
  }
  const correspondenceIds = stringIds(correspondenceValue);
  const resolution = resolveKpEquationSeriesGovernedSource({
    requirement: {
      sourcePin: { sourceId, revisionId },
      operationId: KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID,
      requiredSemanticContractKinds: [
        KP_FRACTION_EQUIVALENCE_AUTHORING_CONTRACT_KIND
      ],
      requiredAdjacency: {
        adjacencyId: plan.id,
        fromStateId: plan.fromStateId,
        toStateId: plan.toStateId
      },
      requiredCorrespondenceIds: correspondenceIds ?? []
    },
    sources
  });
  if (resolution.status !== "resolved") {
    diagnostics.push(sourceDiagnostic(`${path}.sourcePin`,
      `The fraction-equivalence source failed ${resolution.status}: ` +
      `${resolution.missingIds.join(", ")}.`));
    return undefined;
  }
  const contract = resolution.source.semanticContracts?.find(({ kind }) =>
    kind === KP_FRACTION_EQUIVALENCE_AUTHORING_CONTRACT_KIND
  )?.authority;
  if (!isKpVerifiedFractionEquivalence(contract) ||
      correspondenceIds === undefined ||
      !equal(correspondenceIds, contract.correspondence.map(({ id }) => id))) {
    diagnostics.push(diagnostic(
      "equation-series.governance.source.unresolved",
      `${path}.correspondenceIds`,
      "Correspondences must exactly match authenticated fraction-equivalence authority.",
      "Use the verified contract's ordered correspondence IDs.",
      KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID
    ));
    return undefined;
  }
  return Object.freeze({ source: resolution.source, transformation: contract });
}

function validatePin(
  value: unknown,
  path: string,
  diagnostics: KpEquationSeriesExternalDiagnostic[]
): void {
  if (!isExactRecord(value, ["packId", "version"]) ||
      value["packId"] !== KP_FRACTION_EQUIVALENCE_AUTHORING_PACK_PIN.packId ||
      value["version"] !== KP_FRACTION_EQUIVALENCE_AUTHORING_PACK_PIN.version) {
    diagnostics.push(diagnostic(
      "equation-series.governance.pin.mismatch",
      `${path}.operationPin`,
      "Fraction equivalence requires its exact governed operation pin.",
      `Use ${KP_FRACTION_EQUIVALENCE_AUTHORING_PACK_PIN.packId}@` +
        `${KP_FRACTION_EQUIVALENCE_AUTHORING_PACK_PIN.version}.`,
      KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID
    ));
  }
}

function validateBindings(
  value: unknown,
  transformation: KpVerifiedFractionEquivalence,
  path: string,
  diagnostics: KpEquationSeriesExternalDiagnostic[]
): void {
  const expected = roleBindings(transformation);
  if (!isExactRecord(value, Object.keys(expected)) ||
      Object.entries(expected).some(([key, ids]) =>
        !Array.isArray(value[key]) || !equal(value[key], ids)
      )) diagnostics.push(diagnostic(
    "equation-series.governance.role.invalid",
    `${path}.roleBindings`,
    "Fraction-equivalence roles do not match the verified source identities.",
    "Bind the exact source operands, factor, and both target factor occurrences.",
    KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID
  ));
}

function validateEvidence(
  value: unknown,
  resolved: Readonly<{
    source: KpEquationSeriesVerifiedSemanticSource;
    transformation: KpVerifiedFractionEquivalence;
  }>,
  path: string,
  diagnostics: KpEquationSeriesExternalDiagnostic[]
): void {
  const expected = resolved.transformation.nonzeroEvidence;
  if (!isExactRecord(value, Object.keys(expected)) ||
      Object.entries(expected).some(([key, evidenceId]) =>
        value[key] !== evidenceId ||
        !resolved.source.assumptionEvidenceIds.includes(evidenceId)
      )) diagnostics.push(diagnostic(
    "equation-series.governance.assumption.mismatch",
    `${path}.nonzeroEvidenceIds`,
    "Fraction-equivalence nonzero evidence must match the verified source.",
    "Provide exact denominator and scale-factor nonzero evidence.",
    KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID
  ));
}

function validateEndpoints(
  input: Parameters<typeof validateArguments>[0],
  transformation: KpVerifiedFractionEquivalence
): void {
  const source = input.normalizedStates.find(({ id }) =>
    id === input.plan.fromStateId);
  const target = input.normalizedStates.find(({ id }) =>
    id === input.plan.toStateId);
  const matches =
    transformation.source.stateId === input.plan.fromStateId &&
    transformation.target.stateId === input.plan.toStateId &&
    source?.endpoint.kind === "expression" &&
    target?.endpoint.kind === "expression" &&
    matchesSource(source.endpoint.expression, transformation) &&
    matchesTarget(target.endpoint.expression, transformation);
  if (!matches) input.diagnostics.push(sourceDiagnostic(
    input.path,
    "The ordered LaTeX endpoints do not represent the pinned fraction-equivalence contract."
  ));
}

function matchesSource(
  expression: ParsedLatexExpression,
  transformation: KpVerifiedFractionEquivalence
): boolean {
  return expression.kind === "binary" && expression.operator === "/" &&
    matchesScalar(expression.left, transformation.source.numerator) &&
    matchesScalar(expression.right, transformation.source.denominator);
}

function matchesTarget(
  expression: ParsedLatexExpression,
  transformation: KpVerifiedFractionEquivalence
): boolean {
  return expression.kind === "binary" && expression.operator === "/" &&
    matchesProduct(expression.left, transformation.source.numerator,
      transformation.factor) &&
    matchesProduct(expression.right, transformation.source.denominator,
      transformation.factor);
}

function matchesProduct(
  expression: ParsedLatexExpression,
  source: KpFractionEquivalenceScalar,
  factor: KpFractionEquivalenceScalar
): boolean {
  return expression.kind === "binary" && expression.operator === "*" && (
    (matchesScalar(expression.left, source) &&
      matchesScalar(expression.right, factor)) ||
    (matchesScalar(expression.left, factor) &&
      matchesScalar(expression.right, source))
  );
}

function matchesScalar(
  expression: ParsedLatexExpression,
  scalar: KpFractionEquivalenceScalar
): boolean {
  return scalar.kind === "number"
    ? expression.kind === "number" && Object.is(expression.value, scalar.value)
    : expression.kind === "identifier" && expression.name === scalar.symbol;
}

function roleBindings(transformation: KpVerifiedFractionEquivalence) {
  return deepFreeze({
    "source-numerator": [transformation.source.numerator.entityId] as const,
    "source-denominator": [transformation.source.denominator.entityId] as const,
    "scale-factor": [transformation.factor.entityId] as const,
    "target-numerator-factor": [
      transformation.target.numeratorFactorOccurrenceEntityId
    ] as const,
    "target-denominator-factor": [
      transformation.target.denominatorFactorOccurrenceEntityId
    ] as const
  });
}

function transformationEntityIds(
  transformation: KpVerifiedFractionEquivalence
): readonly string[] {
  return Object.freeze([
    transformation.source.fractionEntityId,
    transformation.source.divisionEntityId,
    transformation.source.numerator.entityId,
    transformation.source.denominator.entityId,
    transformation.factor.entityId,
    transformation.target.fractionEntityId,
    transformation.target.divisionEntityId,
    transformation.target.numeratorProductEntityId,
    transformation.target.denominatorProductEntityId,
    transformation.target.numeratorSourceOccurrenceEntityId,
    transformation.target.numeratorFactorOccurrenceEntityId,
    transformation.target.denominatorSourceOccurrenceEntityId,
    transformation.target.denominatorFactorOccurrenceEntityId
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
      `${key} is not governed fraction-equivalence authoring authority.`,
      "Remove geometry, timing, rendering, and other unrecognized fields."
    ))
  );
}

function sourceDiagnostic(path: string, message =
  "The source pin does not resolve to verified fraction-equivalence authority."
): KpEquationSeriesExternalDiagnostic {
  return diagnostic(
    "equation-series.governance.source.unresolved",
    path,
    message,
    "Use the exact verified source, endpoints, identities, and evidence.",
    KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID
  );
}

function isExactRecord(
  value: unknown,
  keys: readonly string[]
): value is Record<string, unknown> {
  return isRecord(value) && Object.keys(value).length === keys.length &&
    Object.keys(value).every((key) => keys.includes(key));
}

function stringIds(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value) || value.some((id) =>
    typeof id !== "string" || id.trim().length === 0
  ) || new Set(value).size !== value.length) return undefined;
  return Object.freeze([...value]) as readonly string[];
}

function equal(left: readonly unknown[], right: readonly unknown[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
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
