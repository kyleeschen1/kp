import assert from "node:assert/strict";
import test from "node:test";
import spam from "../content/authoring/r4b-spam-filter.bayes.json" with { type: "json" };
import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { projectBayesPrompts } from "../src/experiments/bayesian-reasoning/prompts.ts";

test("authored prompt wording cannot override compiler-owned answers or semantic references", () => {
  for (const prior of ["1/100", "1/10"]) {
    const model = { ...spam.model, prior };
    const authored = checkBayesDraft(JSON.stringify({ ...spam, model }));
    const baseline = checkBayesDraft(JSON.stringify({ schemaVersion: "kp.bayes-source.v1", model, teaching: spam.teaching }));
    if (authored.status !== "compiled" || baseline.status !== "compiled") assert.fail("Expected valid model and editorial source");
    const prompts = projectBayesPrompts(authored.draft), defaults = projectBayesPrompts(baseline.draft);
    for (const [index, prompt] of prompts.entries()) {
      assert.equal(prompt.card.title, spam.editorial.prompts[prompt.kind].title);
      assert.notEqual(prompt.card.prompt, defaults[index]!.card.prompt);
      assert.deepEqual(prompt.card.answer, defaults[index]!.card.answer);
      assert.deepEqual(prompt.card.objectIds, defaults[index]!.card.objectIds);
      assert.deepEqual(prompt.card.transformationIds, defaults[index]!.card.transformationIds);
      assert.deepEqual(prompt.card.selectorIds, defaults[index]!.card.selectorIds);
      assert.deepEqual(prompt.context, defaults[index]!.context);
      assert.equal(prompt.revisionId, authored.draft.revisionId);
      assert.equal(prompt.projection.diagnostics.length, 0);
      assert.ok(prompt.card.answer?.value.includes(prior === "1/100" ? "2/13" : "2/3"));
    }
    assert.ok(prompts[0]!.card.prompt.includes(prior));
  }
  const illegal = { ...spam, editorial: { ...spam.editorial, prompts: { ...spam.editorial.prompts,
    prediction: { ...spam.editorial.prompts.prediction, answer: "1" } } } };
  const rejected = checkBayesDraft(JSON.stringify(illegal));
  assert.equal(rejected.status, "repair-gap");
  if (rejected.status === "repair-gap") assert.equal(rejected.diagnostic.path, "$.editorial.prompts.prediction.answer");
});
