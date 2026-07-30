import assert from "node:assert/strict";
import test from "node:test";

import {
  certifyKpExactFractionQuantityPromotionReadiness,
  checkKpExactFractionQuantityPromotionEvidence,
  kpExactFractionQuantityPromotionPrerequisiteIds
} from "../src/architecture/exact-fraction-quantity-promotion-certificate.ts";
import {
  isKpVerifiedExactFractionQuantityReleaseApproval,
  kpVerifiedExactFractionQuantityReleaseApproval
} from "../src/architecture/exact-fraction-quantity-release-approval.ts";
import {
  isKpVerifiedExecutableMotifPromotionCertificate
} from "../src/architecture/executable-motif-promotion-evidence.ts";

test("exact quantity closes automated gates without claiming promotion", () => {
  const certificate =
    certifyKpExactFractionQuantityPromotionReadiness();

  assert.equal(
    certificate.schemaVersion,
    "kp.verified-exact-fraction-quantity-promotion-readiness.v1"
  );
  assert.equal(certificate.status, "ready-for-human-review");
  assert.equal(certificate.remainingGate, "human-perceptual-review");
  assert.deepEqual(
    certificate.prerequisiteEvidence.map(({ id }) => id),
    kpExactFractionQuantityPromotionPrerequisiteIds
  );
  assert.ok(certificate.prerequisiteEvidence.every(
    ({ evidenceSourceIds }) => evidenceSourceIds.length > 0
  ));
  assert.equal(
    JSON.stringify(certificate).includes("humanReviewApproved"),
    false
  );
});

test("missing, duplicated, and source-free evidence cannot close readiness", () => {
  const certificate =
    certifyKpExactFractionQuantityPromotionReadiness();
  const [first, second, ...rest] = certificate.prerequisiteEvidence;
  assert.ok(first !== undefined && second !== undefined);
  const issues = checkKpExactFractionQuantityPromotionEvidence([
    { ...first, evidenceSourceIds: [] },
    second,
    second,
    ...rest.slice(1)
  ]);

  assert.deepEqual(
    issues.map(({ code }) => code).sort(),
    [
      "promotion-evidence.duplicate",
      "promotion-evidence.empty-source",
      "promotion-evidence.missing"
    ]
  );
});

test("human approval certifies evaluation, fission, and fusion as one cohort", () => {
  const approval = kpVerifiedExactFractionQuantityReleaseApproval;

  assert.equal(
    isKpVerifiedExactFractionQuantityReleaseApproval(approval),
    true
  );
  assert.deepEqual(
    approval.executableMotifCertificates.map(({ programKind }) => programKind),
    ["identity-fission", "identity-fusion", "operation-evaluation"]
  );
  assert.ok(approval.executableMotifCertificates.every(
    isKpVerifiedExecutableMotifPromotionCertificate
  ));
  assert.equal(
    isKpVerifiedExactFractionQuantityReleaseApproval({
      ...approval
    }),
    false
  );
});
