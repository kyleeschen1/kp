import assert from "node:assert/strict";
import test from "node:test";

import {
  assertKpCanonicalAnimationIdentities,
  createKpCanonicalAnimationIdentity
} from "../src/editor/semantic-animation-workbench-identity.ts";
import {
  assertKpAnimationRepresentationRelationships,
  createKpAnimationRepresentationRelationship
} from "../src/editor/semantic-animation-workbench-representation.ts";
import {
  createKpAnimationWorkbenchSeedCohort
} from "../src/editor/semantic-animation-workbench-seeds.ts";

const identities = createKpAnimationWorkbenchSeedCohort().map((seed) =>
  createKpCanonicalAnimationIdentity({ seed })
);
assertKpCanonicalAnimationIdentities(identities);

test("representation relationships remain subordinate to one animation", () => {
  const relationship = createKpAnimationRepresentationRelationship({
    animationId: identities[0]!.animationId,
    representationId:
      "editor-animation.sample.animation.radical-rewrite.square-root-as-power",
    kind: "editor",
    label: "Animation Library",
    href:
      "/?animation=editor-animation.sample.animation.radical-rewrite.square-root-as-power",
    playable: true
  });

  assert.equal(relationship.animationId, identities[0]!.animationId);
  assert.equal(relationship.kind, "editor");
  assert.equal(relationship.playable, true);
  assert.equal(relationship.presentationRole, "canonical");
  assert.equal(
    relationship.canonicalRepresentationId,
    relationship.representationId
  );
  assert.doesNotThrow(() =>
    assertKpAnimationRepresentationRelationships({
      identities,
      relationships: [relationship]
    })
  );
});

test("representations cannot masquerade as canonical animations", () => {
  assert.throws(
    () =>
      createKpAnimationRepresentationRelationship({
        animationId: identities[0]!.animationId,
        representationId: "animation.duplicate.radical",
        kind: "card",
        label: "Duplicate",
        playable: true
      }),
    /must not claim canonical animation identity/
  );
});

test("representation relationships reject orphans and duplicate projections", () => {
  const relationship = createKpAnimationRepresentationRelationship({
    animationId: identities[0]!.animationId,
    representationId: "representation.radical.editor",
    kind: "editor",
    label: "Editor",
    playable: true
  });
  assert.throws(
    () =>
      assertKpAnimationRepresentationRelationships({
        identities,
        relationships: [
          relationship,
          {
            ...relationship,
            id: `${relationship.id}.duplicate-owner`,
            animationId: identities[1]!.animationId
          }
        ]
      }),
    /cannot belong to multiple relationships/
  );
  assert.throws(
    () =>
      assertKpAnimationRepresentationRelationships({
        identities,
        relationships: [
          { ...relationship, animationId: "animation.unknown" }
        ]
      }),
    /references unknown animation/
  );
});

test("lesson precedence permits projections and preserves superseded fixtures", () => {
  const animationId = identities[0]!.animationId;
  const lessonId = "learner-experience.radical.lesson";
  const lessonSource = {
    kind: "lesson-animation" as const,
    sourceId: "lesson.asset.radical",
    choreographyId: "choreography.lesson.radical"
  };
  const relationships = [
    createKpAnimationRepresentationRelationship({
      animationId,
      representationId: lessonId,
      kind: "lesson",
      label: "Lesson",
      playable: true,
      presentationRole: "canonical",
      choreographySource: lessonSource,
      aliases: ["lesson.asset.radical"]
    }),
    createKpAnimationRepresentationRelationship({
      animationId,
      representationId: "card.radical",
      kind: "card",
      label: "Card",
      playable: true,
      presentationRole: "projection",
      canonicalRepresentationId: lessonId,
      choreographySource: lessonSource
    }),
    createKpAnimationRepresentationRelationship({
      animationId,
      representationId: "fixture.radical",
      kind: "editor",
      label: "Old fixture",
      playable: true,
      presentationRole: "superseded-fixture",
      canonicalRepresentationId: lessonId
    })
  ];

  assert.doesNotThrow(() =>
    assertKpAnimationRepresentationRelationships({
      identities,
      relationships
    })
  );
});

test("lesson lineage rejects competing canonical and divergent projections", () => {
  const animationId = identities[0]!.animationId;
  const lesson = createKpAnimationRepresentationRelationship({
    animationId,
    representationId: "learner-experience.radical.lesson",
    kind: "lesson",
    label: "Lesson",
    playable: true,
    choreographySource: {
      kind: "lesson-animation",
      sourceId: "lesson.asset.radical",
      choreographyId: "choreography.lesson.radical"
    }
  });
  const competing = createKpAnimationRepresentationRelationship({
    animationId,
    representationId: "card.radical",
    kind: "card",
    label: "Card",
    playable: true
  });
  assert.throws(
    () =>
      assertKpAnimationRepresentationRelationships({
        identities,
        relationships: [lesson, competing]
      }),
    /exactly one canonical/
  );

  const divergent = createKpAnimationRepresentationRelationship({
    animationId,
    representationId: "card.radical",
    kind: "card",
    label: "Card",
    playable: true,
    presentationRole: "projection",
    canonicalRepresentationId: lesson.representationId
  });
  assert.throws(
    () =>
      assertKpAnimationRepresentationRelationships({
        identities,
        relationships: [lesson, divergent]
      }),
    /must consume canonical choreography/
  );
});
