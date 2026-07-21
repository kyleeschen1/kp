import assert from "node:assert/strict";
import test from "node:test";

import type { KpDevReviewCaptureV1 } from "../protocols/dev-review-v1.ts";
import {
  KP_DEV_REVIEW_SCHEMA_VERSION_V2,
  type KpDevReviewInboxV2,
  type KpDevReviewNoteV2
} from "../protocols/dev-review-v2.ts";
import { queryKpDevReviewInbox } from "./dev-review-query.ts";

const inbox = fixtureInbox();

test("review query defaults to bounded compact evidence from the current round", () => {
  const result = queryKpDevReviewInbox(inbox, { limit: 1 });

  assert.equal(result.query.scope, "current");
  assert.equal(result.counts.matching, 3);
  assert.equal(result.page.notes.length, 1);
  assert.equal(result.page.hasMore, true);
  assert.equal(result.page.nextAfterSequence, 3);
  assert.equal(result.page.notes[0]?.comment, "Current first");
  assert.equal(result.page.notes[0]?.checkpointId, "combine");
  assert.equal("capture" in (result.page.notes[0] ?? {}), false);
  assert.deepEqual(result.counts, {
    lifetime: 5,
    current: 3,
    currentNew: 2,
    historical: 2,
    matching: 3,
    byStatus: {
      new: 4,
      discussed: 0,
      grouped: 0,
      accepted: 1,
      fixed: 0,
      verified: 0,
      dismissed: 0
    }
  });
});

test("history is explicit and filters compose without changing source order", () => {
  const history = queryKpDevReviewInbox(inbox, { scope: "historical" });
  assert.deepEqual(history.page.notes.map((note) => note.sequence), [1, 2]);

  const filtered = queryKpDevReviewInbox(inbox, {
    scope: "all",
    statuses: ["new"],
    routePrefix: "/reader/solve-x",
    afterSequence: 1
  });
  assert.deepEqual(filtered.page.notes.map((note) => note.sequence), [3, 5]);
});

test("round-scoped cursors define unread notes and pagination is stable", () => {
  const first = queryKpDevReviewInbox(inbox, {
    scope: "all",
    unreadBy: "codex.main",
    limit: 2
  });
  assert.deepEqual(first.page.notes.map((note) => note.sequence), [2, 4]);
  assert.equal(first.page.nextAfterSequence, 4);

  const second = queryKpDevReviewInbox(inbox, {
    scope: "all",
    unreadBy: "codex.main",
    afterSequence: first.page.nextAfterSequence,
    limit: 2
  });
  assert.deepEqual(second.page.notes.map((note) => note.sequence), [5]);
  assert.equal(second.page.hasMore, false);
});

test("full capture and one-round history require explicit requests", () => {
  const result = queryKpDevReviewInbox(inbox, {
    roundId: "round.old",
    detail: "full"
  });
  assert.deepEqual(result.page.notes.map((note) => note.sequence), [1, 2]);
  assert.equal(result.page.notes[0]?.capture?.temporalTrace.length, 1);
});

test("review query rejects ambiguous or unbounded inputs", () => {
  assert.throws(
    () => queryKpDevReviewInbox(inbox, { scope: "all", roundId: "round.old" }),
    /cannot combine/
  );
  assert.throws(
    () => queryKpDevReviewInbox(inbox, { roundId: "round.missing" }),
    /Unknown review round/
  );
  assert.throws(() => queryKpDevReviewInbox(inbox, { limit: 101 }), /between 1 and 100/);
  assert.throws(() => queryKpDevReviewInbox(inbox, { afterSequence: -1 }), /non-negative/);
  assert.throws(() => queryKpDevReviewInbox(inbox, { unreadBy: "" }), /must not be empty/);
});

function fixtureInbox(): KpDevReviewInboxV2 {
  return {
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
    currentRoundId: "round.current",
    rounds: [
      {
        id: "round.old",
        sequence: 1,
        label: "Historical",
        status: "closed",
        openedAt: "2026-07-20T00:00:00.000Z",
        closedAt: "2026-07-20T01:00:00.000Z",
        baseline: { commit: "old", fingerprint: "old", dirty: false },
        synthetic: true
      },
      {
        id: "round.current",
        sequence: 2,
        label: "Current",
        status: "open",
        openedAt: "2026-07-21T00:00:00.000Z",
        baseline: { commit: "new", fingerprint: "new-dirty", dirty: true },
        synthetic: false
      }
    ],
    notes: [
      note(1, "round.old", "Historical first", "new", "/reader/legacy"),
      note(2, "round.old", "Historical second", "new", "/reader/legacy"),
      note(3, "round.current", "Current first", "new", "/reader/solve-x"),
      note(4, "round.current", "Current accepted", "accepted", "/reader/other"),
      note(5, "round.current", "Current last", "new", "/reader/solve-x/detail")
    ],
    cursors: {
      "codex.main": {
        "round.old": 1,
        "round.current": 3
      }
    }
  };
}

function note(
  sequence: number,
  roundId: string,
  comment: string,
  status: KpDevReviewNoteV2["status"],
  route: string
): KpDevReviewNoteV2 {
  return {
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
    id: `note.${sequence}`,
    sequence,
    roundId,
    sessionId: "session.fixture",
    comment,
    status,
    capture: capture(route)
  };
}

function capture(route: string): KpDevReviewCaptureV1 {
  return {
    route,
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
      build: { commit: "new", fingerprint: "new-dirty", dirty: true }
    },
    semantic: {
      checkpointId: "combine",
      progressPermille: 500,
      activePhase: "morph",
      activeTransformationIds: [],
      focusRefs: []
    },
    render: { ownerIds: [] },
    temporalTrace: [{ offsetMs: 0, progressPermille: 500 }]
  };
}
