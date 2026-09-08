import test from "node:test";
import assert from "node:assert/strict";
import { checkBayesDraft, createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { projectBayesPrompts } from "../src/experiments/bayesian-reasoning/prompts.ts";

test("prediction and reconstruction reuse existing flashcards and derive exact answers in both directions", () => {
  for (const [masses, direction, answer] of [
    [["16/100", "4/100", "8/100", "72/100"], "higher", "2/3"],
    [["1/8", "3/8", "3/8", "1/8"], "lower", "1/4"],
    [["1/4", "1/4", "1/4", "1/4"], "unchanged", "1/2"]
  ] as const) {
    const source = createBayesDraft(); source.model.masses = [...masses];
    const result = checkBayesDraft(JSON.stringify(source)); assert.equal(result.status, "compiled");
    if (result.status !== "compiled") return;
    const prompts = projectBayesPrompts(result.draft);
    assert.deepEqual(prompts.map(prompt => prompt.card.kind), ["predict-next", "cloze"]);
    for (const prompt of prompts) {
      assert.equal(prompt.direction, direction); assert.equal(prompt.revisionId, result.draft.revisionId);
      assert.deepEqual(prompt.projection.diagnostics, []); assert.ok(prompt.card.answer!.value.includes(answer));
      assert.equal(prompt.context.definitions.length, 2); assert.equal(prompt.context.jointMasses.length, 4);
      assert.equal(prompt.extraction.posterior, answer);
      assert.ok(!prompt.card.prompt.includes(`P(A | B) = ${answer}`));
    }
  }
});
