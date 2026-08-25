import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpGovernedIntegrationPowerRuleResult,
  findKpForbiddenPresentationAuthority
} from "../src/authoring/canonical-animation-public-api.ts";

test("canonical integration compiles through the governed construction seam", () => {
  const result = createKpGovernedIntegrationPowerRuleResult({
    operationClass: "canonical-monic-quadratic"
  });
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;

  assert.equal(
    result.fixture.authority.animation.id,
    "animation.generated.calculus.integral.power-rule-quadratic"
  );
  assert.deepEqual(
    result.fixture.compilation.mathematicalVerification.operations.map(
      ({ operationId, definitionId, strictLawIds }) => ({
        operationId,
        definitionId,
        strictLawIds
      })
    ),
    [
      {
        operationId: "transform.generated.calculus.integral.power-rule-quadratic.expand-integral-power-rule",
        definitionId: "definition.generated.calculus.integral.power-rule",
        strictLawIds: ["law.calculus.integral.power-rule"]
      },
      {
        operationId: "transform.generated.calculus.integral.power-rule-quadratic.resolve-integral-power-rule",
        definitionId: "definition.generated.calculus.integral.power-rule-resolution",
        strictLawIds: ["law.calculus.integral.power-rule"]
      }
    ]
  );
  assert.deepEqual(
    result.fixture.compilation.construction.composition.operationStepIds,
    result.fixture.compilation.construction.operations.map(({ stepId }) => stepId)
  );
  assert.deepEqual(
    findKpForbiddenPresentationAuthority(result.fixture.request),
    []
  );
  assert.equal(Object.isFrozen(result.fixture.compilation), true);
});

test("unsupported integration returns its typed repair before construction", () => {
  const result = createKpGovernedIntegrationPowerRuleResult({
    operationClass: "negative-one-exponent"
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.deepEqual(result, {
    status: "repair-required",
    case: result.case,
    repair: {
      code: "integration.logarithmic-case-required",
      targetId: "operation.equation.integrate-logarithmic-case.v1",
      summary:
        "The n=-1 antiderivative is logarithmic and cannot use the power-rule quotient."
    },
    preservationBoundary:
      "Keep the current canonical integration exemplar active and do not synthesize target truth, correspondence, presentation, or fallback motion."
  });
  assert.equal("fixture" in result, false);
  assert.equal("request" in result, false);
});
