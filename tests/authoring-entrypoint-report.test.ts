import assert from "node:assert/strict";
import test from "node:test";
import { reportAuthorCheck } from "../src/authoring/author-check-report.ts";
import { checkBayesDraft, createBayesDraft, requirePreparedBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { compileKpEquationSeriesLogarithmBaseDraft } from "../src/authoring/equation-series-logarithm-base-draft.ts";

test("reports preserve domain failures, including detailed equation repair actions", () => {
  const bayes = checkBayesDraft("{}");
  const report = reportAuthorCheck("bayes.binary", bayes);
  assert.equal(report.status, "repair-gap");
  assert.equal(report.result, bayes);
  const equation = compileKpEquationSeriesLogarithmBaseDraft({});
  const failure = reportAuthorCheck("equation.logarithm-base", equation);
  assert.equal(failure.status, "repair-gap");
  assert.equal(failure.result.repairs, equation.repairs);
  assert.ok(failure.result.repairs.length > 0);
});

test("report-only success cannot become prepared host authority", () => {
  const result = checkBayesDraft(JSON.stringify(createBayesDraft()));
  assert.equal(result.status, "compiled");
  const report = reportAuthorCheck("bayes.binary", result);
  assert.equal(report.status, "checked");
  assert.equal(report.authority, "report-only");
  assert.equal(report.result, result);
  assert.throws(() => {
    // @ts-expect-error A successful report is not an issued prepared draft.
    requirePreparedBayesDraft(report);
  });
});

test("classification retains all existing owner outcome distinctions", () => {
  for (const status of ["compiled", "compiled-artifact", "existing-artifact", "semantic-plan-only"] as const) {
    const result = { status, evidenceRefs: ["retained-domain-evidence"] };
    assert.equal(reportAuthorCheck("graph3d.saddle", result).status, "checked");
  }
  for (const status of ["repair-gap", "repair-required"] as const)
    assert.equal(reportAuthorCheck("graph3d.saddle", { status }).status, "repair-gap");
  assert.throws(() => {
    // @ts-expect-error Publication is not a check outcome.
    reportAuthorCheck("bayes.binary", { status: "published" });
  });
});
