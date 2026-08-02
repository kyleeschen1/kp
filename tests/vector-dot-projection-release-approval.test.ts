import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpVerifiedVectorDotProjectionReleaseApproval,
  kpVerifiedVectorDotProjectionReleaseApproval
} from "../src/architecture/vector-dot-projection-release-approval.ts";
import { createKpAnimationCatalogueProjection } from
  "../src/editor/animation-catalogue-projection.ts";
import { createKpAnimationLibraryDisplayCatalog } from
  "../src/editor/animation-library-display-catalog.ts";

test("vector promotion is owned by one nominal seven-checkpoint approval", () => {
  const approval = kpVerifiedVectorDotProjectionReleaseApproval;

  assert.equal(approval.animationId, "animation.dot-projection.basic");
  assert.equal(approval.releaseDecision, "passed");
  assert.equal(approval.catalogueDisposition, "keep");
  assert.equal(approval.checkpointCount, 7);
  assert.equal(isKpVerifiedVectorDotProjectionReleaseApproval(approval), true);
  assert.equal(
    isKpVerifiedVectorDotProjectionReleaseApproval({ ...approval }),
    false
  );
});

test("the approved vector is ported and Keep without inferring other rows", () => {
  const display = createKpAnimationLibraryDisplayCatalog().find(
    ({ animationId }) => animationId === "animation.dot-projection.basic"
  );
  const catalogue = createKpAnimationCatalogueProjection();
  const vector = catalogue.entries.find(
    ({ animationId }) => animationId === "animation.dot-projection.basic"
  );
  const other = catalogue.entries.find(
    ({ animationId }) => animationId !== "animation.dot-projection.basic"
  );

  assert.equal(display?.canonicalFormat, "ported");
  assert.equal(vector?.humanDisposition, "keep");
  assert.equal(other?.humanDisposition, "unreviewed");
});
