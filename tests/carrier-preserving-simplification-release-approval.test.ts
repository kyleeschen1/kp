import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpVerifiedCarrierPreservingSimplificationReleaseApproval,
  kpCarrierPreservingSimplificationReleasedAnimationIds,
  kpVerifiedCarrierPreservingSimplificationReleaseApproval
} from "../src/architecture/carrier-preserving-simplification-release-approval.ts";
import {
  kpCarrierPreservingSimplificationEvaluationFamilyProfile,
  resolveKpDefaultOperationEvaluationFamilyProfile,
  resolveKpOperationEvaluationFamilyProfile
} from "../src/animation/operation-evaluation-family-profile.ts";
import {
  createKpAnimationLibraryDisplayCatalog
} from "../src/editor/animation-library-display-catalog.ts";

test("carrier preservation has one nominal two-caller release approval", () => {
  const approval = kpVerifiedCarrierPreservingSimplificationReleaseApproval;

  assert.deepEqual(approval.animationIds,
    kpCarrierPreservingSimplificationReleasedAnimationIds);
  assert.deepEqual(approval.approvedTransformationKinds, [
    "simplifyMultiplicativeIdentity",
    "simplify-additive-identity"
  ]);
  assert.equal(approval.releaseDecision, "passed");
  assert.equal(
    isKpVerifiedCarrierPreservingSimplificationReleaseApproval(approval),
    true
  );
  assert.equal(
    isKpVerifiedCarrierPreservingSimplificationReleaseApproval({ ...approval }),
    false
  );
});

test("the promoted resolver exposes only the proved family and handoff", () => {
  const resolved = resolveKpOperationEvaluationFamilyProfile({
    family: "carrier-preserving-simplification",
    handoff: "persistent-carrier-transfer"
  });
  assert.equal(resolved.status, "resolved");
  if (resolved.status !== "resolved") return;
  assert.equal(
    resolved.profile,
    kpCarrierPreservingSimplificationEvaluationFamilyProfile
  );
  assert.equal(resolveKpOperationEvaluationFamilyProfile({
    family: "carrier-preserving-simplification",
    handoff: "compressed-ink-handoff"
  }).status, "incompatible-handoff");
  assert.equal(
    resolveKpDefaultOperationEvaluationFamilyProfile(
      "simplifyMultiplicativeIdentity"
    ),
    kpCarrierPreservingSimplificationEvaluationFamilyProfile
  );
  assert.equal(
    resolveKpDefaultOperationEvaluationFamilyProfile(
      "simplify-additive-identity"
    ),
    kpCarrierPreservingSimplificationEvaluationFamilyProfile
  );
  assert.equal(
    resolveKpDefaultOperationEvaluationFamilyProfile(
      "simplifyConstantDifference"
    ),
    undefined
  );
});

test("only the released carrier cohort reports canonical format", () => {
  const catalog = createKpAnimationLibraryDisplayCatalog();
  for (const animationId of
    kpCarrierPreservingSimplificationReleasedAnimationIds) {
    assert.equal(
      catalog.find((entry) => entry.animationId === animationId)
        ?.canonicalFormat,
      "ported",
      animationId
    );
  }
  assert.notEqual(
    catalog.find((entry) =>
      entry.animationId === "animation.operation-evaluation.one-plus-two"
    )?.canonicalFormat,
    "ported"
  );
});
