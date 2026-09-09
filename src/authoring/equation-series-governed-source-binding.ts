import { KP_COMMON_FACTOR_OPERATION, bindKpEquationSeriesCommonFactorSource } from "./equation-series-common-factor-authoring.ts";
import {
  kpEquationSeriesBothSidesAuthoringByOperationId,
  type KpEquationSeriesBothSidesSemanticArguments
} from "./equation-series-both-sides-authoring.ts";
import {
  KP_LOGARITHM_BASE_AUTHORING_CONTRACT_KIND,
  KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID,
  kpEquationSeriesLogarithmBaseAuthoringDeclaration,
  type KpEquationSeriesLogarithmBaseSemanticArguments
} from "./equation-series-logarithm-base-authoring.ts";
import {
  resolveKpEquationSeriesGovernedSource,
  type KpEquationSeriesVerifiedSemanticSource
} from "./equation-series-governed-source.ts";
import { resolveKpEquationSeriesIntents } from
  "./equation-series-intent-resolver.ts";
import type { KpEquationSeriesExternalDiagnostic } from
  "./equation-series-repair-taxonomy.ts";
import type { KpEquationSeriesIntentProposal } from
  "./equation-series-intent-resolver.ts";
import {
  type KpEquationSeriesOperationDeclaration
} from "./equation-series-operation-declarations.ts";
import type {
  KpEquationTransformSeriesAdjacency,
  KpEquationTransformSeriesRequest
} from "./equation-transform-series-request.ts";
import {
  isKpVerifiedLogarithmChangeOfBase,
  type KpVerifiedLogarithmChangeOfBase
} from "../semantic/logarithm-change-of-base.ts";
import {
  KP_FRACTION_EQUIVALENCE_AUTHORING_CONTRACT_KIND,
  KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID,
  kpEquationSeriesFractionEquivalenceAuthoringDeclaration,
  type KpEquationSeriesFractionEquivalenceSemanticArguments
} from "./equation-series-fraction-equivalence-authoring.ts";
import {
  isKpVerifiedFractionEquivalence,
  type KpVerifiedFractionEquivalence
} from "../semantic/fraction-equivalence.ts";
import {
  KP_COMMON_DENOMINATOR_AUTHORING_CONTRACT_KIND,
  KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID,
  kpEquationSeriesCommonDenominatorAuthoringDeclaration,
  roleBindings as commonDenominatorRoleBindings,
  type KpEquationSeriesCommonDenominatorSemanticArguments
} from "./equation-series-common-denominator-authoring.ts";
import {
  isKpVerifiedCommonDenominatorAlignment,
  type KpVerifiedCommonDenominatorAlignment
} from "../semantic/fraction-common-denominator.ts";
import {
  KP_LIKE_DENOMINATOR_AUTHORING_CONTRACT_KIND,
  KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID,
  kpEquationSeriesLikeDenominatorAuthoringDeclaration,
  roleBindings as likeDenominatorRoleBindings,
  type KpEquationSeriesLikeDenominatorSemanticArguments
} from "./equation-series-like-denominator-authoring.ts";
import {
  isKpVerifiedLikeDenominatorCombination,
  type KpVerifiedLikeDenominatorCombination
} from "../semantic/fraction-like-denominator-combination.ts";

export interface KpEquationSeriesGovernedSourceBindingInput {
  readonly adjacency: KpEquationTransformSeriesAdjacency;
  readonly declaration: KpEquationSeriesOperationDeclaration;
  readonly sources: readonly KpEquationSeriesVerifiedSemanticSource[];
  readonly path: string;
}

export type KpEquationSeriesGovernedSourceBindingResult =
  | Readonly<{
      readonly status: "bound";
      readonly semanticArguments: unknown;
    }>
  | Readonly<{
      readonly status: "repair-required";
      readonly diagnostics: readonly KpEquationSeriesExternalDiagnostic[];
    }>;

export interface KpEquationSeriesGovernedSourceBinder {
  readonly id: string;
  readonly operationIds: readonly string[];
  readonly bind: (
    input: KpEquationSeriesGovernedSourceBindingInput
  ) => KpEquationSeriesGovernedSourceBindingResult;
}

export interface KpEquationSeriesGovernedSourceBindingRegistry {
  readonly binders: readonly KpEquationSeriesGovernedSourceBinder[];
  readonly byOperationId:
    Readonly<Record<string, KpEquationSeriesGovernedSourceBinder>>;
}

