import assert from "node:assert/strict";
import test from "node:test";

import {
  kpDevReviewAcceptanceContract,
  kpDevReviewRoundAcceptanceContract
} from "../src/dev-review/review-acceptance.ts";

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

test("review-round acceptance separates current projections from preserved history", () => {
  assert.equal(
    kpDevReviewRoundAcceptanceContract.sourceAuthority,
    "append-only-event-history"
  );
  assert.deepEqual(kpDevReviewRoundAcceptanceContract.currentStateAuthority, [
    "explicit-round-lifecycle",
    "note-lifecycle-status",
    "per-consumer-cursor"
  ]);
  assert.ok(kpDevReviewRoundAcceptanceContract.queryCriteria.includes(
    "bounded-current-round-default"
  ));
  assert.ok(kpDevReviewRoundAcceptanceContract.migrationCriteria.includes(
    "source-event-bytes-remain-unchanged"
  ));
  assert.ok(kpDevReviewRoundAcceptanceContract.forbiddenInferences.includes(
    "age-implies-obsolete"
  ));
  assert.deepEqual(kpDevReviewRoundAcceptanceContract.counterSemantics, {
    primary: "new-notes-in-current-round",
    historical: "all-preserved-notes"
  });
  assert.equal(
    kpDevReviewRoundAcceptanceContract.humanCheckpoint,
    "s27-release-gate-handoff"
  );
  assert.throws(() => {
    (kpDevReviewRoundAcceptanceContract.queryCriteria as string[]).push(
      "unbounded-default"
    );
  });
});
