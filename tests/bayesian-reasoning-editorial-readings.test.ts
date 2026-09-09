import assert from "node:assert/strict";
import test from "node:test";
import spam from "../content/authoring/r4b-spam-filter.bayes.json" with { type: "json" };
import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { projectBayesReading } from "../src/experiments/bayesian-reasoning/readings.ts";

test("authored full and compact Articles retain their source, exact answer and required context", () => {
  for (const prior of ["1/100", "1/10"]) {
    const result = checkBayesDraft(JSON.stringify({ ...spam, model: { ...spam.model, prior } }));
    if (result.status !== "compiled") assert.fail(result.diagnostic.expected);
    const full = projectBayesReading(result.draft, "full"), compact = projectBayesReading(result.draft, "compact");
    for (const reading of [full, compact]) {
      assert.equal(reading.document.kind, "kp-article-document");
      assert.equal(reading.revisionId, result.draft.revisionId);
      assert.ok(reading.html.includes(spam.editorial.title));
      assert.ok(reading.html.includes(`= ${reading.facts.posterior}.`));
      assert.equal(reading.facts.posterior, prior === "1/100" ? "2/13" : "2/3");
      assert.ok(reading.html.includes("no independence assumption"));
      assert.equal(reading.references.length, 13);
    }
    assert.ok(full.html.includes("Our question reverses the conditioning"));
    assert.ok(compact.html.includes("Both groups belong in the denominator"));
    assert.ok(compact.source.text.length < full.source.text.length);
    assert.deepEqual(full.facts, compact.facts);
  }
});

test("authored Article literals cannot become markup, KP directives, links or math", () => {
  const raw = structuredClone(spam), hostile = '<script>alert(1)</script> [x](javascript:bad) $x$ $$y$$ :::kp-stage{#bad use=bad}';
  raw.editorial.title = hostile;
  raw.editorial.readings.full = [[hostile]];
  raw.editorial.readings.compact = [[hostile]];
  const result = checkBayesDraft(JSON.stringify(raw));
  if (result.status !== "compiled") assert.fail(result.diagnostic.expected);
  for (const mode of ["full", "compact"] as const) {
    const reading = projectBayesReading(result.draft, mode);
    assert.match(reading.html, /&lt;script&gt;/);
    assert.doesNotMatch(reading.html, /<script|href="javascript:|class="katex"|data-kp-stage/);
    assert.ok(reading.html.includes("no independence assumption"));
    assert.ok(reading.html.includes("= 2/13."));
  }
});
