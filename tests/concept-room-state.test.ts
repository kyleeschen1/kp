import assert from "node:assert/strict";
import test from "node:test";

import {
  conceptRoomStateRoute,
  createConceptRoomSnapshot,
  createConceptRoomState,
  formatConceptRoomRoute,
  parseConceptRoomSnapshot,
  reduceConceptRoomState,
  replayConceptRoomCommands,
  type KpConceptRoomCommand,
  type KpConceptRoomRoute
} from "../src/kernel/public-api.ts";

const initialRoute: KpConceptRoomRoute = {
  schemaVersion: "kp.room-route.v1",
  conceptId: "mathematics.linear-equations.solve-with-balance",
  conceptVersion: "1.0.0",
  checkpoint: "start",
  timePermille: 0,
  mode: "watch",
  projection: "symbolic",
  parameters: { seed: "canonical" },
  focus: ["equation.initial"]
};
const integrity = `sha256:${"a".repeat(64)}`;

test("room reducer is immutable, deterministic, replayable, and canonical", () => {
  const initial = createConceptRoomState(initialRoute, integrity);
  const commands: readonly KpConceptRoomCommand[] = [
    { kind: "seek", checkpoint: "subtract-three", timePermille: 400 },
    { kind: "set-mode", mode: "touch" },
    { kind: "set-projection", projection: "balance" },
    { kind: "set-parameter", key: "difficulty", value: "intro" },
    { kind: "set-focus", focus: ["operation.subtract-three", "diagram.balance"] },
    { kind: "set-branch", branch: "guided" }
  ];
  const first = replayConceptRoomCommands(initial, commands);
  const second = replayConceptRoomCommands(initial, commands);
  assert.deepEqual(first, second);
  assert.equal(first.revision, commands.length);
  assert.equal(initial.revision, 0);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.parameters), true);
  assert.equal(formatConceptRoomRoute(conceptRoomStateRoute(first)).includes("checkpoint=subtract-three"), true);
});

test("semantic no-ops preserve identity and invalid commands fail", () => {
  const initial = createConceptRoomState(initialRoute, integrity);
  assert.equal(reduceConceptRoomState(initial, { kind: "set-mode", mode: "watch" }), initial);
  assert.throws(() => reduceConceptRoomState(initial, {
    kind: "hover",
    semanticRef: "term.two-x"
  } as never), /Unknown concept room command/);
  assert.throws(() => reduceConceptRoomState(initial, {
    kind: "seek",
    checkpoint: "invalid checkpoint",
    timePermille: 2000
  }), /Invalid checkpoint|Room time/);
});

test("snapshots survive JSON and restore only their immutable concept version", () => {
  const initial = createConceptRoomState(initialRoute, integrity);
  const advanced = replayConceptRoomCommands(initial, [
    { kind: "seek", checkpoint: "divide-two", timePermille: 750 },
    { kind: "set-mode", mode: "review" }
  ]);
  const serialized = JSON.stringify(createConceptRoomSnapshot(advanced));
  const snapshot = parseConceptRoomSnapshot(JSON.parse(serialized));
  const restored = reduceConceptRoomState(initial, { kind: "restore-snapshot", snapshot });
  assert.equal(restored.checkpoint, "divide-two");
  assert.equal(restored.mode, "review");
  assert.equal(restored.revision, 1);
  assert.throws(() => reduceConceptRoomState(
    createConceptRoomState({ ...initialRoute, conceptVersion: "2.0.0" }, integrity),
    { kind: "restore-snapshot", snapshot }
  ), /does not belong/);
});

test("ephemeral hover and layout never enter canonical state or snapshots", () => {
  const state = createConceptRoomState(initialRoute, integrity);
  const snapshot = createConceptRoomSnapshot(state);
  assert.equal("hoveredSemanticRef" in state, false);
  assert.equal("layoutRevision" in state, false);
  assert.equal(snapshot.route.includes("hover"), false);
  assert.equal(snapshot.route.includes("layout"), false);
});
