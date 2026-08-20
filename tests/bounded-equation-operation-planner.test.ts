import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEquationOperationDiscoveryApi
} from "../src/authoring/equation-operation-discovery-api.ts";
import {
  runKpBoundedEquationOperationPlanner,
  type KpBoundedEquationOperationPlannerPort
} from "../src/authoring/bounded-equation-operation-planner.ts";
import {
  createKpGeneratedAddZeroCarrierSource
} from "../src/semantic/generated-add-zero-carrier-preserving-simplification.ts";
import {
  verifyKpCarrierPreservingSimplificationEvidence
} from "../src/semantic/carrier-preserving-simplification-evidence.ts";

test("a friendly carrier alias binds only to KP-verified evidence", async () => {
  const evidence = verifiedAddZeroEvidence();
  const result = await runKpBoundedEquationOperationPlanner({
    naturalLanguageIntent: "Remove the additive zero and keep x.",
    states: addZeroStates,
    port: choosing("drop + 0"),
    evidenceBindings: [binding(
      "kp.semantic-motion.absorb-additive-identity",
      evidence
    )]
  });
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.equal(result.plan.selections[0]?.operationId,
    "kp.semantic-motion.absorb-additive-identity");
  assert.equal(result.plan.selections[0]?.aliasResolution, "alias");
  assert.equal(result.plan.selections[0]?.evidenceBinding.carrierEvidence,
    evidence);
});

test("missing or copied carrier evidence requests clarification", async () => {
  const evidence = verifiedAddZeroEvidence();
  const accepted = await runKpBoundedEquationOperationPlanner({
    naturalLanguageIntent: "Remove zero.",
    states: addZeroStates,
    port: choosing("remove additive zero"),
    evidenceBindings: [binding(
      "kp.semantic-motion.absorb-additive-identity",
      evidence
    )]
  });
  assert.equal(accepted.status, "accepted");
  if (accepted.status !== "accepted") return;
  const repaired = await runKpBoundedEquationOperationPlanner({
    naturalLanguageIntent: "Try again.",
    states: addZeroStates,
    port: choosing("remove additive zero"),
    evidenceBindings: [{
      ...binding("kp.semantic-motion.absorb-additive-identity", evidence),
      carrierEvidence: { ...evidence } as unknown as typeof evidence
    }],
    lastValidPlan: accepted.plan
  });
  assert.equal(repaired.status, "clarification-required");
  if (repaired.status !== "clarification-required") return;
  assert.equal(repaired.code, "missing-verified-evidence");
  assert.equal(repaired.lastValidPlan, accepted.plan);
});

test("the model cannot escape the shortlist or author presentation fields", async () => {
  const outside = await runKpBoundedEquationOperationPlanner({
    naturalLanguageIntent: "Remove zero.",
    states: addZeroStates,
    port: choosing("kp.algebra.simplify-constant-product"),
    evidenceBindings: []
  });
  assert.equal(outside.status, "clarification-required");
  if (outside.status === "clarification-required") {
    assert.equal(outside.code, "operation-outside-shortlist");
  }
  const presentation = await runKpBoundedEquationOperationPlanner({
    naturalLanguageIntent: "Remove zero.",
    states: addZeroStates,
    port: {
      id: "planner.test",
      choose: async () => ({
        schemaVersion: "kp.bounded-equation-operation-planner-choice.v1",
        kind: "bounded-equation-operation-planner-choice",
        plannerId: "planner.test",
        choices: [{
          adjacencyIndex: 0,
          operation: "drop + 0",
          opacity: 0.2
        }]
      })
    },
    evidenceBindings: []
  });
  assert.equal(presentation.status, "clarification-required");
  if (presentation.status === "clarification-required") {
    assert.equal(presentation.code, "invalid-response");
  }
});

test("no-match and port errors preserve the last valid plan", async () => {
  const evidence = verifiedAddZeroEvidence();
  const accepted = await runKpBoundedEquationOperationPlanner({
    naturalLanguageIntent: "Remove zero.",
    states: addZeroStates,
    port: choosing("remove additive zero"),
    evidenceBindings: [binding(
      "kp.semantic-motion.absorb-additive-identity",
      evidence
    )]
  });
  assert.equal(accepted.status, "accepted");
  if (accepted.status !== "accepted") return;
  const noMatch = await runKpBoundedEquationOperationPlanner({
    naturalLanguageIntent: "Do something unknown.",
    states: [
      { id: "a", latex: "x+y" },
      { id: "b", latex: "x" }
    ],
    port: choosing("drop + 0"),
    evidenceBindings: [],
    lastValidPlan: accepted.plan
  });
  assert.equal(noMatch.status, "clarification-required");
  if (noMatch.status !== "clarification-required") return;
  assert.equal(noMatch.code, "no-eligible-operation");
  assert.equal(noMatch.lastValidPlan, accepted.plan);
  const portError = await runKpBoundedEquationOperationPlanner({
    naturalLanguageIntent: "Remove zero.",
    states: addZeroStates,
    port: {
      id: "planner.error",
      choose: async () => { throw new Error("offline"); }
    },
    evidenceBindings: [],
    lastValidPlan: accepted.plan
  });
  assert.equal(portError.status, "clarification-required");
  if (portError.status === "clarification-required") {
    assert.equal(portError.code, "planner-error");
    assert.equal(portError.lastValidPlan, accepted.plan);
  }
});

function choosing(operation: string): KpBoundedEquationOperationPlannerPort {
  return {
    id: "planner.test",
    choose: async () => ({
      schemaVersion: "kp.bounded-equation-operation-planner-choice.v1",
      kind: "bounded-equation-operation-planner-choice",
      plannerId: "planner.test",
      choices: [{ adjacencyIndex: 0, operation }]
    })
  };
}

function verifiedAddZeroEvidence() {
  const source = createKpGeneratedAddZeroCarrierSource();
  const result = verifyKpCarrierPreservingSimplificationEvidence({
    candidate: source.evidenceCandidate,
    bundle: source.animation.bundle,
    transformation: source.transformation
  });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") throw new Error("Fixture evidence failed.");
  return result.evidence;
}

function binding(
  operationId: string,
  carrierEvidence: ReturnType<typeof verifiedAddZeroEvidence>
) {
  const inspected = createKpEquationOperationDiscoveryApi().inspect(operationId);
  assert.equal(inspected.status, "resolved");
  if (inspected.status !== "resolved") throw new Error("Missing operation.");
  return {
    operationId,
    verifiedEvidenceIds: inspected.capability.requiredEvidenceIds,
    carrierEvidence
  };
}

const addZeroStates = Object.freeze([
  Object.freeze({ id: "before", latex: "x + 0 = 4" }),
  Object.freeze({ id: "after", latex: "x = 4" })
]);
