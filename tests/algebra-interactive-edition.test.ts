import assert from "node:assert/strict";
import test from "node:test";
import source from "../content/authoring/algebra/whole-and-parts.json" with { type: "json" };
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import { renderInteractiveAlgebraEdition } from "../scripts/algebra-interactive-edition.ts";
import { compile } from "../src/authoring/algebra/compile.ts";

test("interactive editions preserve checked source and complete reading without editor or fixtures", () => {
  for (const candidate of [source, primary]) {
    const text = JSON.stringify(candidate), { artifact, html } = renderInteractiveAlgebraEdition(text, "source.json");
    assert.equal(artifact.payload.revisionId, compile(candidate).revisionId);
    assert.match(html, /data-composed-text-first/);
    assert.match(html, /Complete verified reading/);
    assert.doesNotMatch(html, /data-reasoning-editor|data-composed-apply|textarea|\/experiments\//);
    for (const state of candidate.states) assert.ok(html.includes(state.narration));
  }
  const escaped = structuredClone(source); escaped.editorial.title = '</script><img src=x onerror="alert(1)">';
  const { html } = renderInteractiveAlgebraEdition(JSON.stringify(escaped), "source.json");
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /\\u003c\/script>/);
  assert.throws(() => renderInteractiveAlgebraEdition('{}', "source.json"));
  assert.throws(() => renderInteractiveAlgebraEdition(JSON.stringify({ ...source, schemaVersion: 'kp.composed-algebra-source.v1' }), "source.json"));
});
