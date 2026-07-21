import {
  kpDevReviewCreateRequestV2Schema,
  kpDevReviewEventV2Schema,
  kpDevReviewInboxV2Schema
} from "../protocols/dev-review-v2-schema.ts";
import {
  KP_DEV_REVIEW_SCHEMA_VERSION_V2,
  type KpDevReviewEventV2,
  type KpDevReviewInboxV2,
  type KpDevReviewNoteV2,
  type KpDevReviewRoundBaselineV2,
  type KpDevReviewRoundV2
} from "../protocols/dev-review-v2.ts";
import type { KpDevReviewStoredEvent } from "../protocols/dev-review-stored.ts";
import type {
  KpDevReviewEventV1,
  KpDevReviewStatusV1
} from "../protocols/dev-review-v1.ts";
import { projectKpDevReviewV1EventsToSyntheticRounds } from "./dev-review-legacy-round-migration.ts";
import { KpDevReviewEventStore } from "./dev-review-store.ts";

export interface KpDevReviewRoundInboxServiceOptions {
  readonly now?: () => Date;
}

export interface KpDevReviewOpenRoundInput {
  readonly label: string;
  readonly baseline: KpDevReviewRoundBaselineV2;
}

export class KpDevReviewRoundInboxService {
  readonly #store: KpDevReviewEventStore;
  readonly #now: () => Date;
  #mutationTail: Promise<unknown> = Promise.resolve();

  constructor(
    store: KpDevReviewEventStore,
    options: KpDevReviewRoundInboxServiceOptions = {}
  ) {
    this.#store = store;
    this.#now = options.now ?? (() => new Date());
  }

  read(): KpDevReviewInboxV2 {
    return projectKpDevReviewRoundInbox(this.#store.readAll());
  }

  openRound(input: KpDevReviewOpenRoundInput): Promise<KpDevReviewRoundV2> {
    return this.#enqueue(async () => {
      const inbox = this.read();
      if (inbox.currentRoundId !== undefined) {
        throw new Error(`Close current review round ${inbox.currentRoundId} before opening another`);
      }
      const sequence = (inbox.rounds.at(-1)?.sequence ?? 0) + 1;
      const occurredAt = this.#now().toISOString();
      const round: KpDevReviewRoundV2 = {
        id: `review-round.${sequence}.${Date.parse(occurredAt).toString(36)}`,
        sequence,
        label: input.label,
        status: "open",
        openedAt: occurredAt,
        baseline: structuredClone(input.baseline),
        synthetic: false
      };
      await this.#store.append(kpDevReviewEventV2Schema.parse({
        schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
        kind: "round-opened",
        occurredAt,
        round
      }));
      return structuredClone(round);
    });
  }

  closeRound(roundId?: string, reason?: string): Promise<void> {
    return this.#enqueue(async () => {
      const inbox = this.read();
      const selectedId = roundId ?? inbox.currentRoundId;
      if (selectedId === undefined) throw new Error("No current review round to close");
      const round = inbox.rounds.find((candidate) => candidate.id === selectedId);
      if (round === undefined) throw new Error(`Unknown review round ${selectedId}`);
      if (round.status !== "open") throw new Error(`Review round ${selectedId} is already closed`);
      await this.#store.append(kpDevReviewEventV2Schema.parse({
        schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
        kind: "round-closed",
        occurredAt: this.#now().toISOString(),
        roundId: selectedId,
        ...(reason === undefined ? {} : { reason })
      }));
    });
  }

  createNote(request: unknown): Promise<KpDevReviewNoteV2> {
    return this.#enqueue(async () => {
      const validated = kpDevReviewCreateRequestV2Schema.parse(request);
      const inbox = this.read();
      if (validated.roundId !== inbox.currentRoundId) {
        throw new Error(`Review note must target current round ${inbox.currentRoundId ?? "none"}`);
      }
      const sequence = (inbox.notes.at(-1)?.sequence ?? 0) + 1;
      const occurredAt = this.#now().toISOString();
      const note: KpDevReviewNoteV2 = {
        ...validated,
        id: `review-note.${sequence}.${Date.parse(occurredAt).toString(36)}`,
        sequence,
        status: "new"
      };
      await this.#store.append(kpDevReviewEventV2Schema.parse({
        schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
        kind: "note-created",
        occurredAt,
        note
      }));
      return structuredClone(note);
    });
  }

  setStatus(noteId: string, status: KpDevReviewStatusV1, reason?: string): Promise<void> {
    return this.#enqueue(async () => {
      if (!this.read().notes.some((note) => note.id === noteId)) {
        throw new Error(`Unknown review note ${noteId}`);
      }
      await this.#store.append(kpDevReviewEventV2Schema.parse({
        schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
        kind: "status-changed",
        occurredAt: this.#now().toISOString(),
        noteId,
        status,
        ...(reason === undefined ? {} : { reason })
      }));
    });
  }

  advanceCursor(
    consumerId: string,
    roundId: string,
    throughSequence: number
  ): Promise<void> {
    return this.#enqueue(async () => {
      const inbox = this.read();
      if (!inbox.rounds.some((round) => round.id === roundId)) {
        throw new Error(`Unknown review round ${roundId}`);
      }
      const highestSequence = inbox.notes
        .filter((note) => note.roundId === roundId)
        .at(-1)?.sequence ?? 0;
      const current = inbox.cursors[consumerId]?.[roundId] ?? 0;
      if (throughSequence < current || throughSequence > highestSequence) {
        throw new RangeError(
          `Cursor must advance from ${current} through at most ${highestSequence}`
        );
      }
      await this.#store.append(kpDevReviewEventV2Schema.parse({
        schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
        kind: "cursor-advanced",
        occurredAt: this.#now().toISOString(),
        consumerId,
        roundId,
        throughSequence
      }));
    });
  }

  #enqueue<Value>(mutation: () => Promise<Value>): Promise<Value> {
    const result = this.#mutationTail.then(mutation);
    this.#mutationTail = result.catch(() => undefined);
    return result;
  }
}

