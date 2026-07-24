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
  const provenance = input.entry.identity.provenance;
  const relationship =
    input.entry.representations.find(
      (candidate) =>
        candidate.representationId === input.requestedRepresentationId
    ) ??
    input.entry.representations.find(
      (candidate) => candidate.presentationRole === "canonical"
    ) ??
    (provenance.kind === "catalog"
      ? input.entry.representations.find(
          (candidate) =>
            candidate.representationId ===
            provenance.descriptorId
        )
      : undefined) ??
    input.entry.representations.find((candidate) => candidate.playable) ??
    input.entry.representations[0];
  if (relationship === undefined) return {};

  const descriptor =
    descriptorForRelationship(
      relationship,
      input.entry.identity.animationId,
      input.descriptors
    ) ??
    input.entry.representations
      .filter(
        (candidate) =>
          candidate.presentationRole === "projection" &&
          sameChoreography(candidate, relationship)
      )
      .map((candidate) =>
        descriptorForRelationship(
          candidate,
          input.entry.identity.animationId,
          input.descriptors
        )
      )
      .find(
        (candidate): candidate is KpEditorAnimationDescriptor =>
          candidate !== undefined
      );
  return {
    relationship,
    ...(descriptor === undefined ? {} : { descriptor })
  };
}

function descriptorForRelationship(
  relationship: KpAnimationRepresentationRelationship,
  animationId: string,
  descriptors: readonly KpEditorAnimationDescriptor[]
): KpEditorAnimationDescriptor | undefined {
  return descriptors.find((candidate) => {
    if (candidate.animationId !== animationId) {
      return false;
    }
    return relationship.kind === "card"
      ? candidate.sampleId === relationship.representationId
      : candidate.id === relationship.representationId;
  });
}

function sameChoreography(
  candidate: KpAnimationRepresentationRelationship,
  canonical: KpAnimationRepresentationRelationship
): boolean {
  return (
    candidate.canonicalRepresentationId === canonical.representationId &&
    candidate.choreographySource.kind === canonical.choreographySource.kind &&
    candidate.choreographySource.sourceId ===
      canonical.choreographySource.sourceId &&
    candidate.choreographySource.choreographyId ===
      canonical.choreographySource.choreographyId
  );
}
