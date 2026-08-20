export type KpEquationOperationSupportState = "available" | "alias";

export interface KpEquationOperationDiscoverability {
  readonly schemaVersion: "kp.equation-operation-discoverability.v1";
  readonly friendlyName: string;
  readonly aliases: readonly string[];
  readonly meaning: string;
  readonly positiveExamples: readonly string[];
  readonly counterexamples: readonly string[];
  readonly requiredEvidenceIds: readonly string[];
  readonly supportState: KpEquationOperationSupportState;
}

export interface KpEquationOperationDiscoverabilityInput {
  readonly operationId: string;
  readonly plannerOperationId: string;
  readonly plannerExposure:
    | Readonly<{ readonly kind: "exposed"; readonly summary: string }>
    | Readonly<{
        readonly kind: "alias";
        readonly canonicalOperationId: string;
      }>;
  readonly authorityRefIds: readonly string[];
  readonly governedRequiredEvidenceIds?: readonly string[] | undefined;
}

interface KpEquationOperationDiscoveryOverride {
  readonly operationId: string;
  readonly friendlyName: string;
  readonly aliases: readonly string[];
  readonly meaning: string;
  readonly positiveExamples: readonly [string, ...string[]];
  readonly counterexamples: readonly [string, ...string[]];
}

const discoveryOverrides = new Map<
  string,
  KpEquationOperationDiscoveryOverride
>(
  ([
    {
      operationId: "kp.semantic-motion.absorb-additive-identity",
      friendlyName: "Remove additive identity",
      aliases: [
        "remove additive zero",
        "simplify plus zero",
        "drop + 0"
      ],
      meaning:
        "Preserve an explicitly identified operand while additive identity syntax yields.",
      positiveExamples: [
        "Transform x + 0 = 4 into x = 4 while x, =, and 4 persist.",
        "Transform a + 0 into a when correspondence proves that a is the carrier."
      ],
      counterexamples: [
        "Do not use for 2 + 3 → 5; both addends contribute to a new result.",
        "Do not use when the surviving glyph merely looks equal but lacks carrier evidence."
      ]
    },
    {
      operationId: "kp.semantic-motion.absorb-multiplicative-identity",
      friendlyName: "Remove multiplicative identity",
      aliases: [
        "remove times one",
        "simplify multiply by one",
        "drop × 1"
      ],
      meaning:
        "Preserve an explicitly identified factor while multiplicative identity syntax yields.",
      positiveExamples: [
        "Transform 2 × 1 into 2 while the original 2 remains the carrier.",
        "Transform x · 1 into x when correspondence proves that x persists."
      ],
      counterexamples: [
        "Do not use for 2 × 3 → 6; both factors contribute to a new result.",
        "Do not use for 0 × x → 0; annihilation is not identity removal."
      ]
    }
  ] as const satisfies readonly KpEquationOperationDiscoveryOverride[])
    .map((entry) => [entry.operationId, entry] as const)
);

/**
 * Discovery describes how to ask for existing authority. It cannot add a
 * semantic law, presentation family, or release state of its own.
 */
export function compileKpEquationOperationDiscoverability(
  input: KpEquationOperationDiscoverabilityInput
): KpEquationOperationDiscoverability {
  const override = discoveryOverrides.get(input.operationId);
  const exposed = input.plannerExposure.kind === "exposed";
  const friendlyName = override?.friendlyName ??
    titleFromOperationId(input.operationId);
  const meaning = override?.meaning ?? (exposed
    ? input.plannerExposure.summary
    : `Alias for ${input.plannerExposure.canonicalOperationId}.`);
  const requiredEvidenceIds = unique(
    (input.governedRequiredEvidenceIds?.length ?? 0) > 0
      ? input.governedRequiredEvidenceIds!
      : input.authorityRefIds
  );
  return deepFreeze({
    schemaVersion: "kp.equation-operation-discoverability.v1" as const,
    friendlyName,
    aliases: unique([
      input.operationId,
      ...(exposed ? [input.plannerOperationId] : []),
      ...(override?.aliases ?? [])
    ]),
    meaning,
    positiveExamples: override?.positiveExamples ?? [
      `Ask to ${lowercaseFirst(friendlyName)} using the declared semantic roles.`
    ],
    counterexamples: override?.counterexamples ?? [
      "Do not select this operation when its declared roles or required evidence are absent."
    ],
    requiredEvidenceIds,
    supportState: exposed ? "available" as const : "alias" as const
  });
}

function titleFromOperationId(operationId: string): string {
  const segments = operationId.split(".");
  const segment = [...segments].reverse().find((candidate) =>
    !/^v\d+$/u.test(candidate)
  ) ?? operationId;
  const words = segment.replaceAll("-", " ").trim();
  return words.length === 0
    ? operationId
    : `${words[0]!.toUpperCase()}${words.slice(1)}`;
}

function lowercaseFirst(value: string): string {
  return value.length === 0
    ? value
    : `${value[0]!.toLowerCase()}${value.slice(1)}`;
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) =>
    value.trim().length > 0
  ))]);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