export type KpEquationSeriesRequestBindingResult =
  | Readonly<{
      readonly status: "bound";
      readonly request: KpEquationTransformSeriesRequest;
      readonly diagnostics: readonly [];
    }>
  | Readonly<{
      readonly status: "repair-required";
      readonly diagnostics: readonly KpEquationSeriesExternalDiagnostic[];
    }>;

export function createKpEquationSeriesGovernedSourceBindingRegistry(
  binders: readonly KpEquationSeriesGovernedSourceBinder[]
): KpEquationSeriesGovernedSourceBindingRegistry {
  const byOperationId: Record<string, KpEquationSeriesGovernedSourceBinder> = {};
  for (const binder of binders) {
    for (const operationId of binder.operationIds) {
      if (byOperationId[operationId] !== undefined) {
        throw new Error(`Duplicate governed source binder ${operationId}.`);
      }
      byOperationId[operationId] = binder;
    }
  }
  return Object.freeze({
    binders: Object.freeze(binders.map((binder) => Object.freeze({
      ...binder,
      operationIds: Object.freeze([...binder.operationIds])
    }))),
    byOperationId: Object.freeze(byOperationId)
  });
}

const bothSidesBinder: KpEquationSeriesGovernedSourceBinder = Object.freeze({
  id: "binding.equation-series.both-sides.v1",
  operationIds: Object.keys(kpEquationSeriesBothSidesAuthoringByOperationId),
  bind: bindBothSides
});

const logarithmBaseBinder: KpEquationSeriesGovernedSourceBinder = Object.freeze({
  id: "binding.equation-series.logarithm-base.v1",
  operationIds: [KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID],
  bind: bindLogarithmBase
});

const fractionEquivalenceBinder: KpEquationSeriesGovernedSourceBinder =
  Object.freeze({
    id: "binding.equation-series.fraction-equivalence.v1",
    operationIds: [KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID],
    bind: bindFractionEquivalence
  });

const commonDenominatorBinder: KpEquationSeriesGovernedSourceBinder =
  Object.freeze({
    id: "binding.equation-series.common-denominator-alignment.v1",
    operationIds: [KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID],
    bind: bindCommonDenominator
  });

const likeDenominatorBinder: KpEquationSeriesGovernedSourceBinder =
  Object.freeze({
    id: "binding.equation-series.like-denominator-combination.v1",
    operationIds: [KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID],
    bind: bindLikeDenominator
  });

export const kpEquationSeriesGovernedSourceBindingRegistry =
  createKpEquationSeriesGovernedSourceBindingRegistry([
    { id: "binding.equation-series.common-factor.v1", operationIds: [KP_COMMON_FACTOR_OPERATION], bind: bindKpEquationSeriesCommonFactorSource },
    bothSidesBinder,
    logarithmBaseBinder,
    fractionEquivalenceBinder,
    commonDenominatorBinder,
    likeDenominatorBinder
  ]);

/**
 * Planner proposals become explicit requests only after compiler-owned source
 * evidence supplies every governed argument. The model never authors truth.
 */
export function bindKpEquationSeriesGovernedRequest(input: {
  readonly request: KpEquationTransformSeriesRequest;
  readonly proposals: readonly KpEquationSeriesIntentProposal[];
  readonly sources?: readonly KpEquationSeriesVerifiedSemanticSource[];
  readonly registry?: KpEquationSeriesGovernedSourceBindingRegistry;
}): KpEquationSeriesRequestBindingResult {
  const resolution = resolveKpEquationSeriesIntents({
    request: input.request,
    proposals: input.proposals
  });
  if (resolution.status !== "resolved") return repair(resolution.repairs.map(
    (item, index) => diagnostic(
      "equation-series.planner.binding.unresolved",
      `$.adjacencies[${index}]`,
      `Planner proposal could not produce one operation: ${item.kind}.`,
      "Repair the planner proposal before binding semantic source evidence."
    )
  ));

  const registry = input.registry ??
    kpEquationSeriesGovernedSourceBindingRegistry;
  const sources = input.sources ?? [];
  const diagnostics: KpEquationSeriesExternalDiagnostic[] = [];
  const adjacencies = resolution.plans.map((plan, index) => {
    const adjacency = input.request.adjacencies[index]!;
    const declaration = plan.declaration;
    if (declaration.governed === undefined) return {
      ...adjacency,
      intent: {
        mode: "explicit" as const,
        operationId: plan.operationId,
        semanticArguments: {}
      }
    };
    const binder = registry.byOperationId[plan.operationId];
    if (binder === undefined) {
      diagnostics.push(diagnostic(
        "equation-series.governance.source.unresolved",
        `$.adjacencies[${index}].intent.semanticArguments`,
        `No governed source binder owns ${plan.operationId}.`,
        "Register exactly one source binder for the governed operation.",
        plan.operationId
      ));
      return adjacency;
    }
    const bound = binder.bind({
      adjacency,
      declaration,
      sources,
      path: `$.adjacencies[${index}].intent.semanticArguments`
    });
    if (bound.status !== "bound") {
      diagnostics.push(...bound.diagnostics);
      return adjacency;
    }
    return {
      ...adjacency,
      intent: {
        mode: "explicit" as const,
        operationId: plan.operationId,
        semanticArguments: bound.semanticArguments
      }
    };
  });
  if (diagnostics.length > 0) return repair(diagnostics);
  return deepFreeze({
    status: "bound" as const,
    request: {
      ...input.request,
      states: input.request.states.map((state) => ({ ...state })) as unknown as
        KpEquationTransformSeriesRequest["states"],
      adjacencies
    },
    diagnostics: [] as []
  });
}

