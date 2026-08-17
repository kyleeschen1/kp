import type {
  KpModuleOwnershipZoneId
} from "./kp-module-ownership.ts";

export const kpFrameworkNeutralEntrypointIds = [
  "semantic",
  "runtime",
  "renderer",
  "authoring",
  "publication"
] as const;

export type KpFrameworkNeutralEntrypointId =
  (typeof kpFrameworkNeutralEntrypointIds)[number];

export interface KpFrameworkNeutralEntrypoint {
  readonly id: KpFrameworkNeutralEntrypointId;
  readonly modulePath: string;
  readonly allowedOwnershipZones: readonly KpModuleOwnershipZoneId[];
  readonly allowedExternalPackages: readonly string[];
  readonly purpose: string;
}

/**
 * These facades are logical package boundaries. Their transitive closures must
 * remain portable before physical packages or framework adapters are allowed.
 */
export const kpFrameworkNeutralEntrypoints =
  defineKpFrameworkNeutralEntrypoints([
    entrypoint(
      "semantic",
      "src/public/semantic.ts",
      ["neutral-core"],
      [],
      "Semantic objects, identity, provenance, and transformation composition."
    ),
    entrypoint(
      "runtime",
      "src/public/runtime.ts",
      ["neutral-core"],
      [],
      "Deterministic progress, sampled frames, and framework-neutral playback."
    ),
    entrypoint(
      "renderer",
      "src/public/renderer.ts",
      ["neutral-core", "presentation", "renderer"],
      [],
      "Pure visual-frame validation and geometry projection without host lifecycle."
    ),
    entrypoint(
      "authoring",
      "src/public/authoring.ts",
      ["neutral-core"],
      [],
      "Typed lesson documents, semantic links, beats, and artifact references."
    ),
    entrypoint(
      "publication",
      "src/public/publication.ts",
      ["neutral-core"],
      ["katex"],
      "Static searchable output, math projections, and hydration manifests."
    )
  ]);

export function findKpFrameworkNeutralEntrypoint(
  id: KpFrameworkNeutralEntrypointId
): KpFrameworkNeutralEntrypoint {
  const entrypointDefinition = kpFrameworkNeutralEntrypoints.find(
    (candidate) => candidate.id === id
  );
  if (entrypointDefinition === undefined) {
    throw new Error(`Unknown framework-neutral entrypoint ${id}.`);
  }
  return entrypointDefinition;
}

export function defineKpFrameworkNeutralEntrypoints<
  const TEntrypoints extends readonly KpFrameworkNeutralEntrypoint[]
>(entrypoints: TEntrypoints): TEntrypoints {
  const ids = new Set<string>();
  const modulePaths = new Set<string>();
  for (const definition of entrypoints) {
    if (ids.has(definition.id)) {
      throw new Error(`Framework-neutral entrypoint ${definition.id} is duplicated.`);
    }
    if (modulePaths.has(definition.modulePath)) {
      throw new Error(`Framework-neutral module ${definition.modulePath} is duplicated.`);
    }
    if (
      !definition.modulePath.startsWith("src/public/") ||
      !definition.modulePath.endsWith(".ts") ||
      definition.modulePath.includes("\\")
    ) {
      throw new Error(`${definition.id} must use a normalized src/public TypeScript module.`);
    }
    if (
      definition.allowedOwnershipZones.length === 0 ||
      new Set(definition.allowedOwnershipZones).size !==
        definition.allowedOwnershipZones.length
    ) {
      throw new Error(`${definition.id} must declare unique allowed ownership zones.`);
    }
    if (
      new Set(definition.allowedExternalPackages).size !==
      definition.allowedExternalPackages.length
    ) {
      throw new Error(`${definition.id} must declare unique external packages.`);
    }
    ids.add(definition.id);
    modulePaths.add(definition.modulePath);
  }
  if (
    ids.size !== kpFrameworkNeutralEntrypointIds.length ||
    kpFrameworkNeutralEntrypointIds.some((id) => !ids.has(id))
  ) {
    throw new Error("Framework-neutral entrypoints must declare every public role once.");
  }
  return Object.freeze(entrypoints.map((definition) => Object.freeze({
    ...definition,
    allowedOwnershipZones: Object.freeze([
      ...definition.allowedOwnershipZones
    ]),
    allowedExternalPackages: Object.freeze([
      ...definition.allowedExternalPackages
    ])
  }))) as unknown as TEntrypoints;
}

function entrypoint(
  id: KpFrameworkNeutralEntrypointId,
  modulePath: string,
  allowedOwnershipZones: readonly KpModuleOwnershipZoneId[],
  allowedExternalPackages: readonly string[],
  purpose: string
): KpFrameworkNeutralEntrypoint {
  return {
    id,
    modulePath,
    allowedOwnershipZones,
    allowedExternalPackages,
    purpose
  };
}
