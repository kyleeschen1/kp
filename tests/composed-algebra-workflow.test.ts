import assert from "node:assert/strict";
import test from "node:test";
import { checkComposedAlgebraWorkflow } from "../scripts/check-composed-algebra-workflow.ts";

test("both composed sources replay repair revision projections and publication through identical owners", async () => {
  const report = await checkComposedAlgebraWorkflow();
  assert.equal(report.provenance, "deterministic-scripted-fixtures-not-live-LLM");
  assert.equal(report.externalModelCalls, 0); assert.equal(report.authorTime, "not-measured");
  assert.equal(report.results.length, 2);
  for (const result of report.results) {
    assert.equal(result.status, "passed"); assert.equal(result.repair, "invalid-evaluation");
    assert.equal(result.scriptedRepairTurns, 1); assert.equal(result.checkpointCount, 3);
    assert.ok(result.sourceBytes > 0);
    assert.deepEqual(result.canonicalReferences, report.results[0]!.canonicalReferences);
    assert.equal(result.runtimeOwner, report.results[0]!.runtimeOwner);
  }
});
