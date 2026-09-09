import assert from "node:assert/strict";
import test from "node:test";
import { createKpCommonFactorExample } from "../src/authoring/common-factor-author-check.ts";
import { prepareKpCommonFactorDraft } from "../src/authoring/common-factor-draft.ts";
import { commonFactorEndpoints } from "../src/experiments/common-factor/endpoints.ts";
import { buildKpCommonFactorInitialPage, renderCommonFactorCard } from "../src/experiments/common-factor/page.ts";
import { compileKpEquationExemplarTemplate } from "../src/reader/compiler/equation-exemplar-page.ts";

test("native annotations preserve exact generated endpoints and every occurrence role", () => {
  const draft = prepareKpCommonFactorDraft(createKpCommonFactorExample()), endpoints = commonFactorEndpoints(draft);
  assert.deepEqual(endpoints.map(e => e.annotated.rawLatex), ["ab + ac", "a(b + c)"]);
  assert.deepEqual(endpoints.map(e => e.annotated.annotations.length), [5, 6]);
  const html = compileKpEquationExemplarTemplate(draft.animation, s => endpoints.find(e => e.stateId === s.id)?.annotated);
  assert.equal((html.match(/class="kp-reader-equation-transition"/g) ?? []).length, 1);
  for (const endpoint of endpoints) for (const annotation of endpoint.annotated.annotations)
    assert.ok(html.includes(`data-kp-reader-selector-id="${annotation.selectorId}"`));
  assert.match(buildKpCommonFactorInitialPage(), /<noscript>/);
  assert.match(renderCommonFactorCard(draft), /1 \/ 2/);
  assert.throws(() => Reflect.apply(renderCommonFactorCard, undefined, [draft.candidate]), TypeError);
});
