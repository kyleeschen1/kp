import type {
  KpAnimationCatalogueLoadableRegistryEntry
} from "./animation-catalogue-loadable-registry.ts";
import type {
  KpCanonicalAnimationIdentity
} from "./semantic-animation-workbench-identity.ts";

export interface KpAnimationCatalogueIdentityBoundary {
  readonly schemaVersion: "kp.animation-catalogue-identity-boundary.v1";
  readonly catalogue: readonly KpAnimationCatalogueLoadableRegistryEntry[];
  readonly planned: readonly KpCanonicalAnimationIdentity[];
}

export function partitionKpAnimationCatalogueIdentities(input: {
  readonly loadable:
    readonly KpAnimationCatalogueLoadableRegistryEntry[];
  readonly canonical: readonly KpCanonicalAnimationIdentity[];
}): KpAnimationCatalogueIdentityBoundary {
  const loadableById = uniqueByAnimationId(input.loadable, "loadable registry");
  uniqueByAnimationId(
    input.canonical,
    "canonical identity projection"
  );
  const canonicalConcreteIds = new Set(
    input.canonical
      .filter(({ availability }) => availability === "concrete")
      .map(({ animationId }) => animationId)
  );
  const planned = input.canonical
    .filter(({ availability }) => availability === "planned")
    .sort((left, right) => left.animationId.localeCompare(right.animationId));

  for (const identity of planned) {
    if (loadableById.has(identity.animationId)) {
      throw new Error(
        `Planned animation ${identity.animationId} cannot be loadable catalogue membership.`
      );
    }
  }

  const missingFromLoadable = [...canonicalConcreteIds]
    .filter((animationId) => !loadableById.has(animationId))
    .sort();
  const missingFromCanonical = [...loadableById.keys()]
    .filter((animationId) => !canonicalConcreteIds.has(animationId))
    .sort();
  if (missingFromLoadable.length > 0 || missingFromCanonical.length > 0) {
    throw new Error(
      "Concrete catalogue identity mismatch: " +
      `missing loadable [${missingFromLoadable.join(", ")}], ` +
      `missing canonical [${missingFromCanonical.join(", ")}].`
    );
  }

  // Planned identity is retained as evidence, but the catalogue array is
  // sourced only from records that can resolve through the lazy asset loader.
  return Object.freeze({
    schemaVersion: "kp.animation-catalogue-identity-boundary.v1" as const,
    catalogue: Object.freeze(
      [...loadableById.values()].sort(
        (left, right) => left.animationId.localeCompare(right.animationId)
      )
    ),
    planned: Object.freeze(planned.map((identity) => Object.freeze({
      ...identity,
      aliases: Object.freeze([...identity.aliases]),
      familyIds: Object.freeze([...identity.familyIds]),
      provenance: Object.freeze({ ...identity.provenance })
    })))
  });
}

function uniqueByAnimationId<T extends { readonly animationId: string }>(
  entries: readonly T[],
  label: string
): ReadonlyMap<string, T> {
  const byId = new Map<string, T>();
  for (const entry of entries) {
    if (byId.has(entry.animationId)) {
      throw new Error(
        `Duplicate ${label} animation id: ${entry.animationId}`
      );
    }
    byId.set(entry.animationId, entry);
  }
  return byId;
}
