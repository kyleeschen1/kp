import { createKpAnimationAssets } from "../animation/catalog.ts";
import {
  createSymbolicManipulationFamilyRegistry
} from "../animation/symbolic-manipulation-family-registry.ts";
import {
  projectKpAnimationAssetsToEditorDescriptors
} from "./animation-catalog-projection.ts";
import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";

export function createKpEditorAnimationLibrary():
  readonly KpEditorAnimationDescriptor[] {
  return projectKpAnimationAssetsToEditorDescriptors({
    assets: createKpAnimationAssets(),
    families: createSymbolicManipulationFamilyRegistry()
  });
}

export function selectKpEditorAnimationDescriptor(
  descriptors: readonly KpEditorAnimationDescriptor[],
  requestedId?: string | undefined
): KpEditorAnimationDescriptor {
  const selected = descriptors.find(
    (descriptor) => descriptor.id === requestedId
  ) ?? descriptors[0];

  if (selected === undefined) {
    throw new Error("The editor animation library must contain an animation.");
  }

  return selected;
}
