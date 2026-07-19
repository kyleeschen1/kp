import assert from "node:assert/strict";
import test from "node:test";

import {
  createRoomEffectCoordinator,
  type KpRoomEffectOutcome,
  type KpRoomEffectPorts
} from "../src/app-adapters/public-api.ts";
import {
  createConceptRoomSnapshot,
  createConceptRoomState,
  formatConceptRoomRoute,
  reduceConceptRoomState,
  type KpConceptRoomState
} from "../src/kernel/public-api.ts";

const integrity = `sha256:${"a".repeat(64)}`;

function initialState(): KpConceptRoomState {
  return createConceptRoomState({
    schemaVersion: "kp.room-route.v1",
    conceptId: "mathematics.linear-equations.solve-with-balance",
    conceptVersion: "1.0.0",
    checkpoint: "start",
    timePermille: 0,
    mode: "watch",
    projection: "symbolic",
    parameters: {},
    focus: []
  }, integrity);
}

test("coordinator applies only results anchored to the current revision", async () => {
  let state = initialState();
  const pending = deferred<unknown>();
  const applied: KpRoomEffectOutcome[] = [];
  const coordinator = createRoomEffectCoordinator({
    roomId: "room.one",
    getState: () => state,
    ports: fakePorts({ provider: () => pending.promise }),
    onApplied: (outcome) => applied.push(outcome)
  });
  const handle = coordinator.start({ kind: "provider", operation: "generate", payload: { seed: "one" } });
  state = reduceConceptRoomState(state, { kind: "set-mode", mode: "touch" });
  pending.resolve({ problemId: "late" });
  assert.equal((await handle.result).status, "stale");
  assert.deepEqual(applied, []);
});

test("same-lane requests supersede, cancel, and never apply late values", async () => {
  const state = initialState();
  const first = deferred<unknown>();
  const second = deferred<unknown>();
  let call = 0;
  const applied: KpRoomEffectOutcome[] = [];
  const coordinator = createRoomEffectCoordinator({
    roomId: "room.cancel",
    getState: () => state,
    ports: fakePorts({ provider: () => (++call === 1 ? first.promise : second.promise) }),
    onApplied: (outcome) => applied.push(outcome)
  });
  const firstHandle = coordinator.start({ kind: "provider", operation: "generate", payload: {} });
  const secondHandle = coordinator.start({ kind: "provider", operation: "generate", payload: {} });
  first.resolve("old");
  second.resolve("new");
  assert.equal((await firstHandle.result).status, "cancelled");
  const outcome = await secondHandle.result;
  assert.equal(outcome.status, "applied");
  assert.equal(outcome.requestId, "room.cancel.2");
  assert.deepEqual(applied.map((item) => item.requestId), ["room.cancel.2"]);
});

test("coordinator interprets URL, persistence, and independent lazy-load lanes", async () => {
  const state = initialState();
  const calls: string[] = [];
  const coordinator = createRoomEffectCoordinator({
    roomId: "room.effects",
    getState: () => state,
    ports: fakePorts({
      url: (request) => { calls.push(`url:${request.strategy}`); },
      persistence: () => { calls.push("persist"); },
      lazyLoad: async (request) => { calls.push(`load:${request.resourceId}`); return request.resourceId; }
    }),
    onApplied: () => undefined
  });
  const route = formatConceptRoomRoute({
    schemaVersion: "kp.room-route.v1",
    conceptId: state.conceptId,
    conceptVersion: state.conceptVersion,
    checkpoint: state.checkpoint,
    timePermille: state.timePermille,
    mode: state.mode,
    projection: state.projection,
    parameters: state.parameters,
    focus: state.focus
  });
  const handles = [
    coordinator.start({ kind: "url", route, strategy: "replace" }),
    coordinator.start({ kind: "persistence", snapshot: createConceptRoomSnapshot(state) }),
    coordinator.start({ kind: "lazy-load", resourceId: "artifact.one" }),
    coordinator.start({ kind: "lazy-load", resourceId: "artifact.two" })
  ];
  assert.deepEqual((await Promise.all(handles.map((handle) => handle.result))).map((item) => item.status), [
    "applied", "applied", "applied", "applied"
  ]);
  assert.deepEqual(calls.sort(), ["load:artifact.one", "load:artifact.two", "persist", "url:replace"]);
});

test("disposal is room-scoped and concurrent coordinators do not interfere", async () => {
  const state = initialState();
  const one = deferred<unknown>();
  const two = deferred<unknown>();
  const firstRoom = createRoomEffectCoordinator({
    roomId: "room.first",
    getState: () => state,
    ports: fakePorts({ provider: () => one.promise }),
    onApplied: () => undefined
  });
  const secondRoom = createRoomEffectCoordinator({
    roomId: "room.second",
    getState: () => state,
    ports: fakePorts({ provider: () => two.promise }),
    onApplied: () => undefined
  });
  const first = firstRoom.start({ kind: "provider", operation: "generate", payload: {} });
  const second = secondRoom.start({ kind: "provider", operation: "generate", payload: {} });
  firstRoom.dispose();
  one.resolve("ignored");
  two.resolve("kept");
  assert.equal((await first.result).status, "cancelled");
  assert.equal((await second.result).status, "applied");
  assert.equal(secondRoom.disposed, false);
  assert.throws(
    () => firstRoom.start({ kind: "lazy-load", resourceId: "after.dispose" }),
    /disposed/
  );
});

function fakePorts(overrides: Partial<KpRoomEffectPorts> = {}): KpRoomEffectPorts {
  return {
    provider: async () => ({}),
    url: () => undefined,
    persistence: () => undefined,
    lazyLoad: async () => ({}),
    ...overrides
  };
}

function deferred<Value>(): {
  readonly promise: Promise<Value>;
  resolve(value: Value): void;
} {
  let resolvePromise: (value: Value) => void = () => undefined;
  const promise = new Promise<Value>((resolve) => { resolvePromise = resolve; });
  return { promise, resolve: (value) => resolvePromise(value) };
}
