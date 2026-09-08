import test from "node:test";
import assert from "node:assert/strict";
import { checkBayesDraft, createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { extractBayesDenominator, resolveBayesDenominatorReturn } from "../src/experiments/bayesian-reasoning/extraction.ts";

test("denominator extraction preserves full population context and exact interrupted return", () => {
  const result = checkBayesDraft(JSON.stringify(createBayesDraft()));
  assert.equal(result.status, "compiled"); if (result.status !== "compiled") return;
  for (const step of [0, 1, 2.35, 3, 3.8, 4, 5, 5.5, 6]) {
    const extraction = extractBayesDenominator(result.draft, step);
    assert.equal(resolveBayesDenominatorReturn(result.draft, JSON.parse(JSON.stringify(extraction))).step, step);
    assert.equal(extraction.outcomeIds.length, 2); assert.equal(extraction.operations.length, 2);
    assert.equal(extraction.definitions.length, 2); assert.equal(extraction.denominator, "6/25");
    assert.equal(extraction.referencePopulationId, result.draft.tree.marginalId);
    assert.match(extraction.assumptions.join(" "), /positive/);
    assert.throws(() => resolveBayesDenominatorReturn(result.draft, { ...extraction, revisionId: "stale" }), /same source revision/);
    assert.throws(() => resolveBayesDenominatorReturn(result.draft, { ...extraction,
      returnTo: { ...extraction.returnTo, reference: { ...extraction.returnTo.reference, id: "foreign" } } }), /stale or forged/);
  }
  for (const step of [NaN, Infinity, -1, 7]) assert.throws(() => extractBayesDenominator(result.draft, step), /finite position/);
  assert.throws(() => extractBayesDenominator({ ...result.draft }, 0), /revision authority/);
});
