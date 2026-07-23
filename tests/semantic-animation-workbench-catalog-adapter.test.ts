import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import {
  projectKpAnimationCatalogToWorkbench
} from "../src/editor/semantic-animation-workbench-catalog-adapter.ts";
import {
  createKpAnimationWorkbenchSeedCohort
} from "../src/editor/semantic-animation-workbench-seeds.ts";

test("catalog adapter collapses descriptor variants into canonical animations", () => {
  const descriptors = createKpEditorAnimationLibrary();
  const entries = projectKpAnimationCatalogToWorkbench({
    descriptors,
    seeds: createKpAnimationWorkbenchSeedCohort()
  });
  const catalogAnimationIds = new Set(
    descriptors.map((descriptor) => descriptor.animationId)
  );

  assert.equal(entries.length, catalogAnimationIds.size);
  assert.equal(
    new Set(entries.map((entry) => entry.identity.animationId)).size,
    entries.length
  );

  const radical = entries.filter(
    (entry) =>
      entry.identity.animationId ===
      "animation.generated.radical.square-root-as-power"
  );
  assert.equal(radical.length, 1);
  assert.deepEqual(radical[0]!.descriptorIds, [
    "editor-animation.sample.animation.radical-rewrite.square-root-as-power",
    "editor-animation.animation.generated.radical.square-root-as-power"
  ]);
  assert.equal(
    radical[0]!.primaryDescriptor.id,
    "editor-animation.sample.animation.radical-rewrite.square-root-as-power"
  );
  assert.equal(radical[0]!.identity.title, "Power to radical");
});

test("catalog adapter preserves tangent provenance and excludes planned items", () => {
  const entries = projectKpAnimationCatalogToWorkbench({
    descriptors: createKpEditorAnimationLibrary(),
    seeds: createKpAnimationWorkbenchSeedCohort()
  });
  const tangent = entries.filter(
    (entry) =>
      entry.identity.animationId ===
      "animation.derivative-rules.tangent-graph"
  );

  assert.equal(tangent.length, 1);
  assert.equal(tangent[0]!.descriptorIds.length, 2);
  assert.deepEqual(tangent[0]!.identity.provenance, {
    kind: "catalog",
    descriptorId:
      "editor-animation.sample.animation.derivative-rules.tangent-graph"
  });
  assert.equal(
    entries.some(
      (entry) =>
        entry.identity.animationId ===
        "animation.algebra.quadratic.solution-branching"
    ),
    false
  );
});

test("catalog adapter rejects seed provenance missing from the catalog", () => {
  const [radical] = createKpAnimationWorkbenchSeedCohort();

  assert.throws(
    () =>
      projectKpAnimationCatalogToWorkbench({
        descriptors: createKpEditorAnimationLibrary(),
        seeds: [
          {
            ...radical!,
            source: {
              kind: "catalog",
              descriptorId: "editor-animation.missing"
            }
          }
        ]
      }),
    /requires descriptor/
  );
});
