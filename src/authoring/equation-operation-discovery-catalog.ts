import {
  kpEquationSeriesOperationRegistry,
  type KpEquationSeriesOperationRegistry
} from "./equation-series-operation-declarations.ts";

export interface KpEquationOperationDiscoveryCatalogEntry {
  readonly operationId: string;
  readonly familyId: string;
  readonly friendlyName: string;
  readonly aliases: readonly string[];
  readonly meaning: string;
  readonly positiveExamples: readonly string[];
  readonly counterexamples: readonly string[];
  readonly requiredEvidenceIds: readonly string[];
  readonly supportState: "available";
}

export interface KpEquationOperationDiscoveryAlias {
  readonly alias: string;
  readonly operationId: string;
}

export interface KpEquationOperationDiscoveryCatalog {
  readonly schemaVersion: "kp.equation-operation-discovery-catalog.v1";
  readonly kind: "equation-operation-discovery-catalog";
  readonly entries: readonly KpEquationOperationDiscoveryCatalogEntry[];
  readonly aliases: readonly KpEquationOperationDiscoveryAlias[];
}

/** One projection serves generated files, tools, and UI; none may hand-copy it. */
export function createKpEquationOperationDiscoveryCatalog(
  registry: KpEquationSeriesOperationRegistry =
    kpEquationSeriesOperationRegistry
): KpEquationOperationDiscoveryCatalog {
  const entries = registry.plannerIds.map((operationId) => {
    const declaration = registry.plannerById[operationId];
    if (declaration === undefined) {
      throw new Error(`Missing planner declaration ${operationId}.`);
    }
    return Object.freeze({
      operationId,
      familyId: declaration.familyId,
      friendlyName: declaration.discoverability.friendlyName,
      aliases: Object.freeze([...declaration.discoverability.aliases]),
      meaning: declaration.discoverability.meaning,
      positiveExamples: Object.freeze([
        ...declaration.discoverability.positiveExamples
      ]),
      counterexamples: Object.freeze([
        ...declaration.discoverability.counterexamples
      ]),
      requiredEvidenceIds: Object.freeze([
        ...declaration.discoverability.requiredEvidenceIds
      ]),
      supportState: "available" as const
    });
  });
  const aliasOwners = new Map<string, string>();
  registry.declarations.forEach((declaration) => {
    const aliases = [
      ...declaration.discoverability.aliases,
      declaration.operationId
    ];
    aliases.forEach((alias) => {
      const normalized = normalizeAlias(alias);
      const prior = aliasOwners.get(normalized);
      if (prior !== undefined && prior !== declaration.plannerOperationId) {
        throw new Error(
          `Discovery alias ${alias} is ambiguous between ${prior} and ` +
          `${declaration.plannerOperationId}.`
        );
      }
      aliasOwners.set(normalized, declaration.plannerOperationId);
    });
  });
  return deepFreeze({
    schemaVersion: "kp.equation-operation-discovery-catalog.v1" as const,
    kind: "equation-operation-discovery-catalog" as const,
    entries,
    aliases: [...aliasOwners.entries()]
      .map(([alias, operationId]) => ({ alias, operationId }))
      .sort((left, right) => left.alias.localeCompare(right.alias))
  });
}

export function normalizeKpEquationOperationAlias(value: string): string {
  return normalizeAlias(value);
}

function normalizeAlias(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replaceAll("×", " times ")
    .replace(/\s+/gu, " ");
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
