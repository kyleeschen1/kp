import assert from "node:assert/strict";
import test from "node:test";
import { compile, serialize } from "../src/authoring/matrix-columns/compile.ts";
import { session } from "../src/authoring/matrix-columns/session.ts";
import { example } from "../content/authoring/convergence/matrix-example.ts";

test("only issued matrix drafts serialize or enter a revision session", async () => {
  const draft = compile(example());
  assert.equal(compile(JSON.parse(serialize(draft))).revision, draft.revision);
  assert.throws(() => serialize({ ...draft }), /Compile matrix source/);
  const input = { initial: draft, prepare: async () => ({ dispose() {} }), commit() {} };
  assert.throws(() => session({ ...input, initial: { ...draft } }), /Compile matrix source/);
  const owner = session(input);
  await assert.rejects(owner.applyDraft({ ...draft }), /Compile matrix source/);
});

test("invalid and failed preparations preserve the displayed source and release failed candidates", async () => {
  const initial = compile(example()); let disposed = 0, fail = false;
  const owner = session({ initial, prepare: async () => ({ dispose() { disposed++; } }),
    commit() { if (fail) throw new Error("paint unavailable"); } });
  assert.equal((await owner.apply("{")).status, "repair-gap");
  assert.equal(owner.current(), initial);
  fail = true;
  const source = example(); source.left[0]![0] = 7;
  const failed = await owner.apply(JSON.stringify(source));
  assert.equal(failed.status, "repair-gap");
  assert.equal(owner.current(), initial); assert.equal(disposed, 1);
  fail = false;
  assert.equal((await owner.apply(JSON.stringify(source))).status, "applied");
  assert.equal(owner.current().source.left[0][0], 7);
});

test("new edits, invalid edits and disposal supersede pending surfaces without publishing them", async () => {
  for (const interruption of ["invalidate", "invalid", "dispose", "newer"] as const) {
    const initial = compile(example()); let disposed = 0, commits = 0;
    let finish: (() => void) | undefined;
    let pending = true;
    const owner = session({ initial, prepare: async () => {
      if (pending) await new Promise<void>(resolve => { finish = resolve; });
      return { dispose() { disposed++; } };
    }, commit() { commits++; } });
    const first = owner.apply(serialize(initial));
    if (interruption === "invalid") await owner.apply("{");
    else if (interruption === "newer") { pending = false; await owner.apply(serialize(initial)); }
    else owner[interruption]();
    finish!();
    assert.equal((await first).status, "superseded");
    assert.equal(disposed, 1); assert.equal(commits, interruption === "newer" ? 1 : 0);
    if (interruption === "dispose") assert.equal((await owner.apply(serialize(initial))).status, "superseded");
  }
});
