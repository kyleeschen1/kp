import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import {
  projectKpAnimationCatalogToWorkbench
} from "../src/editor/semantic-animation-workbench-catalog-adapter.ts";
import {
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
    descriptors
  });
  return { catalogEntries, descriptors, relationships };
}

test("representation adapter projects editor descriptors and sample cards", () => {
  const { descriptors, relationships } = createProjection();
  const expectedCount =
    descriptors.length +
    descriptors.filter((descriptor) => descriptor.sampleId !== undefined).length;

  assert.equal(relationships.length, expectedCount);
  assert.equal(
    new Set(
      relationships.map((relationship) => relationship.representationId)
    ).size,
    relationships.length
  );
});

test("radical representations stay beneath one canonical identity", () => {
  const { relationships } = createProjection();
  const radical = relationships.filter(
    (relationship) =>
      relationship.animationId ===
      "animation.generated.radical.square-root-as-power"
  );

  assert.deepEqual(
    radical.map(({ kind, representationId }) => ({
      kind,
      representationId
    })),
    [
      {
        kind: "editor",
        representationId:
          "editor-animation.animation.generated.radical.square-root-as-power"
      },
      {
        kind: "editor",
        representationId:
          "editor-animation.sample.animation.radical-rewrite.square-root-as-power"
      },
      {
        kind: "card",
        representationId:
          "sample.animation.radical-rewrite.square-root-as-power"
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
