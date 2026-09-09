import assert from "node:assert/strict";
import test from "node:test";
import { readKpCommonFactorSource } from "../src/authoring/common-factor-source.ts";
import { normalizeKpCommonFactorEndpoints } from "../src/authoring/common-factor-normalizer.ts";
import { verifyKpCommonFactorRewrite } from "../src/semantic/common-factor-rewrite.ts";
import { createKpEquationSeriesCommonFactorSemanticSource, bindKpEquationSeriesCommonFactorSource, KP_COMMON_FACTOR_OPERATION } from "../src/authoring/equation-series-common-factor-authoring.ts";
import { kpEquationSeriesOperationRegistry } from "../src/authoring/equation-series-operation-declarations.ts";
import { compileKpEquationTransformSeries } from "../src/authoring/compile-equation-transform-series.ts";

function fixture() {
  const raw = readKpCommonFactorSource({ schemaVersion: "kp.common-factor-source.v1", id: "lesson.test", domain: "real-scalars", symbols: ["a", "b", "c"],
    states: [{ id: "state.before", latex: "ab+ac", narration: "Expand" }, { id: "state.after", latex: "a(b+c)", narration: "Factor" }],
    editorial: { title: "Factor", setup: "Inspect", summary: "Group" } });
  const endpoints = normalizeKpCommonFactorEndpoints(raw);
  const proof = verifyKpCommonFactorRewrite({ domain: raw.domain, symbols: raw.symbols, source: endpoints[0].structured, target: endpoints[1].structured });
  const source = createKpEquationSeriesCommonFactorSemanticSource({ sourceId: raw.id, adjacencyId: "edge.factor", transformation: proof });
  const adjacency = { id: "edge.factor", fromStateId: "state.before", toStateId: "state.after", intent: { mode: "explicit" as const, operationId: KP_COMMON_FACTOR_OPERATION, semanticArguments: {} } };
  const declaration = kpEquationSeriesOperationRegistry.byId[KP_COMMON_FACTOR_OPERATION]!;
  const input = { adjacency, declaration, sources: [source], path: "$.adjacencies[0]" };
  const bound = bindKpEquationSeriesCommonFactorSource(input);
  assert.equal(bound.status, "bound");
  if (bound.status !== "bound") throw new Error("Expected verified binding");
  const request = { schemaVersion: "kp.equation-transform-series-request.v1", kind: "equation-transform-series-request", id: "series.factor.test",
    states: [{ id: "state.before", latex: "a*b+a*c" }, { id: "state.after", latex: "a*(b+c)" }],
    adjacencies: [{ ...adjacency, intent: { ...adjacency.intent, semanticArguments: bound.semanticArguments } }] };
  return { source, request, input };
}

test("registered common-factor governance compiles exact proof and rejects stale, foreign and forged evidence", () => {
  const { source, request, input } = fixture();
  const success = compileKpEquationTransformSeries({ value: request, governedSources: [source] });
  assert.equal(success.status, "compiled", JSON.stringify(success.repairs));
  const invalidSources = [
    [], [{ ...source }], [{ ...source, revisionId: "stale" }],
    [{ ...source, semanticContracts: [{ kind: "kp.semantic-contract.common-factor.v1", authority: { lawId: "kp.algebra.distribute.v1" } }] }],
    [{ ...source, adjacencyEvidence: [{ ...source.adjacencyEvidence![0]!, roleBindings: { "common-factor": ["foreign"] } }] }],
    [source, source]
  ];
  for (const sources of invalidSources) {
    const result = compileKpEquationTransformSeries({ value: request, governedSources: sources, previous: success });
    assert.equal(result.status, "repair-required");
    assert.equal(result.active, success.active);
    assert.equal(bindKpEquationSeriesCommonFactorSource({ ...input, sources }).status, "repair-required");
  }
  for (const latex of ["a*(b+d)", "a*(c+b)", "b*(b+c)"])
    assert.equal(compileKpEquationTransformSeries({ value: { ...request, states: [request.states[0], { ...request.states[1], latex }] }, governedSources: [source] }).status, "repair-required");
  const alteredAdjacency = { ...request.adjacencies[0], id: "edge.foreign" };
  assert.equal(compileKpEquationTransformSeries({ value: { ...request, adjacencies: [alteredAdjacency] }, governedSources: [source] }).status, "repair-required");
  const forgedArgs = { ...request.adjacencies[0]!, intent: { ...request.adjacencies[0]!.intent, semanticArguments: { proof: "trust me" } } };
  assert.equal(compileKpEquationTransformSeries({ value: { ...request, adjacencies: [forgedArgs] }, governedSources: [source] }).status, "repair-required");
});
