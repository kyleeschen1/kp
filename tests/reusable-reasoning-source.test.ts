import assert from "node:assert/strict";
import test from "node:test";
import { createKpReasoningSource, readKpReasoningSource, KpReasoningRepairGap } from "../src/experiments/reusable-reasoning/source.ts";

test("reasoning source round trips without shared mutable caller data", () => {
  const input = JSON.parse(JSON.stringify(createKpReasoningSource()));
  const result = readKpReasoningSource(input);
  input.reason.operationIds[0] = "forged";
  assert.equal(result.reason.operationIds[0], "fraction-solve.step.distribute");
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.reason.operationIds));
  assert.deepEqual(readKpReasoningSource(JSON.parse(JSON.stringify(result))), result);
});

test("reasoning source rejects malformed and renderer-authored fields with exact paths", () => {
  for (const [value, path] of [
    [null, "$"],
    [{ ...createKpReasoningSource(), geometry: [] }, "$.geometry"],
    [{ ...createKpReasoningSource(), title: "" }, "$.title"],
    [{ ...createKpReasoningSource(), reason: { ...createKpReasoningSource().reason, duration: 20 } }, "$.reason.duration"],
    [{ ...createKpReasoningSource(), reason: { ...createKpReasoningSource().reason, operationIds: [] } }, "$.reason.operationIds"]
  ] as const) {
    assert.throws(() => readKpReasoningSource(value), error =>
      error instanceof KpReasoningRepairGap && error.path === path);
  }
});

test("reasoning source rejects repeated operations and local identities", () => {
  const source = createKpReasoningSource();
  assert.throws(() => readKpReasoningSource({ ...source, reason: {
    ...source.reason, operationIds: ["same", "same"] } }), KpReasoningRepairGap);
  assert.throws(() => readKpReasoningSource({ ...source, reason: {
    ...source.reason, id: source.parent.id } }), KpReasoningRepairGap);
});

test("reasoning shape validation does not pretend to verify authored claims", () => {
  const source = createKpReasoningSource();
  const result = readKpReasoningSource({ ...source, parent: {
    ...source.parent, statement: "This prose is an editorial claim." } });
  assert.equal(result.parent.statement, "This prose is an editorial claim.");
  assert.equal("verification" in result, false);
});
