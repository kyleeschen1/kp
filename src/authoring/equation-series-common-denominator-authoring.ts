import type { ParsedLatexExpression } from "../math/latex-parser.ts";
import {
  isKpVerifiedCommonDenominatorAlignment,
  KP_COMMON_DENOMINATOR_ALIGNMENT_OPERATION_AUTHORITY,
  type KpCommonDenominatorAlignmentDraft,
  type KpVerifiedCommonDenominatorAlignment
} from "../semantic/fraction-common-denominator.ts";
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

export const KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID =
  "kp.algebra.align-common-denominator" as const;

export const KP_COMMON_DENOMINATOR_SOURCE_OPERATION_ALIASES = Object.freeze([
  "definition.symbolic.algebra.create-common-denominator"
] as const);

export const KP_COMMON_DENOMINATOR_EQUATION_SERIES_AUTHORING_AUTHORITY =
  "authoring.equation.common-denominator-alignment.v1" as const;

export const KP_COMMON_DENOMINATOR_AUTHORING_CONTRACT_KIND =
  "kp.semantic-contract.common-denominator-alignment.v1" as const;

export const KP_COMMON_DENOMINATOR_AUTHORING_PACK_PIN = Object.freeze({
  packId: "kp.common-denominator-alignment",
  version: "1.0.0"
} as const);

export const KP_COMMON_DENOMINATOR_AUTHORING_ROLE_IDS = Object.freeze([
  "source-first-numerator",
  "source-first-denominator",
  "first-scale-factor",
  "target-first-numerator",
  "target-first-denominator",
  "addition-operator",
  "untouched-second-term"
] as const);

export interface KpEquationSeriesCommonDenominatorSemanticArguments {
  readonly schemaVersion:
    "kp.equation-series.common-denominator-alignment-intent.v1";
  readonly sourcePin: Readonly<{
    readonly sourceId: string;
    readonly revisionId: string;
  }>;
  readonly operationPin: Readonly<{
    readonly packId: string;
    readonly version: string;
  }>;
  readonly roleBindings: Readonly<{
    readonly "source-first-numerator": readonly [string];
    readonly "source-first-denominator": readonly [string];
    readonly "first-scale-factor": readonly [string];
    readonly "target-first-numerator": readonly [string];
    readonly "target-first-denominator": readonly [string];
    readonly "addition-operator": readonly [string, string];
    readonly "untouched-second-term": readonly [string, string];
  }>;
  readonly correspondenceIds: readonly string[];
}

export const kpEquationSeriesCommonDenominatorAuthoringDeclaration =
  deepFreeze({
    operationId: KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID,
    authoringSummary:
      "Align two numeric fractions to one caller-supplied common denominator while preserving each addend and the addition operator.",
    authoringAuthorityId:
      KP_COMMON_DENOMINATOR_EQUATION_SERIES_AUTHORING_AUTHORITY,
    familyId: "family.equation.common-denominator-alignment.v1",
    operationPin: KP_COMMON_DENOMINATOR_AUTHORING_PACK_PIN,
    roleIds: KP_COMMON_DENOMINATOR_AUTHORING_ROLE_IDS,
    requiredEvidenceIds: [] as const,
    semanticAuthorityId:
      KP_COMMON_DENOMINATOR_ALIGNMENT_OPERATION_AUTHORITY,
    lawId: "law.fraction.equivalent-common-denominator" as const,
    recipeIds: [] as const,
    motifIds: [] as const
  } as const);

