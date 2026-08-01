import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpVerifiedCrossDomainSynchronizedModelReleaseApproval,
  kpVerifiedEconomicsEquilibriumReleaseApproval,
  kpVerifiedPhysicsWorkEnergyReleaseApproval
} from "../src/architecture/cross-domain-synchronized-model-release-approval.ts";
import {
  kpDimensionalContinuityGraphLanguageId
} from "../src/rendering/dimensional-continuity-graph-profile.ts";

test("cross-domain release approvals bind both exact approved callers", () => {
  assert.deepEqual(
    [
      kpVerifiedEconomicsEquilibriumReleaseApproval.animationId,
      kpVerifiedPhysicsWorkEnergyReleaseApproval.animationId
    ],
    [
      "animation.economics.supply-demand-equilibrium-shift",
      "animation.physics.constant-force-work-energy"
    ]
  );
  for (const approval of [
    kpVerifiedEconomicsEquilibriumReleaseApproval,
    kpVerifiedPhysicsWorkEnergyReleaseApproval
  ]) {
    assert.equal(approval.releaseDecision, "passed");
    assert.equal(approval.sharedContractCount, 4);
    assert.equal(
      approval.graphLanguageProfileId,
      kpDimensionalContinuityGraphLanguageId
    );
    assert.equal(
      isKpVerifiedCrossDomainSynchronizedModelReleaseApproval(approval),
      true
    );
  }
});

test("copied cross-domain release evidence cannot claim promotion", () => {
  assert.equal(
    isKpVerifiedCrossDomainSynchronizedModelReleaseApproval({
      ...kpVerifiedEconomicsEquilibriumReleaseApproval
    }),
    false
  );
  assert.equal(
    isKpVerifiedCrossDomainSynchronizedModelReleaseApproval({
      ...kpVerifiedPhysicsWorkEnergyReleaseApproval
    }),
    false
  );
});
