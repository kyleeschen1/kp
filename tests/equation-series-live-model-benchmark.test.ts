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
    repetitionCount: 1,
    port: {
      id: plannerId,
      modelId: "model.fake.perfect.v1",
      propose: async () => fixtureBatch(
        kpEquationSeriesLiveModelBenchmarkCases.map(perfectRecord),
        "perfect"
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
    repetitionCount: 1,
    cases: [unsupported],
    port: {
      id: plannerId,
      modelId: "model.fake.false-positive.v1",
      propose: async () => fixtureBatch([proposedRecord(unsupported, [
        "kp.algebra.wrap-function"
      ])], "false-positive")
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
    repetitionCount: 1,
    cases: [wrap],
    port: {
      id: plannerId,
      modelId: "model.fake.authority-attempt.v1",
      propose: async () => fixtureBatch([{
        ...candidate,
        proposals: [{
          ...candidate.proposals[0],
          semanticArguments: { wrapper: "ln" },
          durationMs: 800
        }]
      }], "authority-attempt")
    }
  });

  assert.equal(report.status, "failed");
  assert.equal(report.metrics.authorityAttemptCount, 2);
  assert.equal(report.cases[0]?.plannerStatus, "repair-required");
  assert.equal(report.cases[0]?.compilationStatus, "not-run");
});

test("provider failure becomes bounded benchmark evidence", async () => {
  const report = await runKpEquationSeriesLiveModelBenchmark({
    repetitionCount: 1,
    cases: [kpEquationSeriesLiveModelBenchmarkCases[0]!],
    port: {
      id: plannerId,
      modelId: "model.fake.offline.v1",
      propose: async () => { throw new Error("offline"); }
    }
  });

  assert.equal(report.status, "failed");
  assert.deepEqual(report.providerErrors, [{
    repetitionIndex: 1,
    message: "offline"
  }]);
  assert.deepEqual(report.cases[0]?.plannerDiagnosticCodes,
    ["equation-series.planner.record.type"]);
});

test("reports explicit repeated-run prompt and raw-response provenance", async () => {
  const seen: Array<Readonly<{
    repetitionIndex: number;
    promptFingerprint: string;
  }>> = [];
  const report = await runKpEquationSeriesLiveModelBenchmark({
    repetitionCount: 3,
    cases: [kpEquationSeriesLiveModelBenchmarkCases[0]!],
    port: {
      id: plannerId,
      modelId: "model.fake.repeated.v1",
      propose: async ({ repetitionIndex, promptFingerprint }) => {
        seen.push({ repetitionIndex, promptFingerprint });
        return fixtureBatch([
          perfectRecord(kpEquationSeriesLiveModelBenchmarkCases[0]!)
        ], `repeat-${repetitionIndex}`);
      }
    }
  });
  assert.equal(report.status, "passed");
  assert.equal(report.modelId, "model.fake.repeated.v1");
  assert.equal(report.repetitionCount, 3);
  assert.match(report.promptFingerprint, /^fnv1a64:[0-9a-f]{16}$/u);
  assert.deepEqual(seen.map(({ repetitionIndex }) => repetitionIndex),
    [1, 2, 3]);
  assert.equal(new Set(seen.map(({ promptFingerprint }) =>
    promptFingerprint)).size, 1);
  assert.deepEqual(report.rawResponseProvenance.map((entry) => ({
    repetitionIndex: entry.repetitionIndex,
    kind: entry.kind,
    locator: entry.locator
  })), [1, 2, 3].map((repetitionIndex) => ({
    repetitionIndex,
    kind: "fixture",
    locator: `fixture://repeat-${repetitionIndex}`
  })));
  assert.equal(report.metrics.caseCount, 3);
  assert.deepEqual(report.cases.map(({ repetitionIndex }) => repetitionIndex),
    [1, 2, 3]);
});

test("missing model repetition or raw provenance fails closed", async () => {
  const benchmarkCase = kpEquationSeriesLiveModelBenchmarkCases[0]!;
  await assert.rejects(() => runKpEquationSeriesLiveModelBenchmark({
    repetitionCount: 1,
    cases: [benchmarkCase],
    port: {
      id: plannerId,
      modelId: "",
      propose: async () => fixtureBatch([perfectRecord(benchmarkCase)], "x")
    }
  }), /explicit model ID/u);
  await assert.rejects(() => runKpEquationSeriesLiveModelBenchmark({
    repetitionCount: 0,
    cases: [benchmarkCase],
    port: {
      id: plannerId,
      modelId: "model.fake.invalid-repetitions.v1",
      propose: async () => fixtureBatch([perfectRecord(benchmarkCase)], "x")
    }
  }), /repetitions/u);
  const provenanceFailure = await runKpEquationSeriesLiveModelBenchmark({
    repetitionCount: 1,
    cases: [benchmarkCase],
    port: {
      id: plannerId,
      modelId: "model.fake.no-provenance.v1",
      propose: async () => ({
        candidates: [perfectRecord(benchmarkCase)],
        rawResponseProvenance: {
          kind: "fixture",
          locator: "",
          contentFingerprint: ""
        }
      })
    }
  });
  assert.equal(provenanceFailure.status, "failed");
  assert.match(provenanceFailure.providerErrors[0]?.message ?? "",
    /raw-response provenance/u);
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
    reason: "No supplied semantic operation represents this adjacency.",
    unsupportedAdjacencyIds: entry.request.adjacencies.map(({ id }) => id),
    diagnostics: []
  };
}

function fixtureBatch(candidates: readonly unknown[], label: string) {
  return {
    candidates,
    rawResponseProvenance: {
      kind: "fixture" as const,
      locator: `fixture://${label}`,
      contentFingerprint: `fixture:${label}`
    }
  };
}
