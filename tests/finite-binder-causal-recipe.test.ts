import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFiniteBinderCausalRecipe
} from "../src/domain-ir/finite-binder-causal-recipe.ts";
import {
  defineKpFiniteBinderExpansionOperation,
  type KpVerifiedFiniteBinderExpansionOperation
} from "../src/semantic/finite-binder-expansion-operation.ts";
import { defineKpFiniteBinderRange } from
  "../src/semantic/finite-binder-range.ts";
import { proveKpFiniteBinderScope } from
  "../src/semantic/finite-binder-scope-proof.ts";
import {
  normalizeKpFiniteSumSourceEndpoint,
  normalizeKpFiniteSumTargetEndpoint
} from "../src/semantic/finite-sum-endpoint-normalizer.ts";

function canonicalOperation(): KpVerifiedFiniteBinderExpansionOperation {
  const source = normalizeKpFiniteSumSourceEndpoint("\\sum_{i=1}^{3} a_i");
  const target = normalizeKpFiniteSumTargetEndpoint("a_1+a_2+a_3");
  assert.equal(source.status, "normalized");
  assert.equal(target.status, "normalized");
  if (source.status !== "normalized" || target.status !== "normalized") {
    throw new Error("Expected endpoints.");
  }
  const scope = proveKpFiniteBinderScope(source.endpoint.semantic);
  assert.equal(scope.status, "verified");
  if (scope.status !== "verified") throw new Error("Expected scope.");
  const range = defineKpFiniteBinderRange(source.endpoint.semantic, scope.proof);
  assert.equal(range.status, "verified");
  if (range.status !== "verified") throw new Error("Expected range.");
  const operation = defineKpFiniteBinderExpansionOperation({
    source: source.endpoint,
    target: target.endpoint,
    scopeProof: scope.proof,
    rangeProof: range.range
  });
  assert.equal(operation.status, "verified");
  if (operation.status !== "verified") throw new Error("Expected operation.");
  return operation.operation;
}

test("causal recipe establishes context then ordered instances", () => {
  const recipe = createKpFiniteBinderCausalRecipe(canonicalOperation());
  const instanceSteps = recipe.steps.filter(({ kind }) =>
    kind === "instantiate-body"
  );
  assert.deepEqual(instanceSteps.map(({ ordinal, indexValue, dependsOn }) => ({
    ordinal,
    indexValue,
    dependsOn
  })), [
    {
      ordinal: 0,
      indexValue: 1,
      dependsOn: ["finite-binder.establish-context"]
    },
    {
      ordinal: 1,
      indexValue: 2,
      dependsOn: ["finite-binder.instantiate.0"]
    },
    {
      ordinal: 2,
      indexValue: 3,
      dependsOn: ["finite-binder.instantiate.1"]
    }
  ]);
});

test("each connector causally requires both adjacent instances", () => {
  const recipe = createKpFiniteBinderCausalRecipe(canonicalOperation());
  const connectorSteps = recipe.steps.filter(({ kind }) =>
    kind === "derive-connector"
  );
  assert.deepEqual(connectorSteps.map(({ ordinal, dependsOn }) => ({
    ordinal,
    dependsOn
  })), [
    {
      ordinal: 0,
      dependsOn: [
        "finite-binder.instantiate.0",
        "finite-binder.instantiate.1"
      ]
    },
    {
      ordinal: 1,
      dependsOn: [
        "finite-binder.instantiate.1",
        "finite-binder.instantiate.2"
      ]
    }
  ]);
});

test("target endpoint depends on every derived target role", () => {
  const recipe = createKpFiniteBinderCausalRecipe(canonicalOperation());
  const target = recipe.steps.at(-1);
  assert.equal(target?.kind, "establish-target-endpoint");
  assert.deepEqual(target?.dependsOn, [
    "finite-binder.instantiate.0",
    "finite-binder.instantiate.1",
    "finite-binder.instantiate.2",
    "finite-binder.connector.0",
    "finite-binder.connector.1"
  ]);
  assert.equal(Object.isFrozen(recipe.steps), true);
});

test("recipe owns causality but delegates every presentation decision", () => {
  const recipe = createKpFiniteBinderCausalRecipe(canonicalOperation());
  assert.ok(recipe.invariants.includes("presentation-remains-caller-owned"));
  assert.doesNotMatch(
    JSON.stringify(recipe),
    /duration|timingWindow|geometry|coordinates|motionPath|opacity|scale|renderer/u
  );
});
