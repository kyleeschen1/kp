import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID,
  KP_COMMON_DENOMINATOR_AUTHORING_PACK_PIN,
  KP_COMMON_DENOMINATOR_EQUATION_SERIES_AUTHORING_AUTHORITY,
  KP_COMMON_DENOMINATOR_SOURCE_OPERATION_ALIASES,
  createKpEquationSeriesCommonDenominatorSemanticSource,
  kpEquationSeriesCommonDenominatorAuthoringDeclaration
} from "../src/authoring/equation-series-common-denominator-authoring.ts";
import { compileKpEquationTransformSeries } from
  "../src/authoring/compile-equation-transform-series.ts";
import { bindKpEquationSeriesGovernedRequest } from
  "../src/authoring/equation-series-governed-source-binding.ts";
import { kpEquationSeriesGovernedAuthoringRegistry } from
  "../src/authoring/equation-series-governed-authoring-registry.ts";
import { kpEquationSeriesOperationRegistry } from
  "../src/authoring/equation-series-operation-declarations.ts";
import { normalizeKpEquationSeriesOperationId } from
  "../src/authoring/equation-series-operation-alias-registry.ts";
import { createKpEquationSeriesPlannerPrompt } from
  "../src/authoring/equation-series-natural-language-planner-port.ts";
import type { KpEquationTransformSeriesRequest } from
  "../src/authoring/equation-transform-series-request.ts";
import { kpCanonicalCommonDenominatorAlignment } from
  "../src/semantic/fraction-common-denominator.ts";

const adjacencyId = "adjacency.common-denominator.canonical";
const source = createKpEquationSeriesCommonDenominatorSemanticSource({
  sourceId: "source.common-denominator.canonical",
  revisionId: "revision.common-denominator.canonical.v1",
  adjacencyId,
  transformation: kpCanonicalCommonDenominatorAlignment
});

test("planner sees one canonical name while source aliases normalize", () => {
  const prompt = createKpEquationSeriesPlannerPrompt({
    request: proposedRequest(),
    naturalLanguageIntent: "Give both fractions denominator six."
  });
  const visible = prompt.operations.filter(({ operationId }) =>
    operationId === KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID
  );

  assert.equal(visible.length, 1);
  assert.match(visible[0]!.summary, /caller-supplied common denominator/u);
  KP_COMMON_DENOMINATOR_SOURCE_OPERATION_ALIASES.forEach((operationId) => {
    assert.equal(prompt.operations.some((entry) =>
      entry.operationId === operationId
    ), false);
    assert.deepEqual(normalizeKpEquationSeriesOperationId({ operationId }), {
      status: "alias",
      requestedOperationId: operationId,
      canonicalOperationId: KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID
    });
  });
});

test("common denominator alignment is one governed registered operation", () => {
  const declaration = kpEquationSeriesOperationRegistry.byId[
    KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID
  ];

  assert.ok(declaration);
  assert.equal(declaration.source, "governed-operation");
  assert.equal(declaration.plannerExposure.kind, "exposed");
  assert.equal(
    declaration.governed?.authoringAuthorityId,
    KP_COMMON_DENOMINATOR_EQUATION_SERIES_AUTHORING_AUTHORITY
  );
  assert.deepEqual(
    declaration.governed?.operationPin,
    KP_COMMON_DENOMINATOR_AUTHORING_PACK_PIN
  );
  assert.deepEqual(
    declaration.roleIds,
    kpEquationSeriesCommonDenominatorAuthoringDeclaration.roleIds
  );
  assert.deepEqual(declaration.recipeIds, []);
  assert.deepEqual(declaration.canonicalComposition, [
    KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID
  ]);
  assert.equal(kpEquationSeriesGovernedAuthoringRegistry.some(
    ({ operationIds }) => operationIds.includes(
      KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID
    )), true);
});

test("sealed alignment source binds planner selection and exact endpoints", () => {
  const request = proposedRequest();
  const bound = bindKpEquationSeriesGovernedRequest({
    request,
    proposals: [{
      adjacencyId,
      kind: "single",
      operationId: KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID
    }],
    sources: [source]
  });

  assert.equal(bound.status, "bound");
  if (bound.status !== "bound") return;
  const result = compileKpEquationTransformSeries({
    value: bound.request,
    governedSources: [source]
  });
  assert.equal(result.status, "compiled");
  assert.equal(
    result.active?.runtime.plans[0]?.operationId,
    KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID
  );
  const intent = bound.request.adjacencies[0]!.intent;
  assert.equal(intent.mode, "explicit");
  assert.equal(JSON.stringify(intent).includes("durationMs"), false);
});

