import assert from "node:assert/strict";
import test from "node:test";
import { checkAuthoredBayesWorkflows } from "../scripts/check-authored-bayes-workflows.ts";

test("two authored workflows report actual bytes and separate injected repair from authoring evidence", async () => {
  const report = await checkAuthoredBayesWorkflows();
  assert.equal(report.status, "passed");
  assert.equal(report.externalModelCalls, 0);
  assert.equal(report.editorialQuality, "not-graded");
  assert.equal(report.humanAuthorTime, "not-measured");
  assert.deepEqual(report.results.map(r => r.bytes), [6607, 6273]);
  assert.deepEqual(report.results.map(r => r.posterior), ["2/13", "1/7"]);
  for (const result of report.results) {
    assert.equal(result.sourceFiles, 1);
    assert.equal(result.injectedFaults, 1);
    assert.equal(result.publishedVariantsVerified, 3);
  }
});
