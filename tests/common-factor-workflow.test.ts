import test from "node:test";
import assert from "node:assert/strict";
import { checkCommonFactorWorkflow } from "../scripts/check-common-factor-workflow.ts";

test("both retained sources replay check repair edit and publication through existing owners", async () => {
  const report = await checkCommonFactorWorkflow();
  assert.equal(report.provenance, "deterministic-scripted-fixtures-not-live-LLM");
  assert.equal(report.results.length, 2);
  for (const result of report.results) {
    assert.equal(result.status, "passed");
    assert.equal(result.repair, "invalid-factorization");
    assert.ok(result.sourceBytes > 0);
    assert.equal(result.scriptedRepairTurns, 1);
  }
});
