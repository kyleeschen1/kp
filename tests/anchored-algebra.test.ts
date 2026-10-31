import { test } from "node:test";
import assert from "node:assert/strict";
import source from "../content/authoring/algebra/what-counts.json" with { type: "json" };
import { compile } from "../src/authoring/algebra/compile.ts";
import { AnchoredAlgebraGap, bindAnchoredCommentary } from "../src/experiments/anchored-algebra/commentary.ts";
import { buildAnchoredAlgebraPage } from "../src/experiments/anchored-algebra/page.ts";

test("commentary resolves exact native views and only mathematical stops", () => {
  const draft = compile(source), commentary = bindAnchoredCommentary(draft);
  for (const index of [3, 0, 2, 1, 2, 0]) {
    const point = draft.checkpointProgress[index]!, stop = commentary.at(point)!;
    assert.equal(stop.stateId, source.states[index]!.id);
    assert.equal(commentary.progressFor(stop.stateId), point);
    assert.equal(commentary.at(point + 1e-9), undefined);
    for (const note of stop.notes) for (const [objectId, ids] of Object.entries(note.views)) {
      const object = draft.animation.bundle.objects.find(object => object.id === objectId)!;
      assert.ok(ids.every(id => object.selectors.some(selector => selector.id === id)));
    }
  }
  assert.equal(commentary.at(.5), undefined);
  assert.equal(commentary.at(NaN), undefined);
  assert.throws(() => commentary.progressFor("missing"), AnchoredAlgebraGap);
});
test("valid but changed mathematics or wording cannot inherit an old commentary pin", () => {
  for (const changed of [
    { ...source, editorial: { ...source.editorial, title: "Changed wording" } },
    { ...source, symbols: ["z", "y"], states: source.states.map(state => ({ ...state, latex: state.latex.replaceAll("x", "z") })) }
  ]) assert.throws(() => bindAnchoredCommentary(compile(changed)), AnchoredAlgebraGap);
});
test("static page contains every equation and commentary without enhancement", () => {
  const html = buildAnchoredAlgebraPage(), commentary = bindAnchoredCommentary(compile(source));
  for (const state of source.states) assert.ok(html.includes(state.latex));
  for (const stop of commentary.stops) for (const note of stop.notes) {
    assert.ok(html.includes(note.text)); assert.ok(html.includes(note.detail));
  }
  assert.ok(html.includes("Read the explanation without motion"));
});
