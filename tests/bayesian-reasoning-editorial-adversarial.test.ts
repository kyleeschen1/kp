import assert from "node:assert/strict";
import test from "node:test";
import spam from "../content/authoring/r4b-spam-filter.bayes.json" with { type: "json" };
import urn from "../content/authoring/r4b-urn-explanation.bayes.json" with { type: "json" };
import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { checkBayesAuthorSource } from "../src/experiments/bayesian-reasoning/author-check.ts";
import { renderBayesCardRevision } from "../src/experiments/bayesian-reasoning/page.ts";
import { compileBayesPublication } from "../scripts/build-bayesian-edition.ts";
import { checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";
import { assessRetainedAuthorTask } from "../scripts/assess-authoring-task.ts";

test("both authored lessons reject boundary attacks and recover through the unchanged source", async () => {
  for (const source of [spam, urn]) {
    const editorial = source.editorial;
    const cases: readonly [unknown, string][] = [
      [{ ...source, schemaVersion: "kp.bayes-source.v3" }, "$.schemaVersion"],
      [{ ...source, schemaVersion: "kp.bayes-source.v1" }, "$.editorial"],
      [{ ...source, editorial: { ...editorial, answer: "1" } }, "$.editorial.answer"],
      [{ ...source, editorial: { ...editorial, setup: [{ fact: "__proto__" }] } }, "$.editorial.setup[0].fact"],
      [{ ...source, editorial: { ...editorial, denominator: [{ fact: "posterior", expression: "1/0" }] } }, "$.editorial.denominator[0].expression"],
      [{ ...source, editorial: { ...editorial, passages: editorial.passages.map((p, i) => i === 2 ? { ...p, stateId: "foreign.state.joint-tree" } : p) } }, "$.editorial.passages[2].stateId"],
      [{ ...source, editorial: { ...editorial, prompts: { ...editorial.prompts, prediction: { ...editorial.prompts.prediction, answer: "1" } } } }, "$.editorial.prompts.prediction.answer"],
      [{ ...source, editorial: { ...editorial, readings: { ...editorial.readings, full: [["x".repeat(1001)]] } } }, "$.editorial.readings.full[0][0]"],
      [{ ...source, teaching: { ...source.teaching, durationMs: 900 } }, "$.teaching.durationMs"]
    ];
    for (const [raw, path] of cases) {
      const json = JSON.stringify(raw), result = checkBayesDraft(json);
      assert.equal(result.status, "repair-gap");
      assert.equal(result.diagnostic.path, path);
      assert.deepEqual((await checkAuthorTask("bayes.binary", json)).result, result);
      assert.equal(checkBayesDraft(JSON.stringify(source)).status, "compiled");
    }
    const oversized = JSON.stringify({ ...source, editorial: { ...editorial, setup: ["x".repeat(100_001)] } });
    assert.equal(checkBayesDraft(oversized).status, "repair-gap");
    assert.equal((await checkAuthorTask("bayes.binary", oversized)).status, "repair-gap");
  }
});

test("held-out literal attacks stay inert in every authored projection", () => {
  const hostile = '<img src=x onerror="bad()"> & <script>bad()</script> [go](javascript:bad) $x$ :::kp-stage';
  for (const source of [spam, urn]) {
    const raw = structuredClone(source);
    raw.editorial.title = hostile;
    raw.editorial.setup = [hostile]; raw.editorial.denominator = [hostile];
    raw.editorial.passages = raw.editorial.passages.map(p => ({ ...p, title: hostile, body: [hostile] }));
    raw.editorial.readings = { full: [[hostile]], compact: [[hostile]] };
    raw.editorial.prompts = { prediction: { title: hostile, body: [hostile] }, reconstruction: { title: hostile, body: [hostile] } };
    const json = JSON.stringify(raw), result = checkBayesDraft(json);
    assert.equal(result.status, "compiled");
    const publication = compileBayesPublication(json, "hostile.json");
    for (const html of [renderBayesCardRevision(result.draft), publication.payload.reading.html]) {
      assert.doesNotMatch(html, /<img\b|<script\b|href="javascript:|data-kp-stage=/);
      assert.match(html, /&lt;img/);
    }
    assert.equal(publication.payload.full.facts.posterior, source === spam ? "2/13" : "1/7");
  }
});

test("valid authored syntax is neither task fulfillment nor proof of free prose", () => {
  const wrongTask = { ...urn, teaching: { ...urn.teaching, firstEventId: "urn-a" } };
  assert.equal(checkBayesDraft(JSON.stringify(wrongTask)).status, "compiled");
  assert.equal(assessRetainedAuthorTask("urn-prior-third", JSON.stringify(wrongTask)).status, "intent-gap");
  const falseClaim = { ...urn, editorial: { ...urn.editorial, setup: ["Every red draw certainly came from urn A."] } };
  const result = checkBayesAuthorSource(JSON.stringify(falseClaim));
  assert.equal(result.status, "compiled");
  assert.equal(result.editorial?.status, "editorial-not-proof");
  const publication = compileBayesPublication(JSON.stringify(falseClaim), "false-claim.json");
  assert.equal(publication.payload.full.facts.posterior, "1/7");
  // This is an explicit known limit, not an expectation that a parser grades prose.
  assert.match(publication.payload.reading.html, /Explanatory prose is editorial/);
  const { prior: _prior, likelihoods: _likelihoods, ...model } = urn.model;
  const joint = { ...urn, model: { ...model, kind: "joint-masses", masses: ["1/12", "1/4", "1/2", "1/6"] } };
  assert.equal(assessRetainedAuthorTask("urn-prior-third", JSON.stringify(joint)).status, "fulfilled");
});
