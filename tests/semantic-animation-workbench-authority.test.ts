import assert from "node:assert/strict";
import test from "node:test";

import {
  assertSingleAuthorityPerFact,
  authorityForKpAnimationWorkbenchFact,
  createKpAnimationWorkbenchAuthorityMap
} from "../src/editor/semantic-animation-workbench-authority.ts";

test("Workbench authority map assigns every fact to one existing authority", () => {
  const map = createKpAnimationWorkbenchAuthorityMap();

  assert.equal(map.schemaVersion, "kp.semantic-animation-workbench-authority.v1");
  assert.deepEqual(map.derivedIndexOwns, []);
  assert.equal(
    authorityForKpAnimationWorkbenchFact(map, "canonical-animation-identity").id,
    "animation-catalog"
  );
  assert.equal(
    authorityForKpAnimationWorkbenchFact(map, "representation-relationships").id,
    "representation-registries"
  );
  assert.equal(
    authorityForKpAnimationWorkbenchFact(map, "execution-state").id,
    "theseus"
  );
  assert.equal(
    authorityForKpAnimationWorkbenchFact(map, "approval-evidence").id,
    "promotion-evidence"
  );
  assert.equal(
    authorityForKpAnimationWorkbenchFact(map, "review-history").id,
    "development-review"
  );
});

test("Workbench authority map rejects overlapping ownership", () => {
  assert.throws(
    () =>
      assertSingleAuthorityPerFact([
        {
          id: "animation-catalog",
          label: "Catalog",
          owns: ["canonical-animation-identity"],
          sourceBoundary: "catalog"
        },
        {
          id: "theseus",
          label: "Theseus",
          owns: ["canonical-animation-identity"],
          sourceBoundary: "control"
        }
      ]),
    /cannot be owned by both animation-catalog and theseus/
  );
});

test("Workbench authority map rejects empty authorities and missing facts", () => {
  assert.throws(
    () =>
      assertSingleAuthorityPerFact([
        {
          id: "development-review",
          label: "Review",
          owns: [],
          sourceBoundary: "review"
        }
      ]),
    /must own at least one fact/
  );

  const map = {
    ...createKpAnimationWorkbenchAuthorityMap(),
    authorities: createKpAnimationWorkbenchAuthorityMap().authorities.filter(
      (authority) => authority.id !== "theseus"
    )
  };
  assert.throws(
    () => authorityForKpAnimationWorkbenchFact(map, "execution-state"),
    /must have exactly one authority; found 0/
  );
});
