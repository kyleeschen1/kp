import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  segmentKpEquationSeriesAdjacencies,
  type KpEquationSeriesAdjacencyAnalysis
} from "../src/authoring/equation-series-adjacency-segmentation.ts";
import { validateKpEquationTransformSeriesRequest } from
  "../src/authoring/equation-transform-series-request.ts";

test("one operation per adjacency produces ordered immutable segments", () => {
  const request = acceptedRequest();
  const result = segmentKpEquationSeriesAdjacencies(request, [{
    adjacencyId: "adjacency.log-product.decompose",
    status: "single-operation",
    operationId: "operation.equation.log-product-decomposition.v1"
  }, {
    adjacencyId: "adjacency.log-product.extend",
    status: "single-operation",
    operationId: "operation.equation.log-product-extension.v1"
  }]);
  assert.equal(result.status, "segmented");
  if (result.status !== "segmented") return;
  assert.deepEqual(result.segments.map(({ operationId, authority }) => ({
    operationId,
    authority
  })), [{
    operationId: "operation.equation.log-product-decomposition.v1",
    authority: "explicit-request"
  }, {
    operationId: "operation.equation.log-product-extension.v1",
    authority: "proposed-resolution"
  }]);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.segments), true);
  assert.equal(Object.isFrozen(result.segments[0]?.intent), true);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
});

test("a compound jump requests enough intermediate states and emits no prefix", () => {
  const result = segmentKpEquationSeriesAdjacencies(acceptedRequest(), [{
    adjacencyId: "adjacency.log-product.decompose",
    status: "compound-operation",
    operationIds: [
      "operation.equation.apply-log.v1",
      "operation.equation.divide-log-base.v1",
      "operation.equation.isolate-variable.v1"
    ]
  }, {
    adjacencyId: "adjacency.log-product.extend",
    status: "single-operation",
    operationId: "operation.equation.log-product-extension.v1"
  }]);
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal("segments" in result, false);
  assert.deepEqual(result.repairs[0], {
    kind: "insert-intermediate-states",
    adjacencyId: "adjacency.log-product.decompose",
    fromStateId: "state.log-product.source",
    toStateId: "state.log-product.binary",
    operationIds: [
      "operation.equation.apply-log.v1",
      "operation.equation.divide-log-base.v1",
      "operation.equation.isolate-variable.v1"
    ],
    minimumIntermediateStateCount: 2
  });
});

test("ambiguity and unresolved analysis return typed repairs", () => {
  const result = segmentKpEquationSeriesAdjacencies(acceptedRequest(), [{
    adjacencyId: "adjacency.log-product.decompose",
    status: "ambiguous",
    candidateOperationIds: [
      "operation.equation.log-product-decomposition.v1",
      "operation.equation.log-quotient-decomposition.v1"
    ]
  }, {
    adjacencyId: "adjacency.log-product.extend",
    status: "unresolved",
    reason: "No registered declaration matches the endpoint pair."
  }]);
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.deepEqual(result.repairs.map(({ kind }) => kind), [
    "choose-single-operation",
    "resolve-operation"
  ]);
});

test("analysis evidence must be complete and ordered", () => {
  const result = segmentKpEquationSeriesAdjacencies(acceptedRequest(), [{
    adjacencyId: "adjacency.log-product.extend",
    status: "single-operation",
    operationId: "operation.equation.log-product-extension.v1"
  }]);
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.deepEqual(result.repairs, [{
    kind: "reorder-adjacency-analysis",
    adjacencyId: "adjacency.log-product.extend",
    expectedAdjacencyId: "adjacency.log-product.decompose"
  }, {
    kind: "provide-adjacency-analysis",
    adjacencyId: "adjacency.log-product.extend"
  }]);
});

test("analysis cannot silently override an explicit authored operation", () => {
  const analyses: readonly KpEquationSeriesAdjacencyAnalysis[] = [{
    adjacencyId: "adjacency.log-product.decompose",
    status: "single-operation",
    operationId: "operation.equation.log-quotient-decomposition.v1"
  }, {
    adjacencyId: "adjacency.log-product.extend",
    status: "single-operation",
    operationId: "operation.equation.log-product-extension.v1"
  }];
  const result = segmentKpEquationSeriesAdjacencies(acceptedRequest(), analyses);
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.deepEqual(result.repairs[0], {
    kind: "correct-explicit-operation",
    adjacencyId: "adjacency.log-product.decompose",
    explicitOperationId: "operation.equation.log-product-decomposition.v1",
    analyzedOperationId: "operation.equation.log-quotient-decomposition.v1"
  });
});

test("segmentation owns no parser renderer timing or DOM policy", () => {
  const source = readFileSync(new URL(
    "../src/authoring/equation-series-adjacency-segmentation.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(
    source,
    /(?:latex-parser|renderer|HTMLElement|SVGElement|WebGL|requestAnimationFrame|setTimeout|durationMs)/u
  );
});

function acceptedRequest() {
  const result = validateKpEquationTransformSeriesRequest({
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: "series.log-product.example.v1",
    states: [{
      id: "state.log-product.source",
      latex: "\\ln(xy)"
    }, {
      id: "state.log-product.binary",
      latex: "\\ln(x)+\\ln(y)"
    }, {
      id: "state.log-product.expanded",
      latex: "\\ln(x)+\\ln(y)+\\ln(z)"
    }],
    adjacencies: [{
      id: "adjacency.log-product.decompose",
      fromStateId: "state.log-product.source",
      toStateId: "state.log-product.binary",
      intent: {
        mode: "explicit",
        operationId: "operation.equation.log-product-decomposition.v1",
        semanticArguments: { factorIds: ["x", "y"] }
      }
    }, {
      id: "adjacency.log-product.extend",
      fromStateId: "state.log-product.binary",
      toStateId: "state.log-product.expanded",
      intent: { mode: "proposed" }
    }]
  });
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") throw new Error("fixture must be valid");
  return result.request;
}
