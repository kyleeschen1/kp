import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import {
  createKpLearnerExperienceLibrary
} from "../src/editor/learner-experience-library.ts";
import {
  projectKpAnimationCatalogToWorkbench
} from "../src/editor/semantic-animation-workbench-catalog-adapter.ts";
import {
  auditKpLearnerCardPresentationOverlaps,
  projectKpAnimationRepresentations
} from "../src/editor/semantic-animation-workbench-representation-adapter.ts";
import {
  createKpAnimationWorkbenchSeedCohort
} from "../src/editor/semantic-animation-workbench-seeds.ts";

function createProjection() {
  const descriptors = createKpEditorAnimationLibrary();
  const catalogEntries = projectKpAnimationCatalogToWorkbench({
    descriptors,
    seeds: createKpAnimationWorkbenchSeedCohort()
  });
  const relationships = projectKpAnimationRepresentations({
    catalogEntries,
    descriptors,
    learnerExperiences: createKpLearnerExperienceLibrary()
  });
  return { catalogEntries, descriptors, relationships };
}

test("representation adapter projects editor descriptors and sample cards", () => {
  const { descriptors, relationships } = createProjection();
  const expectedCount =
    descriptors.length +
    descriptors.filter((descriptor) => descriptor.sampleId !== undefined).length +
    2;

  assert.equal(relationships.length, expectedCount);
  assert.equal(
    new Set(
      relationships.map((relationship) => relationship.representationId)
    ).size,
    relationships.length
  );
});

test("existing learner lessons remain subordinate representations", () => {
  const { relationships } = createProjection();
  const lesson = relationships.find(
    (relationship) =>
      relationship.animationId === "animation.linear-solve.solve-x" &&
      relationship.kind === "lesson"
  );

  assert.equal(lesson?.href, "/reader/solve-x/");
  assert.equal(lesson?.playable, true);
  assert.equal(lesson?.presentationRole, "canonical");
  assert.match(lesson?.representationId ?? "", /^learner-experience\./);
});

test("distribution lesson supersedes generated card choreography without losing aliases", () => {
  const { relationships } = createProjection();
  const distribution = relationships.filter(
    ({ animationId }) =>
      animationId === "animation.generated.distribution.expand-a-sum"
  );
  const lesson = distribution.find(({ kind }) => kind === "lesson");
  const fixtures = distribution.filter(
    ({ presentationRole }) => presentationRole === "superseded-fixture"
  );

  assert.equal(lesson?.presentationRole, "canonical");
  assert.equal(
    lesson?.choreographySource.choreographyId,
    "choreography.lesson.distribution-area.algebra-and-area"
  );
  assert.deepEqual(lesson?.aliases, [
    "exemplar.distribution-area.3-times-x-plus-2"
  ]);
  assert.equal(fixtures.length, 1);
  assert.equal(
    distribution.filter(
      ({ presentationRole }) => presentationRole === "projection"
    ).length,
    2
  );
  assert.equal(
    fixtures.every(
      ({ canonicalRepresentationId }) =>
        canonicalRepresentationId === lesson?.representationId
    ),
    true
  );
});

test("learner and card audit classifies every lesson binding from one inventory", () => {
  const descriptors = createKpEditorAnimationLibrary();
  const audit = auditKpLearnerCardPresentationOverlaps({
    descriptors,
    learnerExperiences: createKpLearnerExperienceLibrary()
  });
  const overlaps = audit.filter(
    ({ status }) => status === "lesson-card-overlap"
  );

  assert.equal(audit.length, 9);
  assert.deepEqual(
    overlaps.map(({ canonicalAnimationId }) => canonicalAnimationId),
    [
      "animation.generated.distribution.expand-a-sum",
      "animation.linear-solve.solve-x"
    ]
  );
  assert.deepEqual(overlaps[0]?.preservedAliasIds, [
    "exemplar.distribution-area.3-times-x-plus-2"
  ]);
  assert.equal(overlaps[0]?.supersededFixtureDescriptorIds.length, 1);
  assert.deepEqual(overlaps[1]?.supersededFixtureDescriptorIds, []);
});

test("radical representations stay beneath one canonical identity", () => {
  const { relationships } = createProjection();
  const radical = relationships.filter(
    (relationship) =>
      relationship.animationId ===
      "animation.generated.radical.square-root-as-power"
  );

  assert.deepEqual(
    radical.map(({ kind, representationId, presentationRole }) => ({
      kind,
      representationId,
      presentationRole
    })),
    [
      {
        kind: "editor",
        representationId:
          "editor-animation.animation.generated.radical.square-root-as-power",
        presentationRole: "projection"
      },
      {
        kind: "editor",
        representationId:
          "editor-animation.sample.animation.radical-rewrite.square-root-as-power",
        presentationRole: "canonical"
      },
      {
        kind: "card",
        representationId:
          "sample.animation.radical-rewrite.square-root-as-power",
        presentationRole: "projection"
      }
    ]
  );
  assert.equal(
    radical.every(
      (relationship) =>
        relationship.href?.startsWith("/?animation=") === true &&
        relationship.playable
    ),
    true
  );
});

test("planned quadratic receives no invented representation", () => {
  const { relationships } = createProjection();

  assert.equal(
    relationships.some(
      (relationship) =>
        relationship.animationId ===
        "animation.algebra.quadratic.solution-branching"
    ),
    false
  );
});
