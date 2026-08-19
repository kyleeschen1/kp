import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  kpEquationSeriesLiveModelBenchmarkCases,
  runKpEquationSeriesLiveModelBenchmark,
  type KpEquationSeriesLiveModelBenchmarkCase
} from "../src/authoring/equation-series-live-model-benchmark.ts";

const plannerId = "planner.fake.live-benchmark.v1";

test("the fixed live corpus measures direct governed and unsupported planning", async () => {
  const report = await runKpEquationSeriesLiveModelBenchmark({
    port: {
      id: plannerId,
      modelId: "model.fake.perfect.v1",
      propose: async () => kpEquationSeriesLiveModelBenchmarkCases.map(
        perfectRecord
      )
    }
  });

  assert.equal(report.status, "passed");
  assert.deepEqual(report.metrics, {
    caseCount: 6,
    exactOperationSelections: 5,
    preservedAdjacencyIdentities: 5,
    explicitUnsupportedAbstentions: 1,
    repairCasesWithGuidance: 3,
    authorityAttemptCount: 0,
    compiledSelectionMismatchCount: 0,
    silentFallbackCount: 0
  });
  assert.deepEqual(report.cases.map(({ compilationStatus }) =>
    compilationStatus), [
    "compiled",
    "compiled",
    "compiled",
    "repair-required",
    "repair-required",
    "not-run"
  ]);
  assert.equal(report.cases.every(({ passed }) => passed), true);
});

test("a known operation applied to unsupported endpoints is a silent fallback", async () => {
  const unsupported = kpEquationSeriesLiveModelBenchmarkCases.at(-1)!;
  const report = await runKpEquationSeriesLiveModelBenchmark({
    cases: [unsupported],
    port: {
      id: plannerId,
      modelId: "model.fake.false-positive.v1",
      propose: async () => [proposedRecord(unsupported, [
        "kp.algebra.wrap-function"
      ])]
    }
  });

  assert.equal(report.status, "failed");
  assert.equal(report.metrics.silentFallbackCount, 1);
  assert.equal(report.cases[0]?.compilationStatus, "compiled");
  assert.equal(report.cases[0]?.exactOperationSelection, false);
});

test("model-authored presentation or semantic authority fails closed", async () => {
  const wrap = kpEquationSeriesLiveModelBenchmarkCases[0]!;
  const candidate = proposedRecord(wrap, ["kp.algebra.wrap-function"]);
  const report = await runKpEquationSeriesLiveModelBenchmark({
    cases: [wrap],
    port: {
      id: plannerId,
      modelId: "model.fake.authority-attempt.v1",
      propose: async () => [{
        ...candidate,
        proposals: [{
          ...candidate.proposals[0],
          semanticArguments: { wrapper: "ln" },
          durationMs: 800
        }]
      }]
    }
  });

  assert.equal(report.status, "failed");
  assert.equal(report.metrics.authorityAttemptCount, 2);
  assert.equal(report.cases[0]?.plannerStatus, "repair-required");
  assert.equal(report.cases[0]?.compilationStatus, "not-run");
});

test("provider failure becomes bounded benchmark evidence", async () => {
  const report = await runKpEquationSeriesLiveModelBenchmark({
    cases: [kpEquationSeriesLiveModelBenchmarkCases[0]!],
    port: {
      id: plannerId,
      modelId: "model.fake.offline.v1",
      propose: async () => { throw new Error("offline"); }
    }
  });

  assert.equal(report.status, "failed");
  assert.equal(report.providerError, "offline");
  assert.deepEqual(report.cases[0]?.plannerDiagnosticCodes,
    ["equation-series.planner.record.type"]);
});

test("the benchmark core remains model and framework neutral", () => {
  const source = readFileSync(new URL(
    "../src/authoring/equation-series-live-model-benchmark.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(
    source,
    /(?:codex|OpenAI|Anthropic|Gemini|fetch\(|spawn|src\/editor|\.svelte)/u
  );
});

function perfectRecord(entry: KpEquationSeriesLiveModelBenchmarkCase) {
  return entry.expectation.kind === "unsupported"
    ? unsupportedRecord(entry)
    : proposedRecord(entry, entry.expectation.operationIds);
}

function proposedRecord(
  entry: KpEquationSeriesLiveModelBenchmarkCase,
  operationIds: readonly string[]
) {
  return {
    schemaVersion: "kp.equation-series-planner-record.v1",
    kind: "equation-series-planner-record",
    requestId: entry.request.id,
    plannerId,
    status: "proposed",
    proposals: entry.request.adjacencies.map((adjacency, index) => ({
      adjacencyId: adjacency.id,
      kind: "single",
      operationId: operationIds[index]
    })),
    diagnostics: []
  };
}

function unsupportedRecord(entry: KpEquationSeriesLiveModelBenchmarkCase) {
  return {
    schemaVersion: "kp.equation-series-planner-record.v1",
    kind: "equation-series-planner-record",
    requestId: entry.request.id,
    plannerId,
    status: "unsupported",
    proposals: [],
    diagnostics: []
  };
}
