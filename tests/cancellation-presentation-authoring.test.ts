import assert from "node:assert/strict";
import test from "node:test";
import {
  inferKpCancellationPresentationIntent,
  type KpCancellationPresentationRequest
} from "../src/semantic/cancellation-presentation-authoring.ts";

const generatedRequest = {
  operationId: "kp.algebra.cancel-multiplicative-inverses",
  teachingGoal: "preserve-flow"
} as const satisfies KpCancellationPresentationRequest;

test("authoring infers cancellation intent without renderer choices", () => {
  assert.deepEqual(inferKpCancellationPresentationIntent(generatedRequest), {
    contact: "shared-center",
    approach: "opposing-arcs",
    identityBeat: "implicit",
    retirement: "after-contact",
    readability: "through-contact"
  });
});

test("the teaching goal controls only the semantic identity beat", () => {
  const fluent = inferKpCancellationPresentationIntent({
    operationId: "kp.algebra.cancel-additive-inverses",
    teachingGoal: "preserve-flow"
  });
  const explanatory = inferKpCancellationPresentationIntent({
    operationId: "kp.algebra.cancel-additive-inverses",
    teachingGoal: "make-identity-visible"
  });

  assert.deepEqual(
    { ...fluent, identityBeat: explanatory.identityBeat },
    explanatory
  );
  assert.equal(Object.isFrozen(explanatory), true);
});

test("the authoring request cannot carry a renderer recipe id", () => {
  assert.deepEqual(Object.keys(generatedRequest).sort(), [
    "operationId",
    "teachingGoal"
  ]);
  assert.equal(JSON.stringify(generatedRequest).includes("-v1"), false);
});
