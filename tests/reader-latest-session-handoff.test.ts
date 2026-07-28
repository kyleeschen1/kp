import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpReaderLatestSessionHandoff
} from "../src/reader/runtime/public-api.ts";

test("only the latest issued session may publish ownership", () => {
  const handoff = createKpReaderLatestSessionHandoff();
  const published: number[] = [];
  const stale = handoff.issue();
  const latest = handoff.issue();

  assert.equal(handoff.commit(stale, () => published.push(1)), false);
  assert.equal(handoff.commit(latest, () => published.push(2)), true);
  assert.deepEqual(published, [2]);
  assert.equal(handoff.commit(latest, () => published.push(3)), false);

  const invalidated = handoff.issue();
  handoff.invalidate();
  assert.equal(handoff.commit(invalidated, () => published.push(4)), false);
  assert.deepEqual(published, [2]);
});

