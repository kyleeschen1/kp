import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpReaderRouteBudget,
  groupKpReaderSharedRuntimeClosures,
  kpReaderRouteBudgetGrowthPermille,
  measureKpReaderRouteBudgetDeltas,
  type KpReaderRouteBudgetInspection,
  type KpReaderRouteBudgetMeasurement
} from "./check-reader-route-budgets.ts";

const baseline = {
  compiledHtmlRawBytes: 10_000,
  compiledHtmlGzipBytes: 2_000,
  runtimeCodeGzipBytes: 40_000
} as const;

test("reader route budget accepts every metric at the approved five-percent boundary", () => {
  assert.equal(kpReaderRouteBudgetGrowthPermille, 50);
  assert.deepEqual(checkKpReaderRouteBudget({
    route: "/reader/test/",
    budget: baseline,
    measurement: measurement({
      compiledHtmlRawBytes: 10_500,
      compiledHtmlGzipBytes: 2_100,
      runtimeCodeGzipBytes: 42_000
    })
  }), []);
});

test("reader route budget reports each independently regressed metric", () => {
  const issues = checkKpReaderRouteBudget({
    route: "/reader/test/",
    budget: baseline,
    measurement: measurement({
      compiledHtmlRawBytes: 10_501,
      compiledHtmlGzipBytes: 2_101,
      runtimeCodeGzipBytes: 42_001
    })
  });
  assert.deepEqual(issues.map((issue) => issue.metric), [
    "compiledHtmlRawBytes",
    "compiledHtmlGzipBytes",
    "runtimeCodeGzipBytes"
  ]);
  assert.ok(issues.every((issue) => issue.route === "/reader/test/"));
  assert.deepEqual(issues.map((issue) => issue.deltaBytes), [1, 1, 1]);
  assert.deepEqual(measureKpReaderRouteBudgetDeltas({
    budget: baseline,
    measurement: measurement({
      compiledHtmlRawBytes: 10_501,
      compiledHtmlGzipBytes: 2_101,
      runtimeCodeGzipBytes: 42_001
    })
  }), {
    compiledHtmlRawBytes: 1,
    compiledHtmlGzipBytes: 1,
    runtimeCodeGzipBytes: 1
  });
});

test("reader route budget rejects unrelated learner assets below the byte cap", () => {
  const issues = checkKpReaderRouteBudget({
    route: "/reader/test/",
    budget: baseline,
    measurement: {
      ...measurement(baseline),
      runtimeFiles: ["assets/graph-webgl-three-small.js"]
    }
  });
  assert.deepEqual(issues.map((issue) => issue.metric), ["forbiddenRuntimeAsset"]);
});

test("reader attribution groups identical shared closures with route deltas", () => {
  const files = [{ file: "assets/shared-reader.js", gzipBytes: 42_001 }];
  const sharedMeasurement: KpReaderRouteBudgetMeasurement = {
    ...measurement({
      compiledHtmlRawBytes: 10_000,
      compiledHtmlGzipBytes: 2_000,
      runtimeCodeGzipBytes: 42_001
    }),
    runtimeFiles: ["assets/shared-reader.js"],
    runtimeFileAttribution: files
  };
  const reports: readonly KpReaderRouteBudgetInspection[] = [
    inspection("/reader/z/", sharedMeasurement),
    inspection("/reader/a/", sharedMeasurement)
  ];

  assert.deepEqual(groupKpReaderSharedRuntimeClosures(reports), [{
    routes: [
      { route: "/reader/a/", deltaBytes: 1 },
      { route: "/reader/z/", deltaBytes: 1 }
    ],
    runtimeCodeGzipBytes: 42_001,
    files
  }]);
});

function measurement(
  input: Omit<
    KpReaderRouteBudgetMeasurement,
    "runtimeFiles" | "runtimeFileAttribution"
  >
): KpReaderRouteBudgetMeasurement {
  return {
    ...input,
    runtimeFiles: ["assets/reader.js"],
    runtimeFileAttribution: [{
      file: "assets/reader.js",
      gzipBytes: input.runtimeCodeGzipBytes
    }]
  };
}

function inspection(
  route: string,
  routeMeasurement: KpReaderRouteBudgetMeasurement
): KpReaderRouteBudgetInspection {
  return {
    route,
    measurement: routeMeasurement,
    deltas: measureKpReaderRouteBudgetDeltas({
      budget: baseline,
      measurement: routeMeasurement
    }),
    issues: []
  };
}
