import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  compileKpDerivativePowerMigrationV2
} from "../src/domain-ir/derivative-power-migration-v2.ts";
import {
  compileKpEquationEvaluationFamilyCertificateV2,
  isKpVerifiedEquationEvaluationFamilyCertificateV2
} from "../src/domain-ir/equation-evaluation-family-certificate-v2.ts";

const animationId =
  "animation.generated.calculus.derivative.power-rule-x-cubed";

function derivative() {
  const animation = createKpAnimationAssets().find(
    ({ id }) => id === animationId
  )!;
  const transformation = animation.transformations.find(
    ({ transformType }) => transformType === "simplifyConstantDifference"
  )!;
  const migration = compileKpDerivativePowerMigrationV2(animation);
  const authority = migration.presentationPlan.transitions.find(
    ({ semanticOperation }) =>
      semanticOperation.transformationId === transformation.id
  )!.evaluationAuthority!;
  return { animation, transformation, authority };
}

test("derivative difference receives one compiler-minted family certificate", () => {
  const { animation, transformation, authority } = derivative();
  const result = compileKpEquationEvaluationFamilyCertificateV2({
    bundle: animation.bundle,
    transformation,
    authority
  });

  assert.equal(result.status, "certified");
  if (result.status !== "certified") return;
  assert.equal(
    isKpVerifiedEquationEvaluationFamilyCertificateV2(result.certificate),
    true
  );
  assert.equal(result.certificate.releaseMaturity, "review-stage");
  assert.equal(
    result.certificate.familyProfile.id,
    "kp.evaluation-family.contributor-fusion.v1"
  );
  assert.equal(
    result.certificate.topologyCertificate.topology,
    "contributors-create-result"
  );
});

test("ambiguous evaluation correspondence is a typed repair gap", () => {
  const { animation, transformation, authority } = derivative();
  assert.ok(transformation.correspondenceMap);
  const fanIn = transformation.correspondenceMap.records.find(
    ({ relation }) => relation === "fan-in"
  )!;
  const ambiguous = {
    ...transformation,
    correspondenceMap: {
      ...transformation.correspondenceMap,
      records: [
        ...transformation.correspondenceMap.records,
        { ...fanIn, id: `${fanIn.id}.duplicate` }
      ]
    }
  };

  const result = compileKpEquationEvaluationFamilyCertificateV2({
    bundle: animation.bundle,
    transformation: ambiguous,
    authority
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.deepEqual(result.diagnostics.map(({ code }) => code), [
    "evaluation-topology.ambiguous-evaluation-record"
  ]);
});

test("incomplete contributor topology cannot fall back to generic motion", () => {
  const { animation, transformation, authority } = derivative();
  const bundle = {
    ...animation.bundle,
    objects: animation.bundle.objects.map((object) => ({
      ...object,
      selectors: object.selectors.map((selector) =>
        selector.id.endsWith(".decrement-operator")
          ? { ...selector, metadata: {} }
          : selector)
    }))
  };

  const result = compileKpEquationEvaluationFamilyCertificateV2({
    bundle,
    transformation,
    authority
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.deepEqual(result.diagnostics.map(({ code }) => code), [
    "evaluation-topology.incomplete-source-role",
    "evaluation-topology.insufficient-contributors"
  ]);
  assert.equal("fallback" in result, false);
});
