import test from "node:test";
import assert from "node:assert/strict";
import { createDeferredCardSession, type DeferredCardSession } from "../src/tutorial/kinetic-figure-supply-tax/deferred-card-session.ts";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

test("no preparation before intent; concurrent and repeated activation has one session owner", async () => {
  let loads = 0, mounts = 0, disposals = 0;
  const card = createDeferredCardSession(async () => { loads++; return () => { mounts++; return { dispose: () => { disposals++; } }; }; });
  assert.equal(card.status(), "idle"); assert.equal(loads, 0);
  const first = card.activate(); assert.equal(first, card.activate());
  assert.deepEqual(await first, { kind: "ready" }); await card.activate();
  assert.equal(loads, 1); assert.equal(mounts, 1);
  card.dispose(); card.dispose(); assert.equal(disposals, 1);
  assert.deepEqual(await card.activate(), { kind: "disposed" }); assert.equal(loads, 1);
});

test("disposal during preparation prevents mount and synchronous disposal prevents even import", async () => {
  const preparation = deferred<() => DeferredCardSession>(); let mounts = 0, loads = 0;
  const card = createDeferredCardSession(() => { loads++; return preparation.promise; });
  const active = card.activate(); await Promise.resolve(); card.dispose();
  preparation.resolve(() => { mounts++; return { dispose() {} }; });
  assert.deepEqual(await active, { kind: "disposed" }); assert.equal(mounts, 0);
  const untouched = createDeferredCardSession(async () => { loads++; return () => ({ dispose() {} }); });
  const cancelled = untouched.activate(); untouched.dispose(); await cancelled; assert.equal(loads, 1);
});

test("a mount finishing after disposal releases its late session exactly once", async () => {
  const mounting = deferred<DeferredCardSession>(), started = deferred<void>(); let disposals = 0;
  const card = createDeferredCardSession(async () => () => { started.resolve(); return mounting.promise; });
  const active = card.activate(); await started.promise; card.dispose();
  mounting.resolve({ dispose: () => { disposals++; } });
  assert.deepEqual(await active, { kind: "disposed" }); card.dispose(); assert.equal(disposals, 1);
});

test("preparation and mount failures are explicit and retryable, never unhandled background rejection", async () => {
  let attempts = 0;
  const cause = new Error("unavailable");
  const card = createDeferredCardSession(async () => {
    if (++attempts === 1) throw cause;
    return () => { if (attempts === 2) throw cause; return { dispose() {} }; };
  });
  assert.deepEqual(await card.activate(), { kind: "failed", cause });
  assert.equal(card.status(), "failed");
  assert.deepEqual(await card.activate(), { kind: "failed", cause });
  assert.deepEqual(await card.activate(), { kind: "ready" }); card.dispose();
});
