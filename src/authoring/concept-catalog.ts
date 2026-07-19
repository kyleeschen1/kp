import type { KpPublishedConceptArtifact } from "./publish-concept.ts";

export interface KpGeneratedConceptCatalogEntry {
  readonly conceptId: string;
  readonly version: string;
  readonly canonicalPath: string;
  readonly legacyAliases: readonly string[];
  readonly title: string;
  readonly summary: string;
  readonly searchableText: string;
  readonly checkpointIds: readonly string[];
  readonly preload: readonly string[];
  readonly load: () => Promise<KpPublishedConceptArtifact>;
}

export function defineConceptCatalog<const Entries extends readonly KpGeneratedConceptCatalogEntry[]>(
  entries: Entries
): readonly Entries[number][] {
  const ordered = [...entries].sort((left, right) =>
    left.conceptId.localeCompare(right.conceptId) || left.version.localeCompare(right.version)
  );
  const versionKeys = ordered.map((entry) => `${entry.conceptId}@${entry.version}`);
  ordered.forEach(requireCatalogEntry);
  if (new Set(versionKeys).size !== versionKeys.length) {
    throw new Error("Duplicate concept ID and version in generated catalog.");
  }
  const routeOwners = new Map<string, string>();
  for (const entry of ordered) {
    for (const route of [entry.canonicalPath, ...entry.legacyAliases]) {
      const owner = routeOwners.get(route);
      if (owner !== undefined) throw new Error(`Duplicate concept route ${route}: ${owner} and ${entry.conceptId}.`);
      routeOwners.set(route, entry.conceptId);
    }
  }
  ordered.forEach((entry) => deepFreeze(entry));
  return Object.freeze(ordered);
}

function requireCatalogEntry(entry: KpGeneratedConceptCatalogEntry): void {
  if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(entry.conceptId)) {
    throw new Error(`Invalid catalog concept ID: ${entry.conceptId}.`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(entry.version)) {
    throw new Error(`Invalid catalog version for ${entry.conceptId}: ${entry.version}.`);
  }
  if (!/^\/concepts\/[a-z0-9/-]+$/.test(entry.canonicalPath)) {
    throw new Error(`Invalid canonical route for ${entry.conceptId}: ${entry.canonicalPath}.`);
  }
  if (entry.title.length === 0 || entry.summary.length === 0 || entry.searchableText.length === 0) {
    throw new Error(`Missing search metadata for ${entry.conceptId}.`);
  }
  if (entry.checkpointIds.length === 0 || new Set(entry.checkpointIds).size !== entry.checkpointIds.length) {
    throw new Error(`Invalid checkpoint metadata for ${entry.conceptId}.`);
  }
}

type DeepReadonly<Value> = Value extends readonly (infer Item)[]
  ? readonly DeepReadonly<Item>[]
  : Value extends object
    ? { readonly [Key in keyof Value]: DeepReadonly<Value[Key]> }
    : Value;

function deepFreeze<Value>(value: Value): DeepReadonly<Value> {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value as DeepReadonly<Value>;
  }
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value) as DeepReadonly<Value>;
}
