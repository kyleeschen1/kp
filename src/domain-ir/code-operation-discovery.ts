import type {
  KpCodeRefactorLanguage
} from "./code-refactor-generation-request.ts";

export const KP_CODE_OPERATION_DISCOVERY_CATALOG_SCHEMA =
  "kp.code-operation-discovery-catalog.v1" as const;

export interface KpCodeOperationDiscoveryEntry {
  readonly operationId: string;
  readonly language: KpCodeRefactorLanguage;
  readonly friendlyName: string;
  readonly meaning: string;
  readonly aliases: readonly string[];
  readonly accepts: string;
  readonly produces: string;
  readonly support: readonly string[];
  readonly rejects: readonly string[];
  readonly positiveExamples: readonly string[];
  readonly counterexamples: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly supportScope: "bounded-extract-helper-only";
}

export interface KpCodeOperationDiscoveryCatalog {
  readonly schemaVersion: typeof KP_CODE_OPERATION_DISCOVERY_CATALOG_SCHEMA;
  readonly kind: "code-operation-discovery-catalog";
  readonly entries: readonly KpCodeOperationDiscoveryEntry[];
  readonly aliases: readonly Readonly<{
    language: KpCodeRefactorLanguage;
    alias: string;
    operationId: string;
  }>[];
}

export function normalizeKpCodeOperationAlias(value: string): string {
  return value.normalize("NFKC").trim().toLowerCase().replace(/\s+/gu, " ");
}
