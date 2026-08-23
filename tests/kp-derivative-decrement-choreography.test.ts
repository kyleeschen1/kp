import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpDerivativeDecrementChoreography,
  kpDerivativeDecrementPhaseIds,
  sampleKpDerivativeDecrementChoreography
} from "../src/animation/derivative-decrement-choreography.ts";
import {
  createGeneratedProblemAnimationAsset
} from "../src/animation/generated-problem-import.ts";
import {
  createGeneratedCalculusProblemFixture
} from "../src/semantic/generated-calculus-problem-fixture.ts";

function fixture() {
  const animation = createGeneratedProblemAnimationAsset(
    createGeneratedCalculusProblemFixture(
      "generated.calculus.derivative.power-rule-x-cubed"
    )
  );
  const transformation = animation.transformations.find(
    (candidate) => candidate.transformType === "simplifyConstantDifference"
  );
  assert.ok(transformation);
  const plan = compileKpDerivativeDecrementChoreography({
    id: "choreography.derivative.decrement",
    transformation,
    bundle: animation.bundle
  });
  return { animation, transformation, plan };
}

test("derivative decrement compiles explicit subtraction roles", () => {
  const { plan } = fixture();

  assert.deepEqual(Object.keys(
    sampleKpDerivativeDecrementChoreography({ plan, progress: 0 }).phases
  ), kpDerivativeDecrementPhaseIds);
  assert.equal(plan.operationId, "kp.arithmetic.subtract");
  assert.equal(plan.contextRecordIds.length, 2);
  assert.match(plan.evaluation.minuendSelectorId, /exponent/);
  assert.match(plan.evaluation.decrementOperatorSelectorId, /decrement-operator/);
  assert.match(plan.evaluation.decrementAmountSelectorId, /decrement-amount/);
  assert.match(plan.evaluation.resultSelectorId, /exponent/);
});

test("derivative decrement holds its cause before recognizing the result", () => {
  const { plan } = fixture();
  const hold = sampleKpDerivativeDecrementChoreography({
    plan,
    progress: 0.4
  });
  const resolve = sampleKpDerivativeDecrementChoreography({
    plan,
    progress: 0.68
  });
  const end = sampleKpDerivativeDecrementChoreography({ plan, progress: 1 });

  assert.equal(hold.decrementCause.opacity, 1);
  assert.equal(hold.result.opacity, 0);
  assert.ok(resolve.decrementCause.opacity > 0);
  assert.ok(resolve.decrementCause.opacity < 1);
  assert.ok(resolve.result.opacity > 0);
  assert.equal(end.decrementCause.opacity, 0);
  assert.equal(end.minuend.opacity, 0);
  assert.equal(end.result.opacity, 1);
  assert.equal(end.attention.result, 0);
});

test("derivative decrement samples exact rewind symmetry", () => {
  const { plan } = fixture();
  for (const progress of [0, 0.2, 0.5, 0.8, 1]) {
    const forward = sampleKpDerivativeDecrementChoreography({ plan, progress });
    const rewind = sampleKpDerivativeDecrementChoreography({
      plan,
      progress: 1 - progress,
      direction: "rewind"
    });
    assert.deepEqual({ ...rewind, direction: "forward", progress }, forward);
  }
});

test("derivative decrement rejects a non-evaluation transition", () => {
  const { animation } = fixture();
  const transformation = animation.transformations.find(
    (candidate) => candidate.transformType === "applyDerivativePowerRule"
  );
  assert.ok(transformation);
  assert.throws(() => compileKpDerivativeDecrementChoreography({
    id: "choreography.derivative.decrement",
    transformation,
    bundle: animation.bundle
  }), /requires constant-difference evaluation/);
});
