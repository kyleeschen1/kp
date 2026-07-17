import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateKpAnimationPerformance,
  initialScriptTransferBytes,
  type KpAnimationPerformanceBaseline,
  type KpAnimationPerformanceSnapshot
} from "../src/animation/performance-budget.ts";

const snapshot: KpAnimationPerformanceSnapshot = {
  capturedAt: "2026-07-17T00:00:00.000Z",
  artifacts: {
    entryScriptBytes: 1_531_626,
    entryScriptGzipBytes: 360_390,
    threeScriptBytes: 525_577,
    threeScriptGzipBytes: 132_200
  },
  normal: runtime(),
  constrained: runtime({ hydrationMs: 3_400, frameP95Ms: 32 })
};

const baseline: KpAnimationPerformanceBaseline = {
  schemaVersion: "kp.animation-performance-baseline.v1",
  snapshot,
  regressionAllowance: {
    artifactRatio: 1.05,
    transferRatio: 1.1
  }
};

test("performance evaluation separates regression gates from product targets", () => {
  const issues = evaluateKpAnimationPerformance({ snapshot, baseline });

  assert.equal(issues.some((issue) => issue.severity === "regression"), false);
  assert.deepEqual(
    issues.filter((issue) => issue.severity === "target").map((issue) => issue.metric),
    ["normal.initialScriptTransferBytes.target", "normal.initialThreeRequested"]
  );
  assert.equal(initialScriptTransferBytes(snapshot), 489_079);
});

test("performance evaluation detects artifact and transfer regressions", () => {
  const regressed: KpAnimationPerformanceSnapshot = {
    ...snapshot,
    artifacts: {
      ...snapshot.artifacts,
      entryScriptGzipBytes: 400_000
    },
    normal: {
      ...snapshot.normal,
      initialScriptTransferBytes: 600_000
    }
  };

  const regressions = evaluateKpAnimationPerformance({
    snapshot: regressed,
    baseline
  }).filter((issue) => issue.severity === "regression");

  assert.deepEqual(
    regressions.map((issue) => issue.metric),
    ["artifacts.entryScriptGzipBytes", "normal.initialScriptTransferBytes"]
  );
});

test("runtime transfer accounts for every lazy initial capability chunk", () => {
  const lazy: KpAnimationPerformanceSnapshot = {
    ...snapshot,
    normal: {
      ...snapshot.normal,
      initialScriptTransferBytes: 358_256,
      initialScriptNames: ["index-current.js"]
    }
  };

  assert.equal(initialScriptTransferBytes(lazy), 358_256);
});

test("performance evaluation gates diagnostics below the frame loop", () => {
  const chatty: KpAnimationPerformanceSnapshot = {
    ...snapshot,
    constrained: {
      ...snapshot.constrained,
      matrixFrame: {
        ...snapshot.constrained.matrixFrame,
        diagnosticPublishes: 41,
        inspectionPublishes: 42
      }
    }
  };

  assert.deepEqual(
    evaluateKpAnimationPerformance({ snapshot: chatty, baseline })
      .filter((issue) => issue.metric.includes("Publishes"))
      .map((issue) => issue.metric),
    [
      "constrained.matrixFrame.diagnosticPublishes",
      "constrained.matrixFrame.inspectionPublishes"
    ]
  );
});

function runtime(options: {
  readonly hydrationMs?: number;
  readonly frameP95Ms?: number;
} = {}) {
  return {
    hydrationMs: options.hydrationMs ?? 800,
    initialScriptTransferBytes: 489_079,
    initialFontTransferBytes: 56_028,
    initialScriptNames: ["index-current.js", "graph-webgl-three-current.js"],
    matrixFrame: {
      frames: 180,
      meanMs: 16.67,
      p95Ms: options.frameP95Ms ?? 16.8,
      p99Ms: 17.5,
      maxMs: 18,
      over33Ms: 0,
      longestTaskMs: 0
    }
  };
}
