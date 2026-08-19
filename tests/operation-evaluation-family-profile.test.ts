import assert from "node:assert/strict";
import test from "node:test";

import {
  kpCarrierPreservingSimplificationCandidateProfile,
  kpContributorFusionEvaluationFamilyProfile,
  resolveKpDefaultOperationEvaluationFamilyProfile,
  resolveKpOperationEvaluationFamilyProfile
} from "../src/animation/operation-evaluation-family-profile.ts";

test("contributor fusion closes family and handoff compatibility", () => {
  const resolved = resolveKpOperationEvaluationFamilyProfile({
    family: "contributor-fusion",
    handoff: "compressed-ink-handoff"
  });
  assert.equal(resolved.status, "resolved");
  if (resolved.status !== "resolved") return;
  assert.equal(resolved.profile, kpContributorFusionEvaluationFamilyProfile);
  assert.equal(Object.isFrozen(resolved.profile), true);
  assert.equal(
    Object.isFrozen(resolved.profile.supportedTransformationKinds),
    true
  );
});

test("unsupported and incompatible family requests remain typed gaps", () => {
  assert.equal(resolveKpOperationEvaluationFamilyProfile({
    family: "operator-aperture",
    handoff: "compressed-ink-handoff"
  }).status, "unsupported-family");
  assert.equal(resolveKpOperationEvaluationFamilyProfile({
    family: "contributor-fusion",
    handoff: "discrete-cut"
  }).status, "incompatible-handoff");
  assert.equal(resolveKpOperationEvaluationFamilyProfile({
    family: "carrier-preserving-simplification",
    handoff: "persistent-carrier-transfer"
  }).status, "unsupported-family");
  assert.equal(
    kpCarrierPreservingSimplificationCandidateProfile.status,
    "semantic-candidate"
  );
  assert.deepEqual(
    kpCarrierPreservingSimplificationCandidateProfile
      .supportedTransformationKinds,
    ["simplifyMultiplicativeIdentity"]
  );
});

test("only the three approved arithmetic transformations select the profile", () => {
  for (const transformationKind of [
    "simplifyConstantProduct",
    "simplifyConstantQuotient",
    "simplifyConstantSum"
  ]) {
    assert.equal(
      resolveKpDefaultOperationEvaluationFamilyProfile(transformationKind),
      kpContributorFusionEvaluationFamilyProfile
    );
  }
  assert.equal(
    resolveKpDefaultOperationEvaluationFamilyProfile(
      "simplifyConstantDifference"
    ),
    undefined
  );
});
