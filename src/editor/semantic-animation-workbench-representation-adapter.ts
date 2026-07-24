import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";
import type {
  KpLearnerAnimationPresentation,
  KpLearnerExperienceDescriptor
} from "./learner-experience-library.ts";
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

export interface KpLearnerCardPresentationAudit {
  readonly schemaVersion: "kp.learner-card-presentation-audit.v1";
  readonly learnerExperienceId: string;
  readonly canonicalAnimationId: string;
  readonly lessonAssetId: string;
  readonly canonicalChoreographyId: string;
  readonly status: "lesson-card-overlap" | "lesson-only";
  readonly cardRepresentationIds: readonly string[];
  readonly descriptorIds: readonly string[];
  readonly supersededFixtureDescriptorIds: readonly string[];
  readonly preservedAliasIds: readonly string[];
}

export function projectKpAnimationRepresentations(input: {
  readonly catalogEntries: readonly KpAnimationWorkbenchCatalogEntry[];
  readonly descriptors: readonly KpEditorAnimationDescriptor[];
  readonly learnerExperiences?: readonly KpLearnerExperienceDescriptor[];
  readonly editorPathname?: string;
}): readonly KpAnimationRepresentationRelationship[] {
  const identities = input.catalogEntries.map((entry) => entry.identity);
  const knownAnimationIds = new Set(
    identities.map((identity) => identity.animationId)
  );
  const editorPathname = input.editorPathname ?? "/";
  const lessonAuthorities = projectLessonAuthorities(
    input.learnerExperiences ?? [],
    knownAnimationIds
  );
  const descriptorRelationships = input.descriptors
    .filter((descriptor) => knownAnimationIds.has(descriptor.animationId))
    .flatMap((descriptor) => {
      const catalogEntry = input.catalogEntries.find(
        ({ identity }) => identity.animationId === descriptor.animationId
      )!;
      const lessonAuthority = lessonAuthorities.get(descriptor.animationId);
      const canonicalRepresentationId =
        lessonAuthority?.representationId ??
        catalogEntry.primaryDescriptor.id;
      const canonicalChoreography =
        lessonAuthority?.choreographySource ?? {
          kind: "catalog-animation" as const,
          sourceId: descriptor.animationId,
          choreographyId:
            `choreography.catalog.${descriptor.animationId}`
        };
      const presentationRole =
        lessonAuthority === undefined
          ? descriptor.id === catalogEntry.primaryDescriptor.id
            ? "canonical" as const
            : "projection" as const
          : lessonAuthority.presentation.assetId === descriptor.animationId
            ? "projection" as const
            : descriptor.id === catalogEntry.primaryDescriptor.id
              ? "projection" as const
              : "superseded-fixture" as const;
      const choreographySource =
        presentationRole === "superseded-fixture"
          ? {
              kind: "catalog-animation" as const,
              sourceId: descriptor.animationId,
              choreographyId:
                `choreography.catalog.${descriptor.animationId}`
            }
          : canonicalChoreography;
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
        playable: true,
        presentationRole,
        canonicalRepresentationId,
        choreographySource
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
                playable: true,
                presentationRole:
                  presentationRole === "canonical"
                    ? "projection"
                    : presentationRole,
                canonicalRepresentationId,
                choreographySource
              })
            ];

      return [editor, ...sample];
    });
  const learnerRelationships = [...lessonAuthorities.values()].map(
    ({ experience, presentation, representationId, choreographySource }) =>
      createKpAnimationRepresentationRelationship({
        animationId: presentation.canonicalAnimationId,
        representationId,
        kind:
          experience.kind === "scroll-lesson"
            ? "lesson"
            : "concept-room",
        label: experience.title,
        href: experience.href,
        playable: true,
        presentationRole: "canonical",
        canonicalRepresentationId: representationId,
        choreographySource,
        aliases:
          presentation.assetId === presentation.canonicalAnimationId
            ? []
            : [presentation.assetId]
      })
  );
  const relationships = [
    ...descriptorRelationships,
    ...learnerRelationships
  ];

  assertKpAnimationRepresentationRelationships({
    identities,
    relationships
  });
  return relationships;
}

export function auditKpLearnerCardPresentationOverlaps(input: {
  readonly descriptors: readonly KpEditorAnimationDescriptor[];
  readonly learnerExperiences: readonly KpLearnerExperienceDescriptor[];
}): readonly KpLearnerCardPresentationAudit[] {
  return input.learnerExperiences.flatMap((experience) =>
    experience.animationPresentations.map((presentation) => {
      const descriptors = input.descriptors.filter(
        ({ animationId }) =>
          animationId === presentation.canonicalAnimationId
      );
      const cardRepresentationIds = descriptors.flatMap(({ sampleId }) =>
        sampleId === undefined ? [] : [sampleId]
      );
      const compactProjection = [...descriptors].sort(
        (left, right) =>
          Number(right.familyId !== undefined) -
            Number(left.familyId !== undefined) ||
          left.id.localeCompare(right.id)
      )[0];
      return {
        schemaVersion:
          "kp.learner-card-presentation-audit.v1" as const,
        learnerExperienceId: experience.id,
        canonicalAnimationId: presentation.canonicalAnimationId,
        lessonAssetId: presentation.assetId,
        canonicalChoreographyId: presentation.choreographyId,
        status:
          cardRepresentationIds.length === 0
            ? "lesson-only" as const
            : "lesson-card-overlap" as const,
        cardRepresentationIds,
        descriptorIds: descriptors.map(({ id }) => id),
        supersededFixtureDescriptorIds:
          presentation.assetId === presentation.canonicalAnimationId
            ? []
            : descriptors
                .filter(({ id }) => id !== compactProjection?.id)
                .map(({ id }) => id),
        preservedAliasIds:
          presentation.assetId === presentation.canonicalAnimationId
            ? []
            : [presentation.assetId]
      };
    })
  );
}

interface KpProjectedLessonAuthority {
  readonly experience: KpLearnerExperienceDescriptor;
  readonly presentation: KpLearnerAnimationPresentation;
  readonly representationId: string;
  readonly choreographySource: {
    readonly kind: "lesson-animation";
    readonly sourceId: string;
    readonly choreographyId: string;
  };
}

function projectLessonAuthorities(
  experiences: readonly KpLearnerExperienceDescriptor[],
  knownAnimationIds: ReadonlySet<string>
): ReadonlyMap<string, KpProjectedLessonAuthority> {
  const authorities = new Map<string, KpProjectedLessonAuthority>();
  for (const experience of experiences) {
    for (const presentation of experience.animationPresentations) {
      if (!knownAnimationIds.has(presentation.canonicalAnimationId)) continue;
      if (authorities.has(presentation.canonicalAnimationId)) {
        throw new Error(
          `Animation ${presentation.canonicalAnimationId} has multiple lesson presentation authorities.`
        );
      }
      authorities.set(presentation.canonicalAnimationId, {
        experience,
        presentation,
        representationId:
          `learner-experience.${experience.id}.${presentation.assetId}`,
        choreographySource: {
          kind: "lesson-animation",
          sourceId: presentation.assetId,
          choreographyId: presentation.choreographyId
        }
      });
    }
  }
  return authorities;
}