function bindBothSides(
  input: KpEquationSeriesGovernedSourceBindingInput
): KpEquationSeriesGovernedSourceBindingResult {
  const declaration =
    kpEquationSeriesBothSidesAuthoringByOperationId[input.declaration.operationId];
  if (declaration === undefined) return sourceRepair(
    input,
    `No both-sides declaration owns ${input.declaration.operationId}.`
  );
  const selected = selectExactSource(input);
  if (selected.status !== "selected") return selected.result;
  const evidence = exactAdjacencyEvidence(selected.source, input.adjacency);
  if (evidence === undefined) return sourceRepair(
    input,
    "The selected source has no exact adjacency evidence."
  );
  const missingRoles = declaration.roleIds.filter((roleId) =>
    (evidence.roleBindings[roleId]?.length ?? 0) === 0
  );
  if (missingRoles.length > 0) return sourceRepair(
    input,
    `The selected source is missing roles: ${missingRoles.join(", ")}.`
  );
  const resolution = resolveKpEquationSeriesGovernedSource({
    requirement: {
      sourcePin: sourcePin(selected.source),
      operationId: declaration.operationId,
      requiredEntityIds: declaration.roleIds.flatMap((roleId) =>
        evidence.roleBindings[roleId] ?? []
      ),
      requiredAssumptionEvidenceIds:
        declaration.requiredAssumptionEvidenceIds,
      requiredAdjacency: adjacencyRequirement(input.adjacency),
      requiredCorrespondenceIds: evidence.correspondenceIds
    },
    sources: input.sources
  });
  if (resolution.status !== "resolved") return sourceRepair(
    input,
    `The governed source failed ${resolution.status}: ` +
      `${resolution.missingIds.join(", ")}.`
  );
  const roleBindings = Object.fromEntries(declaration.roleIds.map((roleId) => [
    roleId,
    [...evidence.roleBindings[roleId]!]
  ])) as unknown as KpEquationSeriesBothSidesSemanticArguments["roleBindings"];
  return bound({
    schemaVersion: "kp.equation-series.both-sides-intent.v1",
    sourcePin: sourcePin(selected.source),
    operationPin: { ...declaration.operationPin },
    roleBindings,
    assumptionEvidenceIds: [...declaration.requiredAssumptionEvidenceIds],
    correspondenceIds: [...evidence.correspondenceIds]
  } satisfies KpEquationSeriesBothSidesSemanticArguments);
}

