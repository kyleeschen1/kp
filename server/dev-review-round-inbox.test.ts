import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  KP_DEV_REVIEW_SCHEMA_VERSION,
  type KpDevReviewCreateRequestV1,
  type KpDevReviewEventV1
} from "../protocols/dev-review-v1.ts";
import {
  KP_DEV_REVIEW_SCHEMA_VERSION_V2,
  type KpDevReviewCreateRequestV2
} from "../protocols/dev-review-v2.ts";
import { KpDevReviewInboxService } from "./dev-review-inbox.ts";
import {
  KpDevReviewRoundInboxService,
  projectKpDevReviewRoundInbox
} from "./dev-review-round-inbox.ts";
import { KpDevReviewEventStore } from "./dev-review-store.ts";

test("round service continues legacy history through explicit current state", async (context) => {
  const root = join(tmpdir(), `kp-dev-review-round-${process.pid}-${Date.now()}`);
  context.after(() => rm(root, { recursive: true, force: true }));
  const store = await KpDevReviewEventStore.open(root);
  const legacy = new KpDevReviewInboxService(store, {
    now: () => new Date("2026-07-21T00:00:01.000Z")
  });
  const historical = await legacy.createNote(requestV1("Historical note"));
  const service = new KpDevReviewRoundInboxService(store, {
    now: tickingClock([
      "2026-07-21T01:00:00.000Z",
      "2026-07-21T01:00:01.000Z",
      "2026-07-21T01:00:02.000Z",
      "2026-07-21T01:00:03.000Z",
      "2026-07-21T01:00:04.000Z",
      "2026-07-21T01:00:05.000Z"
    ])
  });

  const migrated = service.read();
  assert.equal(migrated.rounds.length, 1);
  assert.equal(migrated.rounds[0]?.synthetic, true);
  assert.equal(migrated.notes[0]?.id, historical.id);

  await service.closeRound(undefined, "Start explicit feedback round");
  const round = await service.openRound({
    label: "Solve-x polish",
    baseline: { commit: "new123", fingerprint: "new123-dirty", dirty: true }
  });
  const [first, second] = await Promise.all([
    service.createNote(requestV2(round.id, "Current one")),
    service.createNote(requestV2(round.id, "Current two"))
  ]);
  await service.setStatus(first.id, "accepted", "Agreed during review");
  await service.advanceCursor("codex.main", round.id, second.sequence);

  const inbox = service.read();
  assert.equal(inbox.currentRoundId, round.id);
  assert.deepEqual(inbox.rounds.map((item) => [item.label, item.status]), [
    ["Legacy review 1 · old123", "closed"],
    ["Solve-x polish", "open"]
  ]);
  assert.deepEqual(inbox.notes.map((note) => [note.sequence, note.comment, note.status]), [
    [1, "Historical note", "new"],
    [2, "Current one", "accepted"],
    [3, "Current two", "new"]
  ]);
  assert.equal(inbox.cursors["codex.main"]?.[round.id], 3);

  const reopened = new KpDevReviewRoundInboxService(
    await KpDevReviewEventStore.open(root)
  );
  assert.deepEqual(reopened.read(), inbox);
  await assert.rejects(
    () => legacy.createNote(requestV1("Too late")),
    /read-only after v2 history begins/
  );
});

test("mixed-history projector fails closed on legacy events appended after v2", () => {
  const legacyCursor: KpDevReviewEventV1 = {
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION,
    kind: "cursor-advanced",
    occurredAt: "2026-07-21T02:00:00.000Z",
    consumerId: "codex.main",
    throughSequence: 0
  };
  assert.throws(() => projectKpDevReviewRoundInbox([{
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
    kind: "round-opened",
    occurredAt: "2026-07-21T01:00:00.000Z",
    round: {
      id: "review-round.1",
      sequence: 1,
      label: "Current",
      status: "open",
      openedAt: "2026-07-21T01:00:00.000Z",
      baseline: { commit: "abc", fingerprint: "abc", dirty: false },
      synthetic: false
    }
  }, legacyCursor]), /cannot be appended/);
});

function requestV1(comment: string): KpDevReviewCreateRequestV1 {
  return {
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION,
    sessionId: "session.old",
    comment,
    capture: capture("old123")
  };
}

function requestV2(roundId: string, comment: string): KpDevReviewCreateRequestV2 {
  return {
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
    roundId,
    sessionId: "session.current",
    comment,
    capture: capture("new123")
  };
}

function capture(commit: string): KpDevReviewCreateRequestV1["capture"] {
  return {
    route: "http://127.0.0.1:8000/reader/solve-x/",
    capturedAt: "2026-07-21T00:00:00.000Z",
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
      build: { commit, fingerprint: `${commit}-dirty`, dirty: true }
    },
    semantic: { activeTransformationIds: [], focusRefs: [] },
    render: { ownerIds: [] },
    temporalTrace: []
  };
}

function tickingClock(values: readonly string[]): () => Date {
  let index = 0;
  return () => {
    const value = values[index++];
    if (value === undefined) throw new Error("Test clock exhausted");
    return new Date(value);
  };
}
