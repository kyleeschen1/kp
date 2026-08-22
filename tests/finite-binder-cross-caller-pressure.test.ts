import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { kpCanonicalFiniteSumNativeEndpoints } from
  "../src/rendering/finite-sum-native-endpoints.ts";
import { kpCanonicalFiniteProductNativeEndpoints } from
  "../src/rendering/finite-product-native-endpoints.ts";
import {
  defineKpFiniteBinderExpansionOperation,
  type KpVerifiedFiniteBinderExpansionOperation
} from "../src/semantic/finite-binder-expansion-operation.ts";
import { defineKpFiniteBinderRange } from
  "../src/semantic/finite-binder-range.ts";
import { proveKpFiniteBinderScope } from
  "../src/semantic/finite-binder-scope-proof.ts";
import {
  defineKpFiniteProductExpansionOperation,
  type KpVerifiedFiniteProductExpansionOperation
} from "../src/semantic/finite-product-expansion-operation.ts";
import {
  normalizeKpFiniteProductSourceEndpoint,
  normalizeKpFiniteProductTargetEndpoint
} from "../src/semantic/finite-product-endpoint-normalizer.ts";
import {
  normalizeKpFiniteSumSourceEndpoint,
  normalizeKpFiniteSumTargetEndpoint
} from "../src/semantic/finite-sum-endpoint-normalizer.ts";

type PressureOperation =
  | KpVerifiedFiniteBinderExpansionOperation
  | KpVerifiedFiniteProductExpansionOperation;

const sharedLineageRelations = Object.freeze([
  "body-template-instantiates",
  "bound-reference-substitutes-integer",
  "lower-bound-materializes-reference",
  "upper-bound-materializes-reference"
] as const);

test("variant sum and product bodies prove the same scope and range laws", () => {
  const sum = compileSum("\\sum_{j=-1}^{1} b_j", "b_{-1}+b_0+b_1");
  const product = compileProduct("\\prod_{n=2}^{4} y_n", "y_2y_3y_4");

  assert.deepEqual(projectSharedLaws(sum), {
    binder: "j",
    bodySymbol: "b",
    range: [-1, 0, 1],
    instanceOrdinals: [0, 1, 2],
    referenceValues: [-1, 0, 1],
    sharedLineageCounts: [3, 3, 1, 1]
  });
  assert.deepEqual(projectSharedLaws(product), {
    binder: "n",
    bodySymbol: "y",
    range: [2, 3, 4],
    instanceOrdinals: [0, 1, 2],
    referenceValues: [2, 3, 4],
    sharedLineageCounts: [3, 3, 1, 1]
  });
  assert.equal(sum.scopeProof.captureAvoidance,
    "proved-by-closed-substitution");
  assert.equal(product.scopeProof.captureAvoidance,
    "proved-by-closed-substitution");
});

test("both callers derive fresh ordered occurrences without false persistence", () => {
  const operations = [
    compileSum("\\sum_{j=-1}^{1} b_j", "b_{-1}+b_0+b_1"),
    compileProduct("\\prod_{n=2}^{4} y_n", "y_2y_3y_4")
  ];

  for (const operation of operations) {
    const instanceIds = operation.target.instances.map(({ id }) => id);
    const referenceIds = operation.target.instances.map(({ references }) =>
      references[0]!.id
    );
    const sourceIds = new Set(operation.consumedSourceOccurrenceIds);
    assert.equal(new Set(instanceIds).size, operation.rangeProof.cardinality);
    assert.equal(new Set(referenceIds).size, operation.rangeProof.cardinality);
    assert.ok([...instanceIds, ...referenceIds].every((id) =>
      !sourceIds.has(id)
    ));
    assert.equal(operation.identityPolicy,
      "derive-distinct-occurrences-never-clone-identity");
    assert.equal(Object.isFrozen(operation.target.instances), true);
    assert.equal(Object.isFrozen(operation.lineage), true);
  }
});

test("operator connective topology remains deliberately caller-owned", () => {
  const sum = compileSum("\\sum_{j=-1}^{1} b_j", "b_{-1}+b_0+b_1");
  const product = compileProduct("\\prod_{n=2}^{4} y_n", "y_2y_3y_4");

  assert.deepEqual(sum.target.connectors.map(({ rawLatex }) => rawLatex),
    ["+", "+"]);
  assert.equal(sum.lineage.filter(({ relation }) =>
    relation === "operator-introduces-connector"
  ).length, 2);
  assert.deepEqual(product.target.adjacencies.map(({ paintPolicy }) =>
    paintPolicy
  ), ["no-explicit-connector-glyph", "no-explicit-connector-glyph"]);
  assert.equal(product.lineage.filter(({ relation }) =>
    relation === "product-operator-establishes-adjacency"
  ).length, 2);
  assert.equal("connectors" in product.target, false);
  assert.equal("adjacencies" in sum.target, false);
});

