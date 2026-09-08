import assert from "node:assert/strict";
import test from "node:test";
import { createKpFractionCompositionEquationAnimationAsset } from "../src/animation/fraction-composition-equation-adapter.ts";
import { compileReasoningEvaluationCertificates } from "../src/experiments/reusable-reasoning/evaluation.ts";
import { isKpVerifiedEquationEvaluationFamilyCertificateV2 } from "../src/domain-ir/equation-evaluation-family-certificate-v2.ts";

test("bounded evaluations reuse nominal ink-family authority without mutating shared endpoints", () => {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const before = JSON.stringify(animation);
  const certificates = compileReasoningEvaluationCertificates(animation);
  assert.deepEqual(certificates.map(item => item.transformationId),
    animation.transformations.slice(2, 4).map(item => item.id));
  assert.deepEqual(certificates.map(item => item.operationId), ["kp.arithmetic.multiply", "kp.arithmetic.divide"]);
  for (const certificate of certificates) {
    assert.ok(isKpVerifiedEquationEvaluationFamilyCertificateV2(certificate));
    assert.equal(certificate.familyProfile.family, "contributor-fusion");
    assert.equal(certificate.topologyCertificate.topology, "contributors-create-result");
  }
  assert.equal(JSON.stringify(animation), before);
});

test("missing contributor roles cannot silently fall back to another evaluation treatment", () => {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const broken = { ...animation, bundle: { ...animation.bundle, objects: animation.bundle.objects.map(object => ({
    ...object, selectors: object.selectors.map(selector => ({ ...selector, metadata: {} }))
  })) } };
  assert.throws(() => compileReasoningEvaluationCertificates(broken), { code: "kp.reasoning.evaluation-certificate" });
});
