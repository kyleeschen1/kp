import type { ParsedLatexExpression } from "../math/latex-parser.ts";
import {
  isKpVerifiedLikeDenominatorCombination,
  KP_LIKE_DENOMINATOR_COMBINATION_OPERATION_AUTHORITY,
  type KpLikeDenominatorCombinationDraft,
  type KpVerifiedLikeDenominatorCombination
} from "../semantic/fraction-like-denominator-combination.ts";
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

export const KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID =
  "kp.algebra.combine-like-denominator-fractions" as const;

export const KP_LIKE_DENOMINATOR_EQUATION_SERIES_AUTHORING_AUTHORITY =
  "authoring.equation.like-denominator-combination.v1" as const;

export const KP_LIKE_DENOMINATOR_AUTHORING_CONTRACT_KIND =
  "kp.semantic-contract.like-denominator-combination.v1" as const;

export const KP_LIKE_DENOMINATOR_AUTHORING_PACK_PIN = Object.freeze({
  packId: "kp.like-denominator-combination",
  version: "1.0.0"
} as const);

export const KP_LIKE_DENOMINATOR_AUTHORING_ROLE_IDS = Object.freeze([
  "left-numerator",
  "right-numerator",
  "shared-denominator",
  "source-operator",
  "result-numerator",
  "combined-fraction"
] as const);

export interface KpEquationSeriesLikeDenominatorSemanticArguments {
  readonly schemaVersion:
    "kp.equation-series.like-denominator-combination-intent.v1";
  readonly sourcePin: Readonly<{
    readonly sourceId: string;
    readonly revisionId: string;
  }>;
  readonly operationPin: Readonly<{
    readonly packId: string;
    readonly version: string;
  }>;
  readonly roleBindings: Readonly<{
    readonly "left-numerator": readonly [string];
    readonly "right-numerator": readonly [string];
    readonly "shared-denominator": readonly [string, string, string];
    readonly "source-operator": readonly [string];
    readonly "result-numerator": readonly [string];
    readonly "combined-fraction": readonly [string, string, string];
  }>;
  readonly correspondenceIds: readonly string[];
}

export const kpEquationSeriesLikeDenominatorAuthoringDeclaration =
  deepFreeze({
    operationId: KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID,
    authoringSummary:
      "Combine two fractions with an already-shared denominator into one raw, unreduced result fraction.",
    authoringAuthorityId:
      KP_LIKE_DENOMINATOR_EQUATION_SERIES_AUTHORING_AUTHORITY,
    familyId: "family.equation.like-denominator-combination.v1",
    operationPin: KP_LIKE_DENOMINATOR_AUTHORING_PACK_PIN,
    roleIds: KP_LIKE_DENOMINATOR_AUTHORING_ROLE_IDS,
    requiredEvidenceIds: [] as const,
    semanticAuthorityId:
      KP_LIKE_DENOMINATOR_COMBINATION_OPERATION_AUTHORITY,
    lawId: "law.fraction.combine-like-denominators" as const,
    recipeIds: [] as const,
    motifIds: [] as const
  } as const);

