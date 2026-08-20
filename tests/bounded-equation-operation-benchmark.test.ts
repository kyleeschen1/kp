import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEquationOperationDiscoveryApi
} from "../src/authoring/equation-operation-discovery-api.ts";
import {
  runKpBoundedEquationOperationPlanner,
  type KpBoundedEquationOperationEvidenceBinding,
  type KpBoundedEquationOperationPlannerPort,
  type KpBoundedEquationOperationPlannerPrompt
} from "../src/authoring/bounded-equation-operation-planner.ts";
import {
  createKpTwoTimesOneCarrierEvidenceCandidate,
  createKpTwoTimesOneCarrierExemplar
} from "../src/semantic/carrier-preserving-simplification-exemplar.ts";
import {
  createKpGeneratedAddZeroCarrierSource
} from "../src/semantic/generated-add-zero-carrier-preserving-simplification.ts";
import {
  verifyKpCarrierPreservingSimplificationEvidence,
  type KpVerifiedCarrierPreservingSimplificationEvidence
} from "../src/semantic/carrier-preserving-simplification-evidence.ts";

const api = createKpEquationOperationDiscoveryApi();

test("mixed generation selects carrier preservation and contributor fusion without crossing authority", async () => {
  const corpus = [
    {
      title: "additive carrier",
      intent: "Drop plus zero but keep the original x.",
      states: states("x + 0 = 4", "x = 4"),
      choice: "drop + 0",
      expected: "kp.semantic-motion.absorb-additive-identity",
      expectedCandidates: [
        "kp.semantic-motion.absorb-additive-identity"
      ],
      binding: carrierBinding(
        "kp.semantic-motion.absorb-additive-identity",
        verifiedAddZeroEvidence()
      )
    },
    {
      title: "multiplicative carrier",
      intent: "Remove times one while the original two persists.",
      states: states("2 \\times 1", "2"),
      choice: "remove times one",
      expected: "kp.semantic-motion.absorb-multiplicative-identity",
      expectedCandidates: [
        "kp.semantic-motion.absorb-multiplicative-identity",
        "kp.algebra.simplify-constant-product"
      ],
      binding: carrierBinding(
        "kp.semantic-motion.absorb-multiplicative-identity",
        verifiedTwoTimesOneEvidence()
      )
    },
    {
      title: "contributor fusion",
      intent: "Evaluate the two contributing factors.",
      states: states("2 \\times 3", "6"),
      choice: "kp.algebra.simplify-constant-product",
      expected: "kp.algebra.simplify-constant-product",
      expectedCandidates: ["kp.algebra.simplify-constant-product"],
      binding: evidenceBinding("kp.algebra.simplify-constant-product")
    }
  ] as const;

  for (const example of corpus) {
    const observedPrompts: KpBoundedEquationOperationPlannerPrompt[] = [];
    const result = await runKpBoundedEquationOperationPlanner({
      naturalLanguageIntent: example.intent,
      states: example.states,
      port: recordingPort(example.choice, observedPrompts),
      evidenceBindings: [example.binding]
    });
    assert.equal(result.status, "accepted", example.title);
    if (result.status !== "accepted") continue;
    assert.equal(result.plan.selections[0]?.operationId, example.expected);
    assert.deepEqual(
      observedPrompts[0]?.adjacencies[0]?.candidates.map(({ operationId }) =>
        operationId
      ),
      example.expectedCandidates,
      `${example.title} exposes only deterministically eligible candidates`
    );
    assert.equal("animation" in observedPrompts[0]!, false);
    assert.equal("geometry" in observedPrompts[0]!, false);
    assert.equal("timing" in observedPrompts[0]!, false);
  }
});

test("an invalid mixed-family choice repairs without replacing the last valid plan", async () => {
  const evidence = verifiedAddZeroEvidence();
  const valid = await runKpBoundedEquationOperationPlanner({
    naturalLanguageIntent: "Remove additive zero.",
    states: states("x + 0 = 4", "x = 4"),
    port: recordingPort("remove additive zero", []),
    evidenceBindings: [carrierBinding(
      "kp.semantic-motion.absorb-additive-identity",
      evidence
    )]
  });
  assert.equal(valid.status, "accepted");
  if (valid.status !== "accepted") return;

  const invalid = await runKpBoundedEquationOperationPlanner({
    naturalLanguageIntent: "Fuse these contributors.",
    states: states("x + 0 = 4", "x = 4"),
    port: recordingPort("kp.algebra.simplify-constant-product", []),
    evidenceBindings: [evidenceBinding(
      "kp.algebra.simplify-constant-product"
    )],
    lastValidPlan: valid.plan
  });
  assert.equal(invalid.status, "clarification-required");
  if (invalid.status !== "clarification-required") return;
  assert.equal(invalid.code, "operation-outside-shortlist");
  assert.equal(invalid.lastValidPlan, valid.plan);
});

function states(source: string, target: string) {
  return Object.freeze([
    Object.freeze({ id: "before", latex: source }),
    Object.freeze({ id: "after", latex: target })
  ]);
}

function recordingPort(
  operation: string,
  prompts: KpBoundedEquationOperationPlannerPrompt[]
): KpBoundedEquationOperationPlannerPort {
  return {
    id: "planner.benchmark",
    choose: async (prompt) => {
      prompts.push(prompt);
      return {
        schemaVersion: "kp.bounded-equation-operation-planner-choice.v1",
        kind: "bounded-equation-operation-planner-choice",
        plannerId: "planner.benchmark",
        choices: [{ adjacencyIndex: 0, operation }]
      };
    }
  };
}

function evidenceBinding(
  operationId: string
): KpBoundedEquationOperationEvidenceBinding {
  const inspected = api.inspect(operationId);
  assert.equal(inspected.status, "resolved");
  if (inspected.status !== "resolved") throw new Error("Unknown operation.");
  return Object.freeze({
    operationId,
    verifiedEvidenceIds: inspected.capability.requiredEvidenceIds
  });
}

function carrierBinding(
  operationId: string,
  carrierEvidence: KpVerifiedCarrierPreservingSimplificationEvidence
): KpBoundedEquationOperationEvidenceBinding {
  return Object.freeze({
    ...evidenceBinding(operationId),
    carrierEvidence
  });
}

function verifiedAddZeroEvidence() {
  const source = createKpGeneratedAddZeroCarrierSource();
  const result = verifyKpCarrierPreservingSimplificationEvidence({
    candidate: source.evidenceCandidate,
    bundle: source.animation.bundle,
    transformation: source.transformation
  });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") throw new Error("Add-zero evidence failed.");
  return result.evidence;
}

function verifiedTwoTimesOneEvidence() {
  const exemplar = createKpTwoTimesOneCarrierExemplar();
  const result = verifyKpCarrierPreservingSimplificationEvidence({
    candidate: createKpTwoTimesOneCarrierEvidenceCandidate(),
    bundle: exemplar.bundle,
    transformation: exemplar.transformation
  });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") throw new Error("Times-one evidence failed.");
  return result.evidence;
}
