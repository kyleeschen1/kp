import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import transfer from "../src/authoring/examples/composed-algebra-intuition-transfer.json" with { type: "json" };
import { prepareKpComposedAlgebraDraftV2 } from "../src/authoring/composed-algebra-session-v2.ts";
import { projectComposedAlgebraPromptsV2 } from "../src/experiments/composed-algebra/practice.ts";
import { projectComposedAlgebraSubexplanations } from "../src/experiments/composed-algebra/subexplanations.ts";

test("practice questions retain scoped evidence local answer steps and preserved-structure reasoning", () => {
  for (const source of [primary, transfer]) {
    const draft = prepareKpComposedAlgebraDraftV2(source);
    for (const reference of [undefined, ...projectComposedAlgebraSubexplanations(draft)]) {
      const [start, end] = reference?.range ?? [0, source.states.length - 1];
      const prompts = projectComposedAlgebraPromptsV2(draft, reference);
      assert.deepEqual(prompts.map(p => p.answerStep), [1, end - start]);
      for (const prompt of prompts) {
        assert.deepEqual(prompt.projection.diagnostics, []);
        assert.equal(prompt.revisionId, draft.revisionId);
        assert.equal(prompt.answerLatex, source.states[start + prompt.answerStep]!.latex);
        assert.ok(prompt.card.objectIds!.every(id => source.states.slice(start, end + 1).some(s => s.id === id)));
        assert.match(prompt.card.prompt, /Why|why|preserved/);
      }
    }
    const reference = projectComposedAlgebraSubexplanations(draft)[0]!;
    assert.throws(() => projectComposedAlgebraPromptsV2(prepareKpComposedAlgebraDraftV2(source), reference), /exact/);
  }
});
