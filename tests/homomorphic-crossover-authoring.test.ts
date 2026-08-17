import assert from "node:assert/strict";
import test from "node:test";

import { kpHomomorphicCrossoverCallerDeclarations } from
  "../src/animation/homomorphic-crossover-caller-declarations.ts";
import {
  createKpEquationLlmAuthoringCatalogue,
  validateKpEquationLlmAuthoringRequest
} from "../src/authoring/equation-llm-authoring-catalogue.ts";
import { kpCanonicalHomomorphicCausalPhaseGrammar } from
  "../src/domain-ir/homomorphic-causal-phases.ts";
import { kpLogProductSemanticMotionBundles } from
  "../src/semantic/log-product-semantic-motion.ts";
import { kpCanonicalLogQuotientSemanticMotionRequest } from
  "../src/semantic/log-quotient-semantic-motion.ts";

const catalogue = createKpEquationLlmAuthoringCatalogue();
const homomorphicOperations = catalogue.operations.filter(
  ({ visualMotif }) => visualMotif === "homomorphic-crossover"
);
const homomorphicRequests = [
  ...kpLogProductSemanticMotionBundles.map(({ request }) => request),
  kpCanonicalLogQuotientSemanticMotionRequest
];

test("the LLM catalogue exposes one shared recipe through exact caller authority", () => {
  assert.deepEqual(homomorphicOperations.map((operation) => ({
    operationId: operation.operationId,
    operationKind: operation.extensionAuthority?.operationKind,
    recipeId: operation.extensionAuthority?.recipeId,
    semanticAuthorityIds: operation.extensionAuthority?.semanticAuthorityIds,
    callerIds: operation.extensionAuthority?.callerIds
  })), [{
    operationId: "kp.semantic-motion.log-product",
    operationKind: "operation.equation.log-product-decomposition.v1",
    recipeId: "recipe.equation.homomorphic-decomposition.v1",
    semanticAuthorityIds: ["law.logarithm.product"],
    callerIds: [
      "animation.algebra.log-product.product-to-sum",
      "animation.algebra.log-product.three-factors-to-sum"
    ]
  }, {
    operationId: "kp.semantic-motion.quotient",
    operationKind: "operation.equation.log-quotient-fusion.v1",
    recipeId: "recipe.equation.homomorphic-decomposition.v1",
    semanticAuthorityIds: ["law.logarithm.quotient"],
    callerIds: ["animation.algebra.log-quotient.difference-to-quotient"]
  }]);
  assert.ok(homomorphicOperations.every(({ semanticPhaseIds }) =>
    JSON.stringify(semanticPhaseIds) === JSON.stringify(
      kpCanonicalHomomorphicCausalPhaseGrammar.phases.map(({ id }) => id)
    )
  ));

  const promotedCallers = catalogue.surfaces.filter(({ animationId }) =>
    kpHomomorphicCrossoverCallerDeclarations.some(
      ({ callerId }) => callerId === animationId
    )
  );
  assert.equal(promotedCallers.length, 3);
  assert.ok(promotedCallers.every(({ authoringStatus, recipeIds }) =>
    authoringStatus === "promoted" &&
    recipeIds.includes("recipe.equation.homomorphic-decomposition.v1")
  ));
});

test("canonical binary multi-factor and quotient requests pass role validation", () => {
  for (const request of homomorphicRequests) {
    const result = validateKpEquationLlmAuthoringRequest({
      animationId: request.assetId,
      operation: {
        operationId: request.operation.operationId,
        roleBindings: request.operation.roleBindings
      },
      explanationDepth: "standard"
    }, catalogue);
    assert.equal(result.status, "accepted", request.assetId);
  }
});

test("role cardinality operation mismatch and presentation authorship fail closed", () => {
  const product = kpLogProductSemanticMotionBundles[0]!.request;
  const wrongCardinality = validateKpEquationLlmAuthoringRequest({
    animationId: product.assetId,
    operation: {
      operationId: product.operation.operationId,
      roleBindings: {
        ...product.operation.roleBindings,
        "source-application": ["source.one", "source.two"]
      }
    },
    explanationDepth: "standard"
  }, catalogue);
  assert.ok(wrongCardinality.status === "repair-required" &&
    wrongCardinality.diagnostics.some(({ code }) =>
      code === "equation-llm.role.cardinality"
    ));

  const mismatch = validateKpEquationLlmAuthoringRequest({
    animationId: product.assetId,
    operation: {
      operationId: "kp.semantic-motion.quotient",
      roleBindings:
        kpCanonicalLogQuotientSemanticMotionRequest.operation.roleBindings
    },
    explanationDepth: "standard"
  }, catalogue);
  assert.deepEqual(
    mismatch.status === "repair-required"
      ? mismatch.diagnostics.map(({ code }) => code)
      : [],
    ["equation-llm.surface-operation.mismatch"]
  );

  const forbidden = validateKpEquationLlmAuthoringRequest({
    animationId: product.assetId,
    operation: {
      operationId: product.operation.operationId,
      roleBindings: product.operation.roleBindings,
      durationMs: 500
    },
    explanationDepth: "standard"
  }, catalogue);
  assert.ok(forbidden.status === "repair-required" &&
    forbidden.diagnostics.some(({ code }) =>
      code === "equation-llm.field.forbidden"
    ));
});

test("authoring declarations contain no model-authored presentation policy", () => {
  const serialized = JSON.stringify({
    requests: homomorphicRequests.map((request) => ({
      animationId: request.assetId,
      operation: request.operation
    })),
    callers: kpHomomorphicCrossoverCallerDeclarations
  });
  for (const forbidden of [
    "durationMs",
    "delayMs",
    "geometry",
    "coordinates",
    "renderer",
    "motionPath",
    "keyframes"
  ]) assert.equal(serialized.includes(forbidden), false, forbidden);
});
