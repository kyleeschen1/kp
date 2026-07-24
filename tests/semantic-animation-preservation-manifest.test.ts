import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import { createKpLearnerExperienceLibrary } from "../src/editor/learner-experience-library.ts";
import {
  createKpSemanticAnimationPreservationManifest
} from "../src/editor/semantic-animation-preservation-manifest.ts";
import {
  projectKpAnimationCatalogToWorkbench
} from "../src/editor/semantic-animation-workbench-catalog-adapter.ts";
import {
  projectKpAnimationRepresentations
} from "../src/editor/semantic-animation-workbench-representation-adapter.ts";
import {
  createKpAnimationWorkbenchSeedCohort
} from "../src/editor/semantic-animation-workbench-seeds.ts";

test("preservation manifest freezes the complete convergence cohort", () => {
  const manifest = createKpSemanticAnimationPreservationManifest();

  assert.deepEqual(
    manifest.map(({ topic }) => topic),
    [
      "solve-x",
      "distribution",
      "factoring",
      "fractions",
      "radical",
      "structural-wrap",
      "matrix-composition",
      "equation-graph",
      "program-trace"
    ]
  );
  assert.equal(
    manifest.every(({ animationId, reviewScopeId }) =>
      animationId === reviewScopeId
    ),
    true
  );
});

test("catalog-backed preservation entries match live canonical projections and exports", () => {
  const manifest = createKpSemanticAnimationPreservationManifest();
  const descriptors = createKpEditorAnimationLibrary();
  const entries = projectKpAnimationCatalogToWorkbench({
    descriptors,
    seeds: createKpAnimationWorkbenchSeedCohort()
  });
  const relationships = projectKpAnimationRepresentations({
    catalogEntries: entries,
    descriptors,
    learnerExperiences: createKpLearnerExperienceLibrary()
  });
  const assets = createKpAnimationAssets();

  for (const item of manifest.filter(
    ({ descriptorIds }) => descriptorIds.length > 0
  )) {
    const entry = entries.find(
      ({ identity }) => identity.animationId === item.animationId
    );
    assert.ok(entry, `missing catalog identity ${item.animationId}`);
    assert.deepEqual(entry.descriptorIds, item.descriptorIds);

    const canonical = relationships.find(
      (relationship) =>
        relationship.animationId === item.animationId &&
        relationship.presentationRole === "canonical"
    );
    assert.ok(canonical, `missing canonical projection ${item.animationId}`);
    assert.equal(
      canonical.representationId,
      item.canonicalRepresentationId
    );
    assert.equal(canonical.href, item.canonicalRoute);
    assert.deepEqual(canonical.choreographySource, item.canonicalSource);

    const cards = relationships
      .filter(
        (relationship) =>
          relationship.animationId === item.animationId &&
          relationship.kind === "card"
      )
      .map(({ representationId }) => representationId);
    assert.deepEqual(cards, item.cardRepresentationIds);

    const asset = assets.find(({ id }) => id === item.animationId);
    assert.ok(asset, `missing animation asset ${item.animationId}`);
    assert.deepEqual(
      asset.exportTargets.map(({ id }) => id),
      item.exportTargetIds
    );
  }
});

test("lesson-only preservation entries retain exact learner routes without inventing cards", () => {
  const manifest = createKpSemanticAnimationPreservationManifest();
  const experiences = createKpLearnerExperienceLibrary();
  const lessonOnly = manifest.filter(
    ({ descriptorIds }) => descriptorIds.length === 0
  );

  assert.deepEqual(
    lessonOnly.map(({ animationId }) => animationId),
    ["animation.numerator-split-merge.round-trip"]
  );
  for (const item of lessonOnly) {
    const match = experiences.flatMap((experience) =>
      experience.animationPresentations.map((presentation) => ({
        experience,
        presentation
      }))
    ).find(
      ({ presentation }) =>
        presentation.canonicalAnimationId === item.animationId
    );
    assert.ok(match, `missing lesson-only animation ${item.animationId}`);
    assert.equal(match.experience.href, item.canonicalRoute);
    assert.equal(
      match.presentation.choreographyId,
      item.canonicalSource.choreographyId
    );
    assert.deepEqual(item.cardRepresentationIds, []);
    assert.deepEqual(item.exportTargetIds, []);
  }
});