function bindLogarithmBase(
  input: KpEquationSeriesGovernedSourceBindingInput
): KpEquationSeriesGovernedSourceBindingResult {
  const selected = selectExactSource(input);
  if (selected.status !== "selected") return selected.result;
  const evidence = exactAdjacencyEvidence(selected.source, input.adjacency);
  if (evidence === undefined) return sourceRepair(
    input,
    "The selected change-of-base source has no exact adjacency evidence."
  );
  const resolution = resolveKpEquationSeriesGovernedSource({
    requirement: {
      sourcePin: sourcePin(selected.source),
      operationId: KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID,
      requiredAssumptionEvidenceIds: selected.source.assumptionEvidenceIds,
      requiredSemanticContractKinds: [
        KP_LOGARITHM_BASE_AUTHORING_CONTRACT_KIND
      ],
      requiredAdjacency: adjacencyRequirement(input.adjacency),
      requiredCorrespondenceIds: evidence.correspondenceIds
    },
    sources: input.sources
  });
  if (resolution.status !== "resolved") return sourceRepair(
    input,
    `The change-of-base source failed ${resolution.status}: ` +
      `${resolution.missingIds.join(", ")}.`
  );
  const transformation = verifiedChangeOfBase(resolution.source);
  if (transformation === undefined) return sourceRepair(
    input,
    "The source contract is not authenticated change-of-base authority."
  );
  return bound({
    schemaVersion: "kp.equation-series.logarithm-base-intent.v1",
    sourcePin: sourcePin(selected.source),
    operationPin: {
      ...kpEquationSeriesLogarithmBaseAuthoringDeclaration.operationPin
    },
    semanticBindings: {
      sourceBaseSemanticId: transformation.source.base.semanticId,
      sourceArgumentSemanticId: transformation.source.argument.semanticId,
      targetLogarithmFunction: "natural-logarithm"
    },
    domainEvidenceIds: { ...transformation.domainEvidence },
    correspondenceIds: transformation.correspondence.map(({ id }) => id)
  } satisfies KpEquationSeriesLogarithmBaseSemanticArguments);
}

function bindFractionEquivalence(
  input: KpEquationSeriesGovernedSourceBindingInput
): KpEquationSeriesGovernedSourceBindingResult {
  const selected = selectExactSource(input);
  if (selected.status !== "selected") return selected.result;
  const evidence = exactAdjacencyEvidence(selected.source, input.adjacency);
  if (evidence === undefined) return sourceRepair(
    input,
    "The selected fraction-equivalence source has no exact adjacency evidence."
  );
  const resolution = resolveKpEquationSeriesGovernedSource({
    requirement: {
      sourcePin: sourcePin(selected.source),
      operationId: KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID,
      requiredEntityIds: Object.values(evidence.roleBindings).flat(),
      requiredAssumptionEvidenceIds: selected.source.assumptionEvidenceIds,
      requiredSemanticContractKinds: [
        KP_FRACTION_EQUIVALENCE_AUTHORING_CONTRACT_KIND
      ],
      requiredAdjacency: adjacencyRequirement(input.adjacency),
      requiredCorrespondenceIds: evidence.correspondenceIds
    },
    sources: input.sources
  });
  if (resolution.status !== "resolved") return sourceRepair(
    input,
    `The fraction-equivalence source failed ${resolution.status}: ` +
      `${resolution.missingIds.join(", ")}.`
  );
  const transformation = verifiedFractionEquivalence(resolution.source);
  if (transformation === undefined) return sourceRepair(
    input,
    "The source contract is not authenticated fraction-equivalence authority."
  );
  const roleIds =
    kpEquationSeriesFractionEquivalenceAuthoringDeclaration.roleIds;
  if (roleIds.some((roleId) =>
    (evidence.roleBindings[roleId]?.length ?? 0) !== 1
  )) return sourceRepair(
    input,
    "The source does not bind every fraction-equivalence role exactly once."
  );
  const roleBindings = Object.fromEntries(roleIds.map((roleId) => [
    roleId,
    [...evidence.roleBindings[roleId]!]
  ])) as unknown as
    KpEquationSeriesFractionEquivalenceSemanticArguments["roleBindings"];
  return bound({
    schemaVersion: "kp.equation-series.fraction-equivalence-intent.v1",
    sourcePin: sourcePin(selected.source),
    operationPin: {
      ...kpEquationSeriesFractionEquivalenceAuthoringDeclaration.operationPin
    },
    roleBindings,
    nonzeroEvidenceIds: { ...transformation.nonzeroEvidence },
    correspondenceIds: transformation.correspondence.map(({ id }) => id)
  } satisfies KpEquationSeriesFractionEquivalenceSemanticArguments);
}

