import assert from "node:assert/strict";
import test from "node:test";
import spam from "../content/authoring/r4b-spam-filter.bayes.json" with { type: "json" };
import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { editorialFixture } from "./fixtures/bayes-editorial-source.ts";

test("primary authored lesson binds detection and posterior to distinct existing queries", () => {
  const result = checkBayesDraft(JSON.stringify(spam));
  if (result.status !== "compiled") assert.fail(`${result.diagnostic.path}: ${result.diagnostic.expected}`);
  assert.equal(result.draft.score.length, 7);
  assert.ok(result.draft.editorial?.setup.includes("9/10 of spam"));
  assert.ok(result.draft.editorial?.setup.includes("1/20 of non-spam"));
  assert.ok(result.draft.score[4]!.html.includes("2/13"));
  const changed = checkBayesDraft(JSON.stringify({ ...spam, model: { ...spam.model, prior: "1/10", likelihoods: ["4/5", "1/10"] } }));
  if (changed.status !== "compiled") assert.fail(changed.diagnostic.expected);
  assert.ok(changed.draft.editorial?.setup.includes("4/5 of spam"));
  assert.ok(changed.draft.editorial?.setup.includes("1/10 of non-spam"));
  assert.ok(changed.draft.score[4]!.html.includes("8/17"));
});

test("undefined conditional facts are located gaps without outlawing zero-support models", () => {
  const result = checkBayesDraft(JSON.stringify({ ...spam, model: { ...spam.model, prior: "0/1" } }));
  assert.equal(result.status, "repair-gap");
  if (result.status === "repair-gap") assert.equal(result.diagnostic.path, "$.editorial.setup[3].fact");
  const raw = editorialFixture();
  assert.equal(checkBayesDraft(JSON.stringify({ ...raw, model: { ...spam.model, sourceId: raw.model.sourceId,
    events: raw.model.events, prior: "0/1" }, teaching: raw.teaching })).status, "compiled");
});
