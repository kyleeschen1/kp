import {
  protocolArray,
  protocolEnum,
  protocolLiteral,
  protocolObject,
  protocolRefine,
  protocolSchema,
  protocolString,
  type InferProtocolSchema
} from "../../protocols/public-api.ts";
import { sha256 } from "../kernel/sha256.ts";

import {
  conceptCapabilityRefSchema,
  conceptProviderRefSchema,
  draftConceptManifestSchema,
  publishedConceptManifestSchema,
  type KpConceptDraftSource
} from "./concept-manifest.ts";

const integritySchema = protocolString({ pattern: /^sha256:[a-f0-9]{64}$/ });
export const conceptAssetReferenceSchema = protocolObject({
  id: protocolString({ pattern: /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/ }),
  kind: protocolEnum(["static-svg", "image", "data"] as const),
  path: protocolString({ pattern: /^assets\/(?!.*(?:^|\/)\.\.(?:\/|$))[a-zA-Z0-9._/-]+$/ }),
  integrity: integritySchema
});

const publishedConceptArtifactBaseSchema = protocolObject({
  schemaVersion: protocolLiteral("kp.published-concept.v1"),
  manifest: publishedConceptManifestSchema,
  dependencies: protocolObject({
    capabilities: protocolArray(conceptCapabilityRefSchema),
    providers: protocolArray(conceptProviderRefSchema)
  }),
  assets: protocolArray(conceptAssetReferenceSchema),
  integrity: integritySchema
});

export const publishedConceptArtifactSchema = protocolSchema((input) => deepFreeze(
  protocolRefine(
    publishedConceptArtifactBaseSchema,
    hasMatchingResolvedDependencies,
    "expected artifact dependencies and integrity to match its manifest"
  ).parse(input)
));

export type KpConceptAssetReference = InferProtocolSchema<typeof conceptAssetReferenceSchema>;
export type KpPublishedConceptArtifact = InferProtocolSchema<typeof publishedConceptArtifactSchema>;

export async function publishConceptDraft(
  input: KpConceptDraftSource,
  options: { readonly assets?: readonly KpConceptAssetReference[] } = {}
): Promise<KpPublishedConceptArtifact> {
  const draft = draftConceptManifestSchema.parse(input);
  const dependencies = {
    capabilities: [...draft.capabilities].sort(compareCapabilityRefs),
    providers: [...draft.providers].sort(compareProviderRefs)
  };
  const assets = (options.assets ?? [])
    .map((asset) => conceptAssetReferenceSchema.parse(asset))
    .sort(compareAssetRefs);
  const unsignedManifest = {
    ...draft,
    publicationStatus: "published" as const
  };
  const unsignedArtifact = {
    schemaVersion: "kp.published-concept.v1" as const,
    manifest: unsignedManifest,
    dependencies,
    assets
  };
  const integrity = `sha256:${sha256(canonicalJson(unsignedArtifact))}`;
  return publishedConceptArtifactSchema.parse({
    ...unsignedArtifact,
    manifest: { ...unsignedManifest, integrity },
    integrity
  });
}

export async function verifyPublishedConceptArtifact(
  artifact: KpPublishedConceptArtifact
): Promise<boolean> {
  const parsed = publishedConceptArtifactSchema.parse(artifact);
  const { integrity: _artifactIntegrity, ...artifactWithoutIntegrity } = parsed;
  const { integrity: _manifestIntegrity, ...manifestWithoutIntegrity } = parsed.manifest;
  const unsigned = { ...artifactWithoutIntegrity, manifest: manifestWithoutIntegrity };
  return `sha256:${sha256(canonicalJson(unsigned))}` === parsed.integrity;
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Canonical JSON requires finite numbers.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
      .join(",")}}`;
  }
  throw new TypeError(`Canonical JSON cannot encode ${typeof value}.`);
}

function hasMatchingResolvedDependencies(
  artifact: InferProtocolSchema<typeof publishedConceptArtifactBaseSchema>
): boolean {
  return artifact.integrity === artifact.manifest.integrity &&
    canonicalJson(artifact.dependencies.capabilities) === canonicalJson(
      [...artifact.manifest.capabilities].sort(compareCapabilityRefs)
    ) &&
    canonicalJson(artifact.dependencies.providers) === canonicalJson(
      [...artifact.manifest.providers].sort(compareProviderRefs)
    );
}

function compareCapabilityRefs(
  left: InferProtocolSchema<typeof conceptCapabilityRefSchema>,
  right: InferProtocolSchema<typeof conceptCapabilityRefSchema>
): number {
  return left.id.localeCompare(right.id) || left.major - right.major;
}

function compareProviderRefs(
  left: InferProtocolSchema<typeof conceptProviderRefSchema>,
  right: InferProtocolSchema<typeof conceptProviderRefSchema>
): number {
  return left.id.localeCompare(right.id) || left.protocol.localeCompare(right.protocol) ||
    left.version.localeCompare(right.version);
}

function compareAssetRefs(left: KpConceptAssetReference, right: KpConceptAssetReference): number {
  return left.id.localeCompare(right.id) || left.path.localeCompare(right.path);
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
