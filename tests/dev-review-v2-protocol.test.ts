import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_DEV_REVIEW_SCHEMA_VERSION_V2,
  kpDevReviewEventV2Schema,
  kpDevReviewInboxV2Schema,
  kpDevReviewRoundV2Schema,
  type KpDevReviewEventV2,
  type KpDevReviewInboxV2
} from "../protocols/public-api.ts";

const openedAt = "2026-07-21T14:00:00.000Z";
const round = {
  id: "review-round.1",
  sequence: 1,
  label: "Solve-x checkpoint",
  status: "open" as const,
  openedAt,
  closedAt: undefined,
  baseline: { commit: "abc123", fingerprint: "abc123-dirty", dirty: true },
  synthetic: false
};

test("v2 review protocol gives rounds and round-scoped cursors explicit identity", () => {
  const event: KpDevReviewEventV2 = {
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
    kind: "round-opened",
    occurredAt: openedAt,
    round
  };
  assert.deepEqual(kpDevReviewEventV2Schema.parse(event), event);

  const cursor: KpDevReviewEventV2 = {
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
    kind: "cursor-advanced",
    occurredAt: "2026-07-21T14:05:00.000Z",
    consumerId: "codex.main",
    roundId: round.id,
    throughSequence: 8
  };
  assert.deepEqual(kpDevReviewEventV2Schema.parse(cursor), cursor);
});

test("v2 review protocol rejects ambiguous or malformed round state", () => {
  assert.equal(kpDevReviewRoundV2Schema.safeParse({
    ...round,
    unexpectedAuthority: "latest-timestamp"
  }).success, false);
  assert.equal(kpDevReviewRoundV2Schema.safeParse({
    ...round,
    status: "closed"
  }).success, false);
  assert.equal(kpDevReviewEventV2Schema.safeParse({
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
    kind: "cursor-advanced",
    occurredAt: openedAt,
    consumerId: "codex.main",
    throughSequence: 8
  }).success, false);
});

test("v2 inbox keeps historical rounds separate from the current projection", () => {
  const inbox: KpDevReviewInboxV2 = {
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
    currentRoundId: round.id,
    rounds: [round],
    notes: [],
    cursors: { "codex.main": { [round.id]: 0 } }
  };
  assert.deepEqual(kpDevReviewInboxV2Schema.parse(inbox), inbox);
});
