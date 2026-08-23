import type {
  KpAnimationConformanceManifest,
  KpAnimationConformanceManifestSet
} from "./animation-conformance-manifest.ts";

export type KpAnimationGovernanceDependencyKind =
  | "principle"
  | "motif"
  | "renderer"
  | "typography-policy";

export interface KpAnimationGovernanceReverseDependency {
  readonly dependencyId: string;
  readonly kind: KpAnimationGovernanceDependencyKind;
  readonly callerAssetIds: readonly string[];
}

export interface KpAnimationGovernanceReverseDependencyGraph {
  readonly schemaVersion: "kp.animation-governance-reverse-dependencies.v1";
  readonly kind: "animation-governance-reverse-dependencies";
  readonly assetCount: number;
  readonly dependencies: readonly KpAnimationGovernanceReverseDependency[];
}

export interface KpAnimationReviewInvalidationSet {
  readonly schemaVersion: "kp.animation-review-invalidation-set.v1";
  readonly affectedAssetIds: readonly string[];
  readonly causes: readonly {
    readonly dependencyId: string;
    readonly kind: KpAnimationGovernanceDependencyKind;
  }[];
}

/**
 * Dependencies come from manifests authored at the semantic registration
 * boundary. Source imports and string search are useful audits, not authority.
 */
export function compileKpAnimationGovernanceReverseDependencies(
  manifestSet: KpAnimationConformanceManifestSet
): KpAnimationGovernanceReverseDependencyGraph {
  const assetIds = new Set<string>();
  const callers = new Map<string, {
    readonly dependencyId: string;
    readonly kind: KpAnimationGovernanceDependencyKind;
    readonly callerAssetIds: Set<string>;
  }>();
  for (const manifest of manifestSet.manifests) {
    if (assetIds.has(manifest.assetId)) {
      throw new Error(`Duplicate conformance manifest ${manifest.assetId}.`);
    }
    assetIds.add(manifest.assetId);
    for (const dependency of declarations(manifest)) {
      const key = `${dependency.kind}:${dependency.dependencyId}`;
      const entry = callers.get(key) ?? {
        ...dependency,
        callerAssetIds: new Set<string>()
      };
      entry.callerAssetIds.add(manifest.assetId);
      callers.set(key, entry);
    }
  }
  return Object.freeze({
    schemaVersion: "kp.animation-governance-reverse-dependencies.v1" as const,
    kind: "animation-governance-reverse-dependencies" as const,
    assetCount: assetIds.size,
    dependencies: Object.freeze([...callers.values()]
      .map(({ dependencyId, kind, callerAssetIds }) => Object.freeze({
        dependencyId,
        kind,
        callerAssetIds: Object.freeze([...callerAssetIds].sort())
      }))
      .sort((left, right) =>
        `${left.kind}:${left.dependencyId}`.localeCompare(
          `${right.kind}:${right.dependencyId}`
        )
      ))
  });
}

export function resolveKpAnimationReviewInvalidations(input: {
  readonly graph: KpAnimationGovernanceReverseDependencyGraph;
  readonly changedDependencyIds: readonly string[];
}): KpAnimationReviewInvalidationSet {
  const changed = new Set(input.changedDependencyIds);
  const causes = input.graph.dependencies.filter(({ dependencyId }) =>
    changed.has(dependencyId)
  );
  const affectedAssetIds = new Set(causes.flatMap(({ callerAssetIds }) =>
    callerAssetIds
  ));
  return Object.freeze({
    schemaVersion: "kp.animation-review-invalidation-set.v1" as const,
    affectedAssetIds: Object.freeze([...affectedAssetIds].sort()),
    causes: Object.freeze(causes.map(({ dependencyId, kind }) =>
      Object.freeze({ dependencyId, kind })
    ))
  });
}

function declarations(
  manifest: KpAnimationConformanceManifest
): readonly {
  readonly dependencyId: string;
  readonly kind: KpAnimationGovernanceDependencyKind;
}[] {
  return [
    ...manifest.dependencies.principleIds.map((dependencyId) => ({
      dependencyId,
      kind: "principle" as const
    })),
    ...manifest.dependencies.motifIds.map((dependencyId) => ({
      dependencyId,
      kind: "motif" as const
    })),
    ...manifest.dependencies.rendererIds.map((dependencyId) => ({
      dependencyId,
      kind: "renderer" as const
    })),
    ...manifest.dependencies.typographyPolicyIds.map((dependencyId) => ({
      dependencyId,
      kind: "typography-policy" as const
    }))
  ];
}
