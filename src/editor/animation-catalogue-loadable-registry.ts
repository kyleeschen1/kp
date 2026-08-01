import {
  kpAnimationCatalogPackId,
  type KpAnimationCatalogPackId
} from "../animation/catalog-loader.ts";
import {
  createKpEditorAnimationLibrary
} from "./animation-library.ts";
import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";

export interface KpAnimationCatalogueLoadableRegistryEntry {
  readonly schemaVersion:
    "kp.animation-catalogue-loadable-registry-entry.v1";
  readonly kind: "loadable-animation-asset";
  readonly animationId: string;
  readonly primaryDescriptorId: string;
  readonly packId: KpAnimationCatalogPackId;
}

export function createKpAnimationCatalogueLoadableRegistry(
  descriptors: readonly KpEditorAnimationDescriptor[] =
    createKpEditorAnimationLibrary()
): readonly KpAnimationCatalogueLoadableRegistryEntry[] {
  const descriptorIds = new Set<string>();
  const descriptorsByAnimationId = new Map<
    string,
    KpEditorAnimationDescriptor[]
  >();

  for (const descriptor of descriptors) {
    if (descriptorIds.has(descriptor.id)) {
      throw new Error(
        `Duplicate editor animation descriptor id: ${descriptor.id}`
      );
    }
    descriptorIds.add(descriptor.id);
    const group = descriptorsByAnimationId.get(descriptor.animationId) ?? [];
    group.push(descriptor);
    descriptorsByAnimationId.set(descriptor.animationId, group);
  }

  return [...descriptorsByAnimationId]
    .map(([animationId, group]) => {
      // Family and sample descriptors are related contexts. The generated
      // asset-level descriptor is the one compact record guaranteed to map
      // one-to-one onto a lazy-loadable KpAnimationAsset.
      const primaryDescriptorId = `editor-animation.${animationId}`;
      const primaryDescriptors = group.filter(
        (descriptor) => descriptor.id === primaryDescriptorId
      );
      if (primaryDescriptors.length !== 1) {
        throw new Error(
          `Animation ${animationId} requires exactly one asset-level ` +
          `descriptor ${primaryDescriptorId}; found ${primaryDescriptors.length}.`
        );
      }
      return Object.freeze({
        schemaVersion:
          "kp.animation-catalogue-loadable-registry-entry.v1" as const,
        kind: "loadable-animation-asset" as const,
        animationId,
        primaryDescriptorId,
        packId: kpAnimationCatalogPackId(animationId)
      });
    })
    .sort((left, right) => left.animationId.localeCompare(right.animationId));
}