test("alignment adjacency cannot hide numeric evaluation", () => {
  const request = proposedRequest();
  const bound = bindKpEquationSeriesGovernedRequest({
    request,
    proposals: [{
      adjacencyId,
      kind: "single",
      operationId: KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID
    }],
    sources: [source]
  });
  assert.equal(bound.status, "bound");
  if (bound.status !== "bound") return;
  const directTarget = {
    ...bound.request,
    states: [
      bound.request.states[0],
      { ...bound.request.states[1], latex: "\\frac{2}{6}+\\frac{1}{6}" }
    ]
  } as KpEquationTransformSeriesRequest;
  const result = compileKpEquationTransformSeries({
    value: directTarget,
    governedSources: [source]
  });
  assert.equal(result.status, "repair-required");
  assert.equal(result.repairs[0]?.kind, "semantic-source");
});

test("alignment and numeric evaluation compile as distinct adjacencies", () => {
  const request = composedRequest();
  const bound = bindKpEquationSeriesGovernedRequest({
    request,
    proposals: [{
      adjacencyId,
      kind: "single",
      operationId: KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID
    }, {
      adjacencyId: "adjacency.common-denominator.evaluate-products",
      kind: "single",
      operationId: "kp.algebra.simplify-constant-product"
    }],
    sources: [source]
  });

  assert.equal(bound.status, "bound");
  if (bound.status !== "bound") return;
  const result = compileKpEquationTransformSeries({
    value: bound.request,
    governedSources: [source]
  });
  assert.equal(result.status, "compiled");
  assert.deepEqual(result.active?.runtime.plans.map(({ operationId }) =>
    operationId
  ), [
    KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID,
    "kp.algebra.simplify-constant-product"
  ]);
});

test("missing or forged alignment authority fails closed", () => {
  const request = proposedRequest();
  const proposal = [{
    adjacencyId,
    kind: "single" as const,
    operationId: KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID
  }];
  assert.equal(bindKpEquationSeriesGovernedRequest({
    request,
    proposals: proposal,
    sources: []
  }).status, "repair-required");
  assert.throws(() => createKpEquationSeriesCommonDenominatorSemanticSource({
    sourceId: "source.common-denominator.forged",
    revisionId: "revision.common-denominator.forged.v1",
    adjacencyId,
    transformation: { ...kpCanonicalCommonDenominatorAlignment }
  }), /requires verified authority/u);
});

function proposedRequest(): KpEquationTransformSeriesRequest {
  const transformation = kpCanonicalCommonDenominatorAlignment;
  return {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: "series.common-denominator.canonical.v1",
    states: [{
      id: transformation.source.stateId,
      latex: "\\frac{1}{3}+\\frac{1}{6}"
    }, {
      id: transformation.target.stateId,
      latex: "\\frac{2*1}{2*3}+\\frac{1}{6}"
    }],
    adjacencies: [{
      id: adjacencyId,
      fromStateId: transformation.source.stateId,
      toStateId: transformation.target.stateId,
      intent: {
        mode: "proposed",
        instruction: "Align both fractions to sixths."
      }
    }]
  };
}

function composedRequest(): KpEquationTransformSeriesRequest {
  const request = proposedRequest();
  const evaluatedStateId = "state.fraction.common-denominator.evaluated";
  return {
    ...request,
    id: "series.common-denominator.composed.v1",
    states: [
      request.states[0],
      request.states[1],
      {
        id: evaluatedStateId,
        latex: "\\frac{2}{6}+\\frac{1}{6}"
      }
    ],
    adjacencies: [
      request.adjacencies[0]!,
      {
        id: "adjacency.common-denominator.evaluate-products",
        fromStateId: request.states[1]!.id,
        toStateId: evaluatedStateId,
        intent: {
          mode: "proposed",
          instruction: "Evaluate the numerator and denominator products."
        }
      }
    ]
  };
}
