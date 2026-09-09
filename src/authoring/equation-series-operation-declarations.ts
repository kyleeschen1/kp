import { KP_COMMON_FACTOR_OPERATION, kpCommonFactorGovernance } from "./equation-series-common-factor-authoring.ts";
import {
  kpFunctionWrapOperationRegistration
} from "../animation/equation-extension-packs/function-wrap.ts";
import {
  kpLogProductHomomorphicOperationRegistration,
  kpLogQuotientHomomorphicOperationRegistration
} from "../animation/equation-extension-packs/homomorphic-crossover.ts";
import type { KpEquationOperationRegistration } from
  "../domain-ir/equation-extension-registry.ts";
import {
  kpCanonicalOperationRegistry,
  type KpCanonicalOperationRegistryEntry
} from "../semantic/canonical-operation-registry.ts";
import { createKpHomomorphicCrossoverAuthoringOperations } from
  "./homomorphic-crossover-authoring.ts";
import type { KpLlmPromotedOperationAuthoringDefinition } from
  "../animation/llm-semantic-motion-operation-authoring.ts";
import {
  KP_BOTH_SIDES_EQUATION_SERIES_AUTHORING_AUTHORITY,
  kpEquationSeriesBothSidesAuthoringDeclarations,
  type KpEquationSeriesBothSidesAuthoringDeclaration
} from "./equation-series-both-sides-authoring.ts";
import {
  kpEquationSeriesLogarithmBaseAuthoringDeclaration
} from "./equation-series-logarithm-base-authoring.ts";
import {
  kpEquationSeriesFractionEquivalenceAuthoringDeclaration
} from "./equation-series-fraction-equivalence-authoring.ts";
import {
  KP_COMMON_DENOMINATOR_SOURCE_OPERATION_ALIASES,
  kpEquationSeriesCommonDenominatorAuthoringDeclaration
} from "./equation-series-common-denominator-authoring.ts";
import {
  kpEquationSeriesLikeDenominatorAuthoringDeclaration
} from "./equation-series-like-denominator-authoring.ts";
import {
  resolveKpOperationEvaluationAuthority
} from "../semantic/operation-evaluation-authority.ts";
import {
  compileKpEquationOperationDiscoverability,
  type KpEquationOperationDiscoverability
} from "./equation-operation-discoverability.ts";

export interface KpEquationSeriesGovernedRequirements {
  readonly authoringAuthorityId: string;
  readonly operationPin: Readonly<{ packId: string; version: string }>;
  readonly requiredEvidenceIds: readonly string[];
}

export type KpEquationSeriesPlannerExposure =
  | Readonly<{
      readonly kind: "exposed";
      readonly summary: string;
    }>
  | Readonly<{
      readonly kind: "alias";
      readonly canonicalOperationId: string;
    }>;

export interface KpEquationSeriesOperationDeclaration {
  readonly operationId: string;
  readonly plannerOperationId: string;
  readonly plannerExposure: KpEquationSeriesPlannerExposure;
  readonly source:
    | "canonical-operation"
    | "equation-extension"
    | "both-sides-operation"
    | "governed-operation";
  readonly familyId: string;
  readonly recipeIds: readonly string[];
  readonly authorityRefIds: readonly string[];
  readonly roleIds: readonly string[];
  readonly canonicalComposition: readonly string[];
  readonly discoverability: KpEquationOperationDiscoverability;
  readonly bothSides?:
    KpEquationSeriesBothSidesAuthoringDeclaration | undefined;
  readonly governed?: KpEquationSeriesGovernedRequirements | undefined;
}

export interface KpEquationSeriesOperationRegistry {
  readonly schemaVersion: "kp.equation-series-operation-registry.v1";
  readonly kind: "equation-series-operation-registry";
  readonly ids: readonly string[];
  readonly plannerIds: readonly string[];
  readonly declarations: readonly KpEquationSeriesOperationDeclaration[];
  readonly byId: Readonly<Record<string, KpEquationSeriesOperationDeclaration>>;
  readonly plannerById:
    Readonly<Record<string, KpEquationSeriesOperationDeclaration>>;
}

