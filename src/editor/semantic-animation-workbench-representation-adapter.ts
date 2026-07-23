import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";
import {
  writeKpEditorAnimationSelection
} from "./animation-selection-route.ts";
import type {
  KpAnimationWorkbenchCatalogEntry
} from "./semantic-animation-workbench-catalog-adapter.ts";
import {
  assertKpAnimationRepresentationRelationships,
  createKpAnimationRepresentationRelationship,
  type KpAnimationRepresentationRelationship
} from "./semantic-animation-workbench-representation.ts";

export function projectKpAnimationRepresentations(input: {
  readonly catalogEntries: readonly KpAnimationWorkbenchCatalogEntry[];
  readonly descriptors: readonly KpEditorAnimationDescriptor[];
  readonly editorPathname?: string;
}): readonly KpAnimationRepresentationRelationship[] {
  const identities = input.catalogEntries.map((entry) => entry.identity);
  const knownAnimationIds = new Set(
    identities.map((identity) => identity.animationId)
  );
  const editorPathname = input.editorPathname ?? "/";
  const relationships = input.descriptors
    .filter((descriptor) => knownAnimationIds.has(descriptor.animationId))
    .flatMap((descriptor) => {
      const href = `${editorPathname}${writeKpEditorAnimationSelection(
        "",
        descriptor.id
      )}`;
      const editor = createKpAnimationRepresentationRelationship({
        animationId: descriptor.animationId,
        representationId: descriptor.id,
        kind: "editor",
        label: descriptor.title,
        href,
        playable: true
      });
      const sample =
        descriptor.sampleId === undefined
          ? []
          : [
              createKpAnimationRepresentationRelationship({
                animationId: descriptor.animationId,
                representationId: descriptor.sampleId,
                kind: "card",
                label: `${descriptor.title} sample`,
                href,
                playable: true
              })
            ];

      return [editor, ...sample];
    });

  assertKpAnimationRepresentationRelationships({
    identities,
    relationships
  });
  return relationships;
}
