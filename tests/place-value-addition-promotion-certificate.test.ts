import assert from "node:assert/strict";
import test from "node:test";

import {
  certifyKpPlaceValueAdditionPromotionReadiness,
  checkKpPlaceValueAdditionPromotionEvidence,
  isKpVerifiedPlaceValueAdditionPromotionReadiness,
  kpPlaceValueAdditionPromotionPrerequisiteIds
} from "../src/architecture/place-value-addition-promotion-certificate.ts";
import {
  createKpPlaceValueAdditionAnimationAsset
} from "../src/animation/place-value-addition-adapter.ts";
import {
  createKpAnimationLibraryDisplayCatalog
} from "../src/editor/animation-library-display-catalog.ts";

test("place-value readiness closes automation without claiming promotion", () => {
  const certificate =
    certifyKpPlaceValueAdditionPromotionReadiness();
  const animation = createKpPlaceValueAdditionAnimationAsset();
  const entry = createKpAnimationLibraryDisplayCatalog().find(
    ({ animationId }) => animationId === certificate.animationId
  );

  assert.equal(
    certificate.schemaVersion,
    "kp.verified-place-value-addition-promotion-readiness.v1"
  );
  assert.equal(certificate.status, "ready-for-human-review");
  assert.equal(certificate.remainingGate, "human-perceptual-review");
  assert.deepEqual(
    certificate.prerequisiteEvidence.map(({ id }) => id),
    kpPlaceValueAdditionPromotionPrerequisiteIds
  );
  assert.equal(animation.timeline?.beatCount, 7);
  assert.equal(animation.renderTargets[0]?.kind, "diagram");
  assert.equal(entry?.availability, "playable");
  assert.equal(entry?.canonicalFormat, "partial");
  assert.equal(entry?.primaryRepresentationId,
    "library.editor.place-value-addition-focused-host");
  assert.equal(
    JSON.stringify(certificate).includes("humanReviewApproved"),
    false
  );
});

test("place-value readiness is nominal and copied shapes cannot authorize it", () => {
  const certificate =
    certifyKpPlaceValueAdditionPromotionReadiness();

  assert.equal(
    isKpVerifiedPlaceValueAdditionPromotionReadiness(certificate),
    true
  );
  assert.equal(
    isKpVerifiedPlaceValueAdditionPromotionReadiness({
      ...certificate
    }),
    false
  );
});

test("missing duplicated and source-free place-value evidence fails closed", () => {
  const certificate =
    certifyKpPlaceValueAdditionPromotionReadiness();
  const [first, second, ...rest] = certificate.prerequisiteEvidence;
  assert.ok(first !== undefined && second !== undefined);
  const issues = checkKpPlaceValueAdditionPromotionEvidence([
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