export type KpEquationSeriesOperationDeclarationInput =
  Omit<
    KpEquationSeriesOperationDeclaration,
    "plannerOperationId" | "discoverability"
  > &
  Readonly<{ readonly plannerOperationId?: string | undefined }>;

const extensionOperationRegistrations = Object.freeze([
  kpFunctionWrapOperationRegistration,
  kpLogProductHomomorphicOperationRegistration,
  kpLogQuotientHomomorphicOperationRegistration
] satisfies readonly KpEquationOperationRegistration[]);

/**
 * The registry joins semantic authorities without flattening their contracts:
 * canonical operations retain packs/composition, while extension operations
 * retain family/recipe ownership.
 */
export function createKpEquationSeriesOperationRegistry(
  declarations: readonly KpEquationSeriesOperationDeclarationInput[]
): KpEquationSeriesOperationRegistry {
  const byId: Record<string, KpEquationSeriesOperationDeclaration> = {};
  const normalized = declarations.map(declaration);
  normalized.forEach((input) => {
    if (byId[input.operationId] !== undefined) {
      throw new Error(`Duplicate equation series operation ${input.operationId}.`);
    }
    byId[input.operationId] = input;
    const expectedPlannerOperationId = input.plannerExposure.kind === "exposed"
      ? input.operationId
      : input.plannerExposure.canonicalOperationId;
    if (input.plannerOperationId !== expectedPlannerOperationId) {
      throw new Error(
        `Planner exposure for ${input.operationId} disagrees with ` +
        `planner operation ${input.plannerOperationId}.`
      );
    }
  });
  const plannerIds = unique(normalized.map(({ plannerOperationId }) =>
    plannerOperationId
  ));
  const plannerById = Object.fromEntries(plannerIds.map((plannerOperationId) => {
    const owner = byId[plannerOperationId];
    if (
      owner === undefined ||
      owner.plannerOperationId !== owner.operationId ||
      owner.plannerExposure.kind !== "exposed"
    ) {
      throw new Error(
        `Planner operation ${plannerOperationId} requires one self-canonical declaration.`
      );
    }
    return [plannerOperationId, owner] as const;
  }));
  return deepFreeze({
    schemaVersion: "kp.equation-series-operation-registry.v1" as const,
    kind: "equation-series-operation-registry" as const,
    ids: normalized.map(({ operationId }) => operationId),
    plannerIds,
    declarations: normalized,
    byId,
    plannerById
  });
}

const promotedExtensionDeclarations =
  createKpHomomorphicCrossoverAuthoringOperations().map(
    promotedExtensionDeclaration
  );
const promotedExtensionIds = new Set<string>(promotedExtensionDeclarations.map(
  ({ operationId }) => operationId
));
const extensionIds = new Set<string>(extensionOperationRegistrations.map(
  ({ id }) => id
));
const existingOperationDeclarations = [
    // Specialized authoring projections replace a canonical catalogue view;
    // they do not create a second authority for the same operation identity.
    ...kpCanonicalOperationRegistry.entries
      .filter(({ id }) => !extensionIds.has(id) &&
        !promotedExtensionIds.has(id))
      .map(canonicalDeclaration),
    ...extensionOperationRegistrations
      .filter(({ id }) => !promotedExtensionIds.has(id))
      .map(extensionDeclaration),
    ...promotedExtensionDeclarations
  ];

const bothSidesByOperationId = new Map(
  kpEquationSeriesBothSidesAuthoringDeclarations.map((entry) => [
    entry.operationId,
    entry
  ])
);

const specializedGovernedDeclarations = [
  logarithmBaseDeclaration(),
  fractionEquivalenceDeclaration(),
  commonDenominatorDeclaration(),
  ...commonDenominatorAliasDeclarations(),
  likeDenominatorDeclaration(),
  commonDenominatorProductEvaluationDeclaration()
];
const specializedGovernedIds = new Set(specializedGovernedDeclarations.map(
  ({ operationId }) => operationId
));

