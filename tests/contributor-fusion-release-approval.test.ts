import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpVerifiedContributorFusionReleaseApproval,
  kpContributorFusionReleasedAnimationIds,
  kpVerifiedContributorFusionReleaseApproval
} from "../src/architecture/contributor-fusion-release-approval.ts";
import {
  createKpAnimationLibraryDisplayCatalog
} from "../src/editor/animation-library-display-catalog.ts";

test("contributor fusion has one nominal, bounded release approval", () => {
  const approval = kpVerifiedContributorFusionReleaseApproval;

  assert.deepEqual(approval.approvedPressureKinds, ["product", "quotient"]);
  assert.equal(approval.confirmationKind, "sum");
  assert.equal(approval.releaseDecision, "passed");
  assert.equal(isKpVerifiedContributorFusionReleaseApproval(approval), true);
  assert.equal(
    isKpVerifiedContributorFusionReleaseApproval({ ...approval }),
    false
  );
});

test("only the approved contributor-fusion cohort reports ported", () => {
  const catalog = createKpAnimationLibraryDisplayCatalog();
  const status = (animationId: string) =>
    catalog.find((entry) => entry.animationId === animationId)
      ?.canonicalFormat;

  for (const animationId of kpContributorFusionReleasedAnimationIds) {
    assert.equal(status(animationId), "ported", animationId);
    const entry = catalog.find((candidate) =>
      candidate.animationId === animationId
    );
    const primary = entry?.representations.find(
      ({ id }) => id === entry.primaryRepresentationId
    );
    assert.match(primary?.href ?? "", /view=animation-library-host/u);
  }
  assert.equal(
    status("animation.operation-evaluation.one-plus-two"),
    "partial"
  );
});
