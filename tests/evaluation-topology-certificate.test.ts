import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpContributorEvaluationTopologyCertificate,
  isKpVerifiedEvaluationTopologyCertificate,
  kpEvaluationTopologyKinds
} from "../src/semantic/evaluation-topology-certificate.ts";
import { createGeneratedCalculusProblemFixture } from
  "../src/semantic/generated-calculus-problem-fixture.ts";

test("evaluation topology vocabulary is closed and certificates are nominal", () => {
  assert.deepEqual(kpEvaluationTopologyKinds, [
    "contributors-create-result",
    "carrier-survives",
    "annihilation-leaves-survivor"
  ]);
  assert.equal(isKpVerifiedEvaluationTopologyCertificate({
    schemaVersion: "kp.evaluation-topology-certificate.v1",
    topology: "contributors-create-result"
  }), false);
});

test("derivative decrement correspondence compiles a verified contributor topology", () => {
  const fixture = createGeneratedCalculusProblemFixture(
    "generated.calculus.derivative.power-rule-x-cubed"
  );
  const transformation = fixture.transformations.find(
    (candidate) => candidate.transformType === "simplifyConstantDifference"
  );
  assert.ok(transformation);

  const compilation = compileKpContributorEvaluationTopologyCertificate({
    bundle: fixture.bundle,
    transformation,
    operationId: "kp.arithmetic.subtract"
  });

  assert.equal(compilation.status, "verified");
  if (compilation.status !== "verified") {
    return;
  }
  assert.equal(
    isKpVerifiedEvaluationTopologyCertificate(compilation.certificate),
    true
  );
  assert.equal(compilation.certificate.topology, "contributors-create-result");
  assert.deepEqual(compilation.certificate.materialInputSelectorIds, [
    "expression.generated.calculus.derivative.power-rule-x-cubed.applied.exponent",
    "expression.generated.calculus.derivative.power-rule-x-cubed.applied.decrement-amount"
  ]);
  assert.deepEqual(compilation.certificate.catalystSelectorIds, [
    "expression.generated.calculus.derivative.power-rule-x-cubed.applied.decrement-operator"
  ]);
  assert.deepEqual(compilation.certificate.resultSelectorIds, [
    "expression.generated.calculus.derivative.power-rule-x-cubed.derived.exponent"
  ]);
});

test("unproved operation topology returns a typed repair requirement", () => {
  const fixture = createGeneratedCalculusProblemFixture(
    "generated.calculus.derivative.power-rule-x-cubed"
  );
  const transformation = fixture.transformations.find(
    (candidate) => candidate.transformType === "simplifyConstantDifference"
  );
  assert.ok(transformation);

  const compilation = compileKpContributorEvaluationTopologyCertificate({
    bundle: fixture.bundle,
    transformation,
    operationId: "kp.arithmetic.multiply"
  });

  assert.deepEqual(compilation, {
    status: "repair-required",
    diagnostics: [{
      code: "evaluation-topology.missing-evaluation-record",
      path: "transformation.correspondenceMap.records",
      message:
        `Transformation ${transformation.id} has no fan-in correspondence for operation kp.arithmetic.multiply.`
    }]
  });
});
