import assert from "node:assert/strict";
import test from "node:test";
import { prepareKpComposedAlgebraDraft, exportKpComposedAlgebraSource } from "../src/authoring/composed-algebra-session.ts";
import { projectComposedAlgebraReading } from "../src/experiments/composed-algebra/readings.ts";
import { projectComposedAlgebraPrompts, captureComposedAlgebraPosition, resolveComposedAlgebraPosition } from "../src/experiments/composed-algebra/practice.ts";
import { compileComposedAlgebraPublication, verifyComposedAlgebraPublication } from "../scripts/build-composed-algebra-edition.ts";
import { digestEditionBytes } from "../scripts/immutable-local-edition.ts";

test("both Article densities preserve complete chain facts, assumptions and revision-pinned references", () => {
  const draft = prepareKpComposedAlgebraDraft(), full = projectComposedAlgebraReading(draft, "full"), compact = projectComposedAlgebraReading(draft, "compact");
  assert.deepEqual(full.facts, compact.facts); assert.deepEqual(full.references, compact.references); assert.deepEqual(full.assumptions, compact.assumptions);
  assert.equal(full.facts.states.length, 3); assert.equal(full.facts.operationIds.length, 2);
  for (const view of [full, compact]) { assert.equal(view.revisionId, draft.revisionId); assert.equal((view.html.match(/<math/g) ?? []).length, 3); assert.match(view.html, /may be zero/); }
  assert.ok(full.html.length > compact.html.length);
});
test("practice projects the intended verified steps and restores exact positions only in the same revision", () => {
  const draft = prepareKpComposedAlgebraDraft(), prompts = projectComposedAlgebraPrompts(draft);
  assert.deepEqual(prompts.map(p => p.card.transformationIds?.length), [1, 2]);
  assert.deepEqual(prompts.map(p => p.answerStep), [1, 2]);
  for (const p of prompts) { assert.equal(p.revisionId, draft.revisionId); assert.deepEqual(p.projection.diagnostics, []); }
  for (const p of [0, .37, draft.checkpointProgress[1], .73, 1]) {
    const position = captureComposedAlgebraPosition(draft, p);
    assert.equal(resolveComposedAlgebraPosition(draft, JSON.parse(JSON.stringify(position))), p);
    for (const key of ["sourceId", "revisionId", "referenceId"]) assert.throws(() => resolveComposedAlgebraPosition(draft, { ...position, [key]: "foreign" }), /another source/);
  }
  assert.equal(captureComposedAlgebraPosition(draft, draft.checkpointProgress[1]).referenceId, draft.checked.source.states[1].id);
  for (const p of [-1, 2, NaN, Infinity]) assert.throws(() => captureComposedAlgebraPosition(draft, p), /between/);
});
test("static publication uses one verified revision, escapes editorial input and rejects rehashed forgery", () => {
  const base = prepareKpComposedAlgebraDraft().checked.source;
  const draft = prepareKpComposedAlgebraDraft({ ...base, editorial: { ...base.editorial, title: "<script>bad</script>", summary: "<script>bad</script> [link](https://example.com) $99$ {{kp:widget}}" } });
  const bytes = exportKpComposedAlgebraSource(draft), artifact = compileComposedAlgebraPublication(bytes, "source.json"), { payload } = artifact;
  assert.equal(payload.checkpoints.length, 3);
  for (const view of [payload.full, payload.compact, ...payload.prompts]) assert.equal(view.revisionId, payload.revisionId);
  assert.equal((payload.reading.html.match(/<math/g) ?? []).length, 8);
  assert.doesNotMatch(payload.reading.html, /<script|data-kp-focus-deck-scrubber|type="module"|href="https:\/\/example.com/);
  assert.match(payload.reading.html, /&lt;script&gt;/);
  const ids = [...payload.reading.html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]); assert.equal(new Set(ids).size, ids.length);
  verifyComposedAlgebraPublication(artifact, bytes, "source.json");
  const forged = JSON.parse(JSON.stringify(artifact)); forged.payload.full.facts.states[2].latex = "6(x+3)";
  forged.payloadSha256 = digestEditionBytes(JSON.stringify(forged.payload));
  assert.throws(() => verifyComposedAlgebraPublication(forged, bytes, "source.json"), /does not reproduce/);
});
