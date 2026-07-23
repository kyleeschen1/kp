import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";
import type {
  KpSemanticAnimationWorkbenchIndexEntry
} from "./semantic-animation-workbench-index.ts";
import type {
  KpAnimationRepresentationRelationship
} from "./semantic-animation-workbench-representation.ts";

export interface KpAnimationWorkbenchRepresentationSelection {
  readonly relationship?: KpAnimationRepresentationRelationship;
  readonly descriptor?: KpEditorAnimationDescriptor;
}

export function resolveKpAnimationWorkbenchRepresentation(input: {
  readonly entry: KpSemanticAnimationWorkbenchIndexEntry;
  readonly requestedRepresentationId?: string;
  readonly descriptors: readonly KpEditorAnimationDescriptor[];
}): KpAnimationWorkbenchRepresentationSelection {
  const relationship =
    input.entry.representations.find(
      (candidate) =>
        candidate.representationId === input.requestedRepresentationId
    ) ??
    input.entry.representations.find((candidate) => candidate.playable) ??
    input.entry.representations[0];
  if (relationship === undefined) return {};

  const descriptor = input.descriptors.find((candidate) => {
    if (candidate.animationId !== input.entry.identity.animationId) {
      return false;
    }
    return relationship.kind === "card"
      ? candidate.sampleId === relationship.representationId
      : candidate.id === relationship.representationId;
  });
  return {
    relationship,
    ...(descriptor === undefined ? {} : { descriptor })
  };
}