export function createKpEquationSeriesCommonDenominatorSemanticSource(input: {
  readonly sourceId: string;
  readonly revisionId: string;
  readonly adjacencyId: string;
  readonly transformation: KpVerifiedCommonDenominatorAlignment;
}): KpEquationSeriesVerifiedSemanticSource {
  if (!isKpVerifiedCommonDenominatorAlignment(input.transformation)) {
    throw new TypeError(
      "Common-denominator authoring requires verified authority."
    );
  }
  const transformation = input.transformation;
  return deepFreeze({
    sourceId: input.sourceId,
    revisionId: input.revisionId,
    operationIds: [KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID],
    entityIds: transformationEntityIds(transformation),
    assumptionEvidenceIds: [],
    semanticContracts: [{
      kind: KP_COMMON_DENOMINATOR_AUTHORING_CONTRACT_KIND,
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

/** Native notation is checked against sealed truth, never used to infer it. */
export function validateKpEquationSeriesCommonDenominatorAuthoring(input: {
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
    if (plan.operationId !== KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID) {
      return;
    }
    const path = `$.adjacencies[${index}].intent.semanticArguments`;
    const value = plan.intent.mode === "explicit"
      ? plan.intent.semanticArguments
      : undefined;
    if (!isRecord(value)) {
      diagnostics.push(sourceDiagnostic(path,
        "Common-denominator alignment requires governed semantic arguments."));
      return;
    }
    rejectUnknown(value, [
      "schemaVersion",
      "sourcePin",
      "operationPin",
      "roleBindings",
      "correspondenceIds"
    ], path, diagnostics);
    if (value["schemaVersion"] !==
        "kp.equation-series.common-denominator-alignment-intent.v1") {
      diagnostics.push(diagnostic(
        "equation-series.governance.arguments.invalid",
        `${path}.schemaVersion`,
        "The common-denominator argument schema is unsupported.",
        "Use kp.equation-series.common-denominator-alignment-intent.v1."
      ));
    }
    validatePin(value["operationPin"], path, diagnostics);
    const resolved = resolveSource({
      sourcePinValue: value["sourcePin"],
      correspondenceValue: value["correspondenceIds"],
      path,
      plan,
      sources: input.sourceAuthorities ?? [],
      diagnostics
    });
    if (resolved === undefined) return;
    validateBindings(value["roleBindings"], resolved, path, diagnostics);
    validateEndpoints(input.normalizedStates, plan, resolved, path,
      diagnostics);
  });
  return deepFreeze(diagnostics);
}

function resolveSource(input: {
  readonly sourcePinValue: unknown;
  readonly correspondenceValue: unknown;
  readonly path: string;
  readonly plan: Extract<KpEquationSeriesIntentResolutionResult,
    { readonly status: "resolved" }>["plans"][number];
  readonly sources: readonly KpEquationSeriesVerifiedSemanticSource[];
  readonly diagnostics: KpEquationSeriesExternalDiagnostic[];
}): KpVerifiedCommonDenominatorAlignment | undefined {
  const sourceId = isRecord(input.sourcePinValue)
    ? input.sourcePinValue["sourceId"]
    : undefined;
  const revisionId = isRecord(input.sourcePinValue)
    ? input.sourcePinValue["revisionId"]
    : undefined;
  const correspondenceIds = stringIds(input.correspondenceValue);
  if (!isExactRecord(input.sourcePinValue, ["sourceId", "revisionId"]) ||
      typeof sourceId !== "string" || typeof revisionId !== "string" ||
      correspondenceIds === undefined) {
    input.diagnostics.push(sourceDiagnostic(`${input.path}.sourcePin`));
    return undefined;
  }
  const resolution = resolveKpEquationSeriesGovernedSource({
    requirement: {
      sourcePin: { sourceId, revisionId },
      operationId: KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID,
      requiredSemanticContractKinds: [
        KP_COMMON_DENOMINATOR_AUTHORING_CONTRACT_KIND
      ],
      requiredAdjacency: {
        adjacencyId: input.plan.id,
        fromStateId: input.plan.fromStateId,
        toStateId: input.plan.toStateId
      },
      requiredCorrespondenceIds: correspondenceIds
    },
    sources: input.sources
  });
  if (resolution.status !== "resolved") {
    input.diagnostics.push(sourceDiagnostic(
      `${input.path}.sourcePin`,
      `The common-denominator source failed ${resolution.status}: ` +
        `${resolution.missingIds.join(", ")}.`
    ));
    return undefined;
  }
  const authority = resolution.source.semanticContracts?.find(({ kind }) =>
    kind === KP_COMMON_DENOMINATOR_AUTHORING_CONTRACT_KIND
  )?.authority;
  if (!isKpVerifiedCommonDenominatorAlignment(authority) ||
      !equal(correspondenceIds,
        authority.correspondence.map(({ id }) => id))) {
    input.diagnostics.push(sourceDiagnostic(
      `${input.path}.correspondenceIds`,
      "Correspondences do not match authenticated alignment authority."
    ));
    return undefined;
  }
  return authority;
}

function validatePin(
  value: unknown,
  path: string,
  diagnostics: KpEquationSeriesExternalDiagnostic[]
): void {
  if (!isExactRecord(value, ["packId", "version"]) ||
      value["packId"] !== KP_COMMON_DENOMINATOR_AUTHORING_PACK_PIN.packId ||
      value["version"] !== KP_COMMON_DENOMINATOR_AUTHORING_PACK_PIN.version) {
    diagnostics.push(diagnostic(
      "equation-series.governance.pin.mismatch",
      `${path}.operationPin`,
      "Common-denominator alignment requires its exact operation pin.",
      `Use ${KP_COMMON_DENOMINATOR_AUTHORING_PACK_PIN.packId}@` +
        `${KP_COMMON_DENOMINATOR_AUTHORING_PACK_PIN.version}.`,
      KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID
    ));
  }
}

function validateBindings(
  value: unknown,
  transformation: KpVerifiedCommonDenominatorAlignment,
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
    "Alignment roles do not match the verified source identities.",
    "Bind the exact factor, operands, operator, and untouched term.",
    KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID
  ));
}

function validateEndpoints(
  states: readonly KpNormalizedEquationTransformSeriesState[],
  plan: Extract<KpEquationSeriesIntentResolutionResult,
    { readonly status: "resolved" }>["plans"][number],
  transformation: KpVerifiedCommonDenominatorAlignment,
  path: string,
  diagnostics: KpEquationSeriesExternalDiagnostic[]
): void {
  const source = states.find(({ id }) => id === plan.fromStateId);
  const target = states.find(({ id }) => id === plan.toStateId);
  const matches =
    transformation.source.stateId === plan.fromStateId &&
    transformation.target.stateId === plan.toStateId &&
    source?.endpoint.kind === "expression" &&
    target?.endpoint.kind === "expression" &&
    matchesState(source.endpoint.expression, transformation.source) &&
    matchesAlignmentApplication(target.endpoint.expression, transformation);
  if (!matches) diagnostics.push(sourceDiagnostic(
    path,
    "Ordered LaTeX endpoints do not represent the pinned alignment contract."
  ));
}

function matchesAlignmentApplication(
  expression: ParsedLatexExpression,
  transformation: KpVerifiedCommonDenominatorAlignment
): boolean {
  if (expression.kind !== "binary" || expression.operator !== "+") {
    return false;
  }
  const source = transformation.source.terms[0];
  const factor = transformation.equivalenceMultipliers[0];
  return expression.left.kind === "binary" &&
    expression.left.operator === "/" &&
    matchesProduct(
      expression.left.left,
      source.numerator.value,
      factor.numerator
    ) &&
    matchesProduct(
      expression.left.right,
      source.denominator.value,
      factor.denominator
    ) &&
    matchesTerm(expression.right, transformation.target.terms[1]);
}

function matchesProduct(
  expression: ParsedLatexExpression,
  source: bigint,
  factor: bigint
): boolean {
  return expression.kind === "binary" && expression.operator === "*" && (
    (matchesInteger(expression.left, factor) &&
      matchesInteger(expression.right, source)) ||
    (matchesInteger(expression.left, source) &&
      matchesInteger(expression.right, factor))
  );
}

function matchesState(
  expression: ParsedLatexExpression,
  stateValue: KpCommonDenominatorAlignmentDraft["source"]
): boolean {
  return expression.kind === "binary" && expression.operator === "+" &&
    matchesTerm(expression.left, stateValue.terms[0]) &&
    matchesTerm(expression.right, stateValue.terms[1]);
}

function matchesTerm(
  expression: ParsedLatexExpression,
  term: KpCommonDenominatorAlignmentDraft["source"]["terms"][number]
): boolean {
  return expression.kind === "binary" && expression.operator === "/" &&
    matchesInteger(expression.left, term.numerator.value) &&
    matchesInteger(expression.right, term.denominator.value);
}

function matchesInteger(
  expression: ParsedLatexExpression,
  expected: bigint
): boolean {
  return expression.kind === "number" &&
    Number.isSafeInteger(expression.value) &&
    BigInt(expression.value) === expected;
}

export function roleBindings(
  transformation: KpVerifiedCommonDenominatorAlignment
): KpEquationSeriesCommonDenominatorSemanticArguments["roleBindings"] {
  return deepFreeze({
    "source-first-numerator": [
      transformation.source.terms[0].numerator.entityId
    ],
    "source-first-denominator": [
      transformation.source.terms[0].denominator.entityId
    ],
    "first-scale-factor": [
      transformation.equivalenceMultipliers[0].entityId
    ],
    "target-first-numerator": [
      transformation.target.terms[0].numerator.entityId
    ],
    "target-first-denominator": [
      transformation.target.terms[0].denominator.entityId
    ],
    "addition-operator": [
      transformation.source.operatorEntityId,
      transformation.target.operatorEntityId
    ],
    "untouched-second-term": [
      transformation.source.terms[1].termEntityId,
      transformation.target.terms[1].termEntityId
    ]
  });
}

function transformationEntityIds(
  transformation: KpVerifiedCommonDenominatorAlignment
): readonly string[] {
  const stateIds = (stateValue: KpCommonDenominatorAlignmentDraft["source"]) => [
    stateValue.expressionEntityId,
    stateValue.operatorEntityId,
    ...stateValue.terms.flatMap((term) => [
      term.termEntityId,
      term.fractionEntityId,
      term.divisionEntityId,
      term.numerator.entityId,
      term.denominator.entityId
    ])
  ];
  return Object.freeze([
    ...stateIds(transformation.source),
    ...stateIds(transformation.target),
    ...transformation.equivalenceMultipliers.map(({ entityId }) => entityId)
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
      `${key} is not governed common-denominator authority.`,
      "Remove rendering, timing, geometry, and other unrecognized fields."
    ))
  );
}

function sourceDiagnostic(
  path: string,
  message = "The source pin does not resolve to verified alignment authority."
): KpEquationSeriesExternalDiagnostic {
  return diagnostic(
    "equation-series.governance.source.unresolved",
    path,
    message,
    "Use the exact verified source, endpoints, identities, and correspondences.",
    KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID
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