export function projectKpDevReviewRoundInbox(
  storedEvents: readonly KpDevReviewStoredEvent[]
): KpDevReviewInboxV2 {
  const events = normalizeStoredEvents(storedEvents);
  const rounds = new Map<string, KpDevReviewRoundV2>();
  const notes = new Map<string, KpDevReviewNoteV2>();
  const cursors: Record<string, Record<string, number>> = {};
  let lastRoundSequence = 0;
  let lastNoteSequence = 0;

  for (const event of events) {
    if (event.kind === "round-opened") {
      if (rounds.has(event.round.id) || event.round.sequence <= lastRoundSequence) {
        throw new Error(`Review round sequence ${event.round.sequence} is duplicate or out of order`);
      }
      rounds.set(event.round.id, structuredClone(event.round));
      lastRoundSequence = event.round.sequence;
      continue;
    }
    if (event.kind === "round-closed") {
      const round = rounds.get(event.roundId);
      if (round === undefined) throw new Error(`Close references unknown round ${event.roundId}`);
      if (round.status !== "open") throw new Error(`Review round ${event.roundId} closes twice`);
      rounds.set(event.roundId, {
        ...round,
        status: "closed",
        closedAt: event.occurredAt
      });
      continue;
    }
    if (event.kind === "note-created") {
      if (!rounds.has(event.note.roundId)) {
        throw new Error(`Review note references unknown round ${event.note.roundId}`);
      }
      if (notes.has(event.note.id) || event.note.sequence <= lastNoteSequence) {
        throw new Error(`Review note sequence ${event.note.sequence} is duplicate or out of order`);
      }
      notes.set(event.note.id, structuredClone(event.note));
      lastNoteSequence = event.note.sequence;
      continue;
    }
    if (event.kind === "status-changed") {
      const note = notes.get(event.noteId);
      if (note === undefined) throw new Error(`Status references unknown review note ${event.noteId}`);
      notes.set(event.noteId, { ...note, status: event.status });
      continue;
    }
    if (!rounds.has(event.roundId)) {
      throw new Error(`Cursor references unknown review round ${event.roundId}`);
    }
    const highestSequence = [...notes.values()]
      .filter((note) => note.roundId === event.roundId)
      .at(-1)?.sequence ?? 0;
    const previous = cursors[event.consumerId]?.[event.roundId] ?? 0;
    if (event.throughSequence < previous || event.throughSequence > highestSequence) {
      throw new Error(
        `Invalid cursor ${event.consumerId}:${event.roundId}:${event.throughSequence}`
      );
    }
    const consumer = cursors[event.consumerId] ?? {};
    consumer[event.roundId] = event.throughSequence;
    cursors[event.consumerId] = consumer;
  }

  const projectedRounds = [...rounds.values()].sort(
    (left, right) => left.sequence - right.sequence
  );
  const currentRoundId = projectedRounds
    .filter((round) => round.status === "open")
    .at(-1)?.id;
  if (projectedRounds.filter((round) => round.status === "open").length > 1) {
    throw new Error("Review history has more than one open round");
  }
  return kpDevReviewInboxV2Schema.parse({
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION_V2,
    ...(currentRoundId === undefined ? {} : { currentRoundId }),
    rounds: projectedRounds,
    notes: [...notes.values()].sort((left, right) => left.sequence - right.sequence),
    cursors
  });
}

function normalizeStoredEvents(
  storedEvents: readonly KpDevReviewStoredEvent[]
): readonly KpDevReviewEventV2[] {
  const legacy: KpDevReviewEventV1[] = [];
  const current: KpDevReviewEventV2[] = [];
  let sawV2 = false;
  for (const event of storedEvents) {
    if (event.schemaVersion === KP_DEV_REVIEW_SCHEMA_VERSION_V2) {
      sawV2 = true;
      current.push(event);
      continue;
    }
    if (sawV2) {
      throw new Error("Legacy review events cannot be appended after v2 history begins");
    }
    legacy.push(event);
  }
  return [
    ...projectKpDevReviewV1EventsToSyntheticRounds(legacy),
    ...current
  ];
}