function bindCommonDenominator(
  input: KpEquationSeriesGovernedSourceBindingInput
): KpEquationSeriesGovernedSourceBindingResult {
  const selected = selectExactSource(input);
  if (selected.status !== "selected") return selected.result;
  const evidence = exactAdjacencyEvidence(selected.source, input.adjacency);
  if (evidence === undefined) return sourceRepair(
    input,
    "The selected common-denominator source has no exact adjacency evidence."
  );
  const resolution = resolveKpEquationSeriesGovernedSource({
    requirement: {
      sourcePin: sourcePin(selected.source),
      operationId: KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID,
      requiredEntityIds: Object.values(evidence.roleBindings).flat(),
      requiredSemanticContractKinds: [
        KP_COMMON_DENOMINATOR_AUTHORING_CONTRACT_KIND
      ],
      requiredAdjacency: adjacencyRequirement(input.adjacency),
      requiredCorrespondenceIds: evidence.correspondenceIds
    },
    sources: input.sources
  });
  if (resolution.status !== "resolved") return sourceRepair(
    input,
    `The common-denominator source failed ${resolution.status}: ` +
      `${resolution.missingIds.join(", ")}.`
  );
  const transformation = verifiedCommonDenominator(resolution.source);
  if (transformation === undefined) return sourceRepair(
    input,
    "The source contract is not authenticated common-denominator authority."
  );
  const roleBindings = commonDenominatorRoleBindings(transformation);
  const expectedRoleIds =
    kpEquationSeriesCommonDenominatorAuthoringDeclaration.roleIds;
  if (expectedRoleIds.some((roleId) =>
    !equalIds(evidence.roleBindings[roleId], roleBindings[roleId])
  )) return sourceRepair(
    input,
    "The source does not bind every common-denominator role exactly."
  );
  return bound({
    schemaVersion:
      "kp.equation-series.common-denominator-alignment-intent.v1",
    sourcePin: sourcePin(selected.source),
    operationPin: {
      ...kpEquationSeriesCommonDenominatorAuthoringDeclaration.operationPin
    },
    roleBindings,
    correspondenceIds: transformation.correspondence.map(({ id }) => id)
  } satisfies KpEquationSeriesCommonDenominatorSemanticArguments);
}

function bindLikeDenominator(
  input: KpEquationSeriesGovernedSourceBindingInput
): KpEquationSeriesGovernedSourceBindingResult {
  const selected = selectExactSource(input);
  if (selected.status !== "selected") return selected.result;
  const evidence = exactAdjacencyEvidence(selected.source, input.adjacency);
  if (evidence === undefined) return sourceRepair(
    input,
    "The selected like-denominator source has no exact adjacency evidence."
  );
  const resolution = resolveKpEquationSeriesGovernedSource({
    requirement: {
      sourcePin: sourcePin(selected.source),
      operationId: KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID,
      requiredEntityIds: Object.values(evidence.roleBindings).flat(),
      requiredSemanticContractKinds: [
        KP_LIKE_DENOMINATOR_AUTHORING_CONTRACT_KIND
      ],
      requiredAdjacency: adjacencyRequirement(input.adjacency),
      requiredCorrespondenceIds: evidence.correspondenceIds
    },
    sources: input.sources
  });
  if (resolution.status !== "resolved") return sourceRepair(
    input,
    `The like-denominator source failed ${resolution.status}: ` +
      `${resolution.missingIds.join(", ")}.`
  );
  const transformation = verifiedLikeDenominator(resolution.source);
  if (transformation === undefined) return sourceRepair(
    input,
    "The source contract is not authenticated combination authority."
  );
  const roleBindings = likeDenominatorRoleBindings(transformation);
  const expectedRoleIds =
    kpEquationSeriesLikeDenominatorAuthoringDeclaration.roleIds;
  if (expectedRoleIds.some((roleId) =>
    !equalIds(evidence.roleBindings[roleId], roleBindings[roleId])
  )) return sourceRepair(
    input,
    "The source does not bind every like-denominator role exactly."
  );
  return bound({
    schemaVersion:
      "kp.equation-series.like-denominator-combination-intent.v1",
    sourcePin: sourcePin(selected.source),
    operationPin: {
      ...kpEquationSeriesLikeDenominatorAuthoringDeclaration.operationPin
    },
    roleBindings,
    correspondenceIds: transformation.correspondence.map(({ id }) => id)
  } satisfies KpEquationSeriesLikeDenominatorSemanticArguments);
}