export const kpEquationSeriesOperationRegistry =
  createKpEquationSeriesOperationRegistry([
    ...existingOperationDeclarations
      .filter(({ operationId }) => !specializedGovernedIds.has(operationId))
      .map((entry) => {
      if (entry.operationId === KP_COMMON_FACTOR_OPERATION) return { ...entry, governed: kpCommonFactorGovernance };
      const bothSides = bothSidesByOperationId.get(entry.operationId);
      return bothSides === undefined ? entry : {
        ...entry,
        familyId: bothSides.operationPin.packId,
        authorityRefIds: unique([
          ...entry.authorityRefIds,
          bothSides.semanticAuthorityId,
          bothSides.lawId,
          ...bothSides.requiredAssumptionEvidenceIds
        ]),
        roleIds: bothSides.roleIds,
        governed: {
          authoringAuthorityId:
            KP_BOTH_SIDES_EQUATION_SERIES_AUTHORING_AUTHORITY,
          operationPin: bothSides.operationPin,
          requiredEvidenceIds: bothSides.requiredAssumptionEvidenceIds
        },
        bothSides
      };
    }),
    ...kpEquationSeriesBothSidesAuthoringDeclarations
      .filter(({ operationId }) => !existingOperationDeclarations.some(
        (entry) => entry.operationId === operationId
      ))
      .map(bothSidesDeclaration),
    ...specializedGovernedDeclarations
  ]);

function canonicalDeclaration(
  entry: KpCanonicalOperationRegistryEntry
): KpEquationSeriesOperationDeclaration {
  return declaration({
    operationId: entry.id,
    plannerOperationId: entry.id,
    plannerExposure: {
      kind: "exposed",
      summary: requiredPlannerSummary(entry.id, entry.authoringSummary)
    },
    source: "canonical-operation",
    familyId: entry.packId,
    recipeIds: [],
    authorityRefIds: unique([
      entry.contract.authority.refId,
      ...entry.contract.lawIds
    ]),
    roleIds: entry.contract.roles.map(({ id }) => id),
    canonicalComposition: entry.canonicalComposition
  });
}

function extensionDeclaration(
  entry: KpEquationOperationRegistration
): KpEquationSeriesOperationDeclaration {
  return declaration({
    operationId: entry.id,
    plannerOperationId: entry.canonicalAuthoringOperationId ?? entry.id,
    plannerExposure: entry.canonicalAuthoringOperationId === undefined
      ? {
          kind: "exposed",
          summary: requiredPlannerSummary(entry.id, entry.plannerSummary)
        }
      : {
          kind: "alias",
          canonicalOperationId: entry.canonicalAuthoringOperationId
        },
    source: "equation-extension",
    familyId: entry.familyId,
    recipeIds: entry.recipeIds,
    authorityRefIds: entry.semanticAuthorityIds,
    roleIds: [],
    // The registered extension operation is the adjacency's semantic unit.
    canonicalComposition: [entry.id]
  });
}

function promotedExtensionDeclaration(
  entry: KpLlmPromotedOperationAuthoringDefinition
): KpEquationSeriesOperationDeclaration {
  if (entry.extensionAuthority === undefined) {
    throw new Error(
      `Promoted extension operation ${entry.operationId} lacks extension authority.`
    );
  }
  return declaration({
    operationId: entry.operationId,
    plannerOperationId: entry.operationId,
    plannerExposure: {
      kind: "exposed",
      summary: requiredPlannerSummary(entry.operationId, entry.summary)
    },
    source: "equation-extension",
    familyId: entry.operationPack.packId,
    recipeIds: [entry.extensionAuthority.recipeId],
    authorityRefIds: entry.extensionAuthority.semanticAuthorityIds,
    roleIds: entry.roles.map(({ id }) => id),
    canonicalComposition: entry.canonicalComposition
  });
}

