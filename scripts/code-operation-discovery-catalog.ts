import {
  createKpAnimationDomainFrontendCandidates
} from "../src/architecture/animation-domain-frontend-candidates.ts";
import {
  KP_CODE_OPERATION_DISCOVERY_CATALOG_SCHEMA,
  normalizeKpCodeOperationAlias,
  type KpCodeOperationDiscoveryCatalog,
  type KpCodeOperationDiscoveryEntry
} from "../src/domain-ir/code-operation-discovery.ts";
import { kpPythonCodeAuthoringDescriptor } from
  "./python-code-generation-authoring.ts";
import { kpTypeScriptCodeAuthoringDescriptor } from
  "./typescript-code-generation-authoring.ts";

export function createKpCodeOperationDiscoveryCatalog():
KpCodeOperationDiscoveryCatalog {
  const candidates = createKpAnimationDomainFrontendCandidates().candidates;
  const descriptors = [
    kpTypeScriptCodeAuthoringDescriptor,
    kpPythonCodeAuthoringDescriptor
  ] as const;
  const entries = descriptors.map((descriptor): KpCodeOperationDiscoveryEntry => {
    const candidate = candidates.find(({ language }) =>
      language === descriptor.language
    );
    if (candidate === undefined) {
      throw new Error(`Missing ${descriptor.language} frontend evidence obligations.`);
    }
    return deepFreeze({
      operationId: descriptor.operationId,
      language: descriptor.language,
      friendlyName: descriptor.language === "typescript"
        ? "Extract a TypeScript helper"
        : "Extract a Python helper",
      meaning:
        "Replace equivalent decisions in distinct functions with one named helper and one call per contributor.",
      aliases: uniqueStrings([
        descriptor.operationId,
        ...descriptor.aliases,
        `${descriptor.language} extract helper`,
        `extract ${descriptor.language} helper`
      ]),
      accepts: descriptor.accepts,
      produces: descriptor.produces,
      support: [...descriptor.support],
      rejects: [...descriptor.rejects],
      positiveExamples: [...descriptor.positiveExamples],
      counterexamples: [...descriptor.counterexamples],
      requiredEvidence: [...candidate.proofObligations],
      supportScope: "bounded-extract-helper-only" as const
    });
  });
  if (new Set(entries.map(({ operationId }) => operationId)).size !== entries.length) {
    throw new Error("Code operation discovery IDs must be unique.");
  }
  const aliases = entries.flatMap((entry) => entry.aliases.map((alias) => ({
    language: entry.language,
    alias: normalizeKpCodeOperationAlias(alias),
    operationId: entry.operationId
  })));
  const aliasKeys = aliases.map(({ language, alias }) => `${language}:${alias}`);
  if (new Set(aliasKeys).size !== aliasKeys.length) {
    throw new Error("Code operation aliases must be unique within each language.");
  }
  return deepFreeze({
    schemaVersion: KP_CODE_OPERATION_DISCOVERY_CATALOG_SCHEMA,
    kind: "code-operation-discovery-catalog" as const,
    entries,
    aliases
  });
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
