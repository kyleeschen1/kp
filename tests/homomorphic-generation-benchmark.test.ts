import assert from "node:assert/strict";
import test from "node:test";

import { proveKpHomomorphicGenerationBenchmark } from
  "../scripts/prove-homomorphic-generation-benchmark.ts";
import { compileEquationIntent } from
  "../src/authoring/compile-equation-intent.ts";

test("binary product multi-factor product and quotient compile with zero repairs", () => {
  const proof = proveKpHomomorphicGenerationBenchmark();
  assert.deepEqual(proof.cases.map(({ callerId }) => callerId), [
    "animation.algebra.log-product.product-to-sum",
    "animation.algebra.log-product.three-factors-to-sum",
    "animation.algebra.log-quotient.difference-to-quotient"
  ]);
  assert.ok(proof.cases.every(({ status, repairRounds, authorityIds }) =>
    status === "accepted" && repairRounds === 0 && authorityIds.length === 5
  ));
  assert.equal(proof.directCompilerUsesCallerIds, false);
  assert.equal(proof.presentationInputUsed, false);
  assert.equal(proof.liveModelUsed, false);
});

test("all callers resolve one shared recipe with only family-local marginal files", () => {
  const proof = proveKpHomomorphicGenerationBenchmark();
  assert.deepEqual(new Set(proof.cases.map(
    ({ authorityIds }) => authorityIds[2]
  )), new Set(["recipe.equation.homomorphic-decomposition.v1"]));
  assert.deepEqual(new Set(proof.cases.flatMap(({ marginalSourcePaths }) =>
    marginalSourcePaths
  )), new Set([
    "src/animation/homomorphic-crossover-caller-declarations.ts",
    "src/animation/equation-extension-packs/homomorphic-crossover.ts",
    "src/authoring/homomorphic-crossover-authoring.ts",
    "src/semantic/log-product-semantic-motion.ts",
    "src/semantic/log-quotient-semantic-motion.ts"
  ]));
});

test("unsupported homomorphic-looking input receives a repair without fallback", () => {
  const result = compileEquationIntent({
    animationId: "animation.algebra.log-power.power-to-product",
    operation: {
      operationId: "kp.semantic-motion.log-product",
      roleBindings: {}
    },
    explanationDepth: "standard"
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.ok(result.diagnostics.some(({ code }) =>
    code === "equation-llm.surface.unknown"
  ));
});
