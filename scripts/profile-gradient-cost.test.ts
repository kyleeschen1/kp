import assert from "node:assert/strict";
import test from "node:test";
import { createCpuSourceLabel, summarizeGradientCpuProfile } from "./profile-gradient-cost.ts";

test("generated frames without maps remain explicitly attributed and path traversal is rejected", () => {
  const label = createCpuSourceLabel("tmp/codex/nonexistent-profile-output");
  assert.match(label({ functionName: "preload", url: "http://localhost:8000/assets/helper.js", lineNumber: 0, columnNumber: 2 }), /\[unmapped\] assets\/helper.js:1 preload/);
  assert.throws(() => label({ functionName: "", url: "http://localhost:8000/assets/%2e%2e/other.js", lineNumber: 0, columnNumber: 0 }), /Unexpected profiled asset/);
});

test("CPU attribution separates self and inclusive sample time", () => {
  const frame = (functionName: string) => ({ functionName, url: "", lineNumber: 0, columnNumber: 0 });
  const result = summarizeGradientCpuProfile({ nodes: [{ id: 1, callFrame: frame("root"), children: [2] }, { id: 2, callFrame: frame("work") }], samples: [1, 2, 2], timeDeltas: [1000, 2000, 3000] }, frame => frame.functionName);
  assert.equal(result.sampledMs, 6);
  assert.deepEqual(result.self, [{ location: "work", ms: 5 }, { location: "root", ms: 1 }]);
  assert.deepEqual(result.inclusive, [{ location: "root", ms: 6 }, { location: "work", ms: 5 }]);
});
