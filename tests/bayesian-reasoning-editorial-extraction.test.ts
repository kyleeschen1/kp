import assert from "node:assert/strict";
import test from "node:test";
import spam from "../content/authoring/r4b-spam-filter.bayes.json" with { type: "json" };
import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { extractBayesDenominator, resolveBayesDenominatorReturn } from "../src/experiments/bayesian-reasoning/extraction.ts";

test("authored denominator extraction preserves context and exact interrupted return", () => {
  const result = checkBayesDraft(JSON.stringify(spam));
  if (result.status !== "compiled") assert.fail(result.diagnostic.expected);
  const raw = structuredClone(spam); raw.editorial.denominator = ["Reworded reasoning."];
  const changed = checkBayesDraft(JSON.stringify(raw));
  if (changed.status !== "compiled") assert.fail(changed.diagnostic.expected);
  assert.equal(result.draft.authority.revisionId, changed.draft.authority.revisionId);
  for (const step of [0, 2.35, 3.8, 4, 5.5, 6]) {
    const extraction = extractBayesDenominator(result.draft, step);
    assert.equal(extraction.editorial?.status, "editorial");
    assert.ok(extraction.editorial?.text.includes("A false alarm is still a flag"));
    assert.ok(extraction.editorial?.text.includes("all 117 flags"));
    assert.equal(extraction.denominator, "117/2000");
    assert.equal(extraction.posterior, "2/13");
    assert.equal(extraction.outcomeIds.length, 2);
    assert.equal(extraction.operations.length, 2);
    assert.equal(extraction.definitions.length, 2);
    assert.ok(extraction.assumptions.join(" ").includes("positive"));
    assert.equal(resolveBayesDenominatorReturn(result.draft, JSON.parse(JSON.stringify(extraction))).step, step);
    assert.throws(() => resolveBayesDenominatorReturn(changed.draft, extraction), /stale or forged/);
    const returned = resolveBayesDenominatorReturn(result.draft, { ...extraction, editorial: { status: "proved", text: "forged" } });
    assert.equal("editorial" in returned, false);
    assert.equal(extractBayesDenominator(result.draft, returned.step).editorial?.text, extraction.editorial?.text);
  }
});
