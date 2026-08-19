import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileNaturalLanguageKpEquationSeries } from
  "../src/authoring/compile-natural-language-equation-series.ts";
import {
  kpEquationSeriesBothSidesAuthoringDeclarations,
  type KpEquationSeriesVerifiedSemanticSource
} from "../src/authoring/equation-series-both-sides-authoring.ts";
import {
  createKpEquationSeriesGovernedSourceBindingRegistry,
  kpEquationSeriesGovernedSourceBindingRegistry
} from "../src/authoring/equation-series-governed-source-binding.ts";
import {
  createKpEquationSeriesLogarithmBaseSemanticSource,
  KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID
} from "../src/authoring/equation-series-logarithm-base-authoring.ts";
import type { KpEquationSeriesNaturalLanguagePlannerPort } from
  "../src/authoring/equation-series-natural-language-planner-port.ts";
import type { KpEquationTransformSeriesRequest } from
  "../src/authoring/equation-transform-series-request.ts";
import { kpCanonicalLogarithmChangeOfBase } from
  "../src/semantic/logarithm-change-of-base.ts";

test("natural language compiles through one deterministic orchestration seam", async () => {
  const request = proposedRequest({
    id: "series.orchestration.wrap.v1",
    beforeId: "state.orchestration.wrap.before",
    beforeLatex: "x",
    afterId: "state.orchestration.wrap.after",
    afterLatex: "\\ln(x)",
    adjacencyId: "adjacency.orchestration.wrap"
  });
  const result = await compileNaturalLanguageKpEquationSeries({
    request,
    naturalLanguageIntent: "Wrap x in the natural logarithm.",
    planner: planner(request, "kp.algebra.wrap-function")
  });
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  assert.equal(result.boundRequest?.adjacencies[0]?.intent.mode, "explicit");
  assert.equal(result.compilation.active?.runtime.plans[0]?.operationId,
    "kp.algebra.wrap-function");
});

test("balanced operations receive exact source arguments outside the model", async () => {
  const declaration = kpEquationSeriesBothSidesAuthoringDeclarations.find(
    ({ registrationId }) => registrationId === "addBothSides"
  )!;
  const request = proposedRequest({
    id: "series.orchestration.balanced.v1",
    beforeId: "state.orchestration.balanced.before",
    beforeLatex: "x=3",
    afterId: "state.orchestration.balanced.after",
    afterLatex: "x+2=5",
    adjacencyId: "adjacency.orchestration.balanced"
  });
  const source = balancedSource(request, declaration.operationId,
    declaration.requiredAssumptionEvidenceIds);
  const result = await compileNaturalLanguageKpEquationSeries({
    request,
    naturalLanguageIntent: "Add two to both sides.",
    planner: planner(request, declaration.operationId),
    governedSources: [source]
  });
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  const intent = result.boundRequest?.adjacencies[0]?.intent;
  assert.equal(intent?.mode, "explicit");
  assert.equal(JSON.stringify(intent).includes(source.sourceId), true);
  assert.equal(JSON.stringify(result.plannerRecord)
    .includes("semanticArguments"), false);
});

test("change of base binds branded truth and exact correspondences", async () => {
  const transformation = kpCanonicalLogarithmChangeOfBase;
  const request = proposedRequest({
    id: "series.orchestration.change-base.v1",
    beforeId: transformation.source.stateId,
    beforeLatex: "\\log_2(7)",
    afterId: transformation.target.stateId,
    afterLatex: "\\frac{\\ln(7)}{\\ln(2)}",
    adjacencyId: "adjacency.orchestration.change-base"
  });
  const source = createKpEquationSeriesLogarithmBaseSemanticSource({
    sourceId: "source.orchestration.change-base",
    revisionId: "revision.orchestration.change-base.v1",
    adjacencyId: request.adjacencies[0]!.id,
    transformation
  });
  const result = await compileNaturalLanguageKpEquationSeries({
    request,
    naturalLanguageIntent: "Rewrite the logarithm using natural logs.",
    planner: planner(request, KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID),
    governedSources: [source]
  });
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  assert.deepEqual(
    (result.boundRequest?.adjacencies[0]?.intent as {
      semanticArguments?: { correspondenceIds?: readonly string[] };
    }).semanticArguments?.correspondenceIds,
    transformation.correspondence.map(({ id }) => id)
  );
});

