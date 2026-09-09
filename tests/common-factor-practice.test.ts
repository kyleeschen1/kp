import assert from "node:assert/strict";
import test from "node:test";
import { createKpCommonFactorExample } from "../src/authoring/common-factor-author-check.ts";
import { prepareKpCommonFactorDraft } from "../src/authoring/common-factor-draft.ts";
import { projectCommonFactorPrompts, captureCommonFactorPosition, resolveCommonFactorPosition } from "../src/experiments/common-factor/practice.ts";

test("practice projects the complete verified operation and returns to an exact revision-pinned position", () => {
  const draft = prepareKpCommonFactorDraft(createKpCommonFactorExample());
  const prompts = projectCommonFactorPrompts(draft);
  assert.deepEqual(prompts.map(p => p.kind), ["prediction", "reconstruction"]);
  for (const p of prompts) {
    assert.equal(p.revisionId, draft.revisionId); assert.equal(p.answerLatex, "a(b + c)");
    assert.deepEqual(p.projection.diagnostics, []);
    assert.deepEqual(p.card.transformationIds, [draft.animation.transformations[0]!.id]);
    assert.match(p.answerExplanation, /no division/);
  }
  for (const progress of [0, .37, .73, 1]) {
    const position = captureCommonFactorPosition(draft, progress);
    assert.equal(resolveCommonFactorPosition(draft, JSON.parse(JSON.stringify(position))), progress);
    for (const key of ["sourceId", "revisionId", "referenceId"]) assert.throws(() => resolveCommonFactorPosition(draft, { ...position, [key]: "foreign" }), /another source/);
  }
  for (const progress of [-1, 2, NaN, Infinity]) assert.throws(() => captureCommonFactorPosition(draft, progress), /between/);
  const source = createKpCommonFactorExample();
  const revised = prepareKpCommonFactorDraft({ ...source, editorial: { ...source.editorial, title: "Revised" } });
  assert.throws(() => resolveCommonFactorPosition(revised, captureCommonFactorPosition(draft, .37)), /another source/);
  assert.throws(() => projectCommonFactorPrompts({ ...draft }));
});
