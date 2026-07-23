import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationLifecycleFacets
} from "../src/editor/semantic-animation-workbench-lifecycle.ts";

test("lifecycle facets retain independent roadmap, execution, and evidence states", () => {
  const derivative = createKpAnimationLifecycleFacets({
    roadmap: "now",
    execution: "complete",
    maturity: "approved",
    review: "approved",
    verification: "passing",
    playability: "playable"
  });
  const quadratic = createKpAnimationLifecycleFacets({
    roadmap: "next",
    execution: "queued",
    maturity: "proposed",
    review: "unreviewed",
    verification: "unknown",
    playability: "planned-only"
  });

  assert.equal("status" in derivative, false);
  assert.equal(derivative.execution, "complete");
  assert.equal(derivative.roadmap, "now");
  assert.equal(quadratic.playability, "planned-only");
  assert.equal(quadratic.execution, "queued");
});

test("lifecycle facets reject evidence-backed incompatible states", () => {
  assert.throws(
    () =>
      createKpAnimationLifecycleFacets({
        roadmap: "next",
        execution: "complete",
        maturity: "proposed",
        review: "unreviewed",
        verification: "unknown",
        playability: "planned-only"
      }),
    /planned-only animation cannot have complete execution/
  );
  assert.throws(
    () =>
      createKpAnimationLifecycleFacets({
        roadmap: "later",
        execution: "not-scheduled",
        maturity: "promoted",
        review: "changes-requested",
        verification: "passing",
        playability: "playable"
      }),
    /promoted animation requires approved review evidence/
  );
});

test("lifecycle facets do not infer maturity from passing verification", () => {
  const facets = createKpAnimationLifecycleFacets({
    roadmap: "later",
    execution: "not-scheduled",
    maturity: "experimental",
    review: "awaiting-review",
    verification: "passing",
    playability: "playable"
  });

  assert.equal(facets.verification, "passing");
  assert.equal(facets.maturity, "experimental");
  assert.equal(facets.review, "awaiting-review");
});
