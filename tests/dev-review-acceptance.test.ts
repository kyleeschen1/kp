import assert from "node:assert/strict";
import test from "node:test";

import { kpDevReviewAcceptanceContract } from "../src/dev-review/review-acceptance.ts";

test("dev review acceptance contract freezes the approved observation boundary", () => {
  assert.equal(kpDevReviewAcceptanceContract.developmentDefault, true);
  assert.equal(kpDevReviewAcceptanceContract.productionExcluded, true);
  assert.ok(kpDevReviewAcceptanceContract.acceptanceCriteria.includes(
    "snapshot-locked-at-panel-open"
  ));
  assert.ok(kpDevReviewAcceptanceContract.privacyExclusions.includes(
    "client-selected-filesystem-paths"
  ));
  assert.ok(kpDevReviewAcceptanceContract.preservationBoundary.includes(
    "continuous-scroll-authority"
  ));
  assert.deepEqual(kpDevReviewAcceptanceContract.humanCheckpoint, {
    sliceId: "s20-human-exemplar-checkpoint",
    requiredBefore: [
      "generic-development-surface-mount",
      "semantic-editor-integration"
    ]
  });
  assert.throws(() => {
    (kpDevReviewAcceptanceContract.rollbackUnits as string[]).push("coupled-runtime");
  });
});
