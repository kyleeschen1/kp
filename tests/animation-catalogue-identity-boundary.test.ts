import assert from "node:assert/strict";
import test from "node:test";

import {
  partitionKpAnimationCatalogueIdentities
} from "../src/editor/animation-catalogue-identity-boundary.ts";
import {
  createKpAnimationCatalogueLoadableRegistry
} from "../src/editor/animation-catalogue-loadable-registry.ts";
import {
  createKpSemanticAnimationWorkbenchIndex
} from "../src/editor/semantic-animation-workbench-data.ts";

test("catalogue membership is exactly concrete while planned identity is retained", () => {
  const canonical = createKpSemanticAnimationWorkbenchIndex().entries.map(
    ({ identity }) => identity
  );
  const sourcePlanned = canonical.find(
    ({ availability }) => availability === "planned"
  );
  assert.ok(sourcePlanned);
  assert.equal(Object.isFrozen(sourcePlanned), false);

  const boundary = partitionKpAnimationCatalogueIdentities({
    loadable: createKpAnimationCatalogueLoadableRegistry(),
    canonical
  });

  assert.equal(boundary.catalogue.length, 36);
  assert.equal(boundary.planned.length, 1);
  assert.equal(
    boundary.planned[0]?.animationId,
    "animation.algebra.quadratic.solution-branching"
  );
  assert.equal(boundary.planned[0]?.availability, "planned");
  assert.equal(
    boundary.catalogue.some(
      ({ animationId }) => animationId === boundary.planned[0]?.animationId
    ),
    false
  );
  assert.deepEqual(Object.keys(boundary).sort(), [
    "catalogue",
    "planned",
    "schemaVersion"
  ]);
  assert.equal(Object.isFrozen(boundary.planned[0]), true);
  assert.equal(Object.isFrozen(sourcePlanned), false);
});

test("identity boundary fails closed on concrete projection drift", () => {
  const loadable = createKpAnimationCatalogueLoadableRegistry();
  const canonical = createKpSemanticAnimationWorkbenchIndex().entries.map(
    ({ identity }) => identity
  );

  assert.throws(
    () => partitionKpAnimationCatalogueIdentities({
      loadable: loadable.slice(1),
      canonical
    }),
    /Concrete catalogue identity mismatch/
  );
  assert.throws(
    () => partitionKpAnimationCatalogueIdentities({
      loadable,
      canonical: [...canonical, canonical[0]!]
    }),
    /Duplicate canonical identity projection animation id/
  );
});

test("planned identity cannot overlap a loadable catalogue id", () => {
  const loadable = createKpAnimationCatalogueLoadableRegistry();
  const canonical = createKpSemanticAnimationWorkbenchIndex().entries.map(
    ({ identity }) => identity
  );
  const planned = canonical.find(
    ({ availability }) => availability === "planned"
  );
  assert.ok(planned);

  assert.throws(
    () => partitionKpAnimationCatalogueIdentities({
      loadable,
      canonical: canonical.map((identity) =>
        identity === planned
          ? { ...planned, animationId: loadable[0]!.animationId }
          : identity
      )
    }),
    /Duplicate canonical identity projection animation id|cannot be loadable/
  );
});
