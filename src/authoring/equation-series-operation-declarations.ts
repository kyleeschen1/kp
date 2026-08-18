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
  kpEquationSeriesBothSidesAuthoringDeclarations,
  type KpEquationSeriesBothSidesAuthoringDeclaration
} from "./equation-series-both-sides-authoring.ts";

export interface KpEquationSeriesOperationDeclaration {
  readonly operationId: string;
  readonly source:
    | "canonical-operation"
    | "equation-extension"
    | "both-sides-operation";
  readonly familyId: string;
  readonly recipeIds: readonly string[];
  readonly authorityRefIds: readonly string[];
  readonly roleIds: readonly string[];
  readonly canonicalComposition: readonly string[];
  readonly bothSides?:
    KpEquationSeriesBothSidesAuthoringDeclaration | undefined;
}

export interface KpEquationSeriesOperationRegistry {
  readonly schemaVersion: "kp.equation-series-operation-registry.v1";
  readonly kind: "equation-series-operation-registry";
  readonly ids: readonly string[];
  readonly declarations: readonly KpEquationSeriesOperationDeclaration[];
  readonly byId: Readonly<Record<string, KpEquationSeriesOperationDeclaration>>;
}

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
  declarations: readonly KpEquationSeriesOperationDeclaration[]
): KpEquationSeriesOperationRegistry {
  const byId: Record<string, KpEquationSeriesOperationDeclaration> = {};
  declarations.forEach((input) => {
    if (byId[input.operationId] !== undefined) {
      throw new Error(`Duplicate equation series operation ${input.operationId}.`);
    }
    byId[input.operationId] = declaration(input);
  });
  return deepFreeze({
    schemaVersion: "kp.equation-series-operation-registry.v1" as const,
    kind: "equation-series-operation-registry" as const,
    ids: declarations.map(({ operationId }) => operationId),
    declarations: declarations.map(({ operationId }) => byId[operationId]!),
    byId
  });
}

const existingOperationDeclarations = [
    ...kpCanonicalOperationRegistry.entries.map(canonicalDeclaration),
    ...extensionOperationRegistrations.map(extensionDeclaration),
    ...createKpHomomorphicCrossoverAuthoringOperations().map(
      promotedExtensionDeclaration
    )
  ];

const bothSidesByOperationId = new Map(
  kpEquationSeriesBothSidesAuthoringDeclarations.map((entry) => [
    entry.operationId,
    entry
  ])
);

export const kpEquationSeriesOperationRegistry =
  createKpEquationSeriesOperationRegistry([
    ...existingOperationDeclarations.map((entry) => {
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
        bothSides
      };
    }),
    ...kpEquationSeriesBothSidesAuthoringDeclarations
      .filter(({ operationId }) => !existingOperationDeclarations.some(
        (entry) => entry.operationId === operationId
      ))
      .map(bothSidesDeclaration)
  ]);

function canonicalDeclaration(
  entry: KpCanonicalOperationRegistryEntry
): KpEquationSeriesOperationDeclaration {
  return declaration({
    operationId: entry.id,
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
    bothSides: entry
  });
}

function declaration(
  input: KpEquationSeriesOperationDeclaration
): KpEquationSeriesOperationDeclaration {
  return Object.freeze({
    ...input,
    recipeIds: Object.freeze([...input.recipeIds]),
    authorityRefIds: Object.freeze([...input.authorityRefIds]),
    roleIds: Object.freeze([...input.roleIds]),
    canonicalComposition: Object.freeze([...input.canonicalComposition]),
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

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
