export const KP_NATIVE_KATEX_CONTEXT_MUTATION_SCHEMA_VERSION =
  "kp.native-katex-context-mutation.v1" as const;

export type KpNativeKatexContextMutationClass =
  | "sibling-length"
  | "sibling-height"
  | "grouping"
  | "math-style";

export interface KpNativeKatexContextMutationDescriptor {
  readonly schemaVersion: typeof KP_NATIVE_KATEX_CONTEXT_MUTATION_SCHEMA_VERSION;
  readonly id: `context.${string}`;
  readonly label: string;
  readonly mutationClass: KpNativeKatexContextMutationClass;
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly persistentCarrierLatex: string;
}

export interface KpNativeKatexContextMutationRegistry {
  readonly kind: "native-katex-conformance-context-mutation-registry";
  readonly descriptors: readonly KpNativeKatexContextMutationDescriptor[];
  readonly byId: ReadonlyMap<
    KpNativeKatexContextMutationDescriptor["id"],
    KpNativeKatexContextMutationDescriptor
  >;
}

export function createKpNativeKatexContextMutationDescriptor(
  input: Omit<KpNativeKatexContextMutationDescriptor, "schemaVersion">
): KpNativeKatexContextMutationDescriptor {
  for (const [label, value] of [
    ["context mutation id", input.id],
    [`${input.id} label`, input.label],
    [`${input.id} source LaTeX`, input.sourceLatex],
    [`${input.id} target LaTeX`, input.targetLatex],
    [`${input.id} persistent carrier`, input.persistentCarrierLatex]
  ] as const) {
    if (value.trim() === "") throw new Error(`${label} must be non-empty.`);
  }
  if (input.sourceLatex === input.targetLatex) {
    throw new Error(`${input.id} must change its surrounding context.`);
  }
  if (
    !input.sourceLatex.includes(input.persistentCarrierLatex) ||
    !input.targetLatex.includes(input.persistentCarrierLatex)
  ) {
    throw new Error(`${input.id} must preserve its named carrier.`);
  }
  return Object.freeze({
    schemaVersion: KP_NATIVE_KATEX_CONTEXT_MUTATION_SCHEMA_VERSION,
    ...input
  });
}

export function createKpNativeKatexContextMutationRegistry(
  descriptors: readonly KpNativeKatexContextMutationDescriptor[]
): KpNativeKatexContextMutationRegistry {
  if (descriptors.length === 0) {
    throw new Error("Native KaTeX conformance requires a context mutation.");
  }
  const byId = new Map(descriptors.map((descriptor) => [
    descriptor.id,
    descriptor
  ]));
  if (byId.size !== descriptors.length) {
    throw new Error("Native KaTeX context mutation IDs must be unique.");
  }
  return Object.freeze({
    kind: "native-katex-conformance-context-mutation-registry" as const,
    descriptors: Object.freeze([...descriptors]),
    byId
  });
}
