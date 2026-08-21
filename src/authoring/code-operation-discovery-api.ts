import generatedCatalog from
  "./code-operation-discovery-catalog.generated.json" with { type: "json" };
import {
  normalizeKpCodeOperationAlias,
  type KpCodeOperationDiscoveryCatalog,
  type KpCodeOperationDiscoveryEntry
} from "../domain-ir/code-operation-discovery.ts";
import type { KpCodeRefactorLanguage } from
  "../domain-ir/code-refactor-generation-request.ts";

export type KpCodeOperationInspection =
  | Readonly<{
      status: "resolved";
      requested: string;
      normalizedAlias: string;
      capability: KpCodeOperationDiscoveryEntry;
    }>
  | Readonly<{
      status: "unknown";
      requested: string;
      normalizedAlias: string;
    }>;

export function createKpCodeOperationDiscoveryApi(
  catalog: KpCodeOperationDiscoveryCatalog =
    generatedCatalog as KpCodeOperationDiscoveryCatalog
) {
  const byId = new Map(catalog.entries.map((entry) => [entry.operationId, entry]));
  const aliases = new Map(catalog.aliases.map(({ language, alias, operationId }) =>
    [`${language}:${alias}`, operationId]
  ));
  return Object.freeze({
    schemaVersion: "kp.code-operation-discovery-api.v1" as const,
    list: (query = "", language?: KpCodeRefactorLanguage) => {
      const terms = normalizeKpCodeOperationAlias(query).split(" ").filter(Boolean);
      return Object.freeze(catalog.entries.filter((entry) => {
        if (language !== undefined && entry.language !== language) return false;
        const haystack = normalizeKpCodeOperationAlias([
          entry.operationId,
          entry.friendlyName,
          entry.meaning,
          ...entry.aliases,
          ...entry.support,
          ...entry.positiveExamples
        ].join(" "));
        return terms.every((term) => haystack.includes(term));
      }));
    },
    inspect: (
      language: KpCodeRefactorLanguage,
      requested: string
    ): KpCodeOperationInspection => {
      const normalizedAlias = normalizeKpCodeOperationAlias(requested);
      const operationId = aliases.get(`${language}:${normalizedAlias}`);
      const capability = operationId === undefined ? undefined : byId.get(operationId);
      return capability === undefined
        ? Object.freeze({ status: "unknown" as const, requested, normalizedAlias })
        : Object.freeze({
            status: "resolved" as const,
            requested,
            normalizedAlias,
            capability
          });
    }
  });
}
