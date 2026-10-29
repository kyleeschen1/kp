import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import { compile, check, serialize } from "../src/authoring/algebra/compile.ts";
import { session as createSession } from "../src/authoring/algebra/session.ts";
import { renderAlgebraIntuitionPage } from "../src/experiments/composed-algebra-intuition/page.ts";

test("complete source publishes only a fully prepared revision and exports displayed authority", async () => {
  const initial = compile(primary);
  let fail = false, committed = initial;
  const session = createSession({ initial,
    prepare: async () => { if (fail) throw new Error("Native seam failed"); return { dispose() {} }; }, commit: (_, draft) => { committed = draft; } });
  const edited = structuredClone(primary); edited.editorial.title = "Where did every contribution go?";
  assert.equal((await session.apply(JSON.stringify(edited))).status, "applied");
  assert.notEqual(committed.revisionId, initial.revisionId);
  assert.equal(JSON.parse(serialize(committed)).editorial.title, edited.editorial.title);
  const last = committed; fail = true; edited.editorial.title = "Not prepared";
  assert.equal((await session.apply(JSON.stringify(edited))).status, "repair-gap");
  assert.equal(committed, last); assert.equal(session.current(), last);
  edited.states[4]!.latex = "5x+16";
  assert.equal(check(JSON.stringify(edited)).status, "repair-gap");
  assert.throws(() => serialize({ ...initial }), /issued/);
  const html = renderAlgebraIntuitionPage(initial);
  assert.match(html, /1 \/ 5/); assert.match(html, /5 states · 4 verified moves/);
  session.dispose();
});