function selectExactSource(input: KpEquationSeriesGovernedSourceBindingInput):
  | Readonly<{
      status: "selected";
      source: KpEquationSeriesVerifiedSemanticSource;
    }>
  | Readonly<{
      status: "repair-required";
      result: KpEquationSeriesGovernedSourceBindingResult;
    }> {
  const matches = input.sources.filter((source) =>
    source.operationIds.includes(input.declaration.operationId) &&
    exactAdjacencyEvidence(source, input.adjacency) !== undefined
  );
  if (matches.length !== 1) return Object.freeze({
    status: "repair-required" as const,
    result: sourceRepair(
      input,
      matches.length === 0
        ? `No exact source binds ${input.declaration.operationId} to ` +
          `${input.adjacency.id}.`
        : `Multiple exact sources bind ${input.declaration.operationId} to ` +
          `${input.adjacency.id}.`
    )
  });
  return Object.freeze({ status: "selected" as const, source: matches[0]! });
}

function exactAdjacencyEvidence(
  source: KpEquationSeriesVerifiedSemanticSource,
  adjacency: KpEquationTransformSeriesAdjacency
) {
  return source.adjacencyEvidence?.find((evidence) =>
    evidence.adjacencyId === adjacency.id &&
    evidence.fromStateId === adjacency.fromStateId &&
    evidence.toStateId === adjacency.toStateId
  );
}

function verifiedChangeOfBase(
  source: KpEquationSeriesVerifiedSemanticSource
): KpVerifiedLogarithmChangeOfBase | undefined {
  const authority = source.semanticContracts?.find(({ kind }) =>
    kind === KP_LOGARITHM_BASE_AUTHORING_CONTRACT_KIND
  )?.authority;
  return isKpVerifiedLogarithmChangeOfBase(authority) ? authority : undefined;
}

function verifiedFractionEquivalence(
  source: KpEquationSeriesVerifiedSemanticSource
): KpVerifiedFractionEquivalence | undefined {
  const authority = source.semanticContracts?.find(({ kind }) =>
    kind === KP_FRACTION_EQUIVALENCE_AUTHORING_CONTRACT_KIND
  )?.authority;
  return isKpVerifiedFractionEquivalence(authority) ? authority : undefined;
}

function verifiedCommonDenominator(
  source: KpEquationSeriesVerifiedSemanticSource
): KpVerifiedCommonDenominatorAlignment | undefined {
  const authority = source.semanticContracts?.find(({ kind }) =>
    kind === KP_COMMON_DENOMINATOR_AUTHORING_CONTRACT_KIND
  )?.authority;
  return isKpVerifiedCommonDenominatorAlignment(authority)
    ? authority
    : undefined;
}

function verifiedLikeDenominator(
  source: KpEquationSeriesVerifiedSemanticSource
): KpVerifiedLikeDenominatorCombination | undefined {
  const authority = source.semanticContracts?.find(({ kind }) =>
    kind === KP_LIKE_DENOMINATOR_AUTHORING_CONTRACT_KIND
  )?.authority;
  return isKpVerifiedLikeDenominatorCombination(authority)
    ? authority
    : undefined;
}

function equalIds(
  left: readonly string[] | undefined,
  right: readonly string[]
): boolean {
  return left !== undefined && left.length === right.length &&
    left.every((id, index) => id === right[index]);
}

function adjacencyRequirement(adjacency: KpEquationTransformSeriesAdjacency) {
  return {
    adjacencyId: adjacency.id,
    fromStateId: adjacency.fromStateId,
    toStateId: adjacency.toStateId
  };
}

function sourcePin(source: KpEquationSeriesVerifiedSemanticSource) {
  return { sourceId: source.sourceId, revisionId: source.revisionId };
}

function bound(
  semanticArguments: unknown
): KpEquationSeriesGovernedSourceBindingResult {
  return deepFreeze({ status: "bound" as const, semanticArguments });
}

function sourceRepair(
  input: KpEquationSeriesGovernedSourceBindingInput,
  message: string
): KpEquationSeriesGovernedSourceBindingResult {
  return repair([diagnostic(
    "equation-series.governance.source.unresolved",
    input.path,
    message,
    "Provide exactly one verified source for the operation and adjacency.",
    input.declaration.operationId
  )]);
}

function repair(
  diagnostics: readonly KpEquationSeriesExternalDiagnostic[]
): Extract<KpEquationSeriesGovernedSourceBindingResult,
  { readonly status: "repair-required" }> {
  return deepFreeze({ status: "repair-required" as const, diagnostics });
}

function diagnostic(
  code: string,
  path: string,
  message: string,
  repairInstruction: string,
  operationId?: string
): KpEquationSeriesExternalDiagnostic {
  return Object.freeze({
    code,
    path,
    message,
    repair: repairInstruction,
    ...(operationId === undefined ? {} : { operationId })
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
