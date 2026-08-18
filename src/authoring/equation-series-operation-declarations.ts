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

export interface KpEquationSeriesOperationDeclaration {
  readonly operationId: string;
  readonly source: "canonical-operation" | "equation-extension";
  readonly familyId: string;
  readonly recipeIds: readonly string[];
  readonly authorityRefIds: readonly string[];
  readonly roleIds: readonly string[];
  readonly canonicalComposition: readonly string[];
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

export const kpEquationSeriesOperationRegistry =
  createKpEquationSeriesOperationRegistry([
    ...kpCanonicalOperationRegistry.entries.map(canonicalDeclaration),
    ...extensionOperationRegistrations.map(extensionDeclaration),
    ...createKpHomomorphicCrossoverAuthoringOperations().map(
      promotedExtensionDeclaration
    )
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

function declaration(
  input: KpEquationSeriesOperationDeclaration
): KpEquationSeriesOperationDeclaration {
  return Object.freeze({
    ...input,
    recipeIds: Object.freeze([...input.recipeIds]),
    authorityRefIds: Object.freeze([...input.authorityRefIds]),
    roleIds: Object.freeze([...input.roleIds]),
    canonicalComposition: Object.freeze([...input.canonicalComposition])
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
