import {
  isKpCompiledEquationGrammarV2,
  type KpCompiledEquationGrammarV2
} from "./equation-grammar-v2.ts";
import {
  kpCanonicalOperationRegistry,
  resolveKpCanonicalOperation,
  type KpCanonicalOperationRegistry,
  type KpCanonicalOperationRegistryEntry
} from "../semantic/canonical-operation-registry.ts";
import type { KpCanonicalOperationId } from
  "../semantic/canonical-operation.ts";

export const kpResolvedEquationGrammarOperationsV2SchemaVersion =
  "kp.equation-grammar-operation-resolution.v2" as const;

export interface KpResolvedEquationTransitionOperationV2 {
  readonly transitionId: string;
  readonly transformationId: string;
  readonly operationId: string;
  readonly operationPack: {
    readonly packId: string;
    readonly version: string;
  };
  readonly canonicalComposition: readonly KpCanonicalOperationId[];
  readonly semanticAuthorityIds: readonly string[];
  readonly resolutionSource: "transition-declaration";
  readonly contract: KpCanonicalOperationRegistryEntry["contract"];
}

declare const kpResolvedEquationOperationsAuthority: unique symbol;

export type KpResolvedEquationGrammarOperationsV2 = Readonly<{
  readonly schemaVersion:
    typeof kpResolvedEquationGrammarOperationsV2SchemaVersion;
  readonly kind: "resolved-equation-grammar-operations-v2";
  readonly grammarId: string;
  readonly assetId: string;
  readonly policyEpochId: "policy.animation.governance-v2.preview.1";
  readonly hostClock: "kp.shared-normalized-clock.v1";
  readonly transitions: readonly KpResolvedEquationTransitionOperationV2[];
  readonly [kpResolvedEquationOperationsAuthority]: true;
}>;

export interface KpEquationOperationResolutionDiagnosticV2 {
  readonly code:
    | "operation-resolution.grammar-uncompiled"
    | "operation-resolution.unknown-operation"
    | "operation-resolution.missing-pin"
    | "operation-resolution.version-mismatch";
  readonly transitionId?: string | undefined;
  readonly operationId?: string | undefined;
  readonly message: string;
}

export type KpEquationOperationResolutionResultV2 =
  | {
      readonly status: "resolved";
      readonly resolution: KpResolvedEquationGrammarOperationsV2;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "repair-required";
      readonly diagnostics:
        readonly KpEquationOperationResolutionDiagnosticV2[];
    };

const resolvedEquationOperations = new WeakSet<object>();

export function resolveKpEquationGrammarV2Operations(
  grammar: KpCompiledEquationGrammarV2,
  registry: KpCanonicalOperationRegistry = kpCanonicalOperationRegistry
): KpEquationOperationResolutionResultV2 {
  if (!isKpCompiledEquationGrammarV2(grammar)) {
    return repairRequired([{
      code: "operation-resolution.grammar-uncompiled",
      message: "Operation resolution requires compiler-minted equation grammar v2."
    }]);
  }
  const pins = {
    schemaVersion: "kp.canonical-operation-pins.v1" as const,
    packs: grammar.semanticSource.operationPacks
  };
  const diagnostics: KpEquationOperationResolutionDiagnosticV2[] = [];
  const transitions: KpResolvedEquationTransitionOperationV2[] = [];
  grammar.transitions.forEach((transition) => {
    const operationId = transition.operation.operationId;
    const result = resolveKpCanonicalOperation({
      registry,
      pins,
      operationId
    });
    if (result.status !== "resolved") {
      diagnostics.push({
        code: `operation-resolution.${result.status}`,
        transitionId: transition.id,
        operationId,
        message: result.message
      });
      return;
    }
    transitions.push(Object.freeze({
      transitionId: transition.id,
      transformationId: transition.transformationId,
      operationId,
      operationPack: Object.freeze({
        packId: result.pack.id,
        version: result.pack.version
      }),
      canonicalComposition: Object.freeze([
        ...result.entry.canonicalComposition
      ]),
      semanticAuthorityIds: Object.freeze([
        ...transition.operation.semanticAuthorityIds
      ]),
      resolutionSource: "transition-declaration" as const,
      contract: result.entry.contract
    }));
  });
  if (diagnostics.length > 0) return repairRequired(diagnostics);

  // The host owns the only clock. Per-transition operation records therefore
  // cannot quietly reintroduce caller timing while the grammar is compiled.
  const resolution = Object.freeze({
    schemaVersion: kpResolvedEquationGrammarOperationsV2SchemaVersion,
    kind: "resolved-equation-grammar-operations-v2" as const,
    grammarId: grammar.id,
    assetId: grammar.assetId,
    policyEpochId: grammar.policyEpochId,
    hostClock: grammar.clock.authority,
    transitions: Object.freeze(transitions)
  }) as unknown as KpResolvedEquationGrammarOperationsV2;
  resolvedEquationOperations.add(resolution);
  return Object.freeze({
    status: "resolved" as const,
    resolution,
    diagnostics: Object.freeze([]) as readonly []
  });
}

export function isKpResolvedEquationGrammarOperationsV2(
  value: unknown
): value is KpResolvedEquationGrammarOperationsV2 {
  return typeof value === "object" && value !== null &&
    resolvedEquationOperations.has(value);
}

export const kpLegacyEquationOperationCompatibilitySchemaVersion =
  "kp.equation-operation-resolution-compatibility.v1" as const;

export interface KpLegacyEquationOperationCompatibilityInput {
  readonly assetId: string;
  readonly defaultOperationId: string;
  readonly transformationIds: readonly string[];
  readonly reason: string;
  readonly evidenceIds: readonly string[];
}

export interface KpLegacyEquationOperationCompatibilityRecord {
  readonly schemaVersion:
    typeof kpLegacyEquationOperationCompatibilitySchemaVersion;
  readonly kind: "legacy-asset-default";
  readonly compatibilityOnly: true;
  readonly assetId: string;
  readonly defaultOperationId: string;
  readonly transformationIds: readonly string[];
  readonly reason: string;
  readonly evidenceIds: readonly string[];
}

export function createKpLegacyEquationOperationCompatibilityRecord(
  input: KpLegacyEquationOperationCompatibilityInput
): KpLegacyEquationOperationCompatibilityRecord {
  const hasBlankIdentity = [
    input.assetId,
    input.defaultOperationId,
    input.reason
  ].some((value) => value.trim() === "");
  if (hasBlankIdentity || input.transformationIds.length === 0 ||
      input.evidenceIds.length === 0) {
    throw new Error(
      "Legacy asset defaults require identity, affected transformations, " +
      "a reason, and evidence."
    );
  }
  return Object.freeze({
    schemaVersion: kpLegacyEquationOperationCompatibilitySchemaVersion,
    kind: "legacy-asset-default" as const,
    compatibilityOnly: true as const,
    assetId: input.assetId,
    defaultOperationId: input.defaultOperationId,
    transformationIds: Object.freeze([...input.transformationIds]),
    reason: input.reason,
    evidenceIds: Object.freeze([...input.evidenceIds])
  });
}

function repairRequired(
  diagnostics: readonly KpEquationOperationResolutionDiagnosticV2[]
): KpEquationOperationResolutionResultV2 {
  return Object.freeze({
    status: "repair-required" as const,
    diagnostics: Object.freeze([...diagnostics])
  });
}
