import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  compileKpAntiderivativePowerMigrationV2,
  isKpAntiderivativePowerEvaluationCohortsPayloadV2,
  kpAntiderivativePowerAssetId,
  kpAntiderivativePowerEvaluationCohortIds
} from "../src/domain-ir/antiderivative-power-migration-v2.ts";
import {
  isKpVerifiedEquationEvaluationFamilyCertificateV2
} from "../src/domain-ir/equation-evaluation-family-certificate-v2.ts";
import {
  requireKpGenericEquationMigrationV2
} from "../src/domain-ir/equation-generic-v2-migration-dispatch.ts";

function animation() {
  return createKpAnimationAssets().find(
    ({ id }) => id === kpAntiderivativePowerAssetId
  )!;
}

test("antiderivative migration carries two certified evaluation cohorts", () => {
  const value = animation();
  const migration = compileKpAntiderivativePowerMigrationV2(value);
  assert.deepEqual(migration.operationIds, [
    "kp.semantic-motion.antiderivative-power-rule",
    "kp.semantic-motion.resolve-antiderivative"
  ]);
  const resolution = migration.presentationPlan.transitions[1];
  assert.ok(resolution);
  assert.equal(resolution.semanticOperation.semanticClass, "transformation");
  assert.equal(resolution.evaluationAuthority, undefined);
  assert.equal(resolution.evaluationFamilyCertificate, undefined);
  assert.equal(resolution.domainPayloads.length, 1);
  const payload = resolution.domainPayloads[0]!;
  assert.equal(isKpAntiderivativePowerEvaluationCohortsPayloadV2(payload), true);
  if (!isKpAntiderivativePowerEvaluationCohortsPayloadV2(payload)) return;
  assert.equal(payload.transitionId, resolution.id);
  assert.equal(payload.operationId, "kp.arithmetic.add");
  assert.equal(
    payload.authorityId,
    "kp.presentation.operation-evaluation.sum.authority-v2"
  );
  assert.deepEqual(payload.cohorts.map(({ cohortId }) => cohortId),
    kpAntiderivativePowerEvaluationCohortIds);
  payload.cohorts.forEach(({ cohortId, certificate }) => {
    assert.equal(
      isKpVerifiedEquationEvaluationFamilyCertificateV2(certificate),
      true
    );
    assert.equal(certificate.authorityId, payload.authorityId);
    assert.equal(certificate.operationId, payload.operationId);
    assert.equal(certificate.releaseMaturity, "review-stage");
    assert.equal(certificate.topologyCertificate.cohortId, cohortId);
    assert.equal(
      certificate.familyProfile.rendererProfileId,
      "kp.rendering.native-katex.operation-evaluation.contributor-fusion.v1"
    );
  });
});

test("generic dispatch selects the antiderivative-specific payload compiler", () => {
  const migration = requireKpGenericEquationMigrationV2(animation());
  const payload = migration?.presentationPlan.transitions[1]
    ?.domainPayloads[0];
  assert.ok(payload);
  assert.equal(isKpAntiderivativePowerEvaluationCohortsPayloadV2(payload), true);
});

test("antiderivative migration fails closed when one cohort loses authority", () => {
  const value = animation();
  const broken = {
    ...value,
    bundle: {
      ...value.bundle,
      objects: value.bundle.objects.map((object) => ({
        ...object,
        selectors: object.selectors.map((selector) =>
          selector.metadata?.["successorTarget"] === true &&
              selector.id.endsWith(".denominator")
            ? { ...selector, metadata: {} }
            : selector)
      }))
    }
  };
  assert.throws(
    () => compileKpAntiderivativePowerMigrationV2(broken),
    /must belong to cohort|must declare one cohort/u
  );
});
