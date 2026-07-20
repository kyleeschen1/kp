import { strict as assert } from "node:assert";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import type { KpDevReviewCreateRequestV1 } from "../protocols/dev-review-v1.ts";
import { KpDevReviewInboxService } from "./dev-review-inbox.ts";
import { KpDevReviewEventStore } from "./dev-review-store.ts";

function request(comment: string): KpDevReviewCreateRequestV1 {
  return {
    schemaVersion: "kp.dev-review.v1",
    sessionId: "review.test.1",
    comment,
    capture: {
      route: "http://127.0.0.1:8000/reader/x-plus-three",
      capturedAt: "2026-07-20T20:00:00.000Z",
      environment: {
        browserName: "Chrome",
        language: "en-US",
        viewport: { width: 1280, height: 720, devicePixelRatio: 2, scrollX: 0, scrollY: 400 },
        reducedMotion: false,
        forcedColors: false,
        colorScheme: "light",
        build: { commit: "abc123", fingerprint: "dev-abc123", dirty: false }
      },
      semantic: { activeTransformationIds: [], focusRefs: [] },
      render: { ownerIds: [] },
      temporalTrace: []
    }
  };
}

test("creates concurrent notes with ordered identities and projects statuses and cursors", async (context) => {
  const root = join(tmpdir(), `kp-dev-review-inbox-${process.pid}-${Date.now()}`);
  context.after(() => rm(root, { recursive: true, force: true }));
  const store = await KpDevReviewEventStore.open(root);
  const service = new KpDevReviewInboxService(store, {
    now: () => new Date("2026-07-20T20:00:01.000Z")
  });

  const [first, second] = await Promise.all([
    service.createNote(request("The cancellation jumps.")),
    service.createNote(request("The result font is too large."))
  ]);
  assert.deepEqual([first.sequence, second.sequence], [1, 2]);

  await service.setStatus(first.id, "discussed", "Reviewed with author");
  await service.advanceCursor("codex", second.sequence);
  const inbox = service.read();
  assert.deepEqual(inbox.notes.map((note) => [note.comment, note.status]), [
    ["The cancellation jumps.", "discussed"],
    ["The result font is too large.", "new"]
  ]);
  assert.deepEqual(inbox.cursors, { codex: 2 });
});

test("rejects dangling statuses and cursor regression", async (context) => {
  const root = join(tmpdir(), `kp-dev-review-projection-${process.pid}-${Date.now()}`);
  context.after(() => rm(root, { recursive: true, force: true }));
  const store = await KpDevReviewEventStore.open(root);
  const service = new KpDevReviewInboxService(store);
  const note = await service.createNote(request("A review note."));
  await service.advanceCursor("codex", 1);

  await assert.rejects(() => service.setStatus("missing", "fixed"), /Unknown/);
  await assert.rejects(() => service.advanceCursor("codex", 0), /advance/);
  assert.equal(service.read().notes[0]?.id, note.id);
});