test("canonical Native KaTeX endpoints retain exact distinct paint owners", () => {
  for (const endpoints of [
    kpCanonicalFiniteSumNativeEndpoints,
    kpCanonicalFiniteProductNativeEndpoints
  ]) {
    assert.deepEqual(endpoints.map(({ endpoint }) => endpoint),
      ["source", "target"]);
    for (const endpoint of endpoints) {
      const occurrenceIds = endpoint.nodes.map(({ occurrenceId }) =>
        occurrenceId
      );
      const presentationGroupIds = endpoint.nodes.map(({ presentationGroupId }) =>
        presentationGroupId
      );
      assert.equal(new Set(occurrenceIds).size, occurrenceIds.length);
      assert.equal(new Set(presentationGroupIds).size,
        presentationGroupIds.length);
      assert.ok(endpoint.nodes.every(({ occurrenceId, presentationGroupId }) =>
        occurrenceId.length > 0 && presentationGroupId.length > 0
      ));
    }
  }
  assert.equal(
    kpCanonicalFiniteSumNativeEndpoints[1].nodes.some(({ role }) =>
      role === "additive-connector"
    ),
    true
  );
  assert.equal(
    kpCanonicalFiniteProductNativeEndpoints[1].nodes.some(({ role }) =>
      String(role) === "implicit-multiplicative-adjacency"
    ),
    false
  );
});

test("pressure callers share the semantic kernel but no presentation implementation", async () => {
  const [sumOperation, productOperation, sumPlan, productPlan,
    sumAdapter, productAdapter] = await Promise.all([
    readFile(new URL("../src/semantic/finite-binder-expansion-operation.ts",
      import.meta.url), "utf8"),
    readFile(new URL("../src/semantic/finite-product-expansion-operation.ts",
      import.meta.url), "utf8"),
    readFile(new URL("../src/animation/finite-sum-expansion-presentation-plan.ts",
      import.meta.url), "utf8"),
    readFile(new URL("../src/animation/finite-product-expansion-presentation-plan.ts",
      import.meta.url), "utf8"),
    readFile(new URL("../src/editor/finite-sum-surface-adapter.ts",
      import.meta.url), "utf8"),
    readFile(new URL("../src/editor/finite-product-surface-adapter.ts",
      import.meta.url), "utf8")
  ]);

  assert.match(sumOperation, /deriveKpFiniteBinderExpansionKernel/u);
  assert.match(productOperation, /deriveKpFiniteBinderExpansionKernel/u);
  assert.doesNotMatch(sumPlan, /finite-product/u);
  assert.doesNotMatch(productPlan, /finite-sum/u);
  assert.doesNotMatch(sumAdapter, /finite-product/u);
  assert.doesNotMatch(productAdapter, /finite-sum/u);
});

function projectSharedLaws(operation: PressureOperation) {
  return {
    binder: operation.source.semantic.binder.symbol,
    bodySymbol: operation.source.semantic.body.freeSymbols[0],
    range: [...operation.rangeProof.values],
    instanceOrdinals: operation.target.instances.map(({ ordinal }) => ordinal),
    referenceValues: operation.target.instances.map(({ references }) =>
      references[0]!.value
    ),
    sharedLineageCounts: sharedLineageRelations.map((relation) =>
      operation.lineage.filter((edge) => edge.relation === relation).length
    )
  };
}

function compileSum(
  sourceLatex: string,
  targetLatex: string
): KpVerifiedFiniteBinderExpansionOperation {
  const source = normalizeKpFiniteSumSourceEndpoint(sourceLatex);
  const target = normalizeKpFiniteSumTargetEndpoint(targetLatex);
  assert.equal(source.status, "normalized");
  assert.equal(target.status, "normalized");
  if (source.status !== "normalized" || target.status !== "normalized") {
    throw new Error("Expected finite-sum pressure endpoints.");
  }
  const scope = proveKpFiniteBinderScope(source.endpoint.semantic);
  assert.equal(scope.status, "verified");
  if (scope.status !== "verified") throw new Error("Expected sum scope.");
  const range = defineKpFiniteBinderRange(source.endpoint.semantic, scope.proof);
  assert.equal(range.status, "verified");
  if (range.status !== "verified") throw new Error("Expected sum range.");
  const result = defineKpFiniteBinderExpansionOperation({
    source: source.endpoint,
    target: target.endpoint,
    scopeProof: scope.proof,
    rangeProof: range.range
  });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") throw new Error("Expected sum operation.");
  return result.operation;
}

function compileProduct(
  sourceLatex: string,
  targetLatex: string
): KpVerifiedFiniteProductExpansionOperation {
  const source = normalizeKpFiniteProductSourceEndpoint(sourceLatex);
  const target = normalizeKpFiniteProductTargetEndpoint(targetLatex);
  assert.equal(source.status, "normalized");
  assert.equal(target.status, "normalized");
  if (source.status !== "normalized" || target.status !== "normalized") {
    throw new Error("Expected finite-product pressure endpoints.");
  }
  const scope = proveKpFiniteBinderScope(source.endpoint.semantic);
  assert.equal(scope.status, "verified");
  if (scope.status !== "verified") throw new Error("Expected product scope.");
  const range = defineKpFiniteBinderRange(source.endpoint.semantic, scope.proof);
  assert.equal(range.status, "verified");
  if (range.status !== "verified") throw new Error("Expected product range.");
  const result = defineKpFiniteProductExpansionOperation({
    source: source.endpoint,
    target: target.endpoint,
    scopeProof: scope.proof,
    rangeProof: range.range
  });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") {
    throw new Error("Expected product operation.");
  }
  return result.operation;
}