export function createKpEquationSeriesLikeDenominatorSemanticSource(input: {
  readonly sourceId: string;
  readonly revisionId: string;
  readonly adjacencyId: string;
  readonly transformation: KpVerifiedLikeDenominatorCombination;
}): KpEquationSeriesVerifiedSemanticSource {
  if (!isKpVerifiedLikeDenominatorCombination(input.transformation)) {
    throw new TypeError(
      "Like-denominator authoring requires verified authority."
    );
  }
  const transformation = input.transformation;
  return deepFreeze({
    sourceId: input.sourceId,
    revisionId: input.revisionId,
    operationIds: [KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID],
    entityIds: transformationEntityIds(transformation),
    assumptionEvidenceIds: [],
    semanticContracts: [{
      kind: KP_LIKE_DENOMINATOR_AUTHORING_CONTRACT_KIND,
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

export function validateKpEquationSeriesLikeDenominatorAuthoring(input: {
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
    if (plan.operationId !== KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID) {
      return;
    }
    const path = `$.adjacencies[${index}].intent.semanticArguments`;
    const value = plan.intent.mode === "explicit"
      ? plan.intent.semanticArguments
      : undefined;
    if (!isRecord(value)) {
      diagnostics.push(sourceDiagnostic(path,
        "Like-denominator combination requires governed arguments."));
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
        "kp.equation-series.like-denominator-combination-intent.v1") {
      diagnostics.push(diagnostic(
        "equation-series.governance.arguments.invalid",
        `${path}.schemaVersion`,
        "The like-denominator argument schema is unsupported.",
        "Use kp.equation-series.like-denominator-combination-intent.v1."
      ));
    }
    validatePin(value["operationPin"], path, diagnostics);
    const authority = resolveSource({
      sourcePinValue: value["sourcePin"],
      correspondenceValue: value["correspondenceIds"],
      path,
      plan,
      sources: input.sourceAuthorities ?? [],
      diagnostics
    });
    if (authority === undefined) return;
    validateBindings(value["roleBindings"], authority, path, diagnostics);
    validateEndpoints(input.normalizedStates, plan, authority, path,
      diagnostics);
  });
  return deepFreeze(diagnostics);
}

export function roleBindings(
  transformation: KpVerifiedLikeDenominatorCombination
): KpEquationSeriesLikeDenominatorSemanticArguments["roleBindings"] {
  const [left, right] = transformation.source.terms;
  return deepFreeze({
    "left-numerator": [left.numerator.entityId],
    "right-numerator": [right.numerator.entityId],
    "shared-denominator": [
      left.denominator.entityId,
      right.denominator.entityId,
      transformation.target.term.denominator.entityId
    ],
    "source-operator": [transformation.source.operatorEntityId],
    "result-numerator": [transformation.target.term.numerator.entityId],
    "combined-fraction": [
      left.fractionEntityId,
      right.fractionEntityId,
      transformation.target.term.fractionEntityId
    ]
  });
}

function resolveSource(input: {
  readonly sourcePinValue: unknown;
  readonly correspondenceValue: unknown;
  readonly path: string;
  readonly plan: Extract<KpEquationSeriesIntentResolutionResult,
    { readonly status: "resolved" }>["plans"][number];
  readonly sources: readonly KpEquationSeriesVerifiedSemanticSource[];
  readonly diagnostics: KpEquationSeriesExternalDiagnostic[];
}): KpVerifiedLikeDenominatorCombination | undefined {
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
      operationId: KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID,
      requiredSemanticContractKinds: [
        KP_LIKE_DENOMINATOR_AUTHORING_CONTRACT_KIND
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
      `The like-denominator source failed ${resolution.status}: ` +
        `${resolution.missingIds.join(", ")}.`
    ));
    return undefined;
  }
  const authority = resolution.source.semanticContracts?.find(({ kind }) =>
    kind === KP_LIKE_DENOMINATOR_AUTHORING_CONTRACT_KIND
  )?.authority;
  if (!isKpVerifiedLikeDenominatorCombination(authority) ||
      !equal(correspondenceIds,
        authority.correspondence.map(({ id }) => id))) {
    input.diagnostics.push(sourceDiagnostic(
      `${input.path}.correspondenceIds`,
      "Correspondences do not match authenticated combination authority."
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
      value["packId"] !== KP_LIKE_DENOMINATOR_AUTHORING_PACK_PIN.packId ||
      value["version"] !== KP_LIKE_DENOMINATOR_AUTHORING_PACK_PIN.version) {
    diagnostics.push(diagnostic(
      "equation-series.governance.pin.mismatch",
      `${path}.operationPin`,
      "Like-denominator combination requires its exact operation pin.",
      `Use ${KP_LIKE_DENOMINATOR_AUTHORING_PACK_PIN.packId}@` +
        `${KP_LIKE_DENOMINATOR_AUTHORING_PACK_PIN.version}.`,
      KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID
    ));
  }
}

function validateBindings(
  value: unknown,
  transformation: KpVerifiedLikeDenominatorCombination,
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
    "Combination roles do not match verified source identities.",
    "Bind both numerators, shared denominator, operator, and result exactly.",
    KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID
  ));
}

function validateEndpoints(
  states: readonly KpNormalizedEquationTransformSeriesState[],
  plan: Extract<KpEquationSeriesIntentResolutionResult,
    { readonly status: "resolved" }>["plans"][number],
  transformation: KpVerifiedLikeDenominatorCombination,
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
    matchesSource(source.endpoint.expression, transformation) &&
    matchesTerm(target.endpoint.expression, transformation.target.term);
  if (!matches) diagnostics.push(sourceDiagnostic(
    path,
    "Ordered LaTeX endpoints do not represent the pinned combination."
  ));
}

function matchesSource(
  expression: ParsedLatexExpression,
  transformation: KpVerifiedLikeDenominatorCombination
): boolean {
  return expression.kind === "binary" &&
    expression.operator === transformation.operator &&
    matchesTerm(expression.left, transformation.source.terms[0]) &&
    matchesTerm(expression.right, transformation.source.terms[1]);
}

function matchesTerm(
  expression: ParsedLatexExpression,
  term: KpLikeDenominatorCombinationDraft["target"]["term"]
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

function transformationEntityIds(
  transformation: KpVerifiedLikeDenominatorCombination
): readonly string[] {
  const termIds = (term: KpLikeDenominatorCombinationDraft["target"]["term"]) => [
    term.termEntityId,
    term.fractionEntityId,
    term.divisionEntityId,
    term.numerator.entityId,
    term.denominator.entityId
  ];
  return Object.freeze([
    transformation.source.expressionEntityId,
    transformation.source.operatorEntityId,
    ...transformation.source.terms.flatMap(termIds),
    transformation.target.expressionEntityId,
    ...termIds(transformation.target.term)
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
      `${key} is not governed like-denominator authority.`,
      "Remove rendering, timing, geometry, and unrecognized fields."
    ))
  );
}

function sourceDiagnostic(
  path: string,
  message = "The source pin does not resolve to verified combination authority."
): KpEquationSeriesExternalDiagnostic {
  return diagnostic(
    "equation-series.governance.source.unresolved",
    path,
    message,
    "Use the exact verified source, endpoints, identities, and correspondences.",
    KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID
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
