import {
  protocolArray,
  protocolBoolean,
  protocolEnum,
  protocolInteger,
  protocolLiteral,
  protocolObject,
  protocolRefine,
  protocolSchema,
  protocolString,
  type InferProtocolSchema
} from "../../protocols/public-api.ts";

const semanticRefSchema = protocolObject({
  id: protocolString({ pattern: /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/ }),
  kind: protocolEnum(["equation", "term", "operation", "diagram", "checkpoint"] as const)
});
const checkpointSchema = protocolObject({
  id: protocolString({ pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ }),
  title: protocolString({ minLength: 1 }),
  explanation: protocolString({ minLength: 1 }),
  progressPermille: protocolInteger({ min: 0, max: 1000 }),
  semanticRefs: protocolArray(protocolString({ minLength: 1 }))
});
export const conceptCapabilityRefSchema = protocolObject({
  id: protocolString({ pattern: /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/ }),
  major: protocolInteger({ min: 1 })
});
export const conceptProviderRefSchema = protocolObject({
  id: protocolString({ pattern: /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/ }),
  protocol: protocolString({ pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*\.v[1-9][0-9]*$/ }),
  version: protocolString({ pattern: /^\d+\.\d+\.\d+$/ })
});
const conceptFields = {
  schemaVersion: protocolLiteral("kp.concept-manifest.v1"),
  conceptId: protocolString({ pattern: /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/ }),
  version: protocolString({ pattern: /^\d+\.\d+\.\d+$/ }),
  title: protocolString({ minLength: 1 }),
  modes: protocolArray(protocolEnum(["watch", "touch", "ask", "review"] as const)),
  projections: protocolArray(protocolEnum(["symbolic", "balance"] as const)),
  semanticRefs: protocolArray(semanticRefSchema),
  checkpoints: protocolArray(checkpointSchema),
  capabilities: protocolArray(conceptCapabilityRefSchema),
  providers: protocolArray(conceptProviderRefSchema),
  route: protocolObject({
    canonicalPath: protocolString({ pattern: /^\/concepts\/[a-z0-9/-]+$/ }),
    legacyAliases: protocolArray(protocolString({ pattern: /^\// }))
  }),
  review: protocolObject({
    title: protocolString({ minLength: 1 }),
    summary: protocolString({ minLength: 1 }),
    searchableText: protocolString({ minLength: 1 }),
    checkpointAnchors: protocolBoolean()
  }),
  provenance: protocolObject({
    sourcePath: protocolString({ minLength: 1 }),
    authoredBy: protocolEnum(["human", "llm"] as const),
    authoredAt: protocolString({ pattern: /^\d{4}-\d{2}-\d{2}T/ }),
    compilerVersion: protocolString({ pattern: /^\d+\.\d+\.\d+$/ })
  })
} as const;

const draftConceptManifestBaseSchema = protocolRefine(protocolObject({
  ...conceptFields,
  publicationStatus: protocolLiteral("draft")
}), hasClosedUniqueReferences, "expected unique and closed concept references");
const publishedConceptManifestBaseSchema = protocolRefine(protocolObject({
  ...conceptFields,
  publicationStatus: protocolLiteral("published"),
  integrity: protocolString({ pattern: /^sha256:[a-f0-9]{64}$/ })
}), hasClosedUniqueReferences, "expected unique and closed concept references");

export const draftConceptManifestSchema = draftConceptManifestBaseSchema;
export const publishedConceptManifestSchema = protocolSchema((input) =>
  deepFreeze(publishedConceptManifestBaseSchema.parse(input))
);

type InferredConceptDraft = InferProtocolSchema<typeof draftConceptManifestSchema>;
export type KpConceptDraft = DeepMutable<InferredConceptDraft>;
export type KpPublishedConceptManifest = InferProtocolSchema<typeof publishedConceptManifestSchema>;

export function createConceptDraft(input: InferredConceptDraft): KpConceptDraft {
  const parsed = draftConceptManifestSchema.parse(input);
  return JSON.parse(JSON.stringify(parsed)) as KpConceptDraft;
}

type ConceptReferenceShape = {
  readonly semanticRefs: readonly { readonly id: string }[];
  readonly checkpoints: readonly {
    readonly id: string;
    readonly semanticRefs: readonly string[];
  }[];
  readonly capabilities: readonly { readonly id: string; readonly major: number }[];
  readonly providers: readonly { readonly id: string; readonly protocol: string; readonly version: string }[];
};

function hasClosedUniqueReferences(manifest: ConceptReferenceShape): boolean {
  const semanticIds = manifest.semanticRefs.map((item) => item.id);
  const checkpointIds = manifest.checkpoints.map((item) => item.id);
  const capabilityKeys = manifest.capabilities.map((item) => `${item.id}@${item.major}`);
  const providerKeys = manifest.providers.map((item) => `${item.id}@${item.version}:${item.protocol}`);
  const knownSemanticIds = new Set(semanticIds);
  return unique(semanticIds) && unique(checkpointIds) && unique(capabilityKeys) && unique(providerKeys) &&
    manifest.checkpoints.every((checkpoint) =>
      checkpoint.semanticRefs.every((reference) => knownSemanticIds.has(reference))
    );
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

type DeepMutable<Value> = Value extends readonly (infer Item)[]
  ? DeepMutable<Item>[]
  : Value extends object
    ? { -readonly [Key in keyof Value]: DeepMutable<Value[Key]> }
    : Value;

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
