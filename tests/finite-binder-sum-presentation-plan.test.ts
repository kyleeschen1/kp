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
  assert.equal(plan.templateFanOut.route,
    "renderer-measured-relation-clearance");
  assert.deepEqual(plan.transitBoundary, {
    relationOccurrenceId: "occurrence.finite-sum-equivalence.relation",
    separates: {
      sourceOccurrenceId: "occurrence.finite-sum-equivalence.source",
      targetOccurrenceId: "occurrence.finite-sum-equivalence.target"
    },
    policy: "preserve-relation-legibility"
  });
  assert.deepEqual(plan.instances.map(({ bodyInstanceId }) => bodyInstanceId),
    operation.target.instances.map(({ id }) => id));
  assert.deepEqual(plan.instances.map(({ bodyTransitWindow }) =>
    bodyTransitWindow.start
  ), [0.08, 0.3, 0.52]);
  assert.deepEqual(plan.stateRetention, {
    policy: "equivalence-frame",
    source: "frozen-native-context",
    relation: "fixed-native-equality",
    target: "live-then-native"
  });
});

test("connectors complete exactly as their following terms settle", () => {
  const plan = kpCanonicalFiniteSumExpansionPresentationPlan;
  for (const instance of plan.instances.slice(1)) {
    const previous = plan.instances[instance.ordinal - 1]!;
    assert.ok(instance.precedingConnector !== undefined);
    const connector = instance.precedingConnector!;
    assert.ok(connector.receptionWindow.start >=
      Math.max(previous.bodyTransitWindow.end,
        previous.referenceReceptionWindow.end));
    assert.equal(connector.receptionWindow.end,
      Math.max(instance.bodyTransitWindow.end,
        instance.referenceReceptionWindow.end));
    assert.deepEqual(connector.arrivalCohort, {
      id: `finite-sum.arrival-cohort.${instance.ordinal}`,
      leftNeighborGroupId: previous.bodyInstanceId,
      followerGroupId: instance.bodyInstanceId,
      leadingConnectorId: connector.connectorId,
      reception: "connector-completes-with-follower-settlement"
    });
  }
  assert.ok(plan.targetHoldWindow.start >=
    plan.instances.at(-1)!.precedingConnector!.receptionWindow.end);
});

test("all target references are derived in place from verified range truth", () => {
  const plan = kpCanonicalFiniteSumExpansionPresentationPlan;
  const operation = kpCanonicalFiniteSumExpansionOperation;
  assert.deepEqual(plan.instances.map(({ referenceReception }) =>
    referenceReception.kind
  ), [
    "range-value-instantiation",
    "range-value-instantiation",
    "range-value-instantiation"
  ]);
  assert.deepEqual(plan.instances.map(({ referenceReception }) =>
    referenceReception.valueSource), [
    "lower-bound",
    "range-successor",
    "upper-bound"
  ]);
  assert.deepEqual(plan.instances.map(({ referenceReception }) =>
    referenceReception.sourceReferenceId), [
    operation.source.semantic.body.references[0]!.id,
    operation.source.semantic.body.references[0]!.id,
    operation.source.semantic.body.references[0]!.id
  ]);
  assert.equal(plan.templateFanOut.sourcePaint,
    "retained-context-with-live-derived-copies");
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
