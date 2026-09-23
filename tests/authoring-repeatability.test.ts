import assert from "node:assert/strict";
import test from "node:test";
import { repeatabilityCases, readFrozenInput, verifyFrozenInput } from "../scripts/authoring-repeatability-cases.ts";
import { supportedAuthorTasks } from "../src/authoring/supported-author-tasks.ts";

test("the ten frozen inputs retain exact bytes, unique identity and approved task proportions", () => {
  assert.equal(repeatabilityCases.length, 10);
  assert.equal(new Set(repeatabilityCases.map(item => item.id)).size, 10);
  const counts: Record<string, number> = {};
  for (const item of repeatabilityCases) counts[item.task] = (counts[item.task] ?? 0) + 1;
  assert.deepEqual(counts, {
    "equation.fraction-chain": 3, "equation.common-factor": 2, "mechanics.momentum-energy": 2, "reasoning.code": 3
  });
  for (const item of repeatabilityCases) {
    assert.ok(item.intent && supportedAuthorTasks[item.task]);
    assert.ok(JSON.parse(readFrozenInput(item)));
    assert.throws(() => verifyFrozenInput(item, readFrozenInput(item) + " "), /Frozen input changed/);
  }
  assert.equal(repeatabilityCases.filter(item => item.expected === "checked").length, 6);
});
