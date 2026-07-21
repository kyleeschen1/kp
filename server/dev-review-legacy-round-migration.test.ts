import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_DEV_REVIEW_SCHEMA_VERSION,
  type KpDevReviewEventV1,
  type KpDevReviewNoteV1
} from "../protocols/dev-review-v1.ts";
import { kpDevReviewEventV2Schema } from "../protocols/dev-review-v2-schema.ts";
import { projectKpDevReviewV1EventsToSyntheticRounds } from "./dev-review-legacy-round-migration.ts";

const baseTime = "2026-07-21T00:00:00.000Z";

test("legacy replay deterministically projects sessions into synthetic rounds", () => {
  const events: KpDevReviewEventV1[] = [
    created(note(1, "session.old", "old one", "commit-old"), baseTime),
    created(note(2, "session.old", "old two", "commit-old"), "2026-07-21T00:01:00.000Z"),
    {
      schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION,
      kind: "status-changed",
      occurredAt: "2026-07-21T00:02:00.000Z",
      noteId: "review-note.1",
      status: "discussed"
    },
    {
      schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION,
      kind: "cursor-advanced",
      occurredAt: "2026-07-21T00:03:00.000Z",
      consumerId: "codex.main",
      throughSequence: 2
    },
    created(note(3, "session.current", "current", "commit-current"), "2026-07-21T01:00:00.000Z")
  ];
  const original = JSON.stringify(events);

  const first = projectKpDevReviewV1EventsToSyntheticRounds(events);
  const second = projectKpDevReviewV1EventsToSyntheticRounds(events);

  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(events), original);
  first.forEach((event) => kpDevReviewEventV2Schema.parse(event));

  const opened = first.filter((event) => event.kind === "round-opened");
  assert.equal(opened.length, 2);
  assert.equal(opened[0]?.kind === "round-opened" && opened[0].round.synthetic, true);
  assert.equal(opened[1]?.kind === "round-opened" && opened[1].round.baseline.commit,
    "commit-current");
  assert.equal(first.filter((event) => event.kind === "round-closed").length, 1);

  const notes = first.filter((event) => event.kind === "note-created");
  assert.deepEqual(notes.map((event) => event.kind === "note-created" && [
    event.note.id,
    event.note.sequence,
    event.note.comment,
    event.note.roundId
  ]), [
    ["review-note.1", 1, "old one", openedRoundId(opened[0])],
    ["review-note.2", 2, "old two", openedRoundId(opened[0])],
    ["review-note.3", 3, "current", openedRoundId(opened[1])]
  ]);

  const cursors = first.filter((event) => event.kind === "cursor-advanced");
  assert.deepEqual(cursors.map((event) => event.kind === "cursor-advanced" && [
    event.roundId,
    event.throughSequence
  ]), [[openedRoundId(opened[0]), 2]]);
});

test("legacy replay with no notes creates no synthetic authority", () => {
  assert.deepEqual(projectKpDevReviewV1EventsToSyntheticRounds([]), []);
});

function created(noteValue: KpDevReviewNoteV1, occurredAt: string): KpDevReviewEventV1 {
  return {
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION,
    kind: "note-created",
    occurredAt,
    note: noteValue
  };
}

function note(
  sequence: number,
  sessionId: string,
  comment: string,
  commit: string
): KpDevReviewNoteV1 {
  return {
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION,
    id: `review-note.${sequence}`,
    sequence,
    sessionId,
    comment,
    status: "new",
    capture: {
      route: `http://127.0.0.1:8000/reader/solve-x/?kpProgress=${sequence}`,
      capturedAt: baseTime,
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
    }
  };
}

function openedRoundId(
  event: ReturnType<typeof projectKpDevReviewV1EventsToSyntheticRounds>[number] | undefined
): string {
  assert.equal(event?.kind, "round-opened");
  return event.round.id;
}
