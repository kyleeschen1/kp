import assert from "node:assert/strict";
import test from "node:test";
import source from "../content/authoring/algebra/whole-and-parts.json" with { type: "json" };
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import { check, compile } from "../src/authoring/algebra/compile.ts";
import { buildKpAlgebraIntuitionInitialPage, algebraIntuitionVariant } from "../src/experiments/composed-algebra-intuition/page.ts";

test("selected algebra page embeds exactly its checked source and preserves the primary", () => {
  for (const [url, expected] of [["?variant=whole-and-parts", source], ["", primary]] as const) {
    const html = buildKpAlgebraIntuitionInitialPage(url);
    const embedded = /<script type="application\/json" data-composed-initial-source>(.*?)<\/script>/.exec(html)?.[1];
    assert.ok(embedded); assert.deepEqual(JSON.parse(embedded), expected);
    const draft = compile(expected);
    assert.ok(html.includes(draft.revisionId));
    assert.equal(draft.steps.length, expected.states.length - 1);
    assert.ok(html.includes(expected.editorial.title));
    if (url) assert.match(html, /variant=whole-and-parts&amp;intuition=/);
  }
  for (const url of ["?variant=missing", "?variant=", "?variant=whole-and-parts&variant=whole-and-parts"])
    assert.throws(() => algebraIntuitionVariant(url), /Unsupported algebra source variant/);
});

test("whole-group collection cannot silently accept different groups or a missing contribution", () => {
  for (const altered of [
    { ...source, symbols: ["x", "y", "z"], states: source.states.map((s, i) => i === 0 ? { ...s, latex: "3(x+y)+2(x+z)" } : s) },
    { ...source, states: source.states.map((s, i) => i === 3 ? { ...s, latex: "5x+y" } : s) }
  ]) assert.equal(check(JSON.stringify(altered)).status, "repair-gap");
  assert.equal(check(JSON.stringify(source)).status, "compiled");
});
