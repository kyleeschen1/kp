import assert from "node:assert/strict";
import test from "node:test";

import type {
  KpDevReviewCompactNoteEvidence
} from "../protocols/dev-review-operations-v2.ts";
import {
  projectKpAnimationAsset
} from "../src/animation/asset-projections.ts";
import {
  createKpAnimationAssets
} from "../src/animation/catalog.ts";
import {
  createKpAnimationFlashcardProjection
} from "../src/animation/flashcard-projection.ts";
import {
  createLinearSolveAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import {
  projectKpAnimationAssetsToEditorDescriptors
} from "../src/editor/animation-catalog-projection.ts";
import {
  createKpLearnerExperienceLibrary
} from "../src/editor/learner-experience-library.ts";
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
  projectKpAnimationReviewEvidence
} from "../src/editor/semantic-animation-workbench-review-adapter.ts";
import {
  createKpAnimationWorkbenchSeedCohort
} from "../src/editor/semantic-animation-workbench-seeds.ts";
import {
  createSymbolicManipulationFamilyRegistry
} from "../src/animation/symbolic-manipulation-family-registry.ts";
import {
  createLinearSolveKpAssetBundle
} from "../src/semantic/linear-solve-asset.ts";

test("projected catalog consumers preserve descriptors and lesson-first Workbench identity", () => {
  const assets = createKpAnimationAssets();
  const projectedAssets = assets.map(projectKpAnimationAsset);
  const families = createSymbolicManipulationFamilyRegistry();
  const aggregateDescriptors =
    projectKpAnimationAssetsToEditorDescriptors({ assets, families });
  const projectedDescriptors =
    projectKpAnimationAssetsToEditorDescriptors({
      assets: projectedAssets,
      families
    });

  assert.deepEqual(projectedDescriptors, aggregateDescriptors);

  const workbench = projectKpAnimationCatalogToWorkbench({
    descriptors: projectedDescriptors,
    seeds: createKpAnimationWorkbenchSeedCohort()
  });
  const relationships = projectKpAnimationRepresentations({
    catalogEntries: workbench,
    descriptors: projectedDescriptors,
    learnerExperiences: createKpLearnerExperienceLibrary()
  });

  for (const expected of createKpSemanticAnimationPreservationManifest()) {
    const canonical = relationships.find(
      (relationship) =>
        relationship.animationId === expected.animationId &&
        relationship.presentationRole === "canonical"
    );
    if (expected.descriptorIds.length === 0) continue;
    assert.ok(canonical);
    assert.equal(canonical.representationId, expected.canonicalRepresentationId);
    assert.equal(canonical.href, expected.canonicalRoute);
    assert.deepEqual(canonical.choreographySource, expected.canonicalSource);
    assert.deepEqual(
      relationships
        .filter(
          ({ animationId, kind }) =>
            animationId === expected.animationId && kind === "card"
        )
        .map(({ representationId }) => representationId),
      expected.cardRepresentationIds
    );
  }
});

test("projected card and export consumers retain exact public artifacts", () => {
  const animation = createLinearSolveAnimationAsset();
  const projections = projectKpAnimationAsset(animation);
  const card = createLinearSolveKpAssetBundle().flashcards[2]!;

  assert.deepEqual(
    createKpAnimationFlashcardProjection({
      animation: projections.semanticAnimation,
      card
    }),
    createKpAnimationFlashcardProjection({ animation, card })
  );
  assert.strictEqual(
    projections.productManifest.exportTargets,
    animation.exportTargets
  );
  assert.deepEqual(
    projections.productManifest.exportTargets.map(({ id }) => id),
    ["export.linear-solve.frames"]
  );
});

test("projected Workbench identity remains the sole review target across lesson and card routes", () => {
  const assets = createKpAnimationAssets().map(projectKpAnimationAsset);
  const descriptors = projectKpAnimationAssetsToEditorDescriptors({
    assets,
    families: createSymbolicManipulationFamilyRegistry()
  });
  const entries = projectKpAnimationCatalogToWorkbench({
    descriptors,
    seeds: createKpAnimationWorkbenchSeedCohort()
  });
  const relationships = projectKpAnimationRepresentations({
    catalogEntries: entries,
    descriptors,
    learnerExperiences: createKpLearnerExperienceLibrary()
  });
  const expected = createKpSemanticAnimationPreservationManifest().find(
    ({ topic }) => topic === "distribution"
  )!;
  const identity = entries.find(
    ({ identity }) => identity.animationId === expected.animationId
  )!.identity;
  const result = projectKpAnimationReviewEvidence({
    identities: [identity],
    relationships,
    currentRoundId: "round.current",
    notes: [
      reviewNote({
        id: "note.lesson",
        route: expected.canonicalRoute,
        assetId: expected.canonicalSource.sourceId
      }),
      reviewNote({
        id: "note.card",
        route: `/?animation=${expected.descriptorIds[0]}`,
        assetId: expected.animationId,
        projectionId: expected.cardRepresentationIds[0]
      })
    ]
  });

  assert.equal(result.projections.length, 1);
  assert.equal(result.projections[0]!.animationId, expected.reviewScopeId);
  assert.deepEqual(
    result.projections[0]!.current.map(
      ({ canonicalRepresentation }) =>
        canonicalRepresentation?.representationId
    ),
    [expected.canonicalRepresentationId, expected.canonicalRepresentationId]
  );
});

function reviewNote(input: {
  readonly id: string;
  readonly route: string;
  readonly assetId: string;
  readonly projectionId?: string | undefined;
}): KpDevReviewCompactNoteEvidence {
  return {
    id: input.id,
    sequence: input.id === "note.lesson" ? 1 : 2,
    roundId: "round.current",
    status: "new",
    comment: "Projection migration preservation fixture.",
    sessionId: "session.projection-migration",
    capturedAt: "2026-07-23T00:00:00.000Z",
    route: input.route,
    build: {
      commit: "fixture",
      fingerprint: "build.fixture",
      dirty: false
    },
    capture: {
      route: input.route,
      capturedAt: "2026-07-23T00:00:00.000Z",
      environment: {
        browserName: "fixture",
        language: "en",
        viewport: {
          width: 1200,
          height: 800,
          devicePixelRatio: 1,
          scrollX: 0,
          scrollY: 0
        },
        reducedMotion: false,
        forcedColors: false,
        colorScheme: "light",
        build: {
          commit: "fixture",
          fingerprint: "build.fixture",
          dirty: false
        }
      },
      semantic: {
        assetId: input.assetId,
        ...(input.projectionId === undefined
          ? {}
          : { projectionId: input.projectionId }),
        activeTransformationIds: [],
        focusRefs: []
      },
      render: { ownerIds: [] },
      temporalTrace: []
    }
  };
}
