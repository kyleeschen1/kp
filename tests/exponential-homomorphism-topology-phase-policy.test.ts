import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpExponentialHomomorphismTopologyPhasePolicy,
  kpExponentialHomomorphismTopologyPhasePolicies,
  requireKpExponentialHomomorphismTopologyPhasePolicy
} from
  "../src/rendering/exponential-homomorphism-topology-phase-policy.ts";

test("every exponential target topology has an explicit causal phase policy", () => {
  assert.deepEqual(Object.keys(
    kpExponentialHomomorphismTopologyPhasePolicies
  ).sort(), ["lateral-product", "vertical-quotient"]);
  assert.equal(
    requireKpExponentialHomomorphismTopologyPhasePolicy("lateral-product")
      .targetConnectorEntry,
    "native-juxtaposition"
  );
  assert.equal(
    requireKpExponentialHomomorphismTopologyPhasePolicy("vertical-quotient")
      .causalOrder,
    "source-clear-then-transit-then-target-entry"
  );
});

test("vertical quotient rejects source transit target overlap", () => {
  assert.throws(() => defineKpExponentialHomomorphismTopologyPhasePolicy({
    topology: "vertical-quotient",
    causalOrder: "source-clear-then-transit-then-target-entry",
    motionAxisConstraint: "measured-direct",
    anchorSettlement: { start: 0.16, end: 0.22 },
    outwardTransit: { start: 0.15, end: 0.31 },
    carrierFission: { start: 0.16, end: 0.3 },
    carrierFollowerReveal: { start: 0.16, end: 0.22 },
    sourceConnectorContraction: { start: 0.08, end: 0.14 },
    sourceConnectorRelease: { start: 0.1, end: 0.16 },
    targetConnectorEntry: { start: 0.3, end: 0.36 }
  }), /clear source paint before transit/u);
});

test("lateral product rejects connector timing that drifts from transit", () => {
  assert.throws(() => defineKpExponentialHomomorphismTopologyPhasePolicy({
    topology: "lateral-product",
    causalOrder: "connector-retires-with-branch-transit",
    motionAxisConstraint: "horizontal",
    anchorSettlement: { start: 0.16, end: 0.22 },
    outwardTransit: { start: 0.16, end: 0.3 },
    carrierFission: { start: 0.16, end: 0.3 },
    carrierFollowerReveal: { start: 0.16, end: 0.22 },
    sourceConnectorContraction: { start: 0.16, end: 0.24 },
    sourceConnectorRelease: { start: 0.17, end: 0.3 },
    targetConnectorEntry: "native-juxtaposition"
  }), /must coincide with branch transit/u);
});
