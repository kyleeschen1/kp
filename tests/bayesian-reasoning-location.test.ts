import test from "node:test";
import assert from "node:assert/strict";
import { checkBayesDraft, createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { extractBayesDenominator } from "../src/experiments/bayesian-reasoning/extraction.ts";
import { captureBayesLocation, encodeBayesLocation, readBayesLocation, validateBayesLocation } from "../src/experiments/bayesian-reasoning/location.ts";

test("bounded addresses preserve exact positions and required reason return pins", () => {
  const result = checkBayesDraft(JSON.stringify(createBayesDraft()));
  assert.equal(result.status, "compiled"); if (result.status !== "compiled") return;
  for (const step of [0, 2.35, 3, 5.45, 6]) {
    for (const disclosure of [{ view: "parent" as const }, { view: "reason" as const, extraction: extractBayesDenominator(result.draft, 5.45) }]) {
      const saved = captureBayesLocation(result.draft, step, disclosure);
      assert.deepEqual(validateBayesLocation(result.draft, readBayesLocation(encodeBayesLocation(saved))), saved);
      assert.throws(() => validateBayesLocation(result.draft, { ...saved, position: { ...saved.position, revisionId: "stale" } }), /stale or forged/);
    }
  }
  for (const hash of ["#unknown", "#bayes=%7B", "#bayes=1&bayes=2", `#${"x".repeat(16001)}`]) assert.throws(() => readBayesLocation(hash), /bounded Bayesian address/);
  const saved = captureBayesLocation(result.draft, 0, { view: "parent" });
  assert.throws(() => validateBayesLocation(result.draft, { ...saved, view: "reason" }), /revision-pinned position/);
  assert.throws(() => validateBayesLocation(result.draft, { ...saved, returnTo: saved.position }), /valid view/);
});
