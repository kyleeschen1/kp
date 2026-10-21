import assert from "node:assert/strict";
import test from "node:test";
import { createKpPreparedRevisionSession } from "../src/authoring/prepared-revision-session.ts";

function fixture() {
  const issued = new WeakSet<object>();
  const issue = (value: string) => { const draft = Object.freeze({ value }); issued.add(draft); return draft; };
  const initial = issue("initial"), committed: string[] = [], disposed: string[] = [];
  const pending: { resolve(surface: { dispose(): void }): void; reject(error: Error): void }[] = [];
  let checks = 0;
  const check = (text: string) => {
    checks++;
    return text === "invalid" ? { status: "repair-gap" as const, diagnostic: { code: "invalid", path: "$", expected: "valid" } }
      : { status: "compiled" as const, draft: issue(text) };
  };
  const session = createKpPreparedRevisionSession({
    initial, check, assertDraft(draft) { if (!issued.has(draft)) throw new Error("Not issued"); },
    prepare: () => new Promise<{ dispose(): void }>((resolve, reject) => pending.push({ resolve, reject })),
    commit(_surface, draft) { committed.push(draft.value); },
    preparationFailure: error => ({ code: "prepare", path: "$", expected: String(error) })
  });
  const finish = (index: number, name: string) => pending[index]!.resolve({ dispose() { disposed.push(name); } });
  return { issue, check, session, initial, pending, finish, committed, disposed, checks: () => checks };
}

test("already issued drafts avoid a second check but still prepare a fresh surface", async () => {
  const f = fixture(), result = f.check("history");
  assert.equal(result.status, "compiled"); if (result.status !== "compiled") return;
  const first = f.session.applyDraft(result.draft); f.finish(0, "first");
  assert.equal((await first).status, "applied");
  const second = f.session.applyDraft(result.draft); f.finish(1, "second");
  assert.equal((await second).status, "applied");
  assert.equal(f.checks(), 1);
  assert.equal(f.session.current(), result.draft);
  assert.deepEqual(f.committed, ["history", "history"]);
  assert.deepEqual(f.disposed, []);
});

test("text and issued entrypoints share supersession, invalidation and disposal", async () => {
  const f = fixture();
  const old = f.session.applyDraft(f.issue("old")), newest = f.session.apply("new");
  f.finish(1, "new"); assert.equal((await newest).status, "applied");
  f.finish(0, "old"); assert.equal((await old).status, "superseded");
  const dirty = f.session.applyDraft(f.issue("dirty")); f.session.invalidate(); f.finish(2, "dirty");
  assert.equal((await dirty).status, "superseded");
  const leaving = f.session.applyDraft(f.issue("leaving")); f.session.dispose(); f.finish(3, "leaving");
  assert.equal((await leaving).status, "superseded");
  assert.equal((await f.session.applyDraft(f.issue("late"))).status, "superseded");
  assert.equal(f.pending.length, 4);
  assert.deepEqual(f.disposed, ["old", "dirty", "leaving"]);
  assert.deepEqual(f.committed, ["new"]);
});

test("invalid or failed replacement preserves the displayed revision", async () => {
  const f = fixture(), stale = f.session.applyDraft(f.issue("stale"));
  assert.equal((await f.session.apply("invalid")).status, "repair-gap");
  f.finish(0, "stale"); assert.equal((await stale).status, "superseded");
  await assert.rejects(f.session.applyDraft({ ...f.initial }), /Not issued/);
  assert.equal(f.pending.length, 1);
  const failed = f.session.applyDraft(f.issue("failed")); f.pending[1]!.reject(new Error("mount failed"));
  assert.equal((await failed).status, "repair-gap");
  assert.equal(f.session.current(), f.initial);
});
