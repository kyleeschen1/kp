import assert from "node:assert/strict";
import test from "node:test";

import {
  kpNativeKatexCarrierPreservingSimplificationOpticalProfile,
  sampleKpNativeKatexCarrierPreservingSimplificationOptics
} from "../src/rendering/native-katex-carrier-preserving-simplification-profile.ts";
import {
  kpNativeKatexContributorFusionOpticalProfile
} from "../src/rendering/native-katex-operation-evaluation-contributor-fusion.ts";

test("the promoted profile is one deeply frozen Native KaTeX tuning surface", () => {
  const profile = kpNativeKatexCarrierPreservingSimplificationOpticalProfile;
  assert.equal(profile.status, "promoted");
  assert.equal(profile.treatment, "identity-withdrawal");
  assert.equal(Object.isFrozen(profile), true);
  assert.equal(Object.isFrozen(profile.removedSyntaxWithdrawal), true);
  assert.equal(Object.isFrozen(profile.carrierTransit), true);
  assert.equal(Object.isFrozen(profile.nativeSettlement), true);
  assert.deepEqual(kpNativeKatexContributorFusionOpticalProfile, {
    schemaVersion:
      "kp.native-katex-contributor-fusion-optical-profile.v1",
    id: "kp.rendering.native-katex.operation-evaluation.contributor-fusion.v1",
    gatherStartsAt: 0.18,
    compressionStartsAt: 0.38,
    sourceKernelStartsAt: 0.48,
    ownershipHandoffAt: 0.52,
    targetLegibilityStartsAt: 0.58,
    targetExpansionEndsAt: 0.7,
    kernelAreaRatio: 0.1
  });
});

test("sampling preserves the carrier while the removal cohort yields", () => {
  const source = sampleKpNativeKatexCarrierPreservingSimplificationOptics(0);
  const overlap = sampleKpNativeKatexCarrierPreservingSimplificationOptics(0.36);
  const target = sampleKpNativeKatexCarrierPreservingSimplificationOptics(1);

  assert.deepEqual(source, {
    progress: 0,
    phase: "source",
    carrier: {
      paintPresence: 1,
      transitProgress: 0,
      nativeSettlementProgress: 0
    },
    removedSyntaxCohort: {
      withdrawalProgress: 0,
      paintPresence: 1
    }
  });
  assert.equal(overlap.phase, "identity-withdrawal");
  assert.equal(overlap.carrier.paintPresence, 1);
  assert.equal(overlap.carrier.transitProgress, 0);
  assert.ok(overlap.removedSyntaxCohort.withdrawalProgress > 0);
  assert.ok(
    sampleKpNativeKatexCarrierPreservingSimplificationOptics(0.6)
      .carrier.transitProgress > 0
  );
  assert.deepEqual(target, {
    progress: 1,
    phase: "target",
    carrier: {
      paintPresence: 1,
      transitProgress: 1,
      nativeSettlementProgress: 1
    },
    removedSyntaxCohort: {
      withdrawalProgress: 1,
      paintPresence: 0
    }
  });
});

test("sampling is bounded, deterministic, and history independent", () => {
  const profile = kpNativeKatexCarrierPreservingSimplificationOpticalProfile;
  assert.deepEqual(
    sampleKpNativeKatexCarrierPreservingSimplificationOptics(-2),
    sampleKpNativeKatexCarrierPreservingSimplificationOptics(0)
  );
  assert.deepEqual(
    sampleKpNativeKatexCarrierPreservingSimplificationOptics(3),
    sampleKpNativeKatexCarrierPreservingSimplificationOptics(1)
  );
  const forward = [0.17, 0.5, 0.93].map((progress) =>
    sampleKpNativeKatexCarrierPreservingSimplificationOptics(progress)
  );
  const reverse = [0.93, 0.5, 0.17].map((progress) =>
    sampleKpNativeKatexCarrierPreservingSimplificationOptics(progress)
  ).reverse();
  assert.deepEqual(forward, reverse);
  assert.equal(
    sampleKpNativeKatexCarrierPreservingSimplificationOptics(
      profile.removedSyntaxWithdrawal.end
    ).removedSyntaxCohort.paintPresence,
    0
  );
  assert.equal(
    sampleKpNativeKatexCarrierPreservingSimplificationOptics(
      profile.carrierTransit.end
    ).carrier.transitProgress,
    1
  );
  assert.throws(
    () => sampleKpNativeKatexCarrierPreservingSimplificationOptics(Number.NaN),
    /must be finite/
  );
});
