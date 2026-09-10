import assert from "node:assert/strict";
import test from "node:test";
import { prepareKpComposedAlgebraDraft, createKpComposedAlgebraAuthoringSession, exportKpComposedAlgebraSource } from "../src/authoring/composed-algebra-session.ts";

test("composed Apply publishes only the latest prepared revision and exports displayed source", async () => {
  const initial = prepareKpComposedAlgebraDraft(), source = initial.checked.source;
  let displayed = initial, disposals = 0;
  const pending: ((surface: { dispose(): void }) => void)[] = [];
  const session = createKpComposedAlgebraAuthoringSession({ initial,
    prepare: () => new Promise<{ dispose(): void }>(resolve => pending.push(resolve)),
    commit: (_surface, draft) => { displayed = draft; } });
  const json = (title: string) => JSON.stringify({ ...source, editorial: { ...source.editorial, title } });
  const resolve = (index: number) => pending[index]!({ dispose() { ++disposals; } });
  const first = session.apply(json("First")), second = session.apply(json("Second"));
  assert.equal(session.current(), initial);
  resolve(1); assert.equal((await second).status, "applied");
  resolve(0); assert.equal((await first).status, "superseded");
  assert.equal(displayed.checked.source.editorial.title, "Second"); assert.equal(disposals, 1);
  assert.equal(session.current(), displayed);
  assert.equal(JSON.parse(exportKpComposedAlgebraSource(session.current())).editorial.title, "Second");
  assert.equal((await session.apply("{}")).status, "repair-gap"); assert.equal(session.current(), displayed);
  const interrupted = session.apply(json("Interrupted")); session.invalidate(); resolve(2);
  assert.equal((await interrupted).status, "superseded"); assert.equal(disposals, 2);
  const disposed = session.apply(json("Disposed")); session.dispose(); resolve(3);
  assert.equal((await disposed).status, "superseded"); assert.equal(disposals, 3);
  assert.equal((await session.apply(json("After disposal"))).status, "superseded"); assert.equal(pending.length, 4);
});

test("native preparation failure, invalid math and copied capability cannot replace the composed revision", async () => {
  const initial = prepareKpComposedAlgebraDraft(); let commits = 0;
  const session = createKpComposedAlgebraAuthoringSession({ initial,
    prepare: async () => { throw new Error("native preparation unavailable"); }, commit: () => { ++commits; } });
  const result = await session.apply(exportKpComposedAlgebraSource(initial));
  assert.equal(result.status, "repair-gap"); assert.equal(session.current(), initial); assert.equal(commits, 0);
  const invalid = JSON.parse(exportKpComposedAlgebraSource(initial)); invalid.states[2].latex = "6(x+3)";
  const rejected = await session.apply(JSON.stringify(invalid));
  assert.equal(rejected.status, "repair-gap");
  if (rejected.status === "repair-gap") assert.equal(rejected.diagnostic.path, "$.states[2].latex");
  assert.equal(session.current(), initial);
  assert.throws(() => exportKpComposedAlgebraSource({ ...initial }), TypeError);
  assert.throws(() => createKpComposedAlgebraAuthoringSession({ initial: { ...initial },
    prepare: async () => ({ dispose() {} }), commit() {} }), TypeError);
});
