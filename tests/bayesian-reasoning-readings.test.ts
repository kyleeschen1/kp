import test from "node:test";
import assert from "node:assert/strict";
import { checkBayesDraft, createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { projectBayesReading } from "../src/experiments/bayesian-reasoning/readings.ts";

test("full and compact Articles retain exact facts, definitions, assumptions and reference closure", () => {
  const source = createBayesDraft();
  source.model.events[0]!.label = '<script>alert(1)</script> [unsafe](javascript:bad) $x$';
  const result = checkBayesDraft(JSON.stringify(source)); assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  const full = projectBayesReading(result.draft, "full"), compact = projectBayesReading(result.draft, "compact");
  for (const reading of [full, compact]) {
    assert.equal(reading.document.kind, "kp-article-document");
    assert.equal(reading.revisionId, result.draft.revisionId);
    assert.equal(reading.facts.posterior, "2/3"); assert.equal(reading.facts.denominator, "6/25");
    assert.equal(reading.references.length, 13);
    assert.ok(reading.references.every(id => result.draft.trace.states.some(state => state.id === id) || result.draft.trace.operations.some(op => op.id === id)));
    assert.match(reading.html, /reference population/); assert.match(reading.html, /no independence assumption/);
    assert.match(reading.html, /&lt;script&gt;/); assert.doesNotMatch(reading.html, /<script|href="javascript:|class="katex"/);
  }
  assert.deepEqual(full.facts, compact.facts); assert.deepEqual(full.assumptions, compact.assumptions);
  assert.deepEqual(full.definitions, compact.definitions); assert.deepEqual(full.references, compact.references);
  assert.ok(compact.source.text.length < full.source.text.length);
  assert.throws(() => projectBayesReading({ ...result.draft, revisionId: "forged" }, "full"), /revision authority/);
});
