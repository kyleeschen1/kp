import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpQuadraticBranchingPreservationManifest,
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
