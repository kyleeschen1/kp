import assert from "node:assert/strict";
import test from "node:test";

import { compileKpEquationTransformSeries } from
  "../src/authoring/compile-equation-transform-series.ts";
import {
  KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID,
  KP_LIKE_DENOMINATOR_AUTHORING_PACK_PIN,
  KP_LIKE_DENOMINATOR_EQUATION_SERIES_AUTHORING_AUTHORITY,
  createKpEquationSeriesLikeDenominatorSemanticSource,
  kpEquationSeriesLikeDenominatorAuthoringDeclaration
} from "../src/authoring/equation-series-like-denominator-authoring.ts";
import { bindKpEquationSeriesGovernedRequest } from
  "../src/authoring/equation-series-governed-source-binding.ts";
import { kpEquationSeriesGovernedAuthoringRegistry } from
  "../src/authoring/equation-series-governed-authoring-registry.ts";
import { kpEquationSeriesOperationRegistry } from
  "../src/authoring/equation-series-operation-declarations.ts";
import { createKpEquationSeriesPlannerPrompt } from
  "../src/authoring/equation-series-natural-language-planner-port.ts";
import type { KpEquationTransformSeriesRequest } from
  "../src/authoring/equation-transform-series-request.ts";
import { kpCanonicalLikeDenominatorCombination } from
  "../src/semantic/fraction-like-denominator-combination.ts";

const adjacencyId = "adjacency.like-denominator.canonical";
const source = createKpEquationSeriesLikeDenominatorSemanticSource({
  sourceId: "source.like-denominator.canonical",
  revisionId: "revision.like-denominator.canonical.v1",
  adjacencyId,
  transformation: kpCanonicalLikeDenominatorCombination
});

test("planner exposes one governed renderer-neutral combination", () => {
  const prompt = createKpEquationSeriesPlannerPrompt({
    request: proposedRequest(),
    naturalLanguageIntent: "Combine the fractions with denominator six."
  });
  const visible = prompt.operations.filter(({ operationId }) =>
    operationId === KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID
  );
  assert.equal(visible.length, 1);
  assert.match(visible[0]!.summary, /raw, unreduced result/u);

  const declaration = kpEquationSeriesOperationRegistry.byId[
    KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID
  ];
  assert.equal(declaration?.source, "governed-operation");
  assert.equal(
    declaration?.governed?.authoringAuthorityId,
    KP_LIKE_DENOMINATOR_EQUATION_SERIES_AUTHORING_AUTHORITY
  );
  assert.deepEqual(
    declaration?.governed?.operationPin,
    KP_LIKE_DENOMINATOR_AUTHORING_PACK_PIN
  );
  assert.deepEqual(
    declaration?.roleIds,
    kpEquationSeriesLikeDenominatorAuthoringDeclaration.roleIds
  );
  assert.deepEqual(declaration?.recipeIds, []);
  assert.equal(kpEquationSeriesGovernedAuthoringRegistry.some(
    ({ operationIds }) => operationIds.includes(
      KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID
    )), true);
});

test("sealed combination source binds and compiles exact LaTeX endpoints", () => {
  const request = proposedRequest();
  const bound = bindKpEquationSeriesGovernedRequest({
    request,
    proposals: [{
      adjacencyId,
      kind: "single",
      operationId: KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID
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
    KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID
  );
  assert.equal(JSON.stringify(bound.request).includes("durationMs"), false);
});

test("hidden reduction and missing or forged source fail closed", () => {
  const request = proposedRequest();
  const proposal = [{
    adjacencyId,
    kind: "single" as const,
    operationId: KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID
  }];
  assert.equal(bindKpEquationSeriesGovernedRequest({
    request,
    proposals: proposal,
    sources: []
  }).status, "repair-required");
  assert.throws(() => createKpEquationSeriesLikeDenominatorSemanticSource({
    sourceId: "source.like-denominator.forged",
    revisionId: "revision.like-denominator.forged.v1",
    adjacencyId,
    transformation: { ...kpCanonicalLikeDenominatorCombination }
  }), /requires verified authority/u);

  const bound = bindKpEquationSeriesGovernedRequest({
    request,
    proposals: proposal,
    sources: [source]
  });
  assert.equal(bound.status, "bound");
  if (bound.status !== "bound") return;
  const reduced = {
    ...bound.request,
    states: [
      bound.request.states[0],
      { ...bound.request.states[1], latex: "\\frac{1}{2}" }
    ]
  } as KpEquationTransformSeriesRequest;
  const result = compileKpEquationTransformSeries({
    value: reduced,
    governedSources: [source]
  });
  assert.equal(result.status, "repair-required");
  assert.equal(result.repairs[0]?.kind, "semantic-source");
});

function proposedRequest(): KpEquationTransformSeriesRequest {
  const transformation = kpCanonicalLikeDenominatorCombination;
  return {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: "series.like-denominator.canonical.v1",
    states: [{
      id: transformation.source.stateId,
      latex: "\\frac{2}{6}+\\frac{1}{6}"
    }, {
      id: transformation.target.stateId,
      latex: "\\frac{3}{6}"
    }],
    adjacencies: [{
      id: adjacencyId,
      fromStateId: transformation.source.stateId,
      toStateId: transformation.target.stateId,
      intent: {
        mode: "proposed",
        instruction: "Combine the fractions without reducing the result."
      }
    }]
  };
}
