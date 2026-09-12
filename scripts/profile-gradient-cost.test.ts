import assert from "node:assert/strict";
import test from "node:test";
import { summarizeGradientCpuProfile } from "./profile-gradient-cost.ts";

test("CPU attribution separates self and inclusive sample time", () => {
  const frame = (functionName: string) => ({ functionName, url: "", lineNumber: 0, columnNumber: 0 });
  const result = summarizeGradientCpuProfile({ nodes: [{ id: 1, callFrame: frame("root"), children: [2] }, { id: 2, callFrame: frame("work") }], samples: [1, 2, 2], timeDeltas: [1000, 2000, 3000] }, frame => frame.functionName);
  assert.equal(result.sampledMs, 6);
  assert.deepEqual(result.self, [{ location: "work", ms: 5 }, { location: "root", ms: 1 }]);
  assert.deepEqual(result.inclusive, [{ location: "root", ms: 6 }, { location: "work", ms: 5 }]);
});
