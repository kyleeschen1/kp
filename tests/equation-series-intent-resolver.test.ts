import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileEquationIntent,
  listKpEquationIntentSurfaceVocabularies
} from "../src/authoring/compile-equation-intent.ts";
import {
  resolveKpEquationSeriesIntents
} from "../src/authoring/equation-series-intent-resolver.ts";
import {
  createKpEquationSeriesOperationRegistry,
  kpEquationSeriesOperationRegistry
} from "../src/authoring/equation-series-operation-declarations.ts";
import { validateKpEquationTransformSeriesRequest } from
  "../src/authoring/equation-transform-series-request.ts";
import { kpEquationGenerationPressureFixtures } from
  "../src/authoring/equation-generation-pressure-contract.ts";

test("default declarations are unique and exhaustive for promoted intent surfaces", () => {
  assert.equal(
    new Set(kpEquationSeriesOperationRegistry.ids).size,
    kpEquationSeriesOperationRegistry.ids.length
  );
  for (const vocabulary of listKpEquationIntentSurfaceVocabularies()) {
    assert.ok(
      kpEquationSeriesOperationRegistry.byId[vocabulary.operationId],
      `missing declaration for ${vocabulary.operationId}`
    );
  }
  assert.equal(Object.isFrozen(kpEquationSeriesOperationRegistry), true);
  assert.equal(Object.isFrozen(kpEquationSeriesOperationRegistry.byId), true);
});

test("the three original generation trials resolve declaratively and still compile", () => {
  const vocabularies = listKpEquationIntentSurfaceVocabularies().slice(0, 3);
  for (const vocabulary of vocabularies) {
    const resolved = resolveKpEquationSeriesIntents({
      request: acceptedRequest(vocabulary.operationId)
    });
    assert.equal(resolved.status, "resolved");
    if (resolved.status === "resolved") {
      assert.equal(resolved.plans[0]?.operationId, vocabulary.operationId);
      assert.equal(resolved.plans[0]?.declaration.source, "canonical-operation");
    }
    const fixture = kpEquationGenerationPressureFixtures.find(
      ({ request }) => request.animationId === vocabulary.animationId
    )!;
    const compiled = compileEquationIntent({
      ...fixture.request,
      operation: {
        operationId: vocabulary.operationId,
        roleBindings: vocabulary.canonicalRoleBindings
      }
    });
    assert.equal(compiled.status, "accepted");
  }
});

test("extension operations preserve family recipe and semantic authority", () => {
  const operationId = "operation.equation.log-product-decomposition.v1";
  const result = resolveKpEquationSeriesIntents({
    request: acceptedRequest(operationId)
  });
  assert.equal(result.status, "resolved");
  if (result.status !== "resolved") return;
  assert.deepEqual(result.plans[0]?.declaration, {
    operationId,
    source: "equation-extension",
    familyId: "family.equation.log-homomorphism.v1",
    recipeIds: ["recipe.equation.homomorphic-decomposition.v1"],
    authorityRefIds: ["law.logarithm.product"],
    roleIds: [],
    canonicalComposition: [operationId]
  });
});

test("proposed sequences and alternatives stay typed instead of being guessed", () => {
  const sequence = proposedRequest();
  const sequenceResult = resolveKpEquationSeriesIntents({
    request: sequence,
    proposals: [{
      adjacencyId: "adjacency.example.transform",
      kind: "sequence",
      operationIds: [
        "kp.algebra.wrap-function",
        "kp.algebra.distribute-multiplication"
      ]
    }]
  });
  assert.equal(sequenceResult.status, "repair-required");
  if (sequenceResult.status === "repair-required") {
    assert.equal(sequenceResult.repairs[0]?.kind, "insert-intermediate-states");
  }
  const alternatives = resolveKpEquationSeriesIntents({
    request: sequence,
    proposals: [{
      adjacencyId: "adjacency.example.transform",
      kind: "alternatives",
      operationIds: [
        "kp.algebra.wrap-function",
        "operation.wrap-function.v1"
      ]
    }]
  });
  assert.equal(alternatives.status, "repair-required");
  if (alternatives.status === "repair-required") {
    assert.equal(alternatives.repairs[0]?.kind, "choose-single-operation");
  }
});

test("unknown operations and absent proposals never fall back", () => {
  const unknown = resolveKpEquationSeriesIntents({
    request: acceptedRequest("operation.equation.unknown.v1")
  });
  assert.equal(unknown.status, "repair-required");
  if (unknown.status === "repair-required") {
    assert.equal(unknown.repairs[0]?.kind, "resolve-operation");
  }
  const absent = resolveKpEquationSeriesIntents({ request: proposedRequest() });
  assert.equal(absent.status, "repair-required");
});

test("a caller can extend resolution without editing the resolver", () => {
  const custom = createKpEquationSeriesOperationRegistry([{
    operationId: "operation.equation.custom-proof-step.v1",
    source: "equation-extension",
    familyId: "family.equation.custom-proof.v1",
    recipeIds: ["recipe.equation.custom-proof.v1"],
    authorityRefIds: ["law.custom-proof.step"],
    roleIds: [],
    canonicalComposition: ["operation.equation.custom-proof-step.v1"]
  }]);
  const result = resolveKpEquationSeriesIntents({
    request: acceptedRequest("operation.equation.custom-proof-step.v1"),
    registry: custom
  });
  assert.equal(result.status, "resolved");
  assert.throws(() => createKpEquationSeriesOperationRegistry([
    custom.declarations[0]!,
    custom.declarations[0]!
  ]), /Duplicate equation series operation/u);
});

test("resolver owns no surface handler renderer timing DOM or central switch", () => {
  const resolver = readFileSync(new URL(
    "../src/authoring/equation-series-intent-resolver.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(resolver, /compileEquationIntent|surfaceHandlers|switch\s*\(/u);
  assert.doesNotMatch(
    resolver,
    /(?:renderer|HTMLElement|SVGElement|WebGL|requestAnimationFrame|setTimeout|durationMs)/u
  );
});

function acceptedRequest(operationId: string) {
  return request({
    mode: "explicit" as const,
    operationId,
    semanticArguments: { roleBindings: {} }
  });
}

function proposedRequest() {
  return request({
    mode: "proposed" as const,
    instruction: "Choose the licensed semantic operation."
  });
}

function request(intent: unknown) {
  const result = validateKpEquationTransformSeriesRequest({
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: "series.example.declaration-resolution.v1",
    states: [{ id: "state.example.before", latex: "x" }, {
      id: "state.example.after",
      latex: "f(x)"
    }],
    adjacencies: [{
      id: "adjacency.example.transform",
      fromStateId: "state.example.before",
      toStateId: "state.example.after",
      intent
    }]
  });
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") throw new Error("fixture must be valid");
  return result.request;
}
