import assert from "node:assert/strict";
import test from "node:test";
import { createKpCommonFactorAuthoringSession } from "../src/authoring/common-factor-session.ts";
import { createKpCommonFactorExample } from "../src/authoring/common-factor-author-check.ts";
import { prepareKpCommonFactorDraft, type KpPreparedCommonFactorDraft } from "../src/authoring/common-factor-draft.ts";

test("Apply preserves last-valid and releases superseded, interrupted and disposed preparations", async () => {
  const source = createKpCommonFactorExample(), initial = prepareKpCommonFactorDraft(source);
  let displayed = initial, disposals = 0;
  const pending: ((surface: { dispose(): void }) => void)[] = [];
  const session = createKpCommonFactorAuthoringSession({ initial,
    prepare: () => new Promise<{ dispose(): void }>(resolve => pending.push(resolve)),
    commit: (_surface, draft) => { displayed = draft; } });
  const json = (title: string) => JSON.stringify({ ...source, editorial: { ...source.editorial, title } });
  const resolve = (index: number) => pending[index]!({ dispose() { ++disposals; } });
  const first = session.apply(json("First")), second = session.apply(json("Second"));
  resolve(1); assert.equal((await second).status, "applied");
  resolve(0); assert.equal((await first).status, "superseded");
  assert.equal(displayed.source.editorial.title, "Second"); assert.equal(disposals, 1);
  assert.equal(session.current(), displayed);
  assert.equal((await session.apply("{}")).status, "repair-gap"); assert.equal(session.current(), displayed);
  const interrupted = session.apply(json("Interrupted")); session.invalidate(); resolve(2);
  assert.equal((await interrupted).status, "superseded"); assert.equal(disposals, 2);
  const disposed = session.apply(json("Disposed")); session.dispose(); resolve(3);
  assert.equal((await disposed).status, "superseded"); assert.equal(disposals, 3);
  assert.equal((await session.apply(json("After disposal"))).status, "superseded"); assert.equal(pending.length, 4);
});

test("preparation failure and foreign source never replace the displayed factoring revision", async () => {
  const source = createKpCommonFactorExample(), initial = prepareKpCommonFactorDraft(source);
  let commits = 0;
  const session = createKpCommonFactorAuthoringSession({ initial,
    prepare: async () => { throw new Error("native preparation unavailable"); }, commit: () => { ++commits; } });
  const result = await session.apply(JSON.stringify(source));
  assert.equal(result.status, "repair-gap"); assert.equal(session.current(), initial); assert.equal(commits, 0);
  assert.equal((await session.apply(JSON.stringify({ schemaVersion: "kp.reasoning-source.v1" }))).status, "repair-gap");
  const forged: unknown = { ...initial };
  assert.throws(() => Reflect.apply(createKpCommonFactorAuthoringSession, undefined, [{ initial: forged,
    prepare: async () => ({ dispose() {} }), commit: (_s: unknown, _d: KpPreparedCommonFactorDraft) => {} }]), TypeError);
});
