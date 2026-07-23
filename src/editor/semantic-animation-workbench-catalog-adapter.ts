import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";
import {
  assertKpCanonicalAnimationIdentities,
  createKpCanonicalAnimationIdentity,
  type KpCanonicalAnimationIdentity
} from "./semantic-animation-workbench-identity.ts";
import type {
  KpAnimationWorkbenchSeed
} from "./semantic-animation-workbench-seeds.ts";

export interface KpAnimationWorkbenchCatalogEntry {
  readonly identity: KpCanonicalAnimationIdentity;
  readonly primaryDescriptor: KpEditorAnimationDescriptor;
  readonly descriptorIds: readonly string[];
}

type KpCatalogAnimationWorkbenchSeed = KpAnimationWorkbenchSeed & {
  readonly source: {
    readonly kind: "catalog";
    readonly descriptorId: string;
  };
};

export function projectKpAnimationCatalogToWorkbench(input: {
  readonly descriptors: readonly KpEditorAnimationDescriptor[];
  readonly seeds?: readonly KpAnimationWorkbenchSeed[];
}): readonly KpAnimationWorkbenchCatalogEntry[] {
  const catalogSeeds = new Map(
    (input.seeds ?? [])
      .filter(isCatalogSeed)
      .map((seed) => [seed.animationId, seed] as const)
  );
  const descriptorsByAnimation = new Map<
    string,
    KpEditorAnimationDescriptor[]
  >();

  for (const descriptor of input.descriptors) {
    const group = descriptorsByAnimation.get(descriptor.animationId) ?? [];
    group.push(descriptor);
    descriptorsByAnimation.set(descriptor.animationId, group);
  }

  for (const seed of catalogSeeds.values()) {
    const descriptors = descriptorsByAnimation.get(seed.animationId);
    if (
      descriptors === undefined ||
      !descriptors.some(
        (descriptor) => descriptor.id === seed.source.descriptorId
      )
    ) {
      throw new Error(
        `Catalog seed ${seed.animationId} requires descriptor ${seed.source.descriptorId}.`
      );
    }
  }

  const entries = [...descriptorsByAnimation.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([animationId, descriptors]) => {
      const sortedDescriptors = [...descriptors].sort(compareDescriptors);
      const catalogSeed = catalogSeeds.get(animationId);
      const primaryDescriptor =
        catalogSeed === undefined
          ? sortedDescriptors[0]!
          : sortedDescriptors.find(
              (descriptor) =>
                descriptor.id === catalogSeed.source.descriptorId
            )!;
      const seed =
        catalogSeed ??
        ({
          animationId,
          title: primaryDescriptor.title,
          source: {
            kind: "catalog",
            descriptorId: primaryDescriptor.id
          },
          expectedPlayability: "playable"
        } satisfies KpAnimationWorkbenchSeed);
      const descriptorIds = sortedDescriptors.map(
        (descriptor) => descriptor.id
      );
      const identity = createKpCanonicalAnimationIdentity({
        seed,
        aliases: [
          ...descriptorIds,
          ...sortedDescriptors.map((descriptor) => descriptor.title),
          ...sortedDescriptors.flatMap((descriptor) =>
            descriptor.sampleId === undefined ? [] : [descriptor.sampleId]
          )
        ].filter((alias) => alias !== seed.title),
        familyIds: sortedDescriptors.flatMap((descriptor) =>
          descriptor.familyId === undefined ? [] : [descriptor.familyId]
        )
      });

      return {
        identity,
        primaryDescriptor,
        descriptorIds
      };
    });

  assertKpCanonicalAnimationIdentities(
    entries.map((entry) => entry.identity)
  );
  return entries;
}

function isCatalogSeed(
  seed: KpAnimationWorkbenchSeed
): seed is KpCatalogAnimationWorkbenchSeed {
  return seed.source.kind === "catalog";
}

function compareDescriptors(
  left: KpEditorAnimationDescriptor,
  right: KpEditorAnimationDescriptor
): number {
  // Family-backed descriptors carry the richest catalog-authored discovery data.
  const familyRank =
    Number(right.familyId !== undefined) - Number(left.familyId !== undefined);
  return familyRank || left.id.localeCompare(right.id);
}
