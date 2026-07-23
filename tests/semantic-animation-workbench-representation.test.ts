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
