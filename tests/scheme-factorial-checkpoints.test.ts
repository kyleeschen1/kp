import assert from "node:assert/strict";
import test from "node:test";

import { kpSchemeFactorialCheckpoints } from
  "../src/semantic/scheme-factorial-checkpoints.ts";

const checkpoints = kpSchemeFactorialCheckpoints.checkpoints;
const bySuffix = (suffix: string) => checkpoints.find(({ id }) =>
  id.endsWith(suffix))!;

test("projects one source endpoint and one endpoint per score beat", () => {
  assert.equal(checkpoints.length, 7);
  assert.equal(checkpoints[0]?.definitionPresentation, "full");
  assert.ok(checkpoints.slice(1).every(({ definitionPresentation }) =>
    definitionPresentation === "seed"));
  assert.equal(Object.isFrozen(kpSchemeFactorialCheckpoints), true);
  assert.equal(Object.isFrozen(checkpoints[0]?.material), true);
});

test("waiting shells preserve recursive unfinished work at each depth", () => {
  const first = bySuffix("first-descent");
  const repeated = bySuffix("repeated-descent");
  assert.equal(first.material.filter(({ kind }) =>
    kind === "waiting-shell").length, 1);
  assert.equal(repeated.material.filter(({ kind }) =>
    kind === "waiting-shell").length, 3);
  assert.ok(repeated.material.filter(({ kind }) => kind === "waiting-shell")
    .every(({ textEquivalent }) => textEquivalent.includes("retains")));
});

test("base and result checkpoints expose exact value provenance", () => {
  const base = bySuffix("base-case");
  const result = bySuffix("result");
  assert.ok(base.material.some(({ kind, textEquivalent }) =>
    kind === "value" && textEquivalent.endsWith("1.")));
  assert.ok(result.material.some(({ kind, textEquivalent }) =>
    kind === "value" && textEquivalent.endsWith("6.")));
  assert.ok(base.material.some(({ kind, textEquivalent }) =>
    kind === "dormant-branch" && textEquivalent.includes("recursive branch")));
});

test("every visible material item has source provenance and accessible text", () => {
  for (const checkpoint of checkpoints) {
    assert.ok(checkpoint.accessibleDescription.length > checkpoint.caption.length);
    assert.equal(new Set(checkpoint.material.map(({ id }) => id)).size,
      checkpoint.material.length);
    assert.ok(checkpoint.material.every(({ sourceExpressionIds, textEquivalent }) =>
      sourceExpressionIds.length > 0 && textEquivalent.trim().length > 0));
  }
});

test("checkpoint snapshots and beat boundaries remain explicit", () => {
  assert.equal(checkpoints[0]?.eventId, null);
  assert.equal(checkpoints[0]?.snapshotId, "scheme-factorial.snapshot.000");
  assert.ok(checkpoints.slice(1).every(({ beatId, eventId, snapshotId }) =>
    beatId !== null && eventId !== null && snapshotId.length > 0));
  assert.equal(bySuffix("result").activeExpressionId, null);
});