test("unsupported and missing-source outcomes never compile invented truth", async () => {
  const request = proposedRequest({
    id: "series.orchestration.unsupported.v1",
    beforeId: "state.orchestration.unsupported.before",
    beforeLatex: "x=3",
    afterId: "state.orchestration.unsupported.after",
    afterLatex: "x+2=5",
    adjacencyId: "adjacency.orchestration.unsupported"
  });
  const unsupported = await compileNaturalLanguageKpEquationSeries({
    request,
    naturalLanguageIntent: "Perform an unavailable operation.",
    planner: unsupportedPlanner(request)
  });
  assert.equal(unsupported.status, "unsupported");
  assert.equal("compilation" in unsupported, false);

  const declaration = kpEquationSeriesBothSidesAuthoringDeclarations.find(
    ({ registrationId }) => registrationId === "addBothSides"
  )!;
  const missingSource = await compileNaturalLanguageKpEquationSeries({
    request,
    naturalLanguageIntent: "Add two to both sides.",
    planner: planner(request, declaration.operationId)
  });
  assert.equal(missingSource.status, "repair-required");
  if (missingSource.status !== "repair-required") return;
  assert.equal(missingSource.compilation.repairs[0]?.kind, "semantic-source");
  assert.equal(missingSource.compilation.active, undefined);
});

test("governed binders reject duplicate owners and remain renderer neutral", () => {
  const binder = kpEquationSeriesGovernedSourceBindingRegistry.binders[0]!;
  assert.throws(() => createKpEquationSeriesGovernedSourceBindingRegistry([
    binder,
    { ...binder, id: "binding.duplicate" }
  ]), /Duplicate governed source binder/u);
  const source = readFileSync(new URL(
    "../src/authoring/equation-series-governed-source-binding.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source, /switch\s*\(/u);
  assert.doesNotMatch(source,
    /(?:\.svelte|HTMLElement|SVGElement|WebGL|requestAnimationFrame|setTimeout)/u);
});

function proposedRequest(input: {
  readonly id: string;
  readonly beforeId: string;
  readonly beforeLatex: string;
  readonly afterId: string;
  readonly afterLatex: string;
  readonly adjacencyId: string;
}): KpEquationTransformSeriesRequest {
  return {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: input.id,
    states: [{ id: input.beforeId, latex: input.beforeLatex }, {
      id: input.afterId,
      latex: input.afterLatex
    }],
    adjacencies: [{
      id: input.adjacencyId,
      fromStateId: input.beforeId,
      toStateId: input.afterId,
      intent: { mode: "proposed", instruction: "Select one operation." }
    }]
  };
}

function planner(
  request: KpEquationTransformSeriesRequest,
  operationId: string
): KpEquationSeriesNaturalLanguagePlannerPort {
  return {
    id: "planner.orchestration.fixture.v1",
    propose: async () => ({
      schemaVersion: "kp.equation-series-planner-record.v1",
      kind: "equation-series-planner-record",
      requestId: request.id,
      plannerId: "planner.orchestration.fixture.v1",
      status: "proposed",
      proposals: [{
        adjacencyId: request.adjacencies[0]!.id,
        kind: "single",
        operationId
      }],
      diagnostics: []
    })
  };
}

function unsupportedPlanner(
  request: KpEquationTransformSeriesRequest
): KpEquationSeriesNaturalLanguagePlannerPort {
  return {
    id: "planner.orchestration.unsupported.v1",
    propose: async () => ({
      schemaVersion: "kp.equation-series-planner-record.v1",
      kind: "equation-series-planner-record",
      requestId: request.id,
      plannerId: "planner.orchestration.unsupported.v1",
      status: "unsupported",
      reason: "No registered operation represents the request.",
      unsupportedAdjacencyIds: [request.adjacencies[0]!.id],
      diagnostics: []
    })
  };
}

function balancedSource(
  request: KpEquationTransformSeriesRequest,
  operationId: string,
  assumptionEvidenceIds: readonly string[]
): KpEquationSeriesVerifiedSemanticSource {
  return {
    sourceId: "source.orchestration.balanced",
    revisionId: "revision.orchestration.balanced.v1",
    operationIds: [operationId],
    entityIds: [
      "entity.orchestration.lhs",
      "entity.orchestration.rhs",
      "entity.orchestration.relation",
      "entity.orchestration.operation"
    ],
    assumptionEvidenceIds: [...assumptionEvidenceIds],
    adjacencyEvidence: [{
      adjacencyId: request.adjacencies[0]!.id,
      fromStateId: request.states[0].id,
      toStateId: request.states[1].id,
      correspondenceIds: [
        "correspondence.orchestration.lhs",
        "correspondence.orchestration.rhs",
        "correspondence.orchestration.relation",
        "correspondence.orchestration.operation"
      ],
      roleBindings: {
        lhs: ["entity.orchestration.lhs"],
        rhs: ["entity.orchestration.rhs"],
        relation: ["entity.orchestration.relation"],
        "applied-operation": ["entity.orchestration.operation"]
      }
    }]
  };
}
