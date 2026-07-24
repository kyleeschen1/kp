import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpQuadraticBranchingPreservationManifest,
  createKpQuadraticExemplarReviewLedger,
  KP_QUADRATIC_REJECTED_REVIEW_NOTE_IDS,
  KP_QUADRATIC_BRANCHING_ANIMATION_ID
} from "../src/editor/quadratic-branching-preservation.ts";
import { createKpAnimationLifecycleFacets } from "../src/editor/semantic-animation-workbench-lifecycle.ts";
import { createKpAnimationWorkbenchSeedCohort } from "../src/editor/semantic-animation-workbench-seeds.ts";

test("quadratic preservation manifest freezes the accepted reference cohort", () => {
  const manifest = createKpQuadraticBranchingPreservationManifest();

  assert.equal(manifest.entries.length, 4);
  assert.deepEqual(
    manifest.entries.map(({ id, expectedPlayability }) => [
      id,
      expectedPlayability
    ]),
    [
      ["solve-x", "playable"],
      ["derivative", "playable"],
      ["radical", "playable"],
      ["quadratic", "planned-only"]
    ]
  );
  assert.match(manifest.radicalResidualSource, /radical-cross-renderer/);
});

test("planned quadratic identity stays non-playable before publication", () => {
  const quadratic = createKpAnimationWorkbenchSeedCohort().find(
    ({ animationId }) => animationId === KP_QUADRATIC_BRANCHING_ANIMATION_ID
  );
  assert.equal(quadratic?.expectedPlayability, "planned-only");

  const lifecycle = createKpAnimationLifecycleFacets({
    roadmap: "next",
    execution: "queued",
    maturity: "proposed",
    approval: "unapproved",
    review: "unreviewed",
    verification: "unknown",
    playability: "planned-only"
  });
  assert.equal(lifecycle.playability, "planned-only");
});

test("rejected quadratic checkpoint blocks publication without discarding accepted work", () => {
  const ledger = createKpQuadraticExemplarReviewLedger();

  assert.equal(ledger.checkpointStatus, "rejected");
  assert.deepEqual(ledger.reviewNoteIds, KP_QUADRATIC_REJECTED_REVIEW_NOTE_IDS);
  assert.equal(ledger.reviewNoteIds.length, 8);
  assert.deepEqual(ledger.acceptedBoundaries, [
    "exact-semantic-authority",
    "plus-minus-branch-identity",
    "branch-graph-correspondence",
    "shared-runtime-and-review-lifecycle"
  ]);
  assert.deepEqual(ledger.rejectedBoundaries, [
    "generic-checkpoint-symbol-motion",
    "compound-operation-omission",
    "standalone-visible-solution-set-reunion"
  ]);
  assert.deepEqual(ledger.publicationGate, {
    status: "blocked",
    requires: "renewed-human-exemplar-approval",
    successorContract:
      "run-contract.kp.quadratic-operation-presentation-governance-v0"
  });
});
