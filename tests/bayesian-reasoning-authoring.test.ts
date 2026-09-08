import test from "node:test";
import assert from "node:assert/strict";
import { createBayesAuthoringSession } from "../src/experiments/bayesian-reasoning/authoring.ts";
import { checkBayesDraft, createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";

test("atomic preview retains current on invalid, failed or superseded preparation and disposes stale resources", async () => {
  const source = createBayesDraft(), initial = checkBayesDraft(JSON.stringify(source));
  assert.equal(initial.status, "compiled"); if (initial.status !== "compiled") return;
  const pending: { resolve: (surface: { dispose(): void }) => void; reject: (error: Error) => void }[] = [];
  const committed: string[] = [], released: string[] = [];
  const session = createBayesAuthoringSession({ initial: initial.draft,
    prepare: () => new Promise<{ dispose(): void }>((resolve, reject) => pending.push({ resolve, reject })),
    commit: (_surface, draft) => { committed.push(draft.revisionId); } });
  const old = session.apply(JSON.stringify(source));
  source.model.events[0]!.label = "Edited A";
  const newest = session.apply(JSON.stringify(source));
  pending[1]!.resolve({ dispose: () => released.push("new") });
  assert.equal((await newest).status, "applied");
  const revision = session.current().revisionId;
  pending[0]!.resolve({ dispose: () => released.push("old") });
  assert.equal((await old).status, "superseded");
  assert.deepEqual(released, ["old"]); assert.deepEqual(committed, [revision]);
  assert.equal((await session.apply("{")).status, "repair-gap");
  assert.equal(session.current().revisionId, revision);
  const failing = session.apply(JSON.stringify(source)); pending[2]!.reject(new Error("native preparation failed"));
  assert.equal((await failing).status, "repair-gap"); assert.equal(session.current().revisionId, revision);
  const dirty = session.apply(JSON.stringify(source)); session.invalidate();
  pending[3]!.resolve({ dispose: () => released.push("dirty") });
  assert.equal((await dirty).status, "superseded");
  const disposed = session.apply(JSON.stringify(source)); session.dispose();
  pending[4]!.resolve({ dispose: () => released.push("disposed") });
  assert.equal((await disposed).status, "superseded");
  assert.deepEqual(released, ["old", "dirty", "disposed"]);
  assert.deepEqual(committed, [revision]);
});
