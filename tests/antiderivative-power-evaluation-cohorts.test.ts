import assert from "node:assert/strict";
import test from "node:test";

import {
  kpContributorFusionEvaluationFamilyProfile,
  resolveKpOperationEvaluationFamilyApplicability
} from "../src/animation/operation-evaluation-family-profile.ts";
import {
  compileKpContributorEvaluationTopologyCertificate,
  compileKpContributorEvaluationTopologyCohortCertificates,
  isKpVerifiedEvaluationTopologyCertificate
} from "../src/semantic/evaluation-topology-certificate.ts";
import {
  createGeneratedCalculusProblemFixture
} from "../src/semantic/generated-calculus-problem-fixture.ts";

const operationId = "kp.arithmetic.add";

function fixture() {
  const value = createGeneratedCalculusProblemFixture(
    "generated.calculus.integral.power-rule-quadratic"
  );
  const transformation = value.transformations.find(({ transformType }) =>
    transformType === "simplifyAntiderivativePowerRule"
  );
  assert.ok(transformation);
  return { fixture: value, transformation };
}

test("integration resolution certifies two disjoint contributor-fusion cohorts", () => {
  const { fixture: value, transformation } = fixture();
  const compiled = compileKpContributorEvaluationTopologyCohortCertificates({
    bundle: value.bundle,
    transformation,
    operationId
  });
  assert.equal(compiled.status, "verified");
  if (compiled.status !== "verified") return;
  assert.deepEqual(compiled.certificates.map(({ cohortId }) => cohortId), [
    "cohort.antiderivative-power.numerator-successor",
    "cohort.antiderivative-power.denominator-successor"
  ]);
  const selectorIds = compiled.certificates.flatMap((certificate) => [
    ...certificate.materialInputSelectorIds,
    ...certificate.catalystSelectorIds,
    ...certificate.resultSelectorIds
  ]);
  assert.equal(new Set(selectorIds).size, selectorIds.length);
  for (const certificate of compiled.certificates) {
    assert.equal(isKpVerifiedEvaluationTopologyCertificate(certificate), true);
    assert.equal(certificate.operationId, operationId);
    assert.deepEqual(certificate.materialInputSelectorIds.map((id) =>
      value.bundle.objects.flatMap(({ selectors }) => selectors)
        .find((selector) => selector.id === id)?.label), ["2", "1"]);
    assert.deepEqual(certificate.catalystSelectorIds.map((id) =>
      value.bundle.objects.flatMap(({ selectors }) => selectors)
        .find((selector) => selector.id === id)?.label), ["+"]);
    assert.deepEqual(certificate.resultSelectorIds.map((id) =>
      value.bundle.objects.flatMap(({ selectors }) => selectors)
        .find((selector) => selector.id === id)?.label), ["3"]);
    const family = resolveKpOperationEvaluationFamilyApplicability({
      familyProfileId: kpContributorFusionEvaluationFamilyProfile.id,
      topologyCertificate: certificate
    });
    assert.equal(family.status, "applicable");
  }
});

test("plural certification does not weaken the singular caller contract", () => {
  const { fixture: value, transformation } = fixture();
  const singular = compileKpContributorEvaluationTopologyCertificate({
    bundle: value.bundle,
    transformation,
    operationId
  });
  assert.equal(singular.status, "repair-required");
  if (singular.status !== "repair-required") return;
  assert.deepEqual(singular.diagnostics.map(({ code }) => code), [
    "evaluation-topology.ambiguous-evaluation-record"
  ]);
});

test("plural certification fails closed when one cohort label is absent", () => {
  const { fixture: value, transformation } = fixture();
  const brokenSelectorId = transformation.correspondenceMap?.records.find(
    ({ id }) => id === "divisor-successor-evaluates"
  )?.targetSelectorIds[0];
  assert.ok(brokenSelectorId);
  const bundle = {
    ...value.bundle,
    objects: value.bundle.objects.map((object) => ({
      ...object,
      selectors: object.selectors.map((selector) =>
        selector.id !== brokenSelectorId
          ? selector
          : {
              ...selector,
              metadata: Object.fromEntries(Object.entries(
                selector.metadata ?? {}
              ).filter(([key]) => key !== "successorCohortId"))
            }
      )
    }))
  };
  const compiled = compileKpContributorEvaluationTopologyCohortCertificates({
    bundle,
    transformation,
    operationId
  });
  assert.equal(compiled.status, "repair-required");
  if (compiled.status !== "repair-required") return;
  assert.ok(compiled.diagnostics.some(({ code }) =>
    code === "evaluation-topology.missing-cohort-id"
  ));
  assert.equal("fallback" in compiled, false);
});
