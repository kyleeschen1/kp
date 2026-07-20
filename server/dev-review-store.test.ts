import { strict as assert } from "node:assert";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  KP_DEV_REVIEW_EVENTS_FILENAME,
  KpDevReviewEventStore
} from "./dev-review-store.ts";
import type { KpDevReviewEventV1 } from "../protocols/dev-review-v1.ts";

function cursorEvent(sequence: number): KpDevReviewEventV1 {
  return {
    schemaVersion: "kp.dev-review.v1",
    kind: "cursor-advanced",
    occurredAt: new Date(sequence * 1_000).toISOString(),
    consumerId: "codex",
    throughSequence: sequence
  };
}

test("serializes concurrent appends and replays the local JSONL in order", async (context) => {
  const root = join(tmpdir(), `kp-dev-review-store-${process.pid}-${Date.now()}`);
  context.after(() => rm(root, { recursive: true, force: true }));
  const store = await KpDevReviewEventStore.open(root);
  await Promise.all([store.append(cursorEvent(1)), store.append(cursorEvent(2)), store.append(cursorEvent(3))]);

  assert.deepEqual(store.readAll(), [cursorEvent(1), cursorEvent(2), cursorEvent(3)]);
  const source = await readFile(join(root, KP_DEV_REVIEW_EVENTS_FILENAME), "utf8");
  assert.equal(source.trim().split("\n").length, 3);

  const reopened = await KpDevReviewEventStore.open(root);
  assert.deepEqual(reopened.readAll(), store.readAll());
});

test("fails closed when replay encounters a malformed or unknown event", async (context) => {
  const root = join(tmpdir(), `kp-dev-review-invalid-${process.pid}-${Date.now()}`);
  context.after(() => rm(root, { recursive: true, force: true }));
  const store = await KpDevReviewEventStore.open(root);
  await store.append(cursorEvent(1));
  await writeFile(join(root, KP_DEV_REVIEW_EVENTS_FILENAME), '{"kind":"unknown"}\n', "utf8");

  await assert.rejects(() => KpDevReviewEventStore.open(root), /line 1/);
});
