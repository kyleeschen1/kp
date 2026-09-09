import assert from "node:assert/strict";
import test from "node:test";
import spam from "../content/authoring/r4b-spam-filter.bayes.json" with { type: "json" };
import urn from "../content/authoring/r4b-urn-explanation.bayes.json" with { type: "json" };
import legacyUrn from "../content/authoring/r4a-urn-prior.bayes.json" with { type: "json" };
import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { editorialFixture } from "./fixtures/bayes-editorial-source.ts";

test("second authored lesson reuses the existing urn model and opposite first tree order", () => {
  assert.deepEqual(urn.model, legacyUrn.model);
  assert.deepEqual(urn.teaching, legacyUrn.teaching);
  assert.equal(urn.teaching.firstEventId, urn.model.events[1]!.id);
  assert.equal(spam.teaching.firstEventId, spam.model.events[0]!.id);
  const result = checkBayesDraft(JSON.stringify(urn));
  if (result.status !== "compiled") assert.fail(result.diagnostic.expected);
  assert.equal(result.draft.score.length, 7);
  assert.match(result.draft.score[4]!.html, /1\/7/);
  assert.match(result.draft.editorial!.setup, /1\/3/);
  assert.match(result.draft.score[1]!.html, /red versus blue/);
  assert.match(result.draft.score[6]!.html, /selects A or B before color/);
});

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
