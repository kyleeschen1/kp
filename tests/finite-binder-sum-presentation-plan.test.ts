import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpFiniteSumExpansionPresentationPlan,
  kpCanonicalFiniteSumExpansionPresentationPlan
} from "../src/animation/finite-sum-expansion-presentation-plan.ts";
import {
  kpCanonicalFiniteSumExpansionOperation
} from "../src/semantic/canonical-finite-sum-expansion.ts";

test("sum plan stages one ordered body fan-out", () => {
  const plan = kpCanonicalFiniteSumExpansionPresentationPlan;
  const operation = kpCanonicalFiniteSumExpansionOperation;

  assert.equal(plan.maturity, "candidate-local-exemplar");
  assert.equal(plan.topology, "ordered-template-fan-out");
  assert.equal(plan.templateFanOut.sourceBodyTemplateId,
    operation.source.semantic.body.id);
  assert.deepEqual(plan.instances.map(({ bodyInstanceId }) => bodyInstanceId),
    operation.target.instances.map(({ id }) => id));
  assert.deepEqual(plan.instances.map(({ bodyTransitWindow }) =>
    bodyTransitWindow.start
  ), [0.22, 0.34, 0.46]);
});

test("substituted references settle before their dependent connectors", () => {
  const plan = kpCanonicalFiniteSumExpansionPresentationPlan;
  for (const instance of plan.instances.slice(1)) {
    const previous = plan.instances[instance.ordinal - 1]!;
    assert.ok(instance.precedingConnector !== undefined);
    assert.ok(instance.precedingConnector!.receptionWindow.start >=
      Math.max(
        previous.referenceReceptionWindow.end,
        instance.referenceReceptionWindow.end
      ));
  }
  assert.ok(plan.targetHoldWindow.start >=
    plan.instances.at(-1)!.precedingConnector!.receptionWindow.end);
});

test("changed syntax never claims persistent paint identity", () => {
  const plan = kpCanonicalFiniteSumExpansionPresentationPlan;
  const operation = kpCanonicalFiniteSumExpansionOperation;
  const encoded = JSON.stringify(plan);

  assert.match(encoded, /collapse-toward-operator-center/u);
  assert.match(encoded,
    /withdraw-before-substituted-reference-reception/u);
  assert.doesNotMatch(encoded, /persist|clone-identity|arithmetic/u);
  assert.ok(plan.sourceScopeWithdrawal.cohortIds.includes(
    operation.source.semantic.operator.id
  ));
});

test("candidate plan owns one clock and no renderer scheduling", () => {
  const plan = kpCanonicalFiniteSumExpansionPresentationPlan;
  assert.deepEqual(plan.clock, {
    authority: "one-normalized-external-clock",
    rendererScheduling: "forbidden"
  });
  assert.equal(plan.accessibility.reducedMotion,
    "same-semantic-windows-with-direct-routes");
  assert.equal(Object.isFrozen(plan.instances), true);
});

test("candidate compiler refuses unreviewed cardinality", () => {
  assert.throws(() => compileKpFiniteSumExpansionPresentationPlan({
    ...kpCanonicalFiniteSumExpansionOperation,
    target: {
      ...kpCanonicalFiniteSumExpansionOperation.target,
      instances: kpCanonicalFiniteSumExpansionOperation.target.instances.slice(
        0,
        2
      ) as unknown as typeof kpCanonicalFiniteSumExpansionOperation.target.instances
    }
  }), /limited to the reviewed three-term exemplar/u);
});
