import { createHash } from "node:crypto";

import type { KpDevReviewEventV1 } from "../protocols/dev-review-v1.ts";
import {
  KP_DEV_REVIEW_SCHEMA_VERSION_V2,
  type KpDevReviewEventV2,
  type KpDevReviewRoundV2
} from "../protocols/dev-review-v2.ts";

interface LegacyRoundGroup {
  readonly sessionId: string;
  readonly round: KpDevReviewRoundV2;
  readonly firstEventIndex: number;
  lastNoteEventIndex: number;
  minimumNoteSequence: number;
  maximumNoteSequence: number;
}

/**
 * Projects v1 history into v2 rounds without writing migration events back to
 * the source log. The original JSONL remains the audit authority.
 */
export function projectKpDevReviewV1EventsToSyntheticRounds(
  events: readonly KpDevReviewEventV1[]
): readonly KpDevReviewEventV2[] {
  const groups = collectLegacyRoundGroups(events);
  if (groups.length === 0) return [];

  const groupBySession = new Map(groups.map((group) => [group.sessionId, group]));
  const groupByNoteId = new Map<string, LegacyRoundGroup>();
  for (const event of events) {
    if (event.kind !== "note-created") continue;
    const group = requiredGroup(groupBySession, event.note.sessionId);
    groupByNoteId.set(event.note.id, group);
  }

  const projected: KpDevReviewEventV2[] = [];
  const opened = new Set<string>();
  const latestRoundId = groups.at(-1)?.round.id;

  events.forEach((event, eventIndex) => {
    if (event.kind === "note-created") {
      const group = requiredGroup(groupBySession, event.note.sessionId);
      if (!opened.has(group.round.id)) {
        opened.add(group.round.id);
        projected.push({
          schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
          kind: "round-opened",
          occurredAt: group.round.openedAt,
          round: structuredClone(group.round)
        });
      }
      projected.push({
        schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
        kind: "note-created",
        occurredAt: event.occurredAt,
        note: {
          ...structuredClone(event.note),
          schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
          roundId: group.round.id
        }
      });
      if (eventIndex === group.lastNoteEventIndex && group.round.id !== latestRoundId) {
        projected.push({
          schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
          kind: "round-closed",
          occurredAt: event.occurredAt,
          roundId: group.round.id,
          reason: "legacy-session-superseded"
        });
      }
      return;
    }

    if (event.kind === "status-changed") {
      if (!groupByNoteId.has(event.noteId)) {
        throw new Error(`Legacy status references unknown note ${event.noteId}`);
      }
      projected.push({
        ...structuredClone(event),
        schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2
      });
      return;
    }

    for (const group of groups) {
      const throughSequence = Math.min(
        event.throughSequence,
        group.maximumNoteSequence
      );
      if (throughSequence < group.minimumNoteSequence) continue;
      projected.push({
        schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
        kind: "cursor-advanced",
        occurredAt: event.occurredAt,
        consumerId: event.consumerId,
        roundId: group.round.id,
        throughSequence
      });
    }
  });

  return projected;
}

function collectLegacyRoundGroups(
  events: readonly KpDevReviewEventV1[]
): LegacyRoundGroup[] {
  const groups: LegacyRoundGroup[] = [];
  const bySession = new Map<string, LegacyRoundGroup>();

  events.forEach((event, eventIndex) => {
    if (event.kind !== "note-created") return;
    let group = bySession.get(event.note.sessionId);
    if (group === undefined) {
      const sequence = groups.length + 1;
      group = {
        sessionId: event.note.sessionId,
        round: {
          id: syntheticRoundId(sequence, event.note.sessionId),
          sequence,
          label: `Legacy review ${sequence} · ${event.note.capture.environment.build.commit.slice(0, 12)}`,
          status: "open",
          openedAt: event.occurredAt,
          baseline: structuredClone(event.note.capture.environment.build),
          synthetic: true
        },
        firstEventIndex: eventIndex,
        lastNoteEventIndex: eventIndex,
        minimumNoteSequence: event.note.sequence,
        maximumNoteSequence: event.note.sequence
      };
      groups.push(group);
      bySession.set(event.note.sessionId, group);
    }
    group.lastNoteEventIndex = eventIndex;
    group.minimumNoteSequence = Math.min(
      group.minimumNoteSequence,
      event.note.sequence
    );
    group.maximumNoteSequence = Math.max(
      group.maximumNoteSequence,
      event.note.sequence
    );
  });

  return groups.sort((left, right) => left.firstEventIndex - right.firstEventIndex);
}

function syntheticRoundId(sequence: number, sessionId: string): string {
  const digest = createHash("sha256").update(sessionId).digest("hex").slice(0, 12);
  return `review-round.legacy.${sequence}.${digest}`;
}

function requiredGroup(
  groups: ReadonlyMap<string, LegacyRoundGroup>,
  sessionId: string
): LegacyRoundGroup {
  const group = groups.get(sessionId);
  if (group === undefined) throw new Error(`Missing synthetic round for ${sessionId}`);
  return group;
}
