import assert from "node:assert/strict";
import test from "node:test";

import {
  kpCarrierPreservingSimplificationEvaluationFamilyProfile,
  kpContributorFusionEvaluationFamilyProfile,
  resolveKpDefaultOperationEvaluationFamilyProfile,
  resolveKpOperationEvaluationFamilyCandidate,
  resolveKpOperationEvaluationFamilyProfile
} from "../src/animation/operation-evaluation-family-profile.ts";
import {
  createKpTwoTimesOneCarrierEvidenceCandidate,
  createKpTwoTimesOneCarrierExemplar
} from "../src/semantic/carrier-preserving-simplification-exemplar.ts";
import {
  verifyKpCarrierPreservingSimplificationEvidence
} from "../src/semantic/carrier-preserving-simplification-evidence.ts";

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
  const carrier = resolveKpOperationEvaluationFamilyProfile({
    family: "carrier-preserving-simplification",
    handoff: "persistent-carrier-transfer"
  });
  assert.equal(carrier.status, "resolved");
  assert.equal(
    kpCarrierPreservingSimplificationEvaluationFamilyProfile.status,
    "promoted"
  );
  assert.deepEqual(
    kpCarrierPreservingSimplificationEvaluationFamilyProfile
      .supportedTransformationKinds,
    ["simplifyMultiplicativeIdentity", "simplify-additive-identity"]
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

test("candidate resolution requires the exact handoff, identity operation, and minted evidence", () => {
  const exemplar = createKpTwoTimesOneCarrierExemplar();
  const verification = verifyKpCarrierPreservingSimplificationEvidence({
    candidate: createKpTwoTimesOneCarrierEvidenceCandidate(),
    bundle: exemplar.bundle,
    transformation: exemplar.transformation
  });
  assert.equal(verification.status, "verified");
  if (verification.status !== "verified") return;
  const request = {
    family: "carrier-preserving-simplification",
    handoff: "persistent-carrier-transfer",
    transformationKind: "simplifyMultiplicativeIdentity"
  } as const;
  assert.equal(resolveKpOperationEvaluationFamilyCandidate({
    ...request,
    evidence: verification.evidence
  }).status, "candidate-resolved");
  assert.equal(resolveKpOperationEvaluationFamilyCandidate({
    ...request
  }).status, "missing-carrier-evidence");
  assert.equal(resolveKpOperationEvaluationFamilyCandidate({
    ...request,
    evidence: { ...verification.evidence }
  }).status, "missing-carrier-evidence");
  assert.equal(resolveKpOperationEvaluationFamilyCandidate({
    ...request,
    handoff: "compressed-ink-handoff",
    evidence: verification.evidence
  }).status, "incompatible-handoff");
  assert.equal(resolveKpOperationEvaluationFamilyCandidate({
    ...request,
    transformationKind: "simplifyConstantProduct",
    evidence: verification.evidence
  }).status, "unsupported-operation");
});