function bothSidesDeclaration(
  entry: KpEquationSeriesBothSidesAuthoringDeclaration
): KpEquationSeriesOperationDeclaration {
  return declaration({
    operationId: entry.operationId,
    plannerOperationId: entry.operationId,
    plannerExposure: {
      kind: "exposed",
      summary: requiredPlannerSummary(entry.operationId, entry.authoringSummary)
    },
    source: "both-sides-operation",
    familyId: entry.operationPin.packId,
    recipeIds: [],
    authorityRefIds: [
      entry.semanticAuthorityId,
      entry.lawId,
      ...entry.requiredAssumptionEvidenceIds
    ],
    roleIds: entry.roleIds,
    canonicalComposition: [entry.operationId],
    governed: {
      authoringAuthorityId:
        KP_BOTH_SIDES_EQUATION_SERIES_AUTHORING_AUTHORITY,
      operationPin: entry.operationPin,
      requiredEvidenceIds: entry.requiredAssumptionEvidenceIds
    },
    bothSides: entry
  });
}

function logarithmBaseDeclaration():
KpEquationSeriesOperationDeclaration {
  const entry = kpEquationSeriesLogarithmBaseAuthoringDeclaration;
  return declaration({
    operationId: entry.operationId,
    plannerOperationId: entry.operationId,
    plannerExposure: {
      kind: "exposed",
      summary: requiredPlannerSummary(entry.operationId, entry.authoringSummary)
    },
    source: "governed-operation",
    familyId: entry.familyId,
    recipeIds: entry.recipeIds,
    authorityRefIds: unique([
      entry.authoringAuthorityId,
      entry.semanticAuthorityId,
      entry.lawId,
      ...entry.motifIds
    ]),
    roleIds: entry.roleIds,
    canonicalComposition: [entry.operationId],
    governed: {
      authoringAuthorityId: entry.authoringAuthorityId,
      operationPin: entry.operationPin,
      requiredEvidenceIds: entry.requiredEvidenceIds
    }
  });
}

function fractionEquivalenceDeclaration():
KpEquationSeriesOperationDeclaration {
  const entry = kpEquationSeriesFractionEquivalenceAuthoringDeclaration;
  return declaration({
    operationId: entry.operationId,
    plannerOperationId: entry.operationId,
    plannerExposure: {
      kind: "exposed",
      summary: requiredPlannerSummary(entry.operationId, entry.authoringSummary)
    },
    source: "governed-operation",
    familyId: entry.familyId,
    recipeIds: entry.recipeIds,
    authorityRefIds: unique([
      entry.authoringAuthorityId,
      entry.semanticAuthorityId,
      entry.lawId,
      ...entry.motifIds
    ]),
    roleIds: entry.roleIds,
    canonicalComposition: [entry.operationId],
    governed: {
      authoringAuthorityId: entry.authoringAuthorityId,
      operationPin: entry.operationPin,
      requiredEvidenceIds: entry.requiredEvidenceIds
    }
  });
}

function commonDenominatorDeclaration():
KpEquationSeriesOperationDeclaration {
  const entry = kpEquationSeriesCommonDenominatorAuthoringDeclaration;
  return declaration({
    operationId: entry.operationId,
    plannerOperationId: entry.operationId,
    plannerExposure: {
      kind: "exposed",
      summary: requiredPlannerSummary(entry.operationId, entry.authoringSummary)
    },
    source: "governed-operation",
    familyId: entry.familyId,
    recipeIds: entry.recipeIds,
    authorityRefIds: unique([
      entry.authoringAuthorityId,
      entry.semanticAuthorityId,
      entry.lawId
    ]),
    roleIds: entry.roleIds,
    canonicalComposition: [entry.operationId],
    governed: {
      authoringAuthorityId: entry.authoringAuthorityId,
      operationPin: entry.operationPin,
      requiredEvidenceIds: entry.requiredEvidenceIds
    }
  });
}

