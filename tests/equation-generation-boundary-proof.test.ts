import assert from "node:assert/strict";
import test from "node:test";

import {
  proveKpEquationGenerationBoundary
} from "../scripts/prove-equation-generation-boundary.ts";

test("all eight pressure cases compile first-pass through the direct facade", () => {
  const proof = proveKpEquationGenerationBoundary();
  assert.deepEqual(proof.cases.map(({ status }) => status), [
    "accepted",
    "accepted",
    "accepted",
    "accepted",
    "accepted",
    "accepted",
    "accepted",
    "accepted"
  ]);
  assert.deepEqual(
    proof.cases.map(({ repairRounds }) => repairRounds),
    [0, 0, 0, 0, 0, 0, 0, 0]
  );
  assert.deepEqual(proof.cases.map(({ planKind }) => planKind), [
    "function-wrap-motif-plan",
    "cancellation-semantic-motion-plan",
    "distribution-operation-plan",
    "homomorphic-crossover-semantic-motion-plan",
    "homomorphic-crossover-semantic-motion-plan",
    "homomorphic-crossover-semantic-motion-plan",
    "exponential-homomorphism-correspondence-plan",
    "exponential-homomorphism-correspondence-plan"
  ]);
});

test("the generation entrypoint remains direct and tool-neutral", () => {
  const { boundary } = proveKpEquationGenerationBoundary();
  assert.equal(boundary.entryPoint, "src/authoring/compile-equation-intent.ts");
  assert.equal(boundary.publicImport, "direct-only");
  assert.equal(boundary.liveModelUsed, false);
  assert.equal(boundary.applicationRuntimeUsed, false);
  assert.deepEqual(boundary.forbiddenRuntimeModules, []);
  assert.deepEqual(boundary.broadBarrelModules, []);
  assert.deepEqual(boundary.broadBarrelImporters, []);
  assert.ok(boundary.runtimeModuleCount > 0);
  assert.ok(boundary.runtimeSourceBytes > 0);
});
