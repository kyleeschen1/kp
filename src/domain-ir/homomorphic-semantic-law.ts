export const KP_HOMOMORPHIC_SEMANTIC_LAW_SCHEMA =
  "kp.homomorphic-semantic-law.v1" as const;

export type KpHomomorphicApplicationKind = "logarithm" | "power";
export type KpHomomorphicCombinationKind =
  | "sum"
  | "difference"
  | "product"
  | "quotient";

export interface KpHomomorphicSemanticLaw {
  readonly schemaVersion: typeof KP_HOMOMORPHIC_SEMANTIC_LAW_SCHEMA;
  readonly kind: "homomorphic-semantic-law";
  readonly id: string;
  readonly direction: "decompose-application" | "distribute-application";
  readonly application: Readonly<{
    kind: KpHomomorphicApplicationKind;
    sharedParameterRole: string;
    payloadRole: string;
  }>;
  readonly sourceCombination: Readonly<{
    kind: KpHomomorphicCombinationKind;
    connectorRole: string;
  }>;
  readonly targetCombination: Readonly<{
    kind: KpHomomorphicCombinationKind;
    connectorRole: string;
    applicationCardinality: "one-per-source-payload";
  }>;
  readonly minimumPayloadCount: number;
  readonly domainAssumptionIds: readonly [string, ...string[]];
  readonly invariants: readonly [
    "ordered-payload-identity-persists",
    "derived-applications-are-successors-not-duplicates",
    "connector-law-does-not-imply-glyph-identity"
  ];
}

/**
 * This declaration names mathematical roles and lineage only. Presentation
 * owners may realize the law differently, but cannot replace its connectors,
 * cardinality, domain evidence, or semantic identity rules.
 */
export function defineKpHomomorphicSemanticLaw(
  input: KpHomomorphicSemanticLaw
): KpHomomorphicSemanticLaw {
  if (input.minimumPayloadCount < 2 || !Number.isInteger(input.minimumPayloadCount)) {
    throw new Error("A homomorphic law requires at least two ordered payloads.");
  }
  const roleIds = [
    input.application.sharedParameterRole,
    input.application.payloadRole,
    input.sourceCombination.connectorRole,
    input.targetCombination.connectorRole
  ];
  if (roleIds.some((id) => id.trim().length === 0) ||
      new Set(roleIds).size !== roleIds.length) {
    throw new Error("Homomorphic law roles must be non-empty and distinct.");
  }
  if (new Set(input.domainAssumptionIds).size !==
      input.domainAssumptionIds.length) {
    throw new Error("Homomorphic law assumptions must be unique.");
  }
  return deepFreeze({ ...input });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
