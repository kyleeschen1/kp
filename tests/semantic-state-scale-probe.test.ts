import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import process from "node:process";
import test from "node:test";

import { runKpSemanticStateScaleProbe } from
  "./fixtures/semantic-state-authoring/scale-probe.ts";

test("the representative semantic graph stays selective and shared", (t) => {
  const result = runKpSemanticStateScaleProbe({
    now: () => performance.now(),
    memoryBytes: () => process.memoryUsage().heapUsed
  });

  assert.deepEqual(result.counts, {
    concreteLeaves: 128,
    derivedLeaves: 64,
    graphDefinitions: 64,
    graphEdges: 184,
    changes: 16,
    operations: 16,
    snapshots: 17
  });
  assert.deepEqual(result.sharing.entityStoresPerChange, Array(16).fill(127));
  assert.deepEqual(result.sharing.bindingsPerChange, Array(16).fill(127));
  assert.deepEqual(
    result.sharing.derivedBindingsPerChange,
    Array(16).fill(64)
  );
  assert.deepEqual(result.evaluation.computeCallsByChain, [
    16, 16, 16, 16, 16, 16, 16, 8
  ]);
  assert.deepEqual(result.evaluation.cache, {
    schemaVersion: "kp.semantic-derived-cache-stats.v1",
    kind: "semantic-derived-cache-stats",
    status: "active",
    entries: 120,
    hits: 1,
    misses: 120
  });
  assert.deepEqual(
    result.evaluation.finalTerminalValues.map((value, index) =>
      value - requireValue(result.evaluation.initialTerminalValues[index])
    ),
    [3, 3, 2, 2, 2, 2, 2, 0]
  );
  assert.equal(Number.isFinite(result.advisory.elapsedMilliseconds), true);
  assert.equal(Number.isFinite(result.advisory.memoryDeltaBytes), true);
  t.diagnostic(
    `advisory elapsed=${result.advisory.elapsedMilliseconds.toFixed(2)}ms ` +
    `heapDelta=${result.advisory.memoryDeltaBytes}B`
  );
});

function requireValue(value: number | undefined): number {
  if (value === undefined) throw new Error("Missing terminal scale value.");
  return value;
}
