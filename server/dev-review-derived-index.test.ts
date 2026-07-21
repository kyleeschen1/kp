import assert from "node:assert/strict";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import type { KpDevReviewEventV2 } from "../protocols/dev-review-v2.ts";
import {
  KP_DEV_REVIEW_DERIVED_INDEX_FILENAME,
  KpDevReviewDerivedIndex
} from "./dev-review-derived-index.ts";
import { KP_DEV_REVIEW_EVENTS_FILENAME, KpDevReviewEventStore } from "./dev-review-store.ts";

test("derived index rebuilds without touching source history and reloads deterministically", async (context) => {
  const root = join(tmpdir(), `kp-review-index-${process.pid}-${Date.now()}`);
  context.after(() => rm(root, { recursive: true, force: true }));
  const store = await KpDevReviewEventStore.open(root);
  await store.append(roundOpened());
  await store.append(noteCreated());
  const sourceFile = join(root, KP_DEV_REVIEW_EVENTS_FILENAME);
  const sourceBefore = await readFile(sourceFile, "utf8");
  const derived = await KpDevReviewDerivedIndex.open(root, {
    now: () => new Date("2026-07-21T02:00:00.000Z")
  });

  const rebuilt = await derived.rebuild(store.readAll());
  assert.equal(rebuilt.counts.lifetime, 1);
  assert.equal(rebuilt.counts.currentNew, 1);
  assert.match(rebuilt.source.digest, /^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(await derived.read(store.readAll()), rebuilt);
  assert.equal(await readFile(sourceFile, "utf8"), sourceBefore);
});

test("stale or corrupt derived state is ignored and source remains authoritative", async (context) => {
  const root = join(tmpdir(), `kp-review-index-stale-${process.pid}-${Date.now()}`);
  context.after(() => rm(root, { recursive: true, force: true }));
  const store = await KpDevReviewEventStore.open(root);
  await store.append(roundOpened());
  const derived = await KpDevReviewDerivedIndex.open(root);
  await derived.rebuild(store.readAll());

  await store.append(noteCreated());
  assert.equal(await derived.read(store.readAll()), undefined);

  await writeFile(join(root, KP_DEV_REVIEW_DERIVED_INDEX_FILENAME), "not json\n", "utf8");
  assert.equal(await derived.read(store.readAll()), undefined);
  assert.equal(store.readAll().length, 2);
});

test("derived counters cannot disagree with their reproducible inbox projection", async (context) => {
  const root = join(tmpdir(), `kp-review-index-counts-${process.pid}-${Date.now()}`);
  context.after(() => rm(root, { recursive: true, force: true }));
  const store = await KpDevReviewEventStore.open(root);
  await store.append(roundOpened());
  await store.append(noteCreated());
  const derived = await KpDevReviewDerivedIndex.open(root);
  await derived.rebuild(store.readAll());
  const indexFile = join(root, KP_DEV_REVIEW_DERIVED_INDEX_FILENAME);
  const parsed = JSON.parse(await readFile(indexFile, "utf8")) as {
    counts: { lifetime: number };
  };
  parsed.counts.lifetime = 99;
  await writeFile(indexFile, `${JSON.stringify(parsed)}\n`, "utf8");

  assert.equal(await derived.read(store.readAll()), undefined);
});

function roundOpened(): KpDevReviewEventV2 {
  return {
    schemaVersion: "kp.dev-review.v2",
    kind: "round-opened",
    occurredAt: "2026-07-21T00:00:00.000Z",
    round: {
      id: "round.current",
      sequence: 1,
      label: "Current",
      status: "open",
      openedAt: "2026-07-21T00:00:00.000Z",
      baseline: { commit: "abc", fingerprint: "abc", dirty: false },
      synthetic: false
    }
  };
}

function noteCreated(): KpDevReviewEventV2 {
  return {
    schemaVersion: "kp.dev-review.v2",
    kind: "note-created",
    occurredAt: "2026-07-21T00:01:00.000Z",
    note: {
      schemaVersion: "kp.dev-review.v2",
      id: "note.1",
      sequence: 1,
      roundId: "round.current",
      sessionId: "session.1",
      comment: "Current feedback",
      status: "new",
      capture: {
        route: "http://127.0.0.1:8000/reader/solve-x",
        capturedAt: "2026-07-21T00:01:00.000Z",
        environment: {
          browserName: "Chromium",
          language: "en-US",
          viewport: {
            width: 1280,
            height: 720,
            devicePixelRatio: 2,
            scrollX: 0,
            scrollY: 0
          },
          reducedMotion: false,
          forcedColors: false,
          colorScheme: "light",
          build: { commit: "abc", fingerprint: "abc", dirty: false }
        },
        semantic: { activeTransformationIds: [], focusRefs: [] },
        render: { ownerIds: [] },
        temporalTrace: []
      }
    }
  };
}
