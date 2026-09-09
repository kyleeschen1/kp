import assert from "node:assert/strict";
import test from "node:test";
import { createKpCommonFactorExample } from "../src/authoring/common-factor-author-check.ts";
import { prepareKpCommonFactorDraft } from "../src/authoring/common-factor-draft.ts";
import { projectCommonFactorReading } from "../src/experiments/common-factor/readings.ts";

test("Article reading density preserves exact facts, assumptions and revision-pinned references", () => {
  const draft = prepareKpCommonFactorDraft(createKpCommonFactorExample());
  const full = projectCommonFactorReading(draft, "full"), compact = projectCommonFactorReading(draft, "compact");
  assert.equal(full.revisionId, draft.revisionId); assert.equal(compact.revisionId, draft.revisionId);
  assert.deepEqual(full.facts, compact.facts); assert.deepEqual(full.assumptions, compact.assumptions); assert.deepEqual(full.references, compact.references);
  assert.deepEqual(full.facts.addends, ["b", "c"]); assert.equal(full.facts.factor, "a");
  for (const view of [full, compact]) { assert.match(view.html, /may be zero/); assert.match(view.html, /<math/); assert.doesNotMatch(view.html, /<h1/); }
  assert.ok(full.html.length > compact.html.length);
});

test("editorial math, HTML and directives remain literal while proof owns mathematical claims", () => {
  const source = createKpCommonFactorExample();
  const malicious = "<script>alert(1)</script> [link](https://example.com) $99$ {{kp:widget}}";
  const draft = prepareKpCommonFactorDraft({ ...source, editorial: { ...source.editorial, summary: malicious } });
  const reading = projectCommonFactorReading(draft, "compact");
  assert.doesNotMatch(reading.html, /<script|href="https:\/\/example.com/);
  assert.match(reading.html, /&lt;script&gt;/); assert.equal(reading.facts.factor, "a");
  assert.equal(reading.editorialStatus, "editorial");
});
