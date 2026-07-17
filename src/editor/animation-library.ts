import {
  createKpEditorAnimationMetadataLibrary
} from "./animation-library-metadata.ts";
import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";

export function createKpEditorAnimationLibrary():
  readonly KpEditorAnimationDescriptor[] {
  return createKpEditorAnimationMetadataLibrary();
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