function commonDenominatorAliasDeclarations():
readonly KpEquationSeriesOperationDeclaration[] {
  const canonical = kpEquationSeriesCommonDenominatorAuthoringDeclaration;
  return KP_COMMON_DENOMINATOR_SOURCE_OPERATION_ALIASES.map((operationId) =>
    declaration({
      operationId,
      plannerOperationId: canonical.operationId,
      plannerExposure: {
        kind: "alias",
        canonicalOperationId: canonical.operationId
      },
      source: "governed-operation",
      familyId: canonical.familyId,
      recipeIds: [],
      authorityRefIds: [canonical.semanticAuthorityId, canonical.lawId],
      roleIds: canonical.roleIds,
      canonicalComposition: [canonical.operationId]
    })
  );
}

function likeDenominatorDeclaration():
KpEquationSeriesOperationDeclaration {
  const entry = kpEquationSeriesLikeDenominatorAuthoringDeclaration;
  return declaration({
    operationId: entry.operationId,
    plannerOperationId: entry.operationId,
    plannerExposure: {
      kind: "exposed",
      summary: requiredPlannerSummary(entry.operationId, entry.authoringSummary)
    },
    source: "governed-operation",
    familyId: entry.familyId,
    recipeIds: entry.recipeIds,
    authorityRefIds: unique([
      entry.authoringAuthorityId,
      entry.semanticAuthorityId,
      entry.lawId
    ]),
    roleIds: entry.roleIds,
    canonicalComposition: [entry.operationId],
    governed: {
      authoringAuthorityId: entry.authoringAuthorityId,
      operationPin: entry.operationPin,
      requiredEvidenceIds: entry.requiredEvidenceIds
    }
  });
}

function commonDenominatorProductEvaluationDeclaration():
KpEquationSeriesOperationDeclaration {
  const entry = resolveKpOperationEvaluationAuthority(
    "simplifyConstantProduct"
  );
  const operationId = entry.semanticOperationIds[0]!;
  return declaration({
    operationId,
    plannerOperationId: operationId,
    plannerExposure: {
      kind: "exposed",
      summary:
        "Evaluate an authored constant product while preserving its surrounding expression."
    },
    source: "equation-extension",
    familyId: "family.equation.operation-evaluation.v1",
    recipeIds: [entry.presentationId],
    authorityRefIds: entry.semanticOperationIds,
    roleIds: [],
    canonicalComposition: [operationId]
  });
}

function declaration(
  input: KpEquationSeriesOperationDeclarationInput
): KpEquationSeriesOperationDeclaration {
  const plannerOperationId = input.plannerOperationId ?? input.operationId;
  return Object.freeze({
    ...input,
    plannerOperationId,
    recipeIds: Object.freeze([...input.recipeIds]),
    authorityRefIds: Object.freeze([...input.authorityRefIds]),
    roleIds: Object.freeze([...input.roleIds]),
    canonicalComposition: Object.freeze([...input.canonicalComposition]),
    discoverability: compileKpEquationOperationDiscoverability({
      operationId: input.operationId,
      plannerOperationId,
      plannerExposure: input.plannerExposure,
      authorityRefIds: unique([
        ...input.authorityRefIds,
        input.familyId,
        ...input.recipeIds
      ]),
      governedRequiredEvidenceIds: input.governed?.requiredEvidenceIds
    }),
    ...(input.governed === undefined ? {} : {
      governed: deepFreeze({
        ...input.governed,
        operationPin: { ...input.governed.operationPin },
        requiredEvidenceIds: [...input.governed.requiredEvidenceIds]
      })
    }),
    ...(input.bothSides === undefined ? {} : {
      bothSides: deepFreeze({
        ...input.bothSides,
        operationPin: { ...input.bothSides.operationPin },
        roleIds: input.bothSides.roleIds,
        requiredAssumptionEvidenceIds: [
          ...input.bothSides.requiredAssumptionEvidenceIds
        ]
      })
    })
  });
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function requiredPlannerSummary(
  operationId: string,
  summary: string | undefined
): string {
  if (summary === undefined || summary.trim().length === 0) {
    throw new Error(
      `Exposed planner operation ${operationId} requires an authoring summary.`
    );
  }
  return summary;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
